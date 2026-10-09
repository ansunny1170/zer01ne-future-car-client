"use client";

import { EmotionKey, EmotionPlace } from "@/type";
import { cn } from "@/utils/cn";
import { useEffect, useRef, useState } from "react";

// 장소별 감정 그래프 — 피그마 ZER01NE 8805:7825(상세, compact) / 8892:8486(펼쳐보기, full).
// 열 = 카메라가 본 실제 방문 순서, 행 = 표정 4종. 장소마다 가장 오래 지은 표정에 점을 찍고 선으로 잇는다.
// 숫자 배지·말풍선 = 그 장소에서 한 일(완료 태스크). 데이터: 서버 payload.emotion_places (OC emotions.by_location).

const ASSET = "/assets/review";

const EMOTIONS: { key: EmotionKey; label: string; icon: string; color: string; chip: string }[] = [
    { key: "joy", label: "Happy", icon: "emo_happy", color: "#a4b6ff", chip: "bg-[rgba(164,182,255,0.2)]" },
    { key: "surprise", label: "Surprise", icon: "emo_surprise", color: "#bde956", chip: "bg-[rgba(210,243,133,0.3)]" },
    { key: "neutral", label: "Neutral", icon: "emo_neutral", color: "#fdea43", chip: "bg-[rgba(255,242,127,0.3)]" },
    { key: "anger", label: "Angry", icon: "emo_angry", color: "#ff7575", chip: "bg-[rgba(255,117,117,0.2)]" },
];

const PLACE_ICON: Record<string, string> = { 집: "ic_home", 마트: "ic_store", 공원: "ic_park" };

// 차는 피그마에 아이콘이 없어 기존 Icons.car 모양을 장소 아이콘 색(#5E5E5E)으로 쓴다.
function CarIcon() {
    return (
        <svg width="26" height="23" viewBox="0 0 54 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.53369 41.4998V44.4165C9.53369 45.2429 9.25418 45.9356 8.69515 46.4946C8.13612 47.0537 7.44341 47.3332 6.61702 47.3332H3.70036C2.87397 47.3332 2.18126 47.0537 1.62223 46.4946C1.06321 45.9356 0.783691 45.2429 0.783691 44.4165V31.1769C0.783691 24.4957 1.91101 17.8623 4.11816 11.5561L6.90869 3.58317C7.20036 2.70817 7.72293 2.00331 8.4764 1.46859C9.22987 0.933865 10.0684 0.666504 10.992 0.666504H43.0754C43.999 0.666504 44.8375 0.933865 45.591 1.46859C46.3445 2.00331 46.867 2.70817 47.1587 3.58317L49.9492 11.5561C52.1564 17.8623 53.2837 24.4956 53.2837 31.1769V44.4165C53.2837 45.2429 53.0042 45.9356 52.4452 46.4946C51.8861 47.0537 51.1934 47.3332 50.367 47.3332H47.4504C46.624 47.3332 45.9313 47.0537 45.3722 46.4946C44.8132 45.9356 44.5337 45.2429 44.5337 44.4165V41.4998H9.53369ZM8.95036 15.2498H45.117L42.0545 6.49984H12.0129L8.95036 15.2498ZM13.9087 32.7498C15.124 32.7498 16.157 32.3245 17.0077 31.4738C17.8583 30.6231 18.2837 29.5901 18.2837 28.3748C18.2837 27.1596 17.8583 26.1266 17.0077 25.2759C16.157 24.4252 15.124 23.9998 13.9087 23.9998C12.6934 23.9998 11.6604 24.4252 10.8097 25.2759C9.95904 26.1266 9.53369 27.1596 9.53369 28.3748C9.53369 29.5901 9.95904 30.6231 10.8097 31.4738C11.6604 32.3245 12.6934 32.7498 13.9087 32.7498ZM40.1587 32.7498C41.374 32.7498 42.407 32.3245 43.2576 31.4738C44.1083 30.6231 44.5337 29.5901 44.5337 28.3748C44.5337 27.1596 44.1083 26.1266 43.2576 25.2759C42.407 24.4252 41.374 23.9998 40.1587 23.9998C38.9434 23.9998 37.9104 24.4252 37.0597 25.2759C36.209 26.1266 35.7837 27.1596 35.7837 28.3748C35.7837 29.5901 36.209 30.6231 37.0597 31.4738C37.9104 32.3245 38.9434 32.7498 40.1587 32.7498Z" fill="#5E5E5E" />
        </svg>
    );
}

