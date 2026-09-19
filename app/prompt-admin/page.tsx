"use client";

// 프롬프트 관리 화면 — Postman 으로 치던 POST /prompt 를 대체한다.
// 서버의 "삭제 제외 최신 레코드 = 라이브" 불변식 위에서 동작한다:
//   저장(신규 버전)·재적용 = 새 레코드 생성 → 즉시 다음 여정부터 적용.
// 본문은 DB(content)에 박제되므로 목록은 메타만 받고, 열람할 때 /content 를 부른다.

import { useCallback, useEffect, useMemo, useState } from "react";
import { BASE_API_LINK } from "../constants";

type PromptMeta = {
    id: number;
    filename: string;
    file_url: string | null;
    memo: string;
    starred: boolean;
    active: boolean;
    created_at: string | null;
};

const API = BASE_API_LINK.replace(/\/+$/, "");

// "ambient_step4_v3.md" → { base: "ambient_step4", ver: 3 } (버전 표기 없으면 null)
function parseVersion(filename: string): { base: string; ver: number } | null {
    const m = filename.match(/^(.*)_v(\d+)\.md$/i);
    return m ? { base: m[1], ver: parseInt(m[2], 10) } : null;
}

// 같은 base 의 최대 버전 +1 로 다음 파일명을 제안한다. 버전 표기가 없으면 _v2 부터.
function nextFilename(from: string, all: PromptMeta[]): string {
    const parsed = parseVersion(from);
    const base = parsed ? parsed.base : from.replace(/\.md$/i, "");
    let maxVer = parsed ? parsed.ver : 1;
    for (const p of all) {
        const v = parseVersion(p.filename);
        if (v && v.base === base && v.ver > maxVer) maxVer = v.ver;
    }
    return `${base}_v${maxVer + 1}.md`;
}

function fmtDate(iso: string | null): string {
    if (!iso) return "-";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleString("ko-KR", { hour12: false });
}

