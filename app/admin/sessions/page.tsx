"use client";

// 세션 관리 — plan 이 저장된 세션 목록(GET /ambient/sessions)과 복제 재시작(POST /ambient/restart).
// 복제 재시작은 '{원본}-tN' 사본 세션으로 여정을 처음부터 돌린다(원본·OC 보고에 영향 없음 — 반복 테스트용).

import { useCallback, useEffect, useState } from "react";
import { BASE_API_LINK } from "@/constants";

import { Badge, Card, EmptyState, PageHeader, btn, fmtDateTime } from "../admin-ui";

const API = BASE_API_LINK.replace(/\/+$/, "");

type SessionRow = {
    session_id: string; updated_at: string | null; step: number | null; phase: string | null;
    persona_title: string; places: string[];
};

export default function SessionsPage() {
    const [rows, setRows] = useState<SessionRow[] | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

    const load = useCallback(() => {
        fetch(`${API}/ambient/sessions?limit=50`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => setRows(d?.sessions ?? []))
            .catch(() => setRows([]));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const cloneRestart = async (s: SessionRow) => {
        if (!confirm(`"${s.persona_title || s.session_id}" 세션의 사본으로 여정을 처음부터 다시 시작할까요?\n(원본 세션과 OC 보고에는 영향이 없습니다)`)) return;
        setBusyId(s.session_id);
        setNotice(null);
        try {
            const r = await fetch(`${API}/ambient/restart`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_id: s.session_id, clone: true }),
            });
            const body = await r.json().catch(() => null);
            if (!r.ok) throw new Error(body?.detail || `재시작 실패 (${r.status})`);
            setNotice({ ok: true, text: `사본 세션 ${body?.session_id} 로 여정을 시작했습니다 — 전시 화면(/ambient)에서 진행을 볼 수 있어요.` });
        } catch (e) {
            setNotice({ ok: false, text: e instanceof Error ? e.message : String(e) });
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="mx-auto max-w-6xl">
            <PageHeader
                title="세션 관리"
                desc="여정(plan)이 기록된 세션 목록입니다. 복제 재시작으로 같은 여정을 반복 테스트할 수 있습니다."
                right={<button onClick={load} className={btn.secondary}>새로고침</button>}
            />

            {notice && (
                <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
                    notice.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"
                }`}>
                    {notice.text}
                </div>
            )}

            <Card>
                {!rows ? (
                    <p className="py-6 text-center text-sm text-slate-400">불러오는 중…</p>
                ) : rows.length === 0 ? (
                    <EmptyState>기록된 세션이 없습니다.</EmptyState>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-400">
                                <tr>
                                    <th className="px-4 py-2.5 font-medium">페르소나</th>
                                    <th className="px-4 py-2.5 font-medium">여정 경로</th>
                                    <th className="px-4 py-2.5 font-medium">상태</th>
                                    <th className="px-4 py-2.5 font-medium">마지막 활동</th>
                                    <th className="px-4 py-2.5 text-right font-medium">동작</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rows.map((s) => (
                                    <tr key={s.session_id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-700">{s.persona_title || "이름 없음"}</div>
                                            <div className="font-mono text-[11px] text-slate-400">{s.session_id}</div>
                                        </td>
                                        <td className="max-w-64 truncate px-4 py-3 text-xs text-slate-500">
                                            {s.places.join(" → ") || "-"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge tone={s.phase === "done" ? "slate" : "sky"}>
                                                {s.phase === "done" ? "종료" : `step ${s.step ?? "-"} · ${s.phase ?? "-"}`}
                                            </Badge>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                                            {fmtDateTime(s.updated_at)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => cloneRestart(s)}
                                                disabled={busyId !== null}
                                                className={btn.secondary}
                                            >
                                                {busyId === s.session_id ? "시작 중…" : "복제 재시작"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <p className="mt-3 text-xs text-slate-400">
                복제 세션(-tN)은 목록에 표시되지 않으며, 태스크 진행이 OC(오케스트레이터)에 보고되지 않습니다.
            </p>
        </div>
    );
}
