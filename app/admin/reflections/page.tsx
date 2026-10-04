"use client";

// 엔딩 일기 관리 — /review 에 나가는 일기(작년 2025-car · 올해 2026-ambient)를 전부 보고 고치고 지운다.
// 조회 GET /ending-reflection/?status=all, 수정 PATCH /ending-reflection/{id}, 삭제 DELETE /ending-reflection/{id}.
// 새로 만드는 기능은 없다 — 일기는 세션이 끝날 때(엔딩)만 생긴다.

import { useCallback, useEffect, useState } from "react";
import { BASE_API_LINK } from "@/constants";
import { Reflection } from "@/type";

import { Badge, Card, EmptyState, PageHeader, btn, fmtDateTime, input } from "../admin-ui";

const API = BASE_API_LINK.replace(/\/+$/, "");
const PAGE_SIZE = 50;

const EDITION_LABELS: Record<string, string> = { "2025-car": "차량 전용", "2026-ambient": "2026 전체 여정" };
type Draft = { event_title: string; nick_name: string; reflection_text: string; edition: string; status: string };

const draftOf = (r: Reflection): Draft => ({
    event_title: r.event_title ?? "",
    nick_name: r.nick_name ?? "",
    reflection_text: r.reflection_text ?? "",
    edition: r.edition ?? "2025-car",
    status: r.status ?? "visible",
});

export default function ReflectionsPage() {
    const [rows, setRows] = useState<Reflection[] | null>(null);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [edition, setEdition] = useState("");
    const [status, setStatus] = useState("all");
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Reflection | null>(null);
    const [draft, setDraft] = useState<Draft | null>(null);
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

    const load = useCallback(async () => {
        const params = new URLSearchParams({ status });
        if (edition) params.set("editions", edition);
        if (search) params.set("q", search);
        try {
            const [list, count] = await Promise.all([
                fetch(`${API}/ending-reflection/?${params}&limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`),
                fetch(`${API}/ending-reflection/count?${params}`),
            ]);
            if (!list.ok) throw new Error(`목록 조회 실패 (${list.status})`);
            setRows(await list.json());
            setTotal(count.ok ? (await count.json()).total ?? 0 : 0);
        } catch (e) {
            setRows([]);
            setNotice({ ok: false, text: e instanceof Error ? e.message : String(e) });
        }
    }, [edition, status, search, page]);

    useEffect(() => {
        load();
    }, [load]);

    const open = (r: Reflection) => {
        setSelected(r);
        setDraft(draftOf(r));
        setNotice(null);
    };
    const close = () => {
        setSelected(null);
        setDraft(null);
    };

    const patch = async (r: Reflection, changes: Partial<Draft>, done: string) => {
        setBusy(true);
        setNotice(null);
        try {
            const res = await fetch(`${API}/ending-reflection/${r.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(changes),
            });
            const body = await res.json().catch(() => null);
            if (!res.ok) throw new Error(typeof body?.detail === "string" ? body.detail : `수정 실패 (${res.status})`);
            if (selected?.id === r.id) {
                // 저장된 값으로 편집 칸을 다시 맞춘다 (open 은 알림을 지우므로 쓰지 않는다)
                setSelected(body as Reflection);
                setDraft(draftOf(body as Reflection));
            }
            setNotice({ ok: true, text: done });
            await load();
        } catch (e) {
            setNotice({ ok: false, text: e instanceof Error ? e.message : String(e) });
        } finally {
            setBusy(false);
        }
    };

    const save = () => {
        if (!selected || !draft) return;
        const before = draftOf(selected);
        const changes: Partial<Draft> = {};
        (Object.keys(draft) as (keyof Draft)[]).forEach((k) => {
            if (draft[k] !== before[k]) changes[k] = draft[k];
        });
        if (Object.keys(changes).length === 0) {
            setNotice({ ok: true, text: "바뀐 내용이 없습니다." });
            return;
        }
        patch(selected, changes, `#${selected.id} 일기를 저장했습니다.`);
    };

    const remove = async (r: Reflection) => {
        if (!confirm(`#${r.id} "${r.nick_name || "이름 없음"}" 일기를 완전히 삭제할까요?\n되돌릴 수 없습니다. 화면에서만 빼려면 "숨김"을 쓰세요.`)) return;
        setBusy(true);
        setNotice(null);
        try {
            const res = await fetch(`${API}/ending-reflection/${r.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error(`삭제 실패 (${res.status})`);
            setNotice({ ok: true, text: `#${r.id} 일기를 삭제했습니다.` });
            if (selected?.id === r.id) close();
            await load();
        } catch (e) {
            setNotice({ ok: false, text: e instanceof Error ? e.message : String(e) });
        } finally {
            setBusy(false);
        }
    };

    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const changeFilter = (fn: () => void) => {
        fn();
        setPage(0);
    };

    return (
        <div className="mx-auto max-w-7xl">
            <PageHeader
                title="엔딩 일기"
                desc="/review 에 나가는 일기 전체입니다. 숨김은 화면에서만 빼고, 삭제는 완전히 지웁니다. 일기는 세션이 끝날 때 자동으로 만들어집니다."
                right={<button onClick={load} className={btn.secondary}>새로고침</button>}
            />

            {notice && (
                <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
                    notice.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"
                }`}>
                    {notice.text}
                </div>
            )}

            <div className="mb-4 flex flex-wrap items-center gap-2">
                <select value={edition} onChange={(e) => changeFilter(() => setEdition(e.target.value))} className={input} aria-label="버전">
                    <option value="">모든 버전</option>
                    <option value="2026-ambient">2026 전체 여정</option>
                    <option value="2025-car">차량 전용</option>
                </select>
                <select value={status} onChange={(e) => changeFilter(() => setStatus(e.target.value))} className={input} aria-label="상태">
                    <option value="all">보임 + 숨김</option>
                    <option value="visible">보임만</option>
                    <option value="hidden">숨김만</option>
                </select>
                <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                        changeFilter(() => setSearch(searchInput.trim()));
                    }}
                >
                    <input
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="별명·제목·본문·세션 검색"
                        className={`${input} w-64`}
                    />
                    <button type="submit" className={btn.secondary}>검색</button>
                </form>
                <span className="ml-auto text-sm text-slate-500">총 {total.toLocaleString()}건</span>
            </div>

            <div className={`grid gap-4 ${selected ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]" : ""}`}>
                <Card>
                    {!rows ? (
                        <p className="py-6 text-center text-sm text-slate-400">불러오는 중…</p>
                    ) : rows.length === 0 ? (
                        <EmptyState>조건에 맞는 일기가 없습니다.</EmptyState>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-xs text-slate-400">
                                    <tr>
                                        <th className="px-3 py-2.5 font-medium">#</th>
                                        <th className="px-3 py-2.5 font-medium">별명 · 제목</th>
                                        <th className="px-3 py-2.5 font-medium">버전</th>
                                        <th className="px-3 py-2.5 font-medium">상태</th>
                                        <th className="px-3 py-2.5 font-medium">생성 시각</th>
                                        <th className="px-3 py-2.5 text-right font-medium">동작</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {rows.map((r) => {
                                        const hidden = r.status === "hidden";
                                        return (
                                            <tr
                                                key={r.id}
                                                onClick={() => open(r)}
                                                className={`cursor-pointer hover:bg-slate-50 ${selected?.id === r.id ? "bg-sky-50" : ""}`}
                                            >
                                                <td className="px-3 py-3 font-mono text-xs text-slate-400">{r.id}</td>
                                                <td className="max-w-72 px-3 py-3">
                                                    <div className="truncate font-medium text-slate-700">{r.nick_name || "이름 없음"}</div>
                                                    <div className="truncate text-xs text-slate-500">{r.event_title || "-"}</div>
                                                    {r.failed_response && <div className="text-[11px] text-amber-600">형식 오류로 일부만 저장됨</div>}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-3">
                                                    <Badge tone={r.edition === "2026-ambient" ? "sky" : "slate"}>
                                                        {EDITION_LABELS[r.edition ?? ""] ?? r.edition ?? "-"}
                                                    </Badge>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-3">
                                                    <Badge tone={hidden ? "amber" : "green"}>{hidden ? "숨김" : "보임"}</Badge>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-400">{fmtDateTime(r.created_at)}</td>
                                                <td className="whitespace-nowrap px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => patch(r, { status: hidden ? "visible" : "hidden" },
                                                            hidden ? `#${r.id} 일기를 다시 보이게 했습니다.` : `#${r.id} 일기를 숨겼습니다.`)}
                                                        disabled={busy}
                                                        className={btn.ghost}
                                                    >
                                                        {hidden ? "보이기" : "숨김"}
                                                    </button>
                                                    <button onClick={() => remove(r)} disabled={busy} className={`${btn.ghost} text-rose-600`}>
                                                        삭제
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {pages > 1 && (
                        <div className="mt-4 flex items-center justify-center gap-3 text-sm text-slate-500">
                            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className={btn.secondary}>이전</button>
                            <span>{page + 1} / {pages}</span>
                            <button onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1} className={btn.secondary}>다음</button>
                        </div>
                    )}
                </Card>

                {selected && draft && (
                    <Card
                        title={`#${selected.id} 일기`}
                        right={<button onClick={close} className={btn.ghost}>닫기</button>}
                        className="self-start"
                    >
                        <div className="flex flex-col gap-3 text-sm">
                            <label className="flex flex-col gap-1">
                                <span className="text-xs text-slate-500">별명</span>
                                <input value={draft.nick_name} onChange={(e) => setDraft({ ...draft, nick_name: e.target.value })} className={input} />
                            </label>
                            <label className="flex flex-col gap-1">
                                <span className="text-xs text-slate-500">제목</span>
                                <input value={draft.event_title} onChange={(e) => setDraft({ ...draft, event_title: e.target.value })} className={input} />
                            </label>
                            <label className="flex flex-col gap-1">
                                <span className="text-xs text-slate-500">본문 ({draft.reflection_text.length.toLocaleString()}자)</span>
                                <textarea
                                    value={draft.reflection_text}
                                    onChange={(e) => setDraft({ ...draft, reflection_text: e.target.value })}
                                    rows={14}
                                    className={`${input} leading-relaxed`}
                                />
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <label className="flex flex-col gap-1">
                                    <span className="text-xs text-slate-500">버전</span>
                                    <select value={draft.edition} onChange={(e) => setDraft({ ...draft, edition: e.target.value })} className={input}>
                                        <option value="2026-ambient">2026 전체 여정</option>
                                        <option value="2025-car">차량 전용</option>
                                    </select>
                                </label>
                                <label className="flex flex-col gap-1">
                                    <span className="text-xs text-slate-500">상태</span>
                                    <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })} className={input}>
                                        <option value="visible">보임</option>
                                        <option value="hidden">숨김</option>
                                    </select>
                                </label>
                            </div>
                            <dl className="grid grid-cols-[5rem_minmax(0,1fr)] gap-x-2 gap-y-1 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
                                <dt>세션</dt>
                                <dd className="break-all font-mono">{selected.session_id}</dd>
                                <dt>생성 시각</dt>
                                <dd>{fmtDateTime(selected.created_at)}</dd>
                            </dl>
                            {selected.payload != null && (
                                <details className="rounded-xl border border-slate-200 px-3 py-2 text-xs">
                                    <summary className="cursor-pointer text-slate-500">함께 저장된 지표</summary>
                                    <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-all text-slate-600">
                                        {JSON.stringify(selected.payload, null, 2)}
                                    </pre>
                                </details>
                            )}
                            {selected.failed_response && (
                                <details className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs">
                                    <summary className="cursor-pointer text-amber-700">형식 오류 원문</summary>
                                    <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-all text-amber-800">
                                        {selected.failed_response}
                                    </pre>
                                </details>
                            )}
                            <div className="flex items-center justify-between pt-1">
                                <button onClick={() => remove(selected)} disabled={busy} className={btn.danger}>삭제</button>
                                <button onClick={save} disabled={busy} className={btn.primary}>{busy ? "저장 중…" : "저장"}</button>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
