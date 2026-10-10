import { Reflection } from "@/type";
import { cn } from "@/utils/cn";
import { companionOf, emotionPlacesOf, formatReflectionDate, hasEmotionData } from "@/utils/reflection";
import { useEffect, useRef, useState } from "react";
import { Icons } from "../ui/icons";
import EmotionJourney from "./emotion-journey";

interface DetailAreaProps {
    selectedItem: Reflection | null;
    // 펼쳐보기(피그마 8892:8486) — 감정 그래프를 크게, 일기 전문을 아래에. 목록은 한 줄로 줄어든다.
    expanded: boolean;
    onToggleExpand: () => void;
}

// 감정 그래프 카드 제목·부제 (피그마의 TITLE / Sub Title 자리)
const GRAPH_TITLE = "오늘의 감정 여정";
const GRAPH_SUB = "비전으로 본 장소마다 가장 오래 지은 표정 · 숫자는 그 장소에서 한 일";

export default function DetailArea({ selectedItem, expanded, onToggleExpand }: DetailAreaProps) {
    const places = emotionPlacesOf(selectedItem);
    const showGraph = hasEmotionData(places);
    const dateText = formatReflectionDate(selectedItem?.created_at);
    const companion = companionOf(selectedItem);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showScrollbar, setShowScrollbar] = useState(false);
    const [isScrollable, setIsScrollable] = useState(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // selectedItem이 변경될 때마다 스크롤을 최상단으로 이동
    useEffect(() => {
        if (selectedItem && scrollRef.current) {
            scrollRef.current.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }, [selectedItem]);

    // 스크롤 가능 여부 체크
    useEffect(() => {
        const checkScrollable = () => {
            if (scrollRef.current) {
                const { scrollHeight, clientHeight } = scrollRef.current;
                setIsScrollable(scrollHeight > clientHeight);
            }
        };

        checkScrollable();
        window.addEventListener('resize', checkScrollable);
        return () => window.removeEventListener('resize', checkScrollable);
    }, [selectedItem]);

    // 스크롤 이벤트 처리
    const handleScroll = () => {
        if (!isScrollable) return;

        setShowScrollbar(true);

        // 기존 타이머 클리어
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }

        // 2초 후 스크롤바 숨김
        scrollTimeoutRef.current = setTimeout(() => {
            setShowScrollbar(false);
        }, 2000);
    };

    // 컴포넌트 언마운트 시 타이머 정리
    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, []);

    const failed = selectedItem?.failed_response && (
        <p className="text-red-500">{selectedItem.failed_response}</p>
    );

    return (
        <div
            ref={scrollRef}
            onScroll={handleScroll}
            className={cn(
                "h-full bg-[#E9E7E6] shrink-0 overflow-y-auto custom-scrollbar transition-[width] duration-300",
                expanded && showGraph ? "w-[76.9%]" : "w-[36.35%]",
            )}
            style={{
                '--scrollbar-opacity': showScrollbar && isScrollable ? '0.5' : '0',
                scrollbarWidth: 'thin',
                scrollbarColor: `rgba(0, 0, 0, ${showScrollbar && isScrollable ? 0.5 : 0}) transparent`,
            } as React.CSSProperties & { '--scrollbar-opacity': string }}
        >
            {selectedItem && expanded && showGraph ? (
                // 펼쳐보기 — 피그마 8892:8486
                <div className="pl-[39px] pr-[37px] pt-[78px] pb-[60px]">
                    <div className="bg-[rgba(255,255,255,0.6)] rounded-[16px] p-[20px] flex flex-col gap-[10px]">
                        <div className="flex items-start justify-between w-full">
                            <div className="flex flex-col text-[#5e5e5e] leading-[1.4]">
                                <p className="text-[48px] tracking-[-0.96px]">{GRAPH_TITLE}</p>
                                <p className="text-[16px] tracking-[-0.32px]">{GRAPH_SUB}</p>
                            </div>
                            <ToggleButton expanded onClick={onToggleExpand} />
                        </div>
                        <EmotionJourney places={places} size="full" />
                        <div className="flex flex-col text-[#5e5e5e] leading-[1.4] py-[10px]">
                            <p className="text-[48px] tracking-[-0.96px] break-keep">{selectedItem.event_title}</p>
                            <p className="text-[16px] tracking-[-0.32px]">{selectedItem.nick_name}</p>
                            {dateText && <p className="text-[16px] tracking-[-0.32px]">{dateText}</p>}
                            {companion && <p className="text-[16px] tracking-[-0.32px]">내가 만난 AI 동행자: {companion}</p>}
                        </div>
                        <div className="py-[10px] text-[#5e5e5e] text-[20px] leading-[1.4] tracking-[-0.4px] whitespace-pre-wrap">
                            {selectedItem.reflection_text}
                            {failed}
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <div className="pt-[21px] pl-[12px] pr-[52px] sticky top-0 bg-[#E9E7E6] z-10">
                        <h1 className="px-[12px] pb-[10px] text-[41px] font-semibold leading-none border-b border-black">생성된 체험 이벤트 아카이브</h1>
                    </div>
                    {selectedItem ? (
                        // 상세 — 피그마 8805:7825
                        <div className="pl-[39px] pr-[31px] pt-[60px] pb-[60px]">
                            <h2 className="text-[48.58px] font-semibold leading-[1.2] break-keep">{selectedItem.event_title}</h2>
                            <div className="pt-[30px] text-[22.68px] flex items-center gap-2">
                                <Icons.user />
                                {selectedItem.nick_name}
                            </div>
                            {/* 프로필 아래 — 일기 작성 시각과 관람객이 고른 AI 동행자 */}
                            {dateText && <p className="pt-[10px] text-[22.68px] text-[#5e5e5e]">{dateText}</p>}
                            {companion && <p className="pt-[4px] text-[22.68px] text-[#5e5e5e]">내가 만난 AI 동행자: {companion}</p>}
                            {showGraph && (
                                <div className="mt-[52px] bg-[rgba(255,255,255,0.6)] rounded-[16px] p-[20px] flex flex-col gap-[10px]">
                                    <div className="flex items-start justify-between w-full">
                                        <div className="flex flex-col gap-[4px] text-[#5e5e5e] leading-[1.4]">
                                            <p className="text-[20px] tracking-[-0.4px]">{GRAPH_TITLE}</p>
                                            <p className="text-[14px] tracking-[-0.28px]">{GRAPH_SUB}</p>
                                        </div>
                                        <ToggleButton expanded={false} onClick={onToggleExpand} />
                                    </div>
                                    <EmotionJourney places={places} size="compact" />
                                </div>
                            )}
                            <div className={cn("text-[30px] leading-[1.5] whitespace-pre-wrap", showGraph ? "pt-[40px]" : "pt-[46px]")}>
                                {selectedItem.reflection_text}
                                {failed}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-[80%] text-gray-500">
                            카드를 선택하여 상세 내용을 확인하세요
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// 펼치기/접기 버튼 — 피그마 30px 흰 사각 버튼(아이콘 90° 회전)
function ToggleButton({ expanded, onClick }: { expanded: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={expanded ? "접기" : "펼쳐보기"}
            className="bg-white border border-[rgba(94,94,94,0.3)] rounded-[6px] w-[30px] h-[30px] shrink-0 flex items-center justify-center"
        >
            <img alt="" src={`/assets/review/${expanded ? "btn_collapse" : "btn_expand"}.svg`} className="rotate-90" />
        </button>
    );
}
