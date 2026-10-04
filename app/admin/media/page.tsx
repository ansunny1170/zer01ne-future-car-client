"use client";

// 미디어 저장소 — 서버에 연결된 S3 저장소(AWS S3 또는 맥 스튜디오 MinIO)의 파일 목록과 업로드.
// 시나리오 프롬프트가 가리키는 배경영상·배경음·음성이 여기 있다. 프롬프트에 적힌 파일이 저장소에 없으면
// 그 스텝은 영상·소리가 안 나온다.
// 어느 저장소인지는 서버 환경변수가 정한다(GET /media/info 가 알려 준다) — 화면에서는 바꾸지 않는다.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BASE_API_LINK } from "@/constants";

import { Badge, Card, EmptyState, PageHeader, btn, fmtDateTime, input } from "../admin-ui";

const API = BASE_API_LINK.replace(/\/+$/, "");

type Info = { storage: string; endpoint: string; bucket: string; region: string; public_base: string; allowed_extensions: string[] };
type Item = { key: string; size: number; last_modified: string | null; url: string };
type UploadReply = { key?: string; detail?: unknown } | null;
type Job = { id: number; name: string; size: number; state: "waiting" | "uploading" | "done" | "exists" | "error"; percent: number; message?: string };

const KINDS: Record<string, string[]> = {
    영상: ["mp4", "mov", "webm"],
    소리: ["mp3", "wav", "m4a", "ogg"],
    이미지: ["png", "jpg", "jpeg", "webp", "gif", "svg"],
};
// 키 = 접두사 + 파일 이름. "prompts/a.md" → 접두사 "prompts/", 파일 이름 "a.md".
const nameOf = (key: string) => key.slice(key.lastIndexOf("/") + 1);
const prefixOf = (key: string) => key.slice(0, key.lastIndexOf("/") + 1);
const NO_PREFIX = "(none)";
const extOf = (key: string) => (key.includes(".") ? key.split(".").pop()!.toLowerCase() : "");
const kindOf = (key: string) => Object.keys(KINDS).find((k) => KINDS[k].includes(extOf(key))) ?? "기타";

function fmtSize(bytes: number): string {
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${bytes} B`;
}

// 진행률이 필요해 fetch 대신 XHR 을 쓴다(영상은 수십 MB).
function uploadOne(file: File, prefix: string, overwrite: boolean, onProgress: (p: number) => void): Promise<{ status: number; body: UploadReply }> {
    return new Promise((resolve) => {
        const form = new FormData();
        form.append("file", file);
        form.append("prefix", prefix);
        form.append("overwrite", overwrite ? "true" : "false");
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API}/media/upload`);
        xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
        xhr.onload = () => {
            let body: UploadReply = null;
            try { body = JSON.parse(xhr.responseText); } catch { /* 본문이 JSON 이 아니면 상태 코드만 쓴다 */ }
            resolve({ status: xhr.status, body });
        };
        xhr.onerror = () => resolve({ status: 0, body: null });
        xhr.send(form);
    });
}

