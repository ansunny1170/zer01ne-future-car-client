"use client";

import { useDevTrigger } from "@/hooks/useDevTrigger";
import { useFullscreen } from "@/hooks/useFullscreen";

// 모든 화면에서 전체화면을 토글할 수 있게 하는 전역 트리거.
//
// 보이는 UI 는 두지 않는다 — 키오스크·전시 화면에 버튼이 떠 있으면 연출을 해치기
// 때문이다. 대신 관람객이 우연히 누를 수 없는 개발자 트리거 방식을 쓴다:
//   좌하단 3연속 탭  또는  Ctrl/Cmd+Shift+F
//
// 좌하단인 이유: 나머지 구석은 이미 다른 트리거가 점유하고 있다
// (top-left=KeyD, top-right=KeyG, top-center=KeyL, center-right=KeyT, bottom-right=Period).
//
// 태블릿처럼 키보드가 없는 기기에서는 좌하단 3연속 탭이 유일한 경로다.
export default function FullscreenToggle() {
    const { toggle } = useFullscreen();
    useDevTrigger({ code: "KeyF", corner: "bottom-left" }, toggle);
    return null;
}
