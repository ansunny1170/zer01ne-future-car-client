"use client";

// 서버 로그 뷰어 — GET /logs (dev_log + traffic). 세션·출처 필터, 자동 새로고침, 행 클릭 시 detail JSON.

import { useCallback, useEffect, useState } from "react";
import { BASE_API_LINK } from "@/constants";

import { Badge, Card, EmptyState, PageHeader, btn, input } from "../admin-ui";

const API = BASE_API_LINK.replace(/\/+$/, "");

type LogRow = {
    id: number; ts: string; session_id: string | null; source: string; category: string | null;
    stage: string | null; level: string | null; message: string | null; detail: unknown; topic: string | null;
};

export default function LogsPage() {
    const [rows, setRows] = useState<LogRow[]>([]);
    const [sessionId, setSessionId] = useState("");
    const [source, setSource] = useState("");
    const [auto, setAuto] = useState(true);
    const [openId, setOpenId] = useState<number | null>(null);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        try {
            const q = new URLSearchParams({ limit: "150" });
            if (sessionId.trim()) q.set("session_id", sessionId.trim());
            if (source) q.set("source", source);
            const r = await fetch(`${API}/logs?${q}`, { cache: "no-store" });
            if (!r.ok) throw new Error(`로그 조회 실패 (${r.status})`);
            setRows((await r.json()).entries ?? []);
            setError("");
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    }, [sessionId, source]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        if (!auto) return;
        const t = window.setInterval(load, 5000);
        return () => window.clearInterval(t);
    }, [auto, load]);

    return (
        <div className="mx-auto max-w-6xl">
            <PageHeader
                title="서버 로그"
                desc="미래차 서버의 진행 로그(dev_log)와 MQTT 트래픽을 봅니다. 행을 누르면 상세 내용이 열립니다."
                right={
                    <label className="flex items-center gap-2 text-sm text-slate-500">
                        <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
                        5초마다 자동 새로고침
                    </label>
                }
            />

            <Card>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                    <input
                        value={sessionId}
                        onChange={(e) => setSessionId(e.target.value)}
                        placeholder="세션 ID로 필터…"
                        className={`${input} w-72 font-mono text-xs`}
                    />
                    <select value={source} onChange={(e) => setSource(e.target.value)} className={input}>
                        <option value="">전체 출처</option>
                        <option value="dev_log">dev_log (진행 로그)</option>
                        <option value="traffic">traffic (MQTT)</option>
                    </select>
                    <button onClick={load} className={btn.secondary}>새로고침</button>
                    {error && <span className="text-sm text-rose-600">{error}</span>}
                </div>

                {rows.length === 0 ? (
                    <EmptyState>조건에 맞는 로그가 없습니다.</EmptyState>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-400">
                                <tr>
                                    <th className="px-3 py-2 font-medium">시각</th>
                                    <th className="px-3 py-2 font-medium">세션</th>
                                    <th className="px-3 py-2 font-medium">단계</th>
                                    <th className="px-3 py-2 font-medium">내용</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rows.map((r) => (
                                    <>
                                        <tr
                                            key={r.id}
                                            onClick={() => setOpenId(openId === r.id ? null : r.id)}
                                            className="cursor-pointer hover:bg-slate-50"
                                        >
                                            <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-400">
                                                {r.ts?.slice(5, 19).replace("T", " ")}
                                            </td>
                                            <td
                                                className="max-w-28 truncate px-3 py-2 font-mono text-xs text-sky-600"
                                                title={r.session_id ?? ""}
                                            >
                                                {r.session_id ?? "-"}
                                            </td>
                                            <td className="px-3 py-2">
                                                <Badge tone={r.level === "error" ? "rose" : r.level === "warn" ? "amber" : r.source === "traffic" ? "sky" : "slate"}>
                                                    {r.stage || r.category || "-"}
                                                </Badge>
                                            </td>
                                            <td className="max-w-0 truncate px-3 py-2 text-slate-600" style={{ width: "60%" }}>
                                                {r.message}
                                            </td>
                                        </tr>
                                        {openId === r.id && r.detail != null && (
                                            <tr key={`${r.id}-detail`}>
                                                <td colSpan={4} className="bg-slate-50 px-4 py-3">
                                                    <pre className="max-h-72 overflow-auto rounded-lg bg-[#0d1117] p-3 font-mono text-xs leading-relaxed text-slate-200">
                                                        {JSON.stringify(r.detail, null, 2)}
                                                    </pre>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
