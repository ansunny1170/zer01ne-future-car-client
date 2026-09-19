"use client";

// 프롬프트 관리 화면 — Postman 으로 치던 POST /prompt 를 대체한다.
// 서버의 "삭제 제외 최신 레코드 = 라이브" 불변식 위에서 동작한다:
//   저장(신규 버전)·재적용 = 새 레코드 생성 → 즉시 다음 여정부터 적용 (덮어쓰기 없음).
// 편집기는 목록 행 바로 아래 인라인으로 펼쳐지고(prompt-editor.tsx), 섹션 칩·검색·
// md 미리보기 등 편집 UI 는 그 컴포넌트가 맡는다. 이 파일은 목록·행 액션·데이터 왕복만.

import { useCallback, useEffect, useMemo, useState } from "react";
import { BASE_API_LINK } from "@/constants";

import { PromptEditor } from "./prompt-editor";
import { fmtDate, type PromptContent, type PromptMeta } from "./sections";

const API = BASE_API_LINK.replace(/\/+$/, "");

/** 편집기가 펼쳐진 위치 — 행 id, 또는 "새 프롬프트"(목록 최상단) */
type EditorSlot = { anchorId: number | null; initial: PromptContent | null };

export default function PromptAdminPage() {
    const [items, setItems] = useState<PromptMeta[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [editor, setEditor] = useState<EditorSlot | null>(null);
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

    /** [보기·편집] — 본문을 받아 그 행 아래에 편집기를 펼친다. null 이면 새 프롬프트(최상단). */
    const openEditor = (item: PromptMeta | null) =>
        run(async () => {
            if (!item) {
                setEditor({ anchorId: null, initial: null });
                return;
            }
            const r = await fetch(`${API}/prompt/${item.id}/content`, { cache: "no-store" });
            if (!r.ok) {
                const detail = (await r.json().catch(() => null))?.detail;
                throw new Error(detail || `본문 조회 실패 (${r.status})`);
            }
            setEditor({ anchorId: item.id, initial: await r.json() });
        });

    const saveEditor = (payload: {
        filename: string;
        memo: string;
        content?: string;
        sections?: { key: string; content: string }[];
    }) =>
        run(async () => {
            const r = await fetch(`${API}/prompt/text`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!r.ok) {
                const detail = (await r.json().catch(() => null))?.detail;
                throw new Error(typeof detail === "string" ? detail : `저장 실패 (${r.status})`);
            }
            setEditor(null);
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
            if (editor?.anchorId === item.id) setEditor(null);
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

    const editorNode = editor && (
        <PromptEditor
            key={editor.anchorId ?? "new"}
            initial={editor.initial}
            items={items}
            busy={busy}
            onSave={saveEditor}
            onClose={() => setEditor(null)}
        />
    );

    return (
        // 스크롤·배경·여백은 admin 레이아웃(app/admin/layout.tsx)이 제공한다.
        <div className="w-full">
            <header className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">시나리오 프롬프트 관리</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        저장·재적용은 다음 여정(세션)부터 반영됩니다. 진행 중 여정은 영향 없음.
                    </p>
                </div>
                <button
                    onClick={() => openEditor(null)}
                    disabled={busy}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                    ＋ 새 프롬프트
                </button>
            </header>

            {error && (
                <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                </div>
            )}

            {/* 현재 라이브 요약 카드 — 편집 버튼은 해당 행을 펼친다 */}
            <section className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="mb-1 text-xs font-semibold tracking-wide text-emerald-600">현재 적용 중</div>
                {active ? (
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono text-lg">{active.filename || `#${active.id}`}</span>
                        <span className="text-xs text-slate-500">{fmtDate(active.created_at)}</span>
                        {active.memo && <span className="text-sm text-slate-600">— {active.memo}</span>}
                        <button
                            onClick={() => openEditor(active)}
                            disabled={busy}
                            className="ml-auto rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-500 disabled:opacity-40"
                        >
                            보기 · 수정해서 새 버전
                        </button>
                    </div>
                ) : (
                    <div className="text-sm text-slate-500">
                        {loading ? "불러오는 중…" : "적용된 프롬프트가 없습니다 (서버 기본 파일로 폴백 중)"}
                    </div>
                )}
            </section>

            {/* 새 프롬프트 편집기 — 목록 최상단에 펼침 */}
            {editor && editor.anchorId === null && (
                <section className="mb-6 rounded-xl border border-slate-300">{editorNode}</section>
            )}

            {/* 이력 목록 — [보기·편집] 을 누른 행 바로 아래에 편집기가 이어진다 */}
            <section className="rounded-xl border border-slate-200">
                <div className="grid grid-cols-[2.5rem_1fr_11rem_1fr_13rem] items-center gap-2 border-b border-slate-200 px-4 py-2 text-xs font-semibold text-slate-400">
                    <span>★</span>
                    <span>파일명</span>
                    <span>저장 시각</span>
                    <span>메모</span>
                    <span className="text-right">동작</span>
                </div>
                {loading && <div className="px-4 py-6 text-sm text-slate-400">불러오는 중…</div>}
                {!loading && items.length === 0 && (
                    <div className="px-4 py-6 text-sm text-slate-400">저장된 프롬프트가 없습니다.</div>
                )}
                {items.map((item) => {
                    const expanded = editor?.anchorId === item.id;
                    return (
                        <div key={item.id}>
                            <div
                                className={`grid grid-cols-[2.5rem_1fr_11rem_1fr_13rem] items-center gap-2 border-b border-slate-200 px-4 py-2.5 text-sm ${
                                    item.active ? "bg-emerald-50/70" : expanded ? "bg-white" : ""
                                }`}
                            >
                                <button
                                    onClick={() => toggleStar(item)}
                                    disabled={busy}
                                    title="상태 좋음 표시"
                                    className={`text-lg leading-none ${item.starred ? "text-yellow-400" : "text-slate-300 hover:text-slate-500"}`}
                                >
                                    ★
                                </button>
                                <span className="truncate font-mono">
                                    {item.filename || `#${item.id}`}
                                    {item.active && (
                                        <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                                            LIVE
                                        </span>
                                    )}
                                </span>
                                <span className="text-xs text-slate-500">{fmtDate(item.created_at)}</span>
                                <span className="flex items-center gap-1">
                                    <input
                                        value={memoDrafts[item.id] ?? item.memo}
                                        onChange={(e) => setMemoDrafts((d) => ({ ...d, [item.id]: e.target.value }))}
                                        onBlur={() => saveMemo(item)}
                                        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                                        placeholder="메모…"
                                        className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-xs outline-none hover:border-slate-300 focus:border-sky-400 focus:bg-white"
                                    />
                                </span>
                                <span className="flex justify-end gap-1.5">
                                    <button
                                        onClick={() => (expanded ? setEditor(null) : openEditor(item))}
                                        disabled={busy}
                                        className={`rounded-md px-2.5 py-1 text-xs disabled:opacity-40 ${
                                            expanded
                                                ? "bg-blue-700 text-white hover:bg-blue-600"
                                                : "bg-slate-100 hover:bg-slate-200"
                                        }`}
                                    >
                                        {expanded ? "편집 닫기" : "보기·편집"}
                                    </button>
                                    <button
                                        onClick={() => applyOld(item)}
                                        disabled={busy || item.active}
                                        className="rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-200 disabled:opacity-40"
                                    >
                                        적용
                                    </button>
                                    <button
                                        onClick={() => softDelete(item)}
                                        disabled={busy}
                                        className="rounded-md bg-slate-100 px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-40"
                                    >
                                        삭제
                                    </button>
                                </span>
                            </div>
                            {expanded && editorNode}
                        </div>
                    );
                })}
            </section>

            <p className="mt-4 text-xs text-slate-400">
                삭제는 화면에서만 숨깁니다(soft delete — 기록·본문 보존). 섹션 분할 전 버전은 편집기에서
                &ldquo;섹션으로 나누기&rdquo;로 전환할 수 있습니다.
            </p>
        </div>
    );
}