export default function PromptAdminPage() {
    const [items, setItems] = useState<PromptMeta[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    // 편집기 상태 — 어떤 버전을 열었고(원본 id), 무엇으로 저장할지
    const [editorOpen, setEditorOpen] = useState(false);
    const [editorSourceId, setEditorSourceId] = useState<number | null>(null);
    const [editorFilename, setEditorFilename] = useState("");
    const [editorContent, setEditorContent] = useState("");
    const [editorMemo, setEditorMemo] = useState("");

    // 메모 인라인 수정 버퍼 (id → 입력값)
    const [memoDrafts, setMemoDrafts] = useState<Record<number, string>>({});

    const active = useMemo(() => items.find((i) => i.active) ?? null, [items]);

    const refresh = useCallback(async () => {
        try {
            const r = await fetch(`${API}/prompt`, { cache: "no-store" });
            if (!r.ok) throw new Error(`목록 조회 실패 (${r.status})`);
            setItems(await r.json());
            setError("");
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    // 공통 액션 래퍼 — 실패는 alert 로, 성공은 목록 갱신으로 끝낸다.
    const run = useCallback(
        async (fn: () => Promise<void>) => {
            if (busy) return;
            setBusy(true);
            try {
                await fn();
                await refresh();
            } catch (e) {
                alert(e instanceof Error ? e.message : String(e));
            } finally {
                setBusy(false);
            }
        },
        [busy, refresh],
    );

    const openEditor = (item: PromptMeta | null) =>
        run(async () => {
            if (!item) {
                // 빈 편집기 — 완전히 새 프롬프트 계열 시작
                setEditorSourceId(null);
                setEditorFilename("");
                setEditorContent("");
                setEditorMemo("");
                setEditorOpen(true);
                return;
            }
            const r = await fetch(`${API}/prompt/${item.id}/content`, { cache: "no-store" });
            if (!r.ok) {
                const detail = (await r.json().catch(() => null))?.detail;
                throw new Error(detail || `본문 조회 실패 (${r.status})`);
            }
            const body = await r.json();
            setEditorSourceId(item.id);
            setEditorFilename(nextFilename(item.filename, items));
            setEditorContent(body.content);
            setEditorMemo("");
            setEditorOpen(true);
        });

    const saveEditor = () =>
        run(async () => {
            if (!editorFilename.trim() || !editorContent.trim())
                throw new Error("파일명과 본문을 채워주세요");
            if (items.some((i) => i.filename === editorFilename.trim()))
                throw new Error(`같은 파일명이 이미 있습니다: ${editorFilename} — 버전을 올려주세요`);
            if (!confirm(`"${editorFilename}" 로 저장하면 즉시 라이브로 적용됩니다. 진행할까요?`)) return;
            const r = await fetch(`${API}/prompt/text`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    filename: editorFilename.trim(),
                    content: editorContent,
                    memo: editorMemo,
                }),
            });
            if (!r.ok) throw new Error(`저장 실패 (${r.status})`);
            setEditorOpen(false);
        });

    const applyOld = (item: PromptMeta) =>
        run(async () => {
            if (!confirm(`"${item.filename}" (#${item.id}) 를 다시 라이브로 적용할까요?`)) return;
            const r = await fetch(`${API}/prompt/${item.id}/apply`, { method: "POST" });
            if (!r.ok) throw new Error(`재적용 실패 (${r.status})`);
        });

    const softDelete = (item: PromptMeta) =>
        run(async () => {
            const warn = item.active
                ? `라이브인 "${item.filename}" 을 삭제하면 이전 버전이 라이브가 됩니다. 삭제할까요?`
                : `"${item.filename}" 을 목록에서 숨길까요? (기록은 보존됩니다)`;
            if (!confirm(warn)) return;
            const r = await fetch(`${API}/prompt/${item.id}`, { method: "DELETE" });
            if (!r.ok) throw new Error(`삭제 실패 (${r.status})`);
        });

    const toggleStar = (item: PromptMeta) =>
        run(async () => {
            const r = await fetch(`${API}/prompt/${item.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ starred: !item.starred }),
            });
            if (!r.ok) throw new Error(`상태 변경 실패 (${r.status})`);
        });

    const saveMemo = (item: PromptMeta) =>
        run(async () => {
            const memo = memoDrafts[item.id];
            if (memo === undefined || memo === item.memo) return;
            const r = await fetch(`${API}/prompt/${item.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ memo }),
            });
            if (!r.ok) throw new Error(`메모 저장 실패 (${r.status})`);
            setMemoDrafts((d) => {
                const next = { ...d };
                delete next[item.id];
                return next;
            });
        });

    return (
        <div className="min-h-screen w-full bg-neutral-950 px-6 py-8 text-neutral-100">
            <div className="mx-auto max-w-5xl">
                <header className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">시나리오 프롬프트 관리</h1>
                        <p className="mt-1 text-sm text-neutral-400">
                            저장·재적용은 다음 여정(세션)부터 반영됩니다. 진행 중 여정은 영향 없음.
                        </p>
                    </div>
                    <button
                        onClick={() => openEditor(null)}
                        disabled={busy}
                        className="rounded-lg bg-neutral-800 px-4 py-2 text-sm hover:bg-neutral-700 disabled:opacity-40"
                    >
                        ＋ 새 프롬프트
                    </button>
                </header>

                {error && (
                    <div className="mb-4 rounded-lg border border-red-800 bg-red-950/60 px-4 py-3 text-sm text-red-300">
                        {error}
                    </div>
                )}

                {/* 현재 라이브 */}
                <section className="mb-6 rounded-xl border border-emerald-800 bg-emerald-950/40 p-4">
                    <div className="mb-1 text-xs font-semibold tracking-wide text-emerald-400">
                        현재 적용 중
                    </div>
                    {active ? (
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="font-mono text-lg">{active.filename || `#${active.id}`}</span>
                            <span className="text-xs text-neutral-400">{fmtDate(active.created_at)}</span>
                            {active.memo && <span className="text-sm text-neutral-300">— {active.memo}</span>}
                            <button
                                onClick={() => openEditor(active)}
                                disabled={busy}
                                className="ml-auto rounded-lg bg-emerald-700 px-3 py-1.5 text-sm hover:bg-emerald-600 disabled:opacity-40"
                            >
                                보기 · 수정해서 새 버전
                            </button>
                        </div>
                    ) : (
                        <div className="text-sm text-neutral-400">
                            {loading ? "불러오는 중…" : "적용된 프롬프트가 없습니다 (서버 기본 파일로 폴백 중)"}
                        </div>
                    )}
                </section>

                {/* 편집기 */}
                {editorOpen && (
                    <section className="mb-6 rounded-xl border border-neutral-700 bg-neutral-900 p-4">
                        <div className="mb-3 flex items-center gap-3">
                            <span className="text-sm font-semibold text-neutral-300">
                                {editorSourceId ? `#${editorSourceId} 기반 새 버전` : "새 프롬프트"}
                            </span>
                            <input
                                value={editorFilename}
                                onChange={(e) => setEditorFilename(e.target.value)}
                                placeholder="ambient_step4_v5.md"
                                className="w-72 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-1.5 font-mono text-sm outline-none focus:border-neutral-400"
                            />
                            <input
                                value={editorMemo}
                                onChange={(e) => setEditorMemo(e.target.value)}
                                placeholder="메모 (이 버전의 특징)"
                                className="flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-sm outline-none focus:border-neutral-400"
                            />
                        </div>
                        <textarea
                            value={editorContent}
                            onChange={(e) => setEditorContent(e.target.value)}
                            spellCheck={false}
                            className="h-[28rem] w-full resize-y rounded-md border border-neutral-700 bg-neutral-950 p-3 font-mono text-xs leading-relaxed outline-none focus:border-neutral-400"
                        />
                        <div className="mt-3 flex justify-end gap-2">
                            <button
                                onClick={() => setEditorOpen(false)}
                                disabled={busy}
                                className="rounded-lg px-4 py-2 text-sm text-neutral-400 hover:bg-neutral-800"
                            >
                                닫기
                            </button>
                            <button
                                onClick={saveEditor}
                                disabled={busy}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500 disabled:opacity-40"
                            >
                                저장하고 적용
                            </button>
                        </div>
                    </section>
                )}

                {/* 이력 목록 */}
                <section className="rounded-xl border border-neutral-800">
                    <div className="grid grid-cols-[2.5rem_1fr_11rem_1fr_13rem] items-center gap-2 border-b border-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-500">
                        <span>★</span>
                        <span>파일명</span>
                        <span>저장 시각</span>
                        <span>메모</span>
                        <span className="text-right">동작</span>
                    </div>
                    {loading && <div className="px-4 py-6 text-sm text-neutral-500">불러오는 중…</div>}
                    {!loading && items.length === 0 && (
                        <div className="px-4 py-6 text-sm text-neutral-500">저장된 프롬프트가 없습니다.</div>
                    )}
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className={`grid grid-cols-[2.5rem_1fr_11rem_1fr_13rem] items-center gap-2 border-b border-neutral-800/60 px-4 py-2.5 text-sm ${
                                item.active ? "bg-emerald-950/30" : ""
                            }`}
                        >
                            <button
                                onClick={() => toggleStar(item)}
                                disabled={busy}
                                title="상태 좋음 표시"
                                className={`text-lg leading-none ${item.starred ? "text-yellow-400" : "text-neutral-700 hover:text-neutral-400"}`}
                            >
                                ★
                            </button>
                            <span className="truncate font-mono">
                                {item.filename || `#${item.id}`}
                                {item.active && (
                                    <span className="ml-2 rounded bg-emerald-800 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-200">
                                        LIVE
                                    </span>
                                )}
                                {!item.file_url && item.filename === "" && (
                                    <span className="ml-2 text-xs text-neutral-500">(이름 없음)</span>
                                )}
                            </span>
                            <span className="text-xs text-neutral-400">{fmtDate(item.created_at)}</span>
                            <span className="flex items-center gap-1">
                                <input
                                    value={memoDrafts[item.id] ?? item.memo}
                                    onChange={(e) =>
                                        setMemoDrafts((d) => ({ ...d, [item.id]: e.target.value }))
                                    }
                                    onBlur={() => saveMemo(item)}
                                    onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                                    placeholder="메모…"
                                    className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-xs outline-none hover:border-neutral-700 focus:border-neutral-500 focus:bg-neutral-950"
                                />
                            </span>
                            <span className="flex justify-end gap-1.5">
                                <button
                                    onClick={() => openEditor(item)}
                                    disabled={busy}
                                    className="rounded-md bg-neutral-800 px-2.5 py-1 text-xs hover:bg-neutral-700 disabled:opacity-40"
                                >
                                    보기·편집
                                </button>
                                <button
                                    onClick={() => applyOld(item)}
                                    disabled={busy || item.active}
                                    className="rounded-md bg-neutral-800 px-2.5 py-1 text-xs hover:bg-neutral-700 disabled:opacity-40"
                                >
                                    적용
                                </button>
                                <button
                                    onClick={() => softDelete(item)}
                                    disabled={busy}
                                    className="rounded-md bg-neutral-800 px-2.5 py-1 text-xs text-red-400 hover:bg-red-950 disabled:opacity-40"
                                >
                                    삭제
                                </button>
                            </span>
                        </div>
                    ))}
                </section>

                <p className="mt-4 text-xs text-neutral-600">
                    삭제는 화면에서만 숨깁니다(soft delete — 기록·본문 보존). 본문이 DB에 없는 구(MinIO)
                    버전은 열람이 안 될 수 있습니다.
                </p>
            </div>
        </div>
    );
}
