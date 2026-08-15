import { useEffect, useRef } from "react";

type Zone = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center-right" | "top-center";

interface DevTriggerOptions {
    /** 키 조합에 사용할 KeyboardEvent.code (예: "KeyD", "Period") */
    code: string;
    /** 연속 클릭을 감지할 화면 영역 */
    corner: Zone;
    /** 발동에 필요한 연속 클릭 횟수 (기본 3) */
    clicks?: number;
    /** 연속 클릭으로 인정하는 최대 간격(ms, 기본 600) */
    withinMs?: number;
    /** 영역으로 인정하는 크기(px, 기본 80) */
    cornerSize?: number;
    /** 훅 활성화 여부 (기본 true) */
    enabled?: boolean;
}

/**
 * 개발자 전용 이스터에그 트리거.
 * - 키보드: Ctrl 또는 Cmd + Shift + <code>
 * - 마우스: 지정한 화면 영역을 짧은 시간 안에 N회 연속 클릭
 * 둘 중 하나가 발동하면 onTrigger 를 호출한다. 일반 관람객은 우연히 발동할 수 없다.
 */
export function useDevTrigger(options: DevTriggerOptions, onTrigger: () => void) {
    const {
        code,
        corner,
        clicks = 3,
        withinMs = 600,
        cornerSize = 80,
        enabled = true,
    } = options;

    // 최신 콜백을 참조로 유지 (리스너 재등록 없이 항상 최신 호출)
    const onTriggerRef = useRef(onTrigger);
    onTriggerRef.current = onTrigger;

    const clickState = useRef<{ count: number; last: number }>({ count: 0, last: 0 });

    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === code) {
                e.preventDefault();
                onTriggerRef.current();
            }
        };

        const isInCorner = (x: number, y: number) => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            switch (corner) {
                case "top-left":
                    return x <= cornerSize && y <= cornerSize;
                case "top-right":
                    return x >= w - cornerSize && y <= cornerSize;
                case "bottom-left":
                    return x <= cornerSize && y >= h - cornerSize;
                case "bottom-right":
                    return x >= w - cornerSize && y >= h - cornerSize;
                case "center-right":
                    return x >= w - cornerSize && Math.abs(y - h / 2) <= cornerSize;
                case "top-center":
                    return Math.abs(x - w / 2) <= cornerSize && y <= cornerSize;
            }
        };

        const handleClick = (e: MouseEvent) => {
            if (!isInCorner(e.clientX, e.clientY)) {
                clickState.current.count = 0;
                return;
            }
            const now = e.timeStamp;
            const s = clickState.current;
            s.count = now - s.last <= withinMs ? s.count + 1 : 1;
            s.last = now;
            if (s.count >= clicks) {
                s.count = 0;
                onTriggerRef.current();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("click", handleClick);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("click", handleClick);
        };
    }, [code, corner, clicks, withinMs, cornerSize, enabled]);
}
