/* eslint-disable @next/next/no-img-element */
// 이미지 팝업 — 피그마 '제로원 쇼케이스 GUI 가이드' node 884:485(그룹 2390:288 공통 틀) (2026-10-05).
// 유리 카드: 고정 제목 + 그림(잘리지 않게) + LLM 설명 + 하단 그라데이션 광택.
// 크기는 피그마(577×610, 제목 42px, 그림 509×388, 설명 21.5px)의 2/3 — 화면에서 너무 커서 줄임(2026-10-05).
// 관리자 '팝업 설정'에서 DEFAULT_POPUP·TRIGGER_POPUP 모양을 image 로 고르면 CommonPopupUI 가 이걸 그린다.
// 그림이 없으면 그 팝업 키의 아이콘을 칸 가운데에 크게 그린다.
import { ReactNode } from "react";

export default function ImagePopup({ title, image, subtext, icon }: {
    title: string;
    image: string | null;
    subtext?: string;
    icon?: ReactNode;
}) {
    return (
        <div className="relative h-[407px] w-[385px] overflow-hidden rounded-[25px] text-white opacity-0 translate-y-[50px] animate-popup">
            {/* 하단 그라데이션 광택 — 피그마 Mask group(마스크 + color-dodge) */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 top-[47px] rounded-b-[25px] opacity-40 mix-blend-color-dodge"
                style={{
                    backgroundImage: "linear-gradient(-90deg, rgb(191,255,0) 12.4%, rgb(92,255,217) 43.2%, rgb(0,153,255) 100%)",
                    maskImage: "url(/assets/popup/mask.svg)",
                    maskPosition: "0px 34px",
                    maskSize: "385px calc(100% - 34px)",
                    maskRepeat: "no-repeat",
                    WebkitMaskImage: "url(/assets/popup/mask.svg)",
                    WebkitMaskPosition: "0px 34px",
                    WebkitMaskSize: "385px calc(100% - 34px)",
                    WebkitMaskRepeat: "no-repeat",
                }}
            />
            <div className="relative flex h-full flex-col items-center gap-[9px] rounded-[25px] bg-black/[0.02] px-[23px] py-[21px] backdrop-blur-[25px]">
                <p className="w-full text-center text-[28px] font-bold leading-[43px] break-keep">{title}</p>
                <div className="flex h-[259px] w-[339px] shrink-0 items-center justify-center">
                    {image ? (
                        <img src={image} alt="" className="h-full w-full object-contain" />
                    ) : (
                        <span className="flex scale-[1.7] items-center justify-center">{icon}</span>
                    )}
                </div>
                {subtext && (
                    <p className="w-[339px] text-center text-[14.4px] leading-[25px] text-white/80 break-keep">{subtext}</p>
                )}
            </div>
        </div>
    );
}
