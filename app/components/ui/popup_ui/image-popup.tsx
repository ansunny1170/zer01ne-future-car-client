/* eslint-disable @next/next/no-img-element */
// 이미지 팝업 — 피그마 '제로원 쇼케이스 GUI 가이드' node 884:485(그룹 2390:288 공통 틀) (2026-10-05).
// 577×610 유리 카드: 고정 제목(42px) + 그림(509×388 칸, 잘리지 않게) + LLM 설명(21.5px) + 하단 그라데이션 광택.
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
        <div className="relative h-[610px] w-[577px] overflow-hidden rounded-[37.5px] text-white opacity-0 translate-y-[50px] animate-popup">
            {/* 하단 그라데이션 광택 — 피그마 Mask group(마스크 + color-dodge) */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 top-[70px] rounded-b-[38px] opacity-40 mix-blend-color-dodge"
                style={{
                    backgroundImage: "linear-gradient(-90deg, rgb(191,255,0) 12.4%, rgb(92,255,217) 43.2%, rgb(0,153,255) 100%)",
                    maskImage: "url(/assets/popup/mask.svg)",
                    maskPosition: "0px 51px",
                    maskSize: "577px calc(100% - 51px)",
                    maskRepeat: "no-repeat",
                    WebkitMaskImage: "url(/assets/popup/mask.svg)",
                    WebkitMaskPosition: "0px 51px",
                    WebkitMaskSize: "577px calc(100% - 51px)",
                    WebkitMaskRepeat: "no-repeat",
                }}
            />
            <div className="relative flex h-full flex-col items-center gap-[14px] rounded-[37.5px] bg-black/[0.02] px-[34.375px] py-[31.25px] backdrop-blur-[37.4px]">
                <p className="w-full text-center text-[42px] font-bold leading-[64px] break-keep">{title}</p>
                <div className="flex h-[388px] w-[509px] shrink-0 items-center justify-center">
                    {image ? (
                        <img src={image} alt="" className="h-full w-full object-contain" />
                    ) : (
                        <span className="flex scale-[2.5] items-center justify-center">{icon}</span>
                    )}
                </div>
                {subtext && (
                    <p className="w-[509px] text-center text-[21.563px] leading-[37.5px] text-white/80 break-keep">{subtext}</p>
                )}
            </div>
        </div>
    );
}
