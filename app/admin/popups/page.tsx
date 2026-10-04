"use client";

// 팝업 설정 (2026-10-05).
// ① DEFAULT_POPUP·TRIGGER_POPUP 각각 모양(기존 아이콘 카드 / 이미지 팝업)·표시 시간 — 저장하면 다음 스텝부터 적용(배포 불필요).
// ② 이미지 팝업 그림 — 피그마 GUI 가이드 그룹 2390:288 의 14종. 제목은 고정, 설명은 LLM 이 쓴다.
//    그림이 없는 팝업은 이미지 팝업 모양일 때 아이콘을 크게 보여준다.

import { useCallback, useEffect, useRef, useState } from "react";
import { BASE_API_LINK } from "@/constants";

import { Card, EmptyState, PageHeader, btn, input } from "../admin-ui";
import { normalizeImage } from "../image-normalize";

const API = BASE_API_LINK.replace(/\/+$/, "");
// 이미지 팝업 그림 칸 509×388 — 2배로 저장, 잘리지 않게 맞춤
const SLOT_W = 509;
const SLOT_H = 388;

type KindConfig = { style: "icon" | "image" | "auto"; seconds: number };
type Config = { default: KindConfig; trigger: KindConfig };
type ImageRow = { id: string; key: string; title: string; usage: string; image_url: string | null };

const STYLE_LABELS: Record<KindConfig["style"], string> = {
    icon: "기존 아이콘 카드",
    auto: "자동 (그림 있는 팝업만 이미지)",
    image: "이미지 팝업",
};

const KIND_LABELS: Record<keyof Config, { name: string; desc: string }> = {
    default: { name: "DEFAULT_POPUP", desc: "일반 알림 — LLM 연출 팝업, OC 이벤트 팝업" },
    trigger: { name: "TRIGGER_POPUP", desc: "돌발 연출 — 동물 출현 등" },
};

