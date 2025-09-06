import { Reflection } from "@/type";
import { useEffect, useRef, useState } from "react";
import { Icons } from "../ui/icons";

interface DetailAreaProps {
    selectedItem: Reflection | null;
}

export default function DetailArea({ selectedItem }: DetailAreaProps) {
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
    
    return (
        <div 
            ref={scrollRef} 
            onScroll={handleScroll}
            className="w-1/3 h-full bg-white shrink-0 overflow-y-auto custom-scrollbar"
            style={{
                '--scrollbar-opacity': showScrollbar && isScrollable ? '0.5' : '0',
                scrollbarWidth: 'thin',
                scrollbarColor: `rgba(0, 0, 0, ${showScrollbar && isScrollable ? 0.5 : 0}) transparent`,
            } as React.CSSProperties & { '--scrollbar-opacity': string }}
        >
            <div className="pt-[24px] px-[14px] sticky top-0 bg-white text-[40px]">
                <h1 className="px-[12px] pb-[12px] text-[32px] font-bold border-b border-black">생성된 체험 이벤트 아카이브</h1>
            </div>
            {selectedItem ? (
                <div className="px-[28px] py-[70px]">
                    <div className="pb-[180px]">
                        <h2 className="text-[40px] font-semibold pb-[46px] leading-[1.2] break-keep">{selectedItem.event_title}</h2>
                        <div className="text-[18px] flex items-center gap-2">
                            <Icons.user />
                            {selectedItem.nick_name}
                        </div>
                    </div>

                    
                    <div className="text-[20px] whitespace-pre-wrap">
                        {selectedItem.reflection_text}
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                    카드를 선택하여 상세 내용을 확인하세요
                </div>
            )}
        </div>
    );
}