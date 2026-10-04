"use client";

// 연출 설정 — 코드에 정해 둔 연출 값(스텝3 돌발 연출 확률·종류, 여정 구성, 브리핑, 엔딩, 보관 한도 등)을 읽기 전용으로 본다.
// 서버 GET /ambient/settings 가 실제 코드 상수에서 읽어 준 것을 그대로 그린다 — 화면에 값을 따로 적어 두지 않는다
// (코드가 바뀌면 화면도 따라 바뀐다). 값을 바꾸려면 서버 코드를 고쳐 배포한다.

import { useCallback, useEffect, useState } from "react";
import { BASE_API_LINK } from "@/constants";

import { Card, EmptyState, PageHeader, btn } from "../admin-ui";

const API = BASE_API_LINK.replace(/\/+$/, "");

type Item = { label: string; value: string; note?: string; list?: string[] };
type Section = { title: string; desc?: string; items: Item[] };
type Settings = { prompt: string; sections: Section[] };

// "50%" 같은 값은 막대로도 보여 준다 — 확률끼리 한눈에 비교되게.
const percentOf = (value: string) => {
    const m = /^(\d+(?:\.\d+)?)%$/.exec(value.trim());
    return m ? Math.min(100, Number(m[1])) : null;
};

export default function SettingsPage() {
    const [data, setData] = useState<Settings | null>(null);
    const [error, setError] = useState("");

    const load = useCallback(() => {
        fetch(`${API}/ambient/settings`, { cache: "no-store" })
            .then((r) => {
                if (!r.ok) throw new Error(`설정 조회 실패 (${r.status})`);
                return r.json();
            })
            .then((d: Settings) => {
                setData(d);
                setError("");
            })
            .catch((e) => setError(e instanceof Error ? e.message : String(e)));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <div className="mx-auto max-w-5xl">
            <PageHeader
                title="연출 설정"
                desc="코드에 정해 둔 연출 값입니다. 보기 전용이며, 바꾸려면 서버 코드를 고쳐 배포해야 합니다."
                right={<button onClick={load} className={btn.secondary}>새로고침</button>}
            />

            {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

            {!data ? (
                !error && <p className="py-6 text-center text-sm text-slate-400">불러오는 중…</p>
            ) : data.sections.length === 0 ? (
                <EmptyState>표시할 설정이 없습니다.</EmptyState>
            ) : (
                <div className="flex flex-col gap-4">
                    {data.prompt && (
                        <p className="text-xs text-slate-400">
                            영상 목록은 지금 적용 중인 시나리오 프롬프트(<span className="font-mono">{data.prompt}</span>)의 에셋에서 읽었습니다.
                        </p>
                    )}
                    {data.sections.map((section) => (
                        <Card key={section.title} title={section.title}>
                            {section.desc && <p className="mb-3 text-sm text-slate-500">{section.desc}</p>}
                            <dl className="divide-y divide-slate-100">
                                {section.items.map((item) => {
                                    const percent = percentOf(item.value);
                                    return (
                                        <div key={item.label} className="grid gap-x-4 gap-y-1 py-3 sm:grid-cols-[13rem_minmax(0,1fr)]">
                                            <dt className="text-sm font-medium text-slate-700">{item.label}</dt>
                                            <dd className="min-w-0 text-sm">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <span className="font-semibold text-slate-800">{item.value}</span>
                                                    {percent !== null && (
                                                        <span className="h-2 w-40 overflow-hidden rounded-full bg-slate-100" aria-hidden>
                                                            <span className="block h-full rounded-full bg-sky-500" style={{ width: `${percent}%` }} />
                                                        </span>
                                                    )}
                                                </div>
                                                {item.note && <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.note}</p>}
                                                {item.list && item.list.length > 0 && (
                                                    <ul className="mt-2 flex flex-wrap gap-1.5">
                                                        {item.list.map((entry) => (
                                                            <li key={entry} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">{entry}</li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </dd>
                                        </div>
                                    );
                                })}
                            </dl>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
