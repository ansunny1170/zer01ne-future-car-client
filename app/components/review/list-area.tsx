/* eslint-disable react/display-name */
import { Reflection } from "@/type";
import { useState, useEffect, useRef, memo } from "react";
import { Icons } from "../ui/icons";

interface ListAreaProps {
    data: Reflection[];
    onItemClick: (item: Reflection) => void;
    selectedItem?: Reflection | null;
}

// 최적화된 인디케이터 컴포넌트
const PageIndicator = memo(({ 
    totalPages, 
    currentPage, 
    isProgrammaticScrolling 
}: { 
    totalPages: number; 
    currentPage: number; 
    isProgrammaticScrolling: boolean; 
}) => {
    return (
        <div className="absolute right-[20px] top-1/2 transform -translate-y-1/2 flex flex-col gap-[10px] items-center">
            {Array.from({ length: totalPages }, (_, index) => (
                <div 
                    key={index}
                    className={`w-[12px] h-[12px] rounded-full ${
                        index === currentPage 
                            ? 'bg-white' 
                            : 'bg-white/30'
                    }`}
                    style={{
                        transition: isProgrammaticScrolling 
                            ? 'none' 
                            : 'background-color 150ms ease-in-out'
                    }}
                />
            ))}
            {/* 디버깅용 페이지 표시 */}
            <div className="text-white text-sm mt-4 font-mono whitespace-nowrap fixed right-[20px] bottom-[-140px]">
                {currentPage + 1} / {totalPages}
            </div>
        </div>
    );
});

export default function ListArea({ data, onItemClick, selectedItem }: ListAreaProps) {
    const [currentPage, setCurrentPage] = useState(0);
    const [isProgrammaticScrolling, setIsProgrammaticScrolling] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const targetPageRef = useRef<number | null>(null);
    const scrollEndTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    // 6개씩 페이지로 그룹핑하고 정확히 20페이지로 제한
    const tempGroupedData = [];
    for (let i = 0; i < data.length; i += 6) {
        tempGroupedData.push(data.slice(i, i + 6));
    }
    const groupedData = tempGroupedData.slice(0, 20); // 정확히 20페이지만 렌더링
    console.log('Data length:', data.length, 'Temp grouped pages:', tempGroupedData.length, 'Final grouped pages:', groupedData.length);

    const handleScroll = () => {
        if (!scrollRef.current) return;
        
        const scrollTop = scrollRef.current.scrollTop;
        const clientHeight = scrollRef.current.clientHeight;
        const scrollHeight = scrollRef.current.scrollHeight;
        const pageIndex = Math.round(scrollTop / clientHeight);
        const limitedPageIndex = Math.min(Math.max(pageIndex, 0), groupedData.length - 1);
        
        // 프로그래매틱 스크롤 중일 때는 목표 페이지에 도달했는지만 확인
        if (isProgrammaticScrolling && targetPageRef.current !== null) {
            console.log('🎯 Programmatic scroll check:', limitedPageIndex, 'target:', targetPageRef.current);
            
            // 목표 페이지에 도달하면 프로그래매틱 스크롤 완료
            if (limitedPageIndex === targetPageRef.current) {
                // 스크롤 완료를 확인하기 위한 짧은 지연
                if (scrollEndTimeoutRef.current) {
                    clearTimeout(scrollEndTimeoutRef.current);
                }
                
                scrollEndTimeoutRef.current = setTimeout(() => {
                    setCurrentPage(limitedPageIndex); // 여기서만 currentPage 업데이트
                    setIsProgrammaticScrolling(false);
                    targetPageRef.current = null;
                    console.log('✅ Programmatic scroll completed at page:', limitedPageIndex);
                }, 100);
            }
            return; // 프로그래매틱 스크롤 중에는 다른 currentPage 업데이트 안함
        }
        
        // 일반 사용자 스크롤일 때만 페이지 업데이트
        setCurrentPage(limitedPageIndex);
        
        // 디바운스된 로깅
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }
        
        scrollTimeoutRef.current = setTimeout(() => {
            console.log('📊 User Scroll Analysis:', {
                pageIndex,
                limitedPageIndex,
                scrollTop,
                clientHeight,
                scrollHeight,
                totalPages: groupedData.length,
                maxScrollTop: scrollHeight - clientHeight
            });
        }, 100);
    };

    const scrollToPage = (pageIndex: number) => {
        if (!scrollRef.current) return;
        const clientHeight = scrollRef.current.clientHeight;
        const targetScrollTop = pageIndex * clientHeight;
        console.log('🎯 Button scrollToPage:', pageIndex, 'target:', targetScrollTop);
        
        // 기존 타이머 정리
        if (scrollEndTimeoutRef.current) {
            clearTimeout(scrollEndTimeoutRef.current);
        }
        
        // 프로그래매틱 스크롤 시작 - currentPage는 업데이트하지 않음!
        setIsProgrammaticScrolling(true);
        targetPageRef.current = pageIndex; // 목표 페이지만 저장
        
        scrollRef.current.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth'
        });
        
        // 안전장치: 1초 후에도 완료되지 않으면 강제 완료
        setTimeout(() => {
            if (isProgrammaticScrolling && targetPageRef.current !== null) {
                setCurrentPage(targetPageRef.current); // 안전장치에서만 업데이트
                setIsProgrammaticScrolling(false);
                targetPageRef.current = null;
                console.log('⚠️ Programmatic scroll timeout fallback to page:', targetPageRef.current);
            }
        }, 1000);
    };

    const goToPreviousPage = () => {
        console.log('goToPreviousPage called, currentPage:', currentPage);
        if (currentPage > 0) {
            const targetPage = currentPage - 1;
            console.log('Scrolling to page:', targetPage);
            scrollToPage(targetPage);
        } else {
            console.log('Cannot go to previous page - already at page 0');
        }
    };

    const goToNextPage = () => {
        if (currentPage < groupedData.length - 1) {
            scrollToPage(currentPage + 1);
        }
    };

    if (groupedData.length === 0) {
        return <div className="bg-black h-full grow p-8 relative">
            <div className="h-full flex items-center justify-center">
                <p className="text-white text-2xl">Loading...</p>
            </div>
        </div>
    }
    
    return (
        <div className="bg-black h-full grow p-8 py-[80px] pr-[55px] pb-[60px] relative">
            {currentPage > 0 && groupedData.length > 1 && (
                <div className="absolute inset-x-0 top-[20px] z-20 flex justify-center bg-black w-full">
                    <button 
                        onClick={() => {
                            console.log('ArrowUp clicked, currentPage:', currentPage, 'totalPages:', groupedData.length);
                            goToPreviousPage();
                        }}
                        className="text-white hover:text-gray-300 transition-colors p-4 min-w-[48px] min-h-[48px] flex items-center justify-center cursor-pointer"
                        style={{ pointerEvents: 'auto' }}
                    >
                        <Icons.arrowUp />
                    </button>
                </div>
            )}
            <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide"
                style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                }}
            >
                {groupedData.map((group, groupIndex) => (
                    <div 
                        key={groupIndex}
                        className="grid grid-cols-3 grid-rows-2 gap-6 snap-start flex-shrink-0 pb-[20px]"
                        style={{
                            height: '100%',
                            minHeight: '100%',
                            maxHeight: '100%',
                        }}
                    >
                        {group.map((item, index) => (
                            <div 
                                key={item.id || `${groupIndex}-${index}`}
                                className={`bg-white p-6 rounded-2xl relative overflow-hidden flex flex-col h-full border-4 transition-colors ${
                                    selectedItem?.id === item.id 
                                        ? 'border-teal-400' 
                                        : 'border-transparent'
                                }`}
                            >
                                <button 
                                    onClick={() => onItemClick(item)}
                                    className="overflow-hidden flex flex-col w-full h-full text-left"
                                >
                                    <div className="text-sm flex items-center gap-2 pb-[12px]">
                                        <span className="w-[18px] h-[18px] flex items-center justify-center">
                                            <Icons.user />
                                        </span>
                                        {item.nick_name}
                                    </div>
                                    <div className="font-semibold text-[26px] pb-[24px] leading-[1.2]">{item.event_title}</div>
                                    <div className="flex-1 relative overflow-hidden">
                                        <p className="text-sm leading-relaxed">
                                            {item.reflection_text}
                                        </p>
                                        {/* 그라데이션 페이드아웃 오버레이 */}
                                        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                                    </div>
                                </button>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            <div className="absolute inset-x-0 bottom-[20px] z-20 flex justify-center bg-black w-full min-h-[54px]">
                {currentPage < groupedData.length - 1 && (
                    <button 
                        onClick={() => {
                            console.log('ArrowDown clicked, currentPage:', currentPage);
                            goToNextPage();
                        }}
                        className="text-white hover:text-gray-300 transition-colors p-4 min-w-[48px]  flex items-center justify-center"
                    >
                        <Icons.arrowDown />
                    </button>
                )}
            </div>
            
            
            {/* 페이지 인디케이터 */}
            {groupedData.length > 1 && (
                <PageIndicator 
                    totalPages={groupedData.length}
                    currentPage={isProgrammaticScrolling && targetPageRef.current !== null ? targetPageRef.current : currentPage}
                    isProgrammaticScrolling={isProgrammaticScrolling}
                />
            )}
        </div>
    );
}