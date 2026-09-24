"use client";

// 관리자 대시보드 — 전시 운영의 "지금 상태" 한 화면 요약.
// 라이브 프롬프트 · LLM 설정 · 최근 세션 · 최근 로그를 카드로 보여주고 각 관리 화면으로 잇는다.

import { useEffect, useState } from "react";
import Link from "next/link";
import { BASE_API_LINK } from "@/constants";

import { Badge, Card, EmptyState, PageHeader, btn, fmtDateTime, fmtKstTime } from "./admin-ui";

const API = BASE_API_LINK.replace(/\/+$/, "");

type PromptMeta = { id: number; filename: string; title: string; memo: string; created_at: string | null };
type LlmConfig = { model: string; reasoning_effort: string; verbosity: string };
type SessionRow = { session_id: string; updated_at: string | null; step: number | null; phase: string | null; persona_title: string; places: string[] };
type LogRow = { ts: string; session_id: string | null; stage: string | null; level: string | null; message: string | null };

export default function AdminDashboard() {
    const [prompt, setPrompt] = useState<PromptMeta | null>(null);
    const [llm, setLlm] = useState<LlmConfig | null>(null);
    const [sessions, setSessions] = useState<SessionRow[] | null>(null);
    const [logs, setLogs] = useState<LogRow[] | null>(null);

    useEffect(() => {
        const j = (r: Response) => (r.ok ? r.json() : null);
        fetch(`${API}/prompt/latest`).then(j).then(setPrompt).catch(() => {});
        fetch(`${API}/ambient/llm-config`).then(j).then(setLlm).catch(() => {});
        fetch(`${API}/ambient/sessions?limit=5`).then(j).then((d) => setSessions(d?.sessions ?? [])).catch(() => setSessions([]));
        fetch(`${API}/logs?source=dev_log&limit=6`).then(j).then((d) => setLogs(d?.entries ?? [])).catch(() => setLogs([]));
    }, []);

    return (
        <div className="mx-auto max-w-6xl">
            <PageHeader title="대시보드" desc="미래차 전시 운영 현황을 한눈에 봅니다." />

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <Card
                    title="현재 적용 중인 프롬프트"
                    right={<Link href="/admin/prompts" className={btn.secondary}>관리하기</Link>}
                >
                    {prompt ? (
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <Badge tone="green">LIVE</Badge>
                                <span className="text-base font-semibold text-slate-800">
                                    {prompt.title || prompt.filename}
                                </span>
                            </div>
                            <div className="font-mono text-xs text-slate-400">{prompt.filename}</div>
                            {prompt.memo && <p className="text-sm text-slate-500">{prompt.memo}</p>}
                            <div className="text-xs text-slate-400">적용 시각 · {fmtDateTime(prompt.created_at)}</div>
                        </div>
                    ) : (
                        <EmptyState>프롬프트 정보를 불러오는 중이거나, 적용된 프롬프트가 없습니다.</EmptyState>
                    )}
                </Card>

                <Card
                    title="LLM 설정"
                    right={<Link href="/admin/llm" className={btn.secondary}>변경하기</Link>}
                >
                    {llm ? (
                        <dl className="grid grid-cols-3 gap-4">
                            {[
                                ["모델", llm.model || "-"],
                                ["Reasoning", llm.reasoning_effort || "기본"],
                                ["Verbosity", llm.verbosity || "기본"],
                            ].map(([k, v]) => (
                                <div key={k} className="rounded-xl bg-slate-50 px-4 py-3">
                                    <dt className="text-xs text-slate-400">{k}</dt>
                                    <dd className="mt-0.5 truncate text-sm font-semibold text-slate-700">{v}</dd>
                                </div>
                            ))}
                        </dl>
                    ) : (
                        <EmptyState>서버(LLM 설정)에 연결하지 못했습니다.</EmptyState>
                    )}
                </Card>

                <Card
                    title="최근 세션"
                    right={<Link href="/admin/sessions" className={btn.secondary}>전체 보기</Link>}
                >
                    {!sessions ? null : sessions.length === 0 ? (
                        <EmptyState>기록된 세션이 없습니다.</EmptyState>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {sessions.map((s) => (
                                <li key={s.session_id} className="flex items-center gap-3 py-2.5 text-sm">
                                    <Badge tone={s.phase === "done" ? "slate" : "sky"}>
                                        {s.phase === "done" ? "종료" : `step ${s.step ?? "-"}`}
                                    </Badge>
                                    <span className="font-medium text-slate-700">{s.persona_title || "이름 없음"}</span>
                                    <span className="truncate text-xs text-slate-400">{s.places.join(" → ")}</span>
                                    <span className="ml-auto shrink-0 text-xs text-slate-400">{fmtDateTime(s.updated_at)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>

                <Card
                    title="최근 서버 로그"
                    right={<Link href="/admin/logs" className={btn.secondary}>전체 보기</Link>}
                >
                    {!logs ? null : logs.length === 0 ? (
                        <EmptyState>로그가 없습니다.</EmptyState>
                    ) : (
                        <ul className="space-y-1.5">
                            {logs.map((l, i) => (
                                <li key={i} className="flex items-baseline gap-2 text-xs">
                                    <span className="shrink-0 font-mono text-slate-400">{fmtKstTime(l.ts)}</span>
                                    <Badge tone={l.level === "error" ? "rose" : l.level === "warn" ? "amber" : "slate"}>
                                        {l.stage || "-"}
                                    </Badge>
                                    <span className="truncate text-slate-600">{l.message}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>
        </div>
    );
}
