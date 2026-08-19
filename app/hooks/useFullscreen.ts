import { useCallback, useEffect, useState } from "react";

// 태블릿 브라우저에서 주소창·탭바를 없애고 화면을 꽉 채우기 위한 훅.
//
// 브라우저별 지원이 갈린다:
// - Android Chrome / iPadOS Safari 16.4+ : 표준 Fullscreen API 동작
// - 구형 iPadOS Safari                   : webkit 접두사 필요
// - iPhone Safari                        : <video> 외에는 전체화면 자체가 없다
//   → 이 경우 supported=false 가 되며, "홈 화면에 추가"(standalone) 로 대체해야 한다.
//
// requestFullscreen 은 **사용자 제스처 안에서만** 허용된다(클릭·탭). 마운트 직후
// 자동 호출은 브라우저가 거부하므로, 반드시 버튼/탭 핸들러에서 toggle 을 부를 것.

// 표준 타입에 없는 webkit 접두사 API 를 좁게 선언한다(무분별한 any 대신).
type FullscreenElement = HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
};
type FullscreenDocument = Document & {
    webkitFullscreenElement?: Element | null;
    webkitExitFullscreen?: () => Promise<void> | void;
};

function currentFullscreenElement(): Element | null {
    if (typeof document === "undefined") return null;
    const doc = document as FullscreenDocument;
    return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

export function useFullscreen() {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [supported, setSupported] = useState(false);

    // SSR 하이드레이션 불일치를 피하려고 마운트 후에 판정한다.
    useEffect(() => {
        const el = document.documentElement as FullscreenElement;
        setSupported(
            typeof el.requestFullscreen === "function" ||
            typeof el.webkitRequestFullscreen === "function"
        );
        setIsFullscreen(currentFullscreenElement() !== null);
    }, []);

    // 사용자가 ESC 나 시스템 제스처로 빠져나가는 경우까지 상태에 반영한다.
    useEffect(() => {
        const sync = () => setIsFullscreen(currentFullscreenElement() !== null);
        document.addEventListener("fullscreenchange", sync);
        document.addEventListener("webkitfullscreenchange", sync);
        return () => {
            document.removeEventListener("fullscreenchange", sync);
            document.removeEventListener("webkitfullscreenchange", sync);
        };
    }, []);

    const toggle = useCallback(() => {
        const el = document.documentElement as FullscreenElement;
        const doc = document as FullscreenDocument;
        try {
            if (currentFullscreenElement() === null) {
                if (typeof el.requestFullscreen === "function") {
                    // 실패해도(제스처 밖 호출 등) 화면은 그대로 두면 되므로 삼킨다.
                    void Promise.resolve(el.requestFullscreen()).catch((err) => {
                        console.warn("[fullscreen] 진입 실패", err);
                    });
                } else if (typeof el.webkitRequestFullscreen === "function") {
                    el.webkitRequestFullscreen();
                }
            } else {
                if (typeof doc.exitFullscreen === "function") {
                    void Promise.resolve(doc.exitFullscreen()).catch((err) => {
                        console.warn("[fullscreen] 해제 실패", err);
                    });
                } else if (typeof doc.webkitExitFullscreen === "function") {
                    doc.webkitExitFullscreen();
                }
            }
        } catch (err) {
            console.warn("[fullscreen] 토글 예외", err);
        }
    }, []);

    return { isFullscreen, supported, toggle };
}