function PlaceIcon({ name }: { name: string }) {
    const icon = PLACE_ICON[name];
    return (
        <div className="w-[30px] h-[30px] flex items-center justify-center shrink-0">
            {icon ? <img alt="" src={`${ASSET}/${icon}.svg`} className="block" /> : name.startsWith("차") ? <CarIcon /> : null}
        </div>
    );
}

// 크기별 치수 — compact: 행 48px·간격 16px(영역 240px), full: 행 48px 양끝 정렬(영역 382px).
const SIZE = {
    compact: { plotH: 240, rowY: (i: number) => 24 + i * 64, padX: 10, dot: 20, line: 4, glow: 10 },
    full: { plotH: 382, rowY: (i: number) => 24 + (i * (382 - 48)) / 3, padX: 150, dot: 36, line: 8, glow: 20 },
};

function columnX(i: number, n: number, width: number, size: "compact" | "full") {
    if (size === "full") {
        if (n <= 1) return width / 2;
        return SIZE.full.padX + (i * (width - SIZE.full.padX * 2)) / (n - 1);
    }
    const pad = SIZE.compact.padX;
    return pad + ((i + 0.5) * (width - pad * 2)) / Math.max(n, 1);
}

interface EmotionJourneyProps {
    places: EmotionPlace[];
    size: "compact" | "full";
}

