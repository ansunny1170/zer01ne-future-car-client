"use client";

/**
 * 미래차 모니터 화면 — 서버(/ws/futurecar/{session_id})의 state/reaction 을 실시간 표시.
 *
 * 실행: 서버(uvicorn) + 이 페이지(next dev) + tablet(manual_tablet.py) 를 띄우고
 *   http://localhost:3000/futurecar?sid=DEMO01  로 접속 → tablet 에서 버튼 누르면 이 화면이 바뀐다.
 * WS 주소는 NEXT_PUBLIC_API_URL(http→ws) 에서 파생. session_id 는 ?sid= 쿼리(기본 DEMO01).
 */
import { useEffect, useRef, useState } from "react";

type Context = { context_id: string; kind: string; title: string };
type VehicleState = {
  type: "state";
  step: number;
  phase: "idle" | "waiting" | "driving" | "arrived" | "done";
  scene: string | null;
  contexts?: Context[];
  next?: "start" | "advance" | "exit" | null;
};
type Reaction = { type: "reaction"; step: number; context_id: string; message: string };

const PHASE_LABEL: Record<string, string> = {
  idle: "대기",
  waiting: "탑승 · 출발 대기",
  driving: "주행 중",
  arrived: "도착",
  done: "하차 완료",
};

function wsBase(): string {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/";
  return api.replace(/^http/, "ws").replace(/\/$/, "");
}

export default function FutureCarMonitor() {
  const [sid, setSid] = useState<string>("DEMO01");
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<VehicleState | null>(null);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  // 쿼리(?sid=) 에서 세션 id 읽기 (클라이언트 전용)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("sid");
    if (q) setSid(q);
  }, []);

  useEffect(() => {
    let closed = false;
    let retry: ReturnType<typeof setTimeout>;

    const connect = () => {
      const url = `${wsBase()}/ws/futurecar/${sid}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === "state") setState(msg as VehicleState);
        else if (msg.type === "reaction")
          setReactions((prev) => [msg as Reaction, ...prev].slice(0, 5));
      };
      ws.onclose = () => {
        setConnected(false);
        if (!closed) retry = setTimeout(connect, 1500); // 자동 재연결
      };
      ws.onerror = () => ws.close();
    };

    connect();
    return () => {
      closed = true;
      clearTimeout(retry);
      wsRef.current?.close();
    };
  }, [sid]);

  const phase = state?.phase ?? "idle";
  const contexts = state?.contexts ?? [];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8 flex flex-col gap-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">미래차 모니터</h1>
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${
              connected ? "bg-green-400" : "bg-red-500"
            }`}
          />
          {connected ? "연결됨" : "연결 대기"} · session={sid}
        </div>
      </div>

      {/* 메인 상태 */}
      <div className="flex-1 grid grid-cols-3 gap-6">
        {/* 좌: AI 제안/대사 */}
        <div className="col-span-1 rounded-2xl bg-neutral-900 p-6 flex flex-col gap-3">
          <div className="text-sm text-neutral-400">AI 제안</div>
          {reactions.length === 0 ? (
            <div className="text-neutral-600 text-sm">아직 없음</div>
          ) : (
            reactions.map((r, i) => (
              <div
                key={i}
                className={`rounded-xl p-4 ${i === 0 ? "bg-blue-600" : "bg-neutral-800"}`}
              >
                <div className="text-[11px] opacity-70 mb-1">step {r.step}</div>
                {r.message}
              </div>
            ))
          )}
        </div>

        {/* 중앙: 현재 장소/단계 */}
        <div className="col-span-2 rounded-2xl bg-neutral-900 p-8 flex flex-col items-center justify-center gap-4">
          <div className="text-sm text-neutral-400">
            step {state?.step ?? 0} · {PHASE_LABEL[phase] ?? phase}
          </div>
          <div className="text-5xl font-bold">{state?.scene ?? "—"}</div>
          <span
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${
              phase === "driving"
                ? "bg-amber-500/20 text-amber-300"
                : phase === "arrived"
                  ? "bg-green-500/20 text-green-300"
                  : phase === "done"
                    ? "bg-neutral-700 text-neutral-300"
                    : "bg-blue-500/20 text-blue-300"
            }`}
          >
            {PHASE_LABEL[phase] ?? phase}
          </span>

          {/* 이 스텝의 컨텍스트 */}
          {contexts.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {contexts.map((c) => (
                <span
                  key={c.context_id}
                  className="px-3 py-1 rounded-lg bg-neutral-800 text-sm text-neutral-300"
                >
                  {c.title}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="text-xs text-neutral-600">
        태블릿(리모컨)에서 버튼을 누르면 이 화면이 서버 push 로 실시간 갱신됩니다.
      </div>
    </div>
  );
}
