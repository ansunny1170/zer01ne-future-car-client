"use client";

// 🥚 개발자 전용 이벤트 로그 패널.
// 상단 중앙 3연속 클릭 또는 Ctrl/Cmd+Shift+L 로 연다 (page.tsx 에서 트리거 등록).
// 최신 로그가 맨 위(내림차순) — 스크롤을 내리지 않아도 방금 일어난 일이 보인다.

import { useEffect, useMemo, useRef, useState } from "react";
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

// session_id 는 UUID v7(앞부분이 시각)이라 뒤 8자리가 가장 잘 구분된다.
function shortSession(sid?: string): string {
    if (!sid) return "—";
    return sid.length > 8 ? `…${sid.slice(-8)}` : sid;
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

// 패널 본문 높이. 기본은 화면의 1/3 — 전시 화면을 가리지 않으면서 최근 로그 10여 줄이 보이는 크기.
// 하단 손잡이를 드래그해 조절하고, 마지막 값을 localStorage 에 남긴다(전시 중 새로고침해도 유지).
const HEIGHT_KEY = "ftcar_dev_log_height";
const MIN_HEIGHT = 120;

function loadHeight(): number | null {
    try {
        const v = window.localStorage.getItem(HEIGHT_KEY);
        const n = v ? Number(v) : NaN;
        return Number.isFinite(n) && n >= MIN_HEIGHT ? n : null;
    } catch {
        return null;
    }
}

// activeSessionId: /ambient 가 지금 따라가는 세션. 로그 줄의 세션 칩을 강조해 "이 로그가 지금 화면의
// 것인가"를 바로 구분하게 한다. 없으면(classic 등) 강조 없음.
export default function DevLogPanel({ open, onClose, activeSessionId }: {
    open: boolean; onClose: () => void; activeSessionId?: string | null;
}) {
    const [entries, setEntries] = useState<DevLogEntry[]>([]);
    // 세션 필터. "all" 이면 전체. 세션 칩을 누르면 그 세션만 본다.
    const [sessionFilter, setSessionFilter] = useState<string>("all");
    const [copiedSid, setCopiedSid] = useState<string | null>(null);
    // null 이면 저장값 없음 → 기본 33vh 를 CSS 로 쓴다.
    const [height, setHeight] = useState<number | null>(null);
    const dragRef = useRef<{ startY: number; startH: number } | null>(null);

    useEffect(() => {
        setHeight(loadHeight());
    }, []);

    const onHandlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        const body = e.currentTarget.previousElementSibling as HTMLElement | null;
        const startH = height ?? body?.getBoundingClientRect().height ?? window.innerHeight / 3;
        dragRef.current = { startY: e.clientY, startH };
        e.currentTarget.setPointerCapture(e.pointerId);
        e.preventDefault();
    };
    const onHandlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!dragRef.current) return;
        const maxH = Math.floor(window.innerHeight * 0.9);
        setHeight(Math.min(maxH, Math.max(MIN_HEIGHT, dragRef.current.startH + (e.clientY - dragRef.current.startY))));
    };
    const onHandlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!dragRef.current) return;
        dragRef.current = null;
        e.currentTarget.releasePointerCapture(e.pointerId);
        if (height !== null) {
            try { window.localStorage.setItem(HEIGHT_KEY, String(height)); } catch { /* 저장 실패해도 동작은 유지 */ }
        }
    };
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

    // 세션 목록 — 최근 로그가 있는 세션이 앞. 건수도 같이.
    const sessions = useMemo(() => {
        const count = new Map<string, number>();
        const last = new Map<string, number>();
        entries.forEach((e, i) => {
            if (!e.sessionId) return;
            count.set(e.sessionId, (count.get(e.sessionId) ?? 0) + 1);
            last.set(e.sessionId, i);
        });
        return Array.from(count.keys())
            .sort((a, b) => (last.get(b) ?? 0) - (last.get(a) ?? 0))
            .map((sid) => ({ sid, n: count.get(sid) ?? 0 }));
    }, [entries]);

    // 최신이 맨 위로 오도록 뒤집는다.
    const visible = useMemo(() => {
        let filtered = category === "all" ? entries : entries.filter((e) => e.category === category);
        if (sessionFilter !== "all") filtered = filtered.filter((e) => e.sessionId === sessionFilter);
        return filtered.slice().reverse();
    }, [entries, category, sessionFilter]);

    // 세션 칩 클릭 → 전체 id 복사 (/ambient?sid= 나 /logs?session_id= 에 바로 붙이기 위함)
    const copySid = async (sid: string) => {
        try {
            await navigator.clipboard.writeText(sid);
            setCopiedSid(sid);
            setTimeout(() => setCopiedSid((cur) => (cur === sid ? null : cur)), 1200);
        } catch {
            // 클립보드 권한이 없으면 조용히 넘어간다
        }
    };

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

            {/* 세션 필터 — 어떤 세션의 로그인지 한눈에. ● 표시가 지금 화면이 따라가는 세션 */}
            {sessions.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 border-b border-white/10 px-3 py-1 text-[11px]">
                    <span className="mr-1 text-neutral-500">세션</span>
                    <button
                        onClick={() => setSessionFilter("all")}
                        className={cn("rounded px-2 py-[1px]", sessionFilter === "all" ? "bg-white text-black" : "bg-white/10 text-neutral-300")}
                    >
                        전체
                    </button>
                    {sessions.map(({ sid, n }) => (
                        <button
                            key={sid}
                            onClick={() => setSessionFilter(sid === sessionFilter ? "all" : sid)}
                            onDoubleClick={() => copySid(sid)}
                            title={`${sid}\n클릭: 이 세션만 보기 · 더블클릭: 전체 id 복사`}
                            className={cn(
                                "rounded px-2 py-[1px] font-mono",
                                sessionFilter === sid ? "bg-violet-300 text-black" : "bg-violet-500/20 text-violet-200",
                                activeSessionId === sid && "ring-1 ring-emerald-400"
                            )}
                        >
                            {activeSessionId === sid && <span className="mr-1 text-emerald-400">●</span>}
                            {copiedSid === sid ? "복사됨 ✓" : `…${sid.slice(-8)}`}
                            <span className="ml-1 text-neutral-400">{n}</span>
                        </button>
                    ))}
                </div>
            )}

            <div
                className="overflow-y-auto px-3 py-2 font-mono text-[12px] leading-[1.5]"
                style={{ height: height !== null ? `${height}px` : "33vh" }}
            >
                {visible.length === 0 ? (
                    <div className="py-6 text-center text-neutral-500">기록된 로그가 없습니다</div>
                ) : (
                    visible.map((e) => (
                        <div key={e.id} className="border-b border-white/5 py-[3px]">
                            <div className="flex gap-2">
                                <span className="text-neutral-500">{formatTime(e.serverTs ?? e.clientTs)}</span>
                                {e.sessionId ? (
                                    <button
                                        onClick={() => copySid(e.sessionId!)}
                                        title={`${e.sessionId}\n클릭하면 전체 id 복사`}
                                        className={cn(
                                            "shrink-0 rounded px-1 font-mono",
                                            activeSessionId === e.sessionId ? "bg-emerald-500/20 text-emerald-300" : "bg-violet-500/15 text-violet-300"
                                        )}
                                    >
                                        {copiedSid === e.sessionId ? "복사됨" : shortSession(e.sessionId)}
                                    </button>
                                ) : (
                                    <span className="shrink-0 px-1 text-neutral-600">—</span>
                                )}
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
            {/* 리사이즈 손잡이 — 드래그로 본문 높이 조절 */}
            <div
                role="separator"
                aria-orientation="horizontal"
                title="드래그해서 높이 조절"
                onPointerDown={onHandlePointerDown}
                onPointerMove={onHandlePointerMove}
                onPointerUp={onHandlePointerUp}
                onPointerCancel={onHandlePointerUp}
                className="flex h-3 cursor-ns-resize items-center justify-center rounded-b-lg border-t border-white/10 bg-white/5 hover:bg-white/10"
            >
                <span className="h-[3px] w-10 rounded-full bg-white/30" />
            </div>
        </div>
    );
}