export default function EmotionJourney({ places, size }: EmotionJourneyProps) {
    const plotRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);
    const dim = SIZE[size];

    useEffect(() => {
        const el = plotRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => setWidth(el.clientWidth));
        ro.observe(el);
        setWidth(el.clientWidth);
        return () => ro.disconnect();
    }, []);

    const n = places.length;
    const points = places
        .map((p, i) => {
            const row = EMOTIONS.findIndex((e) => e.key === p.dominant);
            return row < 0 ? null : { i, row, x: columnX(i, n, width, size), y: dim.rowY(row), color: EMOTIONS[row].color, place: p };
        })
        .filter((p): p is NonNullable<typeof p> => p !== null);

    // 점들을 수평 접선 곡선으로 잇는다. 색은 점마다의 표정 색을 가로 그라데이션으로.
    const path = points
        .map((p, k) => {
            if (k === 0) return `M ${p.x} ${p.y}`;
            const prev = points[k - 1];
            const mid = (p.x - prev.x) / 2;
            return `C ${prev.x + mid} ${prev.y} ${p.x - mid} ${p.y} ${p.x} ${p.y}`;
        })
        .join(" ");
    const x0 = points[0]?.x ?? 0;
    const xn = points[points.length - 1]?.x ?? 1;
    const gradId = `emotion-line-${size}`;

    return (
        <div className={cn("flex items-start w-full", size === "full" && "h-[506px] pb-[30px] border-b-4 border-white rounded-[16px]")}>
            {/* 표정 라벨 열 */}
            <div className="flex flex-col gap-[16px] w-[156px] shrink-0">
                <div className="h-[78px]" />
                <div className="flex flex-col justify-between" style={{ height: dim.plotH }}>
                    {EMOTIONS.map((e) => (
                        <div key={e.key} className={cn("flex gap-[16px] items-center px-[10px] py-[6px] rounded-[16px] w-[153px]", e.chip)}>
                            <img alt="" src={`${ASSET}/${e.icon}.svg`} className="w-[20px] h-[20px] shrink-0" />
                            <p className="text-[#5e5e5e] text-[24px] leading-[1.5]">{e.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-[16px] flex-1 min-w-0">
                {/* 장소 머리줄 */}
                <div className="bg-white rounded-[16px] h-[78px] relative">
                    {places.map((p, i) => (
                        <div
                            key={`${p.location_id}-${i}`}
                            className="absolute top-[6px] flex flex-col items-center w-[100px] -translate-x-1/2"
                            style={{ left: columnX(i, n, width, size) }}
                        >
                            <PlaceIcon name={p.name} />
                            <p className="text-[#5e5e5e] text-[24px] leading-[1.5] text-center whitespace-nowrap">{p.name}</p>
                        </div>
                    ))}
                </div>

                {/* 점·선 영역 */}
                <div ref={plotRef} className="relative w-full" style={{ height: dim.plotH }}>
                    {width > 0 && (
                        <>
                            {places.map((_, i) =>
                                EMOTIONS.map((e, row) =>
                                    points.some((pt) => pt.i === i && pt.row === row) ? null : (
                                        <span
                                            key={`${i}-${e.key}`}
                                            className="absolute w-[6px] h-[6px] rounded-full bg-[#b5b5b5] -translate-x-1/2 -translate-y-1/2"
                                            style={{ left: columnX(i, n, width, size), top: dim.rowY(row) }}
                                        />
                                    ),
                                ),
                            )}
                            {points.length > 1 && (
                                <svg className="absolute inset-0 overflow-visible pointer-events-none" width={width} height={dim.plotH}>
                                    <defs>
                                        <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1={x0} y1="0" x2={xn} y2="0">
                                            {points.map((p) => (
                                                <stop key={p.i} offset={xn === x0 ? 0 : (p.x - x0) / (xn - x0)} stopColor={p.color} />
                                            ))}
                                        </linearGradient>
                                        <filter id={`${gradId}-blur`} x="-20%" y="-50%" width="140%" height="200%">
                                            <feGaussianBlur stdDeviation={dim.glow / 3} />
                                        </filter>
                                    </defs>
                                    <path d={path} fill="none" stroke={`url(#${gradId})`} strokeWidth={dim.glow} strokeLinecap="round" opacity={0.45} filter={`url(#${gradId}-blur)`} />
                                    <path d={path} fill="none" stroke={`url(#${gradId})`} strokeWidth={dim.line} strokeLinecap="round" />
                                </svg>
                            )}
                            {points.map((p) => (
                                <HighlightDot key={p.i} point={p} size={size} last={p.i === n - 1} />
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

interface DotPoint {
    x: number;
    y: number;
    row: number;
    place: EmotionPlace;
}

function HighlightDot({ point, size, last }: { point: DotPoint; size: "compact" | "full"; last: boolean }) {
    const emotion = EMOTIONS[point.row];
    const tasks = point.place.tasks ?? [];
    const dot = SIZE[size].dot;
    const box = (dot * 52) / 36; // glow 에셋은 36px 점 + 그림자 여백(52px)

    return (
        <div className="absolute" style={{ left: point.x, top: point.y }}>
            <div className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center" style={{ width: box, height: box }}>
                <img alt="" src={`${ASSET}/glow_${emotion.key}.svg`} className="absolute inset-0 w-full h-full" />
                {size === "full" && tasks.length > 0 && (
                    <p className="relative text-white text-[16px] font-black leading-[1.5]">{tasks.length}</p>
                )}
            </div>

            {/* compact: 오른쪽 파란 숫자 배지 */}
            {size === "compact" && tasks.length > 0 && (
                <div className="absolute left-[14px] -top-[9px] bg-[#6688c4] rounded-[4px] w-[20px] py-[2px] flex items-center justify-center">
                    <p className="text-white text-[10px] font-black leading-[1.5]">{tasks.length}</p>
                    <img alt="" src={`${ASSET}/badge_pointer.svg`} className="absolute -left-[5px] top-[6px] w-[7px] h-[7px] -rotate-90" />
                </div>
            )}

            {/* full: 한 일 말풍선 — 위쪽 두 행은 점 아래로, 아래쪽 두 행은 점 위로. 마지막 열은 오른쪽 정렬 */}
            {size === "full" && tasks.length > 0 && (
                <div
                    className={cn("absolute flex flex-col gap-[6px] w-[180px] z-10", point.row < 2 ? "top-[26px]" : "bottom-[26px]")}
                    style={last ? { left: -166 } : { left: -14 }}
                >
                    {tasks.map((t, k) => (
                        <div key={k} className="relative bg-[rgba(255,255,255,0.8)] rounded-[4px] px-[10px] py-[6px] flex items-center justify-center">
                            <p className="text-[#5e5e5e] text-[14px] leading-[1.5] text-center">{t}</p>
                            {point.row < 2 && k === 0 && (
                                <img alt="" src={`${ASSET}/pointer_up.svg`} className={cn("absolute -top-[8px] w-[12px] h-[12px]", last ? "left-[158px]" : "left-[8px]")} />
                            )}
                            {point.row >= 2 && k === tasks.length - 1 && (
                                <img alt="" src={`${ASSET}/pointer_down.svg`} className={cn("absolute -bottom-[8px] w-[12px] h-[12px] rotate-180", last ? "left-[158px]" : "left-[8px]")} />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
