/* eslint-disable @next/next/no-img-element */
"use client";

/**
 * 차량 마이크 UI — main(키오스크 `/`)의 차량 스텝 마이크 UI 를 그대로 옮겼다(2026-10-04, components/speech).
 *
 * - 따옴표 말풍선: 인식 중인 발화(없으면 안내 문구를 흐리게)
 * - 그 아래 마이크 아이콘(on/off) + 버튼 안내: 닫힘 "버튼을 누르면 마이크가 켜집니다" /
 *   듣는 중 "버튼을 길게 누르면 메시지가 전달됩니다"
 * - 전송 뒤 서버가 다음 스텝을 만드는 동안(paused)은 현대 로딩
 * - 듣는 동안 BGM 을 0.22 로 낮췄다가 닫히면 되돌린다
 * 위치도 main 과 같이 화면 위 20% 지점, 가로 가운데. 조작은 useCarListener(S 짧게 열기·재녹음, S 길게 전송).
 * 마이크 권한 거부·네트워크 오류는 운영자가 볼 수 있게 붉게 표시한다(main 에는 없던 것).
 */
import { useEffect } from "react";
import type { CarListenerState } from "@/hooks/useCarListener";
import { cn } from "@/utils/cn";
import { Icons } from "../ui/icons";
import HyundaiLoading from "../ui/hyundai-loading";

// main 의 기본 안내는 "선택지를 참고하여 자유롭게 말해주세요." — 차 화면에는 선택지가 없어 앞부분을 뺐다.
const PLACEHOLDER = "자유롭게 말해주세요.";
const BGM_DUCK_VOLUME = 0.22;

export default function ListenIndicator({ state }: { state: CarListenerState }) {
  const { status, interim, pending, error } = state;
  const isListening = status === "listening";

  // main 과 같이 듣는 동안 BGM(loop audio)을 낮춘다. 되돌릴 때는 낮추기 직전 볼륨으로.
  useEffect(() => {
    if (!isListening) return;
    const bgm = document.querySelector("audio[loop]") as HTMLAudioElement | null;
    if (!bgm) return;
    const before = bgm.volume;
    bgm.volume = BGM_DUCK_VOLUME;
    return () => {
      bgm.volume = before;
    };
  }, [isListening]);

  if (status === "off" || status === "unsupported") return null;

  if (status === "paused") {
    return (
      <div className="pointer-events-none fixed inset-x-0 top-[20%] z-30 flex justify-center">
        <HyundaiLoading />
      </div>
    );
  }

  // 누적 확정 발화 + 지금 인식 중인 부분 — main 처럼 말한 전체가 이어서 보인다.
  const spoken = [pending, interim].filter(Boolean).join(" ").trim();

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[20%] z-30 flex justify-center">
      <div className="flex max-w-[80vw] flex-col items-center justify-center gap-[25px]">
        <div className="flex items-center justify-center gap-4 rounded-full bg-[#003A66]/30 p-4 text-[20px] text-[#9DE6FF] backdrop-blur-2xl">
          <span className={cn("animate-pulse", isListening && "animate-in")}>
            <Icons.leftQuote />
          </span>
          {spoken ? <strong>{spoken}</strong> : <strong className="opacity-60">{PLACEHOLDER}</strong>}
          <span className={cn("animate-pulse", isListening && "animate-in")}>
            <Icons.rightQuote />
          </span>
        </div>

        <div className="flex items-center gap-[8px]">
          <img
            src={isListening ? "/assets/images/icon_mic_on.png" : "/assets/images/icon_mic_off.png"}
            alt="mic"
            className="w-[34px]"
          />
          <span className="text-shadow-sm text-[18px] text-white">
            {isListening ? "버튼을 길게 누르면 메시지가 전달됩니다" : "버튼을 누르면 마이크가 켜집니다"}
          </span>
        </div>

        {status === "error" && (
          <div className="rounded-full bg-red-900/60 px-4 py-1.5 text-[14px] text-red-200">
            마이크 오류: {error ?? "알 수 없음"}
          </div>
        )}
      </div>
    </div>
  );
}
