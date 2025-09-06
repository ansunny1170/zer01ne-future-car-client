import { Reflection } from "@/type";
import { useState, useEffect, useRef } from "react";
import { Icons } from "../ui/icons";

interface ListAreaProps {
    data: Reflection[];
    onItemClick: (item: Reflection) => void;
    selectedItem?: Reflection | null;
}

export default function ListArea({ data, onItemClick, selectedItem }: ListAreaProps) {
    const [currentPage, setCurrentPage] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    
    // 6개씩 페이지로 나누기 (3x2 그리드)
    const groupedData = [];
    for (let i = 0; i < data.length; i += 6) {
        groupedData.push(data.slice(i, i + 6));
    }

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const scrollTop = scrollRef.current.scrollTop;
        const clientHeight = scrollRef.current.clientHeight;
        const pageIndex = Math.round(scrollTop / clientHeight);
        setCurrentPage(pageIndex);
    };

    if (groupedData.length === 0) {
        return <div className="bg-black h-full grow p-8 relative">
            <div className="h-full flex items-center justify-center">
                <p className="text-white text-2xl">Loading...</p>
            </div>
        </div>
    }
    
    return (
        <div className="bg-black h-full grow p-8 py-[80px] pr-[55px] relative">
            <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide space-y-[20px]"
                style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                }}
            >
                {groupedData.map((group, groupIndex) => (
                    <div 
                        key={groupIndex}
                        className="grid grid-cols-3 grid-rows-2 gap-6 h-full snap-start flex-shrink-0"
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
            
            {/* 페이지 인디케이터 */}
            {groupedData.length > 1 && (
                <div className="absolute right-[20px] top-1/2 transform -translate-y-1/2 flex flex-col gap-[10px]">
                    {groupedData.map((_, index) => (
                        <div 
                            key={index}
                            className={`w-[12px] h-[12px] rounded-full transition-all duration-200 ${
                                index === currentPage 
                                    ? 'bg-white' 
                                    : 'bg-white/30'
                            }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}