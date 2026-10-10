"use client";

// 연출 설정 — 코드에 정해 둔 연출 값(스텝3 돌발 연출 확률·종류, 여정 구성, 브리핑, 엔딩, 보관 한도 등)을 읽기 전용으로 본다.
// 서버 GET /ambient/settings 가 실제 코드 상수에서 읽어 준 것을 그대로 그린다 — 화면에 값을 따로 적어 두지 않는다
// (코드가 바뀌면 화면도 따라 바뀐다). 값을 바꾸려면 서버 코드를 고쳐 배포한다.

import { useCallback, useEffect, useState } from "react";
import { BASE_API_LINK, BASE_S3_LINK } from "@/constants";

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
                desc="코드에 정해 둔 연출 값입니다. 탑승 인트로 영상만 여기서 바꿀 수 있고, 나머지는 보기 전용(서버 코드를 고쳐 배포)입니다."
                right={<button onClick={load} className={btn.secondary}>새로고침</button>}
            />

            <Step0VideoCard />

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

// 탑승 인트로 영상(step0, 2026-10-10) — 이 화면에서 유일하게 바꿀 수 있는 값. 디버그 창 '탑승 인트로 영상'과 같은 서버 설정.
type Step0Cfg = { file: string; choices: { file: string; label: string }[] };

function Step0VideoCard() {
    const [cfg, setCfg] = useState<Step0Cfg | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch(`${API}/ambient/step0-video`, { cache: "no-store" })
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`조회 실패 (${r.status})`))))
            .then(setCfg)
            .catch((e) => setError(e instanceof Error ? e.message : String(e)));
    }, []);

    const choose = (file: string) => {
        setSaving(true);
        fetch(`${API}/ambient/step0-video`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ file }),
        })
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`저장 실패 (${r.status})`))))
            .then((d: Step0Cfg) => { setCfg(d); setError(""); })
            .catch((e) => setError(e instanceof Error ? e.message : String(e)))
            .finally(() => setSaving(false));
    };

    return (
        <div className="mb-4">
            <Card title="탑승 인트로 영상 (step0)">
                <p className="mb-3 text-sm text-slate-500">
                    관람객이 탑승(enter)한 뒤 첫 질문 화면에서 <b>한 번만</b> 재생합니다(반복 없음, 끝나면 마지막 장면에 멈춤, 소리 없음).
                    고르면 다음 탑승부터 바로 적용됩니다. 전시 화면 디버그 창에서도 같은 값을 바꿀 수 있습니다.
                </p>
                {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}
                {!cfg ? (
                    <p className="text-sm text-slate-400">불러오는 중…</p>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-3">
                        {[...cfg.choices, { file: "", label: "끄기 (영상 없음)" }].map((c) => {
                            const on = cfg.file === c.file;
                            return (
                                <div
                                    key={c.file || "off"}
                                    className={`overflow-hidden rounded-xl border ${on ? "border-sky-500 ring-2 ring-sky-200" : "border-slate-200"}`}
                                >
                                    {c.file ? (
                                        <video src={`${BASE_S3_LINK}/${c.file}`} muted playsInline preload="metadata" controls className="aspect-video w-full bg-black object-cover" />
                                    ) : (
                                        <div className="flex aspect-video w-full items-center justify-center bg-black text-xs text-slate-400">검은 화면</div>
                                    )}
                                    <div className="flex items-center justify-between gap-2 px-3 py-2">
                                        <span className="text-sm font-medium text-slate-700">{c.label}</span>
                                        {on ? (
                                            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">사용 중</span>
                                        ) : (
                                            <button type="button" disabled={saving} onClick={() => choose(c.file)} className={btn.secondary}>
                                                이걸로 사용
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>
        </div>
    );
}
