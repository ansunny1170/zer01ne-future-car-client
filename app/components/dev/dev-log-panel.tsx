"use client";

// 🥚 개발자 전용 이벤트 로그 패널.
// 상단 중앙 3연속 클릭 또는 Ctrl/Cmd+Shift+L 로 연다 (page.tsx 에서 트리거 등록).
// 최신 로그가 맨 위(내림차순) — 스크롤을 내리지 않아도 방금 일어난 일이 보인다.

import { useEffect, useMemo, useState } from "react";
import { clearDevLogs, DevLogEntry, getDevLogs, subscribeDevLog } from "@/utils/devLog";
import { cn } from "@/utils/cn";

const LEVEL_MARK: Record<string, string> = {
    info: "●",
    warn: "▲",
    error: "✕",
};

const LEVEL_CLASS: Record<string, string> = {
    info: "text-emerald-400",
    warn: "text-amber-400",
    error: "text-red-400",
};

// 서버가 KST ISO 로 주므로 new Date 로 파싱해 로컬 시각으로 표시한다.
function formatTime(iso?: string): string {
    if (!iso) return "--:--:--.---";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const p = (n: number, w = 2) => String(n).padStart(w, "0");
    return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`;
}

// session_id 는 ms 타임스탬프 문자열이라 뒤 6자리가 가장 잘 구분된다.
function shortSession(sid?: string): string {
    if (!sid) return "—";
    return sid.length > 6 ? `…${sid.slice(-6)}` : sid;
}

function toPlainText(entries: DevLogEntry[]): string {
    return entries
        .map((e) => {
            const head = `${formatTime(e.serverTs ?? e.clientTs)} [${e.category}/${e.stage}] ${e.level.toUpperCase()} ${shortSession(e.sessionId)} ${e.message}`;
            const extra: string[] = [];
            if (e.at) extra.push(`at=${e.at}`);
            if (typeof e.elapsed === "number") extra.push(`elapsed=${e.elapsed}s`);
            if (e.detail && Object.keys(e.detail).length > 0) extra.push(JSON.stringify(e.detail));
            return extra.length > 0 ? `${head}\n    ${extra.join(" ")}` : head;
        })
        .join("\n");
}

export default function DevLogPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [entries, setEntries] = useState<DevLogEntry[]>([]);
    const [category, setCategory] = useState<string>("all");
    const [copied, setCopied] = useState(false);

    // 패널이 닫혀 있어도 구독은 유지한다(열었을 때 이미 최신 상태이도록).
    useEffect(() => {
        setEntries(getDevLogs());
        return subscribeDevLog(setEntries);
    }, []);

    const categories = useMemo(() => {
        const set = new Set(entries.map((e) => e.category));
        return ["all", ...Array.from(set).sort()];
    }, [entries]);

    // 최신이 맨 위로 오도록 뒤집는다.
    const visible = useMemo(() => {
        const filtered = category === "all" ? entries : entries.filter((e) => e.category === category);
        return filtered.slice().reverse();
    }, [entries, category]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(toPlainText(visible.slice().reverse()));
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // 클립보드 권한이 없으면 조용히 넘어간다 (패널은 계속 쓸 수 있어야 한다)
        }
    };

    if (!open) return null;

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1100] w-[min(920px,92vw)] rounded-lg bg-neutral-950/95 text-neutral-100 shadow-2xl ring-1 ring-white/15 backdrop-blur">
            <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2 text-[13px]">
                <strong className="mr-1">이벤트 로그</strong>
                <span className="text-neutral-400">
                    {visible.length}건{category !== "all" && ` / 전체 ${entries.length}건`}
                </span>

                <div className="ml-2 flex gap-1">
                    {categories.map((c) => (
                        <button
                            key={c}
                            onClick={() => setCategory(c)}
                            className={cn(
                                "rounded px-2 py-[2px] text-[12px]",
                                category === c ? "bg-white text-black" : "bg-white/10 text-neutral-300"
                            )}
                        >
                            {c === "all" ? "전체" : c}
                        </button>
                    ))}
                </div>

                <div className="ml-auto flex gap-1">
                    <button className="rounded bg-white/10 px-2 py-[2px] text-[12px]" onClick={handleCopy}>
                        {copied ? "복사됨" : "복사"}
                    </button>
                    <button className="rounded bg-red-500/80 px-2 py-[2px] text-[12px]" onClick={clearDevLogs}>
                        Clear
                    </button>
                    <button className="rounded bg-white/10 px-2 py-[2px] text-[12px]" onClick={onClose}>
                        ✕
                    </button>
                </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-3 py-2 font-mono text-[12px] leading-[1.5]">
                {visible.length === 0 ? (
                    <div className="py-6 text-center text-neutral-500">기록된 로그가 없습니다</div>
                ) : (
                    visible.map((e) => (
                        <div key={e.id} className="border-b border-white/5 py-[3px]">
                            <div className="flex gap-2">
                                <span className="text-neutral-500">{formatTime(e.serverTs ?? e.clientTs)}</span>
                                <span className="text-neutral-600">{shortSession(e.sessionId)}</span>
                                <span className={cn("shrink-0", LEVEL_CLASS[e.level] ?? "text-neutral-300")}>
                                    {LEVEL_MARK[e.level] ?? "·"}
                                </span>
                                <span className="text-neutral-500">{e.stage}</span>
                                <span className="flex-1 break-all">{e.message}</span>
                            </div>
                            {(e.at || typeof e.elapsed === "number" || (e.detail && Object.keys(e.detail).length > 0)) && (
                                <div className="pl-[76px] text-[11px] text-neutral-500 break-all">
                                    {e.at && <span className="mr-2">at={e.at}</span>}
                                    {typeof e.elapsed === "number" && <span className="mr-2">{e.elapsed}s</span>}
                                    {e.detail && Object.keys(e.detail).length > 0 && (
                                        <span>{JSON.stringify(e.detail)}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
