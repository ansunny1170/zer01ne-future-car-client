"use client";

// 서버가 /ws/ending-reflection 으로 흘려보내는 진행 로그(type: "dev_log")를 받아
// devLog 스토어에 쌓는다.
//
// devMode 와 무관하게 항상 연결한다. 패널을 열었을 때만 붙으면 정작 실패가 일어난
// 그 순간의 이벤트를 놓친다 — 수집은 항상, 표시만 트리거로.

import { useEffect, useRef } from "react";
import { BASE_API_LINK } from "@/constants";
import { appendClientLog, appendDevLog, DevLogLevel } from "@/utils/devLog";

const API_BASE = BASE_API_LINK.replace(/\/+$/, "");
const WS_BASE = API_BASE.replace(/^http/, "ws"); // http→ws, https→wss

const RECONNECT_MS = 3000;

export function useDevLogStream() {
    // effect 를 한 번만 돌리기 위한 가드 (reactStrictMode 는 false 지만 방어적으로)
    const startedRef = useRef(false);

    useEffect(() => {
        if (startedRef.current) return;
        startedRef.current = true;

        let closed = false;
        let ws: WebSocket | null = null;
        let retry: ReturnType<typeof setTimeout> | undefined;

        const connect = () => {
            ws = new WebSocket(`${WS_BASE}/ws/ending-reflection`);

            ws.onopen = () => {
                appendClientLog("client", "ws_open", `로그 스트림 연결됨 (${WS_BASE})`);
            };

            ws.onmessage = (event) => {
                let msg: Record<string, unknown>;
                try {
                    msg = JSON.parse(event.data);
                } catch {
                    return;
                }
                if (msg?.type !== "dev_log") return;

                appendDevLog({
                    category: String(msg.category ?? "unknown"),
                    stage: String(msg.stage ?? ""),
                    level: (msg.level as DevLogLevel) ?? "info",
                    message: String(msg.message ?? ""),
                    sessionId: msg.session_id ? String(msg.session_id) : undefined,
                    at: msg.at ? String(msg.at) : undefined,
                    elapsed: typeof msg.elapsed === "number" ? msg.elapsed : undefined,
                    detail: (msg.detail as Record<string, unknown> | null) ?? null,
                    serverTs: msg.ts ? String(msg.ts) : undefined,
                    source: "server",
                });
            };

            ws.onclose = () => {
                if (closed) return;
                // 끊긴 구간은 이벤트를 못 받는다. 나중에 로그를 볼 때 "여기는 비어 있음"을
                // 알 수 있도록 끊김 자체를 남긴다.
                appendClientLog("client", "ws_close", "로그 스트림 끊김 — 재연결 시도", {
                    level: "warn",
                });
                retry = setTimeout(connect, RECONNECT_MS);
            };

            ws.onerror = () => ws?.close();
        };

        connect();

        return () => {
            closed = true;
            if (retry) clearTimeout(retry);
            ws?.close();
        };
    }, []);
}