function ConfigCard() {
    const [cfg, setCfg] = useState<Config | null>(null);
    const [saved, setSaved] = useState<Config | null>(null);
    const [state, setState] = useState<"idle" | "busy" | "ok" | "error">("idle");

    useEffect(() => {
        fetch(`${API}/popups/config`, { cache: "no-store" })
            .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
            .then((d: Config) => {
                setCfg(d);
                setSaved(d);
            })
            .catch(() => setState("error"));
    }, []);

    const save = async () => {
        if (!cfg) return;
        setState("busy");
        try {
            const r = await fetch(`${API}/popups/config`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(cfg),
            });
            if (!r.ok) throw new Error(String(r.status));
            const d = (await r.json()) as Config;
            setCfg(d);
            setSaved(d);
            setState("ok");
        } catch {
            setState("error");
        }
    };
    const dirty = cfg && saved && JSON.stringify(cfg) !== JSON.stringify(saved);

    return (
        <Card
            title="팝업 모양·표시 시간"
            right={
                <button type="button" className={btn.primary} disabled={!dirty || state === "busy"} onClick={save}>
                    {state === "busy" ? "저장 중…" : "저장"}
                </button>
            }
        >
            {!cfg ? (
                <EmptyState>{state === "error" ? "서버에서 설정을 받지 못했습니다." : "불러오는 중…"}</EmptyState>
            ) : (
                <div className="space-y-3">
                    {(Object.keys(KIND_LABELS) as (keyof Config)[]).map((k) => (
                        <div key={k} className="flex flex-wrap items-center gap-4 rounded-xl bg-slate-50 px-4 py-3">
                            <div className="min-w-[220px]">
                                <div className="font-semibold text-slate-800">{KIND_LABELS[k].name}</div>
                                <div className="text-xs text-slate-500">{KIND_LABELS[k].desc}</div>
                            </div>
                            <div className="flex overflow-hidden rounded-lg border border-slate-300">
                                {(["icon", "auto", "image"] as const).map((style) => (
                                    <button
                                        key={style}
                                        type="button"
                                        onClick={() => setCfg({ ...cfg, [k]: { ...cfg[k], style } })}
                                        className={`px-3.5 py-2 text-sm ${cfg[k].style === style ? "bg-sky-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
                                    >
                                        {STYLE_LABELS[style]}
                                    </button>
                                ))}
                            </div>
                            <label className="flex items-center gap-2 text-sm text-slate-600">
                                표시 시간
                                <input
                                    type="number"
                                    min={1}
                                    max={15}
                                    value={cfg[k].seconds}
                                    onChange={(e) => setCfg({ ...cfg, [k]: { ...cfg[k], seconds: Number(e.target.value) } })}
                                    className={`${input} w-20`}
                                />
                                초
                            </label>
                        </div>
                    ))}
                    <p className="text-xs text-slate-500">
                        저장하면 <b>다음에 생성되는 스텝부터</b> 적용됩니다(배포 불필요). <b>이미지 팝업</b>은 모든 팝업을 큰 이미지 팝업으로 — 그림이 없는
                        팝업(문열림·OC 이벤트 등)은 아이콘을 크게. <b>자동</b>은 그림이 있는 팝업만 이미지 팝업, 나머지는 기존 카드.
                        {state === "ok" && <span className="ml-2 font-semibold text-emerald-600">저장했습니다.</span>}
                        {state === "error" && cfg && <span className="ml-2 font-semibold text-rose-600">저장 실패</span>}
                    </p>
                </div>
            )}
        </Card>
    );
}

function ImageRowView({ row, onChanged }: { row: ImageRow; onChanged: () => void }) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const upload = async (file: File) => {
        setBusy(true);
        setError(null);
        const form = new FormData();
        form.append("file", await normalizeImage(file, SLOT_W * 2, SLOT_H * 2, "contain"));
        form.append("label", row.title);
        try {
            const r = await fetch(`${API}/briefing-images/${encodeURIComponent(row.key)}`, { method: "POST", body: form });
            if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.detail || `업로드 실패 ${r.status}`);
            onChanged();
        } catch (e) {
            setError(e instanceof Error ? e.message : "업로드 실패");
        } finally {
            setBusy(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    };
    const remove = async () => {
        setBusy(true);
        try {
            await fetch(`${API}/briefing-images/${encodeURIComponent(row.key)}`, { method: "DELETE" });
            onChanged();
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="flex items-center gap-4 border-b border-slate-100 py-3 last:border-b-0">
            {/* 팝업 그림 칸과 같은 비율(509×388) 미리보기 */}
            <div className="flex h-[76px] w-[100px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-800">
                {row.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.image_url} alt="" className="h-full w-full object-contain" />
                ) : (
                    <span className="text-xs text-slate-400">그림 없음</span>
                )}
            </div>
            <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-800">{row.title}</div>
                <div className="font-mono text-xs text-slate-400">{row.id}</div>
                <div className="text-xs text-slate-500">{row.usage}</div>
                {error && <div className="text-xs text-rose-600">{error}</div>}
            </div>
            <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) upload(f);
                }}
            />
            <button type="button" className={btn.secondary} disabled={busy} onClick={() => fileRef.current?.click()}>
                {busy ? "처리 중…" : row.image_url ? "그림 바꾸기" : "그림 올리기"}
            </button>
            {row.image_url && (
                <button type="button" className={btn.danger} disabled={busy} onClick={remove}>
                    지우기
                </button>
            )}
        </div>
    );
}

export default function PopupSettingsPage() {
    const [rows, setRows] = useState<ImageRow[] | null>(null);
    const load = useCallback(() => {
        fetch(`${API}/popups/images`, { cache: "no-store" })
            .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
            .then((d) => setRows(d?.rows ?? []))
            .catch(() => setRows([]));
    }, []);
    useEffect(load, [load]);

    return (
        <div className="mx-auto max-w-5xl">
            <PageHeader title="팝업 설정" desc="차 화면 팝업의 모양과 표시 시간, 이미지 팝업 그림을 정합니다." />
            <div className="space-y-5">
                <ConfigCard />
                <div className="rounded-xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm leading-relaxed text-sky-900">
                    <div className="font-semibold">차량 화면에서 이미지 팝업이 보이는 크기</div>
                    <ul className="mt-1 list-disc pl-5">
                        <li>팝업 577×610px, 그림 칸 <b>{SLOT_W}×{SLOT_H}px</b>. 올리면 자동으로 {SLOT_W * 2}×{SLOT_H * 2}px(2배)로 맞춰 저장합니다.</li>
                        <li>그림은 잘리지 않게 칸 안에 맞추고, 배경이 투명하면 투명 여백을 걷어냅니다.</li>
                        <li>제목은 아래 목록의 제목으로 고정, 설명 문구는 LLM 이 상황에 맞게 씁니다(시나리오 프롬프트 v21~).</li>
                    </ul>
                </div>
                <Card title={`이미지 팝업 (${rows?.length ?? 0}종)`}>
                    {!rows ? (
                        <EmptyState>불러오는 중…</EmptyState>
                    ) : rows.length === 0 ? (
                        <EmptyState>서버에서 목록을 받지 못했습니다.</EmptyState>
                    ) : (
                        rows.map((r) => <ImageRowView key={r.id} row={r} onChanged={load} />)
                    )}
                </Card>
            </div>
        </div>
    );
}
