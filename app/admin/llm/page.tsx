"use client";

// LLM 설정 — GET/PUT /ambient/llm-config (서버 런타임 env 덮어쓰기).
// 재배포 없이 다음 스텝 생성부터 반영되고, 서버 컨테이너 재시작 시 env 기본값으로 복귀한다.

import { useEffect, useState } from "react";
import { BASE_API_LINK } from "@/constants";

import { Card, PageHeader, btn, input } from "../admin-ui";

const API = BASE_API_LINK.replace(/\/+$/, "");

// 전시에서 검증된 모델 프리셋 — 직접 입력도 허용한다
const MODEL_PRESETS = ["gpt-5.6-luna", "gpt-5.6-terra", "gpt-5.6-sol"];
const EFFORTS = ["", "minimal", "low", "medium", "high"] as const;
const VERBOSITIES = ["", "low", "medium", "high"] as const;

export default function LlmSettingsPage() {
    const [model, setModel] = useState("");
    const [effort, setEffort] = useState("");
    const [verbosity, setVerbosity] = useState("");
    // 태블릿 채팅 발행(질문·답 칩) 스위치 — "direct"(켬) | "off"(끔). request 는 레거시라 UI 미노출.
    const [chatPublish, setChatPublish] = useState("direct");
    const [loaded, setLoaded] = useState(false);
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

    const load = () =>
        fetch(`${API}/ambient/llm-config`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
                if (!d) return;
                setModel(d.model ?? "");
                setEffort(d.reasoning_effort ?? "");
                setVerbosity(d.verbosity ?? "");
                setChatPublish(d.chat_publish ?? "direct");
                setLoaded(true);
            })
            .catch(() => {});

    useEffect(() => {
        load();
    }, []);

    const save = async () => {
        setBusy(true);
        setNotice(null);
        try {
            const r = await fetch(`${API}/ambient/llm-config`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ model, reasoning_effort: effort, verbosity, chat_publish: chatPublish }),
            });
            if (!r.ok) throw new Error(`저장 실패 (${r.status})`);
            setNotice({ ok: true, text: "저장되었습니다 — 다음 스텝 생성부터 반영됩니다." });
        } catch (e) {
            setNotice({ ok: false, text: e instanceof Error ? e.message : String(e) });
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="mx-auto max-w-3xl">
            <PageHeader
                title="LLM 설정"
                desc="스텝 생성에 사용하는 모델과 옵션입니다. 저장하면 재배포 없이 다음 생성부터 바로 반영됩니다."
            />

            <Card title="모델 · 옵션">
                {!loaded ? (
                    <p className="py-6 text-center text-sm text-slate-400">서버에서 현재 값을 불러오는 중…</p>
                ) : (
                    <div className="space-y-5">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-600">모델</label>
                            <div className="flex flex-wrap items-center gap-2">
                                {MODEL_PRESETS.map((m) => (
                                    <button
                                        key={m}
                                        onClick={() => setModel(m)}
                                        className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                                            model === m
                                                ? "border-sky-500 bg-sky-50 font-semibold text-sky-700"
                                                : "border-slate-300 text-slate-600 hover:border-slate-400"
                                        }`}
                                    >
                                        {m}
                                    </button>
                                ))}
                                <input
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                    placeholder="직접 입력"
                                    className={`${input} w-52 font-mono text-xs`}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-600">
                                    Reasoning effort
                                </label>
                                <select value={effort} onChange={(e) => setEffort(e.target.value)} className={`${input} w-full`}>
                                    {EFFORTS.map((v) => (
                                        <option key={v} value={v}>{v === "" ? "기본(해제)" : v}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-600">Verbosity</label>
                                <select value={verbosity} onChange={(e) => setVerbosity(e.target.value)} className={`${input} w-full`}>
                                    {VERBOSITIES.map((v) => (
                                        <option key={v} value={v}>{v === "" ? "기본(해제)" : v}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 pt-4">
                            <label className="mb-1.5 block text-sm font-medium text-slate-600">
                                태블릿 채팅 발행 (질문 · 답 칩)
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={chatPublish !== "off"}
                                    onChange={(e) => setChatPublish(e.target.checked ? "direct" : "off")}
                                />
                                {chatPublish !== "off"
                                    ? "켬 — 인사·스텝 질문과 답 칩이 태블릿 채팅에 뜹니다"
                                    : "끔 — 태블릿엔 아무것도 안 뜨고, 진행은 차 화면 마이크로만 합니다"}
                            </label>
                            <p className="mt-1 text-xs text-slate-400">
                                마지막 상태가 저장되어 서버 재시작·재배포 후에도 유지됩니다. 끈 발행은 로그에 ask_skip 으로 남습니다.
                            </p>
                        </div>

                        <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
                            <button onClick={save} disabled={busy} className={btn.primary}>저장</button>
                            <button onClick={load} disabled={busy} className={btn.secondary}>현재 값 다시 불러오기</button>
                            {notice && (
                                <span className={`text-sm ${notice.ok ? "text-emerald-600" : "text-rose-600"}`}>
                                    {notice.text}
                                </span>
                            )}
                        </div>

                        <p className="text-xs text-slate-400">
                            ⚠️ 서버 컨테이너가 재시작되면 배포 시 설정된 기본값으로 돌아갑니다.
                        </p>
                    </div>
                )}
            </Card>
        </div>
    );
}
