/* eslint-disable @next/next/no-img-element */
"use client";

// step3 끝(도착 직전) '다음 일정 브리핑' 팝업 — 피그마 '제로원 쇼케이스 GUI 가이드' node 2324:4080.
// 서버(app/services/mqtt/briefing.py)가 다음 장소 태스크 최대 3개를 LLM 으로 꾸며 BRIEFING_POPUP 으로 싣는다.
// 글꼴은 피그마의 Google Sans Flex 대신 프로젝트 기본(현대 폰트)을 쓴다 — 크기·굵기·자간은 피그마 값.
import { useEffect } from "react";
import { BriefingPopup as BriefingPopupData } from "@/type";

// 카드 3장 + 문구가 많아 일반 팝업(3초)보다 길게 보여준다.
export const BRIEFING_SHOW_MS = 8000;

export default function BriefingPopup({ data, onComplete }: { data: BriefingPopupData; onComplete?: () => void }) {
  useEffect(() => {
    if (!onComplete) return;
    const timer = setTimeout(onComplete, BRIEFING_SHOW_MS);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const items = (data.items || []).slice(0, 3);

  return (
    <div className="relative w-[600px] overflow-hidden rounded-[10px] text-left text-white opacity-0 translate-y-[50px] animate-popup drop-shadow-[0px_103px_50px_rgba(0,0,0,0.3)]">
      {/* 하단 그라데이션 광택 — 피그마 bg 레이어(마스크 + color-dodge) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-[-60px] top-[-141px] rounded-b-[38px] opacity-40 mix-blend-color-dodge"
        style={{
          backgroundImage: "linear-gradient(-90deg, rgb(191,255,0) 12.4%, rgb(92,255,217) 43.2%, rgb(0,153,255) 100%)",
          maskImage: "url(/assets/briefing/bg-mask.svg)",
          maskPosition: "0px 141px",
          maskSize: "600px calc(100% - 141px)",
          maskRepeat: "no-repeat",
          WebkitMaskImage: "url(/assets/briefing/bg-mask.svg)",
          WebkitMaskPosition: "0px 141px",
          WebkitMaskSize: "600px calc(100% - 141px)",
          WebkitMaskRepeat: "no-repeat",
        }}
      />
      <div className="relative flex flex-col items-center gap-[20px] p-[40px]">
        <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[10px] bg-black/5 backdrop-blur-[37.4px]" />

        {/* 머리글 */}
        <div className="relative flex w-full flex-col items-start gap-[6px]">
          <div className="flex w-full items-center gap-[10px]">
            <img src="/assets/briefing/sparkle.svg" alt="" width={36} height={36} className="block shrink-0" />
            <p className="flex-1 text-[24px] font-bold leading-[1.5] tracking-[-0.264px]">{data.title}</p>
          </div>
          {data.subtitle && (
            <p className="w-full pl-[48px] text-[16px] font-medium leading-[1.5] tracking-[-0.176px]">{data.subtitle}</p>
          )}
        </div>

        {/* 오늘의 일정 */}
        <div className="relative flex w-full flex-col items-start gap-[6px]">
          <p className="text-[14px] font-medium leading-[1.5] tracking-[-0.154px]">{data.section_title}</p>
          <div className="flex w-full flex-col gap-[12px]">
            {items.map((item, i) => (
              <div
                key={i}
                className="flex w-full items-center gap-[20px] rounded-[10px] border border-white bg-white/[0.24] px-[20px] py-[16px]"
              >
                <div className="relative h-[100px] w-[140px] shrink-0 overflow-hidden rounded-[10px] bg-white/10">
                  {item.image && (
                    <img src={item.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col items-start gap-[3px]">
                  {item.tag && (
                    <span className="rounded-[4px] bg-white/10 px-[4px] text-[12px] font-medium leading-[1.5] tracking-[-0.132px] whitespace-nowrap">
                      {item.tag}
                    </span>
                  )}
                  <div className="flex w-full flex-col gap-[6px] leading-[1.5]">
                    <p className="text-[14px] font-bold tracking-[-0.154px] break-keep">{item.title}</p>
                    <div className="flex w-full flex-col gap-[2px] text-[12px] font-medium tracking-[-0.132px]">
                      {item.line1 && <p>{item.line1}</p>}
                      {item.line2 && <p>{item.line2}</p>}
                    </div>
                  </div>
                </div>
                {item.time && (
                  <div className="flex shrink-0 flex-col items-center justify-center gap-[3px] text-center leading-[1.5] whitespace-nowrap">
                    <p className="text-[10px] tracking-[-0.11px]">{item.time_label}</p>
                    <p className="text-[14px] font-bold tracking-[-0.154px]">{item.time}</p>
                    {item.status && <p className="text-[10px] font-bold">{item.status}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[10px] shadow-[inset_0px_-1px_3.5px_0px_white]" />
      </div>
    </div>
  );
}