export default function MediaPage() {
    const [info, setInfo] = useState<Info | null>(null);
    const [items, setItems] = useState<Item[] | null>(null);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [kind, setKind] = useState("");
    // 접두사 필터 — "" 전체, NO_PREFIX 접두사 없는 것만, 그 외는 해당 접두사.
    const [prefixFilter, setPrefixFilter] = useState("");
    const [overwrite, setOverwrite] = useState(false);
    // 접두사(prefix) — 저장소에는 폴더가 없고 파일마다 키(이름) 하나만 있다. 키 앞에 "prompts/" 처럼 붙는 부분이 접두사다.
    const [prefix, setPrefix] = useState("");
    const [jobs, setJobs] = useState<Job[]>([]);
    const [busy, setBusy] = useState(false);
    const [dragging, setDragging] = useState(false);
    const fileInput = useRef<HTMLInputElement>(null);
    const nextId = useRef(1);

    const load = useCallback(async () => {
        try {
            const [i, l] = await Promise.all([fetch(`${API}/media/info`), fetch(`${API}/media/`)]);
            if (i.ok) setInfo(await i.json());
            if (!l.ok) throw new Error(`목록 조회 실패 (${l.status})`);
            setItems((await l.json()).items ?? []);
            setError("");
        } catch (e) {
            setItems([]);
            setError(e instanceof Error ? e.message : String(e));
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const upload = async (files: File[]) => {
        if (busy || files.length === 0) return;
        setBusy(true);
        const queued: Job[] = files.map((f) => ({ id: nextId.current++, name: f.name, size: f.size, state: "waiting", percent: 0 }));
        setJobs((prev) => [...queued, ...prev]);
        const patch = (id: number, changes: Partial<Job>) =>
            setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...changes } : j)));
        for (let n = 0; n < files.length; n++) {
            const job = queued[n];
            patch(job.id, { state: "uploading" });
            const { status, body } = await uploadOne(files[n], prefix.trim(), overwrite, (percent) => patch(job.id, { percent }));
            if (status === 200) patch(job.id, { state: "done", percent: 100, message: body?.key });
            else if (status === 409) patch(job.id, { state: "exists", message: "이미 있는 파일 — 바꾸려면 덮어쓰기를 켜고 다시 올리세요" });
            else patch(job.id, { state: "error", message: typeof body?.detail === "string" ? body.detail : status ? `업로드 실패 (${status})` : "서버에 연결하지 못했습니다" });
        }
        setBusy(false);
        load();
    };

    const shown = useMemo(() => {
        const q = search.trim().toLowerCase();
        return (items ?? []).filter((i) =>
            (!q || i.key.toLowerCase().includes(q)) &&
            (!kind || kindOf(i.key) === kind) &&
            (!prefixFilter || (prefixFilter === NO_PREFIX ? prefixOf(i.key) === "" : prefixOf(i.key) === prefixFilter)));
    }, [items, search, kind, prefixFilter]);
    // 저장소에 실제로 있는 접두사들(개수와 함께) — 필터 선택지.
    const prefixes = useMemo(() => {
        const counts = new Map<string, number>();
        (items ?? []).forEach((i) => counts.set(prefixOf(i.key), (counts.get(prefixOf(i.key)) ?? 0) + 1));
        return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    }, [items]);
    const totalSize = useMemo(() => (items ?? []).reduce((sum, i) => sum + i.size, 0), [items]);

    const copy = (text: string) => navigator.clipboard?.writeText(text).catch(() => {});

    return (
        <div className="mx-auto max-w-6xl">
            <PageHeader
                title="미디어 저장소"
                desc="전시에 쓰는 영상·소리·이미지 파일입니다. 올린 뒤 파일명을 시나리오 프롬프트의 에셋 목록에 적어야 여정에 쓰입니다."
                right={<button onClick={load} className={btn.secondary}>새로고침</button>}
            />

            {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

            <div className="mb-4 grid gap-4 lg:grid-cols-2">
                <Card title="연결된 저장소">
                    {!info ? (
                        <p className="text-sm text-slate-400">불러오는 중…</p>
                    ) : (
                        <dl className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
                            <dt className="text-slate-400">종류</dt>
                            <dd><Badge tone={info.storage === "aws" ? "amber" : "sky"}>{info.storage === "aws" ? "AWS S3" : "S3 호환 저장소 (MinIO 등)"}</Badge></dd>
                            <dt className="text-slate-400">버킷</dt>
                            <dd className="font-mono text-slate-700">{info.bucket}</dd>
                            <dt className="text-slate-400">주소</dt>
                            <dd className="break-all font-mono text-xs text-slate-600">{info.endpoint}</dd>
                            <dt className="text-slate-400">공개 주소</dt>
                            <dd className="break-all font-mono text-xs text-slate-600">{info.public_base}</dd>
                            <dt className="text-slate-400">파일</dt>
                            <dd className="text-slate-700">{(items ?? []).length.toLocaleString()}개 · {fmtSize(totalSize)}</dd>
                        </dl>
                    )}
                    <p className="mt-3 text-xs text-slate-400">
                        저장소는 서버 환경변수로 정합니다(AWS_S3_ENDPOINT 가 있으면 그 주소, 없으면 AWS S3). 이 화면에서는 바꿀 수 없습니다.
                    </p>
                </Card>

                <Card title="파일 올리기">
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={(e) => { e.preventDefault(); setDragging(false); upload(Array.from(e.dataTransfer.files)); }}
                        onClick={() => fileInput.current?.click()}
                        className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-6 text-center text-sm transition ${
                            dragging ? "border-sky-400 bg-sky-50 text-sky-700" : "border-slate-300 text-slate-500 hover:border-slate-400"
                        }`}
                    >
                        {busy ? "올리는 중…" : "여기에 파일을 끌어다 놓거나 눌러서 고르세요 (여러 개 가능)"}
                        <input
                            ref={fileInput}
                            type="file"
                            multiple
                            className="hidden"
                            accept={info?.allowed_extensions.map((e) => `.${e}`).join(",")}
                            onChange={(e) => { upload(Array.from(e.target.files ?? [])); e.target.value = ""; }}
                        />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                        <label className="flex items-center gap-2 text-slate-600">
                            접두사 (prefix)
                            <input value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="보통 비워 둠" className={`${input} w-40`} />
                        </label>
                        <label className="flex items-center gap-2 text-slate-600">
                            <input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} />
                            같은 이름이 있으면 덮어쓰기
                        </label>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                        파일명은 영문·숫자·한글로 시작하고 . _ - 만 섞어 쓸 수 있습니다(공백 불가). 저장소에는 폴더가 없고 파일마다 키(이름) 하나만 있습니다.
                        접두사를 적으면 키가 &quot;접두사/파일명&quot; 이 됩니다. 시나리오 에셋은 접두사 없이 올려야 프롬프트에 파일명만 적어 쓸 수 있습니다.
                    </p>
                </Card>
            </div>

            {jobs.length > 0 && (
                <Card title="업로드 결과" right={<button onClick={() => setJobs([])} disabled={busy} className={btn.ghost}>지우기</button>} className="mb-4">
                    <ul className="flex flex-col gap-2 text-sm">
                        {jobs.map((j) => (
                            <li key={j.id} className="flex flex-wrap items-center gap-3">
                                <span className="min-w-0 flex-1 truncate font-mono text-slate-700">{j.name}</span>
                                <span className="text-xs text-slate-400">{fmtSize(j.size)}</span>
                                {j.state === "uploading" && (
                                    <span className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-200">
                                        <span className="block h-full bg-sky-500 transition-[width]" style={{ width: `${j.percent}%` }} />
                                    </span>
                                )}
                                <Badge tone={j.state === "done" ? "green" : j.state === "exists" ? "amber" : j.state === "error" ? "rose" : "slate"}>
                                    {j.state === "done" ? "올림" : j.state === "exists" ? "이미 있음" : j.state === "error" ? "실패" : j.state === "uploading" ? `${j.percent}%` : "대기"}
                                </Badge>
                                {j.message && j.state !== "done" && <span className="w-full text-xs text-slate-500">{j.message}</span>}
                            </li>
                        ))}
                    </ul>
                </Card>
            )}

            <Card>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="파일 이름·접두사 검색 (예: bgm)" className={`${input} w-64`} />
                    <select value={kind} onChange={(e) => setKind(e.target.value)} className={input} aria-label="종류">
                        <option value="">모든 종류</option>
                        {[...Object.keys(KINDS), "기타"].map((k) => <option key={k} value={k}>{k}</option>)}
                    </select>
                    <select value={prefixFilter} onChange={(e) => setPrefixFilter(e.target.value)} className={input} aria-label="접두사">
                        <option value="">모든 접두사</option>
                        {prefixes.map(([p, n]) => (
                            <option key={p || NO_PREFIX} value={p || NO_PREFIX}>{p || "접두사 없음"} ({n.toLocaleString()})</option>
                        ))}
                    </select>
                    <span className="ml-auto text-sm text-slate-500">{shown.length.toLocaleString()}개</span>
                </div>
                {!items ? (
                    <p className="py-6 text-center text-sm text-slate-400">불러오는 중…</p>
                ) : shown.length === 0 ? (
                    <EmptyState>조건에 맞는 파일이 없습니다.</EmptyState>
                ) : (
                    <div className="max-h-[32rem] overflow-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left text-sm">
                            {/* 열 폭: 접두사 9rem 고정, 종류·크기·수정 시각·동작은 내용 폭에 딱 맞춤(w-[1%]+nowrap), 남는 폭은 전부 파일 이름 열이 받는다(빈 여백 없음). */}
                            <thead className="sticky top-0 bg-slate-50 text-xs text-slate-400">
                                <tr>
                                    <th className="px-4 py-2.5 font-medium">파일 이름</th>
                                    <th className="w-36 px-4 py-2.5 font-medium">접두사 (prefix)</th>
                                    <th className="w-[1%] whitespace-nowrap px-4 py-2.5 font-medium">종류</th>
                                    <th className="w-[1%] whitespace-nowrap px-4 py-2.5 text-right font-medium">크기</th>
                                    <th className="w-[1%] whitespace-nowrap px-4 py-2.5 font-medium">수정 시각</th>
                                    <th className="w-[1%] whitespace-nowrap px-4 py-2.5 text-right font-medium">동작</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {shown.map((i) => (
                                    <tr key={i.key} className="hover:bg-slate-50">
                                        <td className="break-all px-4 py-2.5 font-mono text-slate-700">{nameOf(i.key)}</td>
                                        <td className="w-36 max-w-36 break-all px-4 py-2.5 font-mono text-xs text-slate-500">{prefixOf(i.key) || <span className="text-slate-300">없음</span>}</td>
                                        <td className="whitespace-nowrap px-4 py-2.5 text-xs text-slate-500">{kindOf(i.key)}</td>
                                        <td className="whitespace-nowrap px-4 py-2.5 text-right text-xs text-slate-500">{fmtSize(i.size)}</td>
                                        <td className="whitespace-nowrap px-4 py-2.5 text-xs text-slate-400">{fmtDateTime(i.last_modified)}</td>
                                        <td className="whitespace-nowrap px-4 py-2.5 text-right">
                                            <button onClick={() => copy(i.key)} className={btn.ghost} title="접두사를 포함한 전체 키를 복사합니다">키 복사</button>
                                            <a href={i.url} target="_blank" rel="noreferrer" className={btn.ghost}>열기</a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
