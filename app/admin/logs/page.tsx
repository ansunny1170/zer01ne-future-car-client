"use client";

// 서버 로그 뷰어 — GET /logs (dev_log + traffic). 세션·출처·분류 필터, 자동 새로고침,
// 행 클릭 시 detail JSON(여러 행 동시 펼침, 가로 스크롤 기본 + 줄바꿈 토글).

import { Fragment, useCallback, useEffect, useState } from "react";
import { BASE_API_LINK } from "@/constants";

import { Badge, Card, EmptyState, PageHeader, btn, fmtKstShort, input } from "../admin-ui";

const API = BASE_API_LINK.replace(/\/+$/, "");

type LogRow = {
    id: number; ts: string; session_id: string | null; source: string; category: string | null;
    stage: string | null; level: string | null; message: string | null; detail: unknown; topic: string | null;
};

export default function LogsPage() {
    const [rows, setRows] = useState<LogRow[]>([]);
    const [sessionId, setSessionId] = useState("");
    const [source, setSource] = useState("");
    // 분류(category) 필터 — 인사 LLM(greeting)·임시 디버그(debug)·스텝 생성(stepgen)만 골라 본다
    const [category, setCategory] = useState("");
    const [auto, setAuto] = useState(true);
    // 펼쳐진 행 집합 — 여러 로그(예: greeting llm_call 과 llm_done)를 나란히 놓고 비교한다
    const [openIds, setOpenIds] = useState<Set<number>>(new Set());
    // 줄바꿈 토글 — 끄면 가로 스크롤(원문 그대로), 켜면 줄바꿈 + 문자열 안의 \n 도 실제 개행으로
    // 풀어서 보여준다(프롬프트 전문 읽기용 표시 변형 — 원본 JSON 은 아님).
    const [wrap, setWrap] = useState(false);
    // dashboard 숨김(기본 ON) — OC 주기 재발행이 최신순 화면을 초 단위로 덮어
    // restart·pregen 같은 이벤트가 묻힌다(2026-09-25 실측). 서버 exclude_stages 로 거른다.
    const [hideDashboard, setHideDashboard] = useState(true);
    const [error, setError] = useState("");

    const toggleOpen = (id: number) =>
        setOpenIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const renderDetail = (detail: unknown) => {
        const s = JSON.stringify(detail, null, 2);
        return wrap ? s.replace(/\\n/g, "\n") : s;
    };

    const load = useCallback(async () => {
        try {
            const q = new URLSearchParams({ limit: "150" });
            if (sessionId.trim()) q.set("session_id", sessionId.trim());
            if (source) q.set("source", source);
            if (category) q.set("category", category);
            if (hideDashboard) q.set("exclude_stages", "dashboard");
            const r = await fetch(`${API}/logs?${q}`, { cache: "no-store" });
            if (!r.ok) throw new Error(`로그 조회 실패 (${r.status})`);
            // API 는 오래된 순으로 준다 — 화면은 최신이 위로. (dashboard 홍수 시절엔
            // 최신 150건 창이 전부 최근이라 티가 안 났지만, 걷어낸 뒤엔 창이 긴
            // 시간대를 덮어 최신 기록이 맨 아래로 숨었다 — 2026-09-25 관측)
            setRows(((await r.json()).entries ?? []).slice().reverse());
            setError("");
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    }, [sessionId, source, category, hideDashboard]);

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
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className={input}>
                        <option value="">전체 분류</option>
                        <option value="greeting">greeting (탑승 인사 LLM)</option>
                        <option value="debug">debug (임시 디버그)</option>
                        <option value="stepgen">stepgen (스텝 생성)</option>
                        <option value="reflection">reflection (엔딩 일기)</option>
                    </select>
                    <button onClick={load} className={btn.secondary}>새로고침</button>
                    <label className="flex items-center gap-1.5 text-sm text-slate-500">
                        <input type="checkbox" checked={wrap} onChange={(e) => setWrap(e.target.checked)} />
                        줄바꿈
                    </label>
                    <label className="flex items-center gap-1.5 text-sm text-slate-500">
                        <input type="checkbox" checked={hideDashboard}
                               onChange={(e) => setHideDashboard(e.target.checked)} />
                        dashboard 숨김
                    </label>
                    {openIds.size > 0 && (
                        <button onClick={() => setOpenIds(new Set())} className={btn.secondary}>
                            모두 접기 ({openIds.size})
                        </button>
                    )}
                    {error && <span className="text-sm text-rose-600">{error}</span>}
                </div>

                {rows.length === 0 ? (
                    <EmptyState>조건에 맞는 로그가 없습니다.</EmptyState>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                        {/* table-fixed — detail(colSpan) 안의 긴 내용이 열 폭을 밀어내지 못한다.
                            가로 스크롤은 아래 detail <pre> 안에서만 생긴다. */}
                        <table className="w-full table-fixed text-left text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-400">
                                <tr>
                                    <th className="w-32 px-3 py-2 font-medium">시각</th>
                                    <th className="w-32 px-3 py-2 font-medium">세션</th>
                                    <th className="w-40 px-3 py-2 font-medium">단계</th>
                                    <th className="px-3 py-2 font-medium">내용</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rows.map((r) => (
                                    <Fragment key={r.id}>
                                        <tr
                                            onClick={() => toggleOpen(r.id)}
                                            className="cursor-pointer hover:bg-slate-50"
                                        >
                                            <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-400">
                                                {fmtKstShort(r.ts)}
                                            </td>
                                            <td
                                                className="truncate px-3 py-2 font-mono text-xs text-sky-600"
                                                title={r.session_id ?? ""}
                                            >
                                                {r.session_id ?? "-"}
                                            </td>
                                            <td className="truncate px-3 py-2">
                                                <Badge tone={r.level === "error" ? "rose" : r.level === "warn" ? "amber" : r.source === "traffic" ? "sky" : "slate"}>
                                                    {r.stage || r.category || "-"}
                                                </Badge>
                                            </td>
                                            <td className="truncate px-3 py-2 text-slate-600" title={r.message ?? ""}>
                                                {r.message}
                                            </td>
                                        </tr>
                                        {openIds.has(r.id) && r.detail != null && (
                                            <tr>
                                                <td colSpan={4} className="bg-slate-50 px-4 py-3">
                                                    <pre
                                                        className={`max-h-96 overflow-auto rounded-lg bg-[#0d1117] p-3 font-mono text-xs leading-relaxed text-slate-200 ${
                                                            wrap ? "whitespace-pre-wrap break-all" : "whitespace-pre"
                                                        }`}
                                                    >
                                                        {renderDetail(r.detail)}
                                                    </pre>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
