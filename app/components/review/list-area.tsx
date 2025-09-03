import { Reflection } from "@/type";
import { useState, useEffect, useRef } from "react";

interface ListAreaProps {
    data: Reflection[];
    onItemClick: (item: Reflection) => void;
}

export default function ListArea({ data, onItemClick }: ListAreaProps) {
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
    
    return (
        <div className="bg-black h-full grow p-8 relative">
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
                        className="grid grid-cols-3 grid-rows-2 gap-6 h-full snap-start flex-shrink-0 pb-8"
                    >
                        {group.map((item, index) => (
                            <div 
                                key={item.id || `${groupIndex}-${index}`}
                                className="bg-white p-6 rounded-2xl relative overflow-hidden flex flex-col h-full hover:bg-gray-200 transition-colors"
                            >
                                <button 
                                    onClick={() => onItemClick(item)}
                                    className="overflow-hidden flex flex-col gap-2 w-full h-full text-left transition-colors"
                                >
                                    <div className="text-sm">{item.nick_name}</div>
                                    <div className="font-bold text-lg mb-2">{item.event_title}</div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-sm leading-relaxed line-clamp-[8]">
                                            {item.reflection_text}
                                        </p>
                                    </div>
                                </button>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            
            {/* 페이지 인디케이터 */}
            {groupedData.length > 1 && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-2">
                    {groupedData.map((_, index) => (
                        <div 
                            key={index}
                            className={`w-2 h-8 rounded-full transition-all duration-200 ${
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