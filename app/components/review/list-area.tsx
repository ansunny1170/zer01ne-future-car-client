/* eslint-disable react/display-name */
import { Reflection } from "@/type";
import { useRef, useState } from "react";
import { Icons } from "../ui/icons";

interface ListAreaProps {
    data: Reflection[];
    onItemClick: (item: Reflection) => void;
    selectedItem?: Reflection | null;
}

export default function ListArea({ data, onItemClick, selectedItem }: ListAreaProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [currentPage, setCurrentPage] = useState(0);
    
    const scrollToTop = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    };
    
    // 6개씩 페이지로 그룹핑 (제한 없음)
    const groupedData = [];
    for (let i = 0; i < data.length; i += 6) {
        groupedData.push(data.slice(i, i + 6));
    }

    const handleScroll = () => {
        if (!scrollRef.current) return;
        
        const scrollTop = scrollRef.current.scrollTop;
        const clientHeight = scrollRef.current.clientHeight;
        const pageIndex = Math.round(scrollTop / clientHeight);
        const limitedPageIndex = Math.min(Math.max(pageIndex, 0), groupedData.length - 1);
        setCurrentPage(limitedPageIndex);
    };

    if (groupedData.length === 0) {
        return <div className="bg-black h-full grow p-8 relative">
            <div className="h-full flex items-center justify-center">
                <p className="text-white text-2xl">Loading...</p>
            </div>
        </div>
    }
    
    return (
        <div className="bg-[#444444] h-full grow p-8 py-[80px] pb-[60px] relative">
            {/* Scroll to top button */}
            <div className="absolute right-1/2 translate-x-1/2 top-[20px] z-20">
                <button 
                    onClick={scrollToTop}
                    className="text-white rounded-full p-3 transition-colors focus:opacity-70"
                >
                    <Icons.scrollTop />
                </button>
            </div>
            
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide"
                style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch',
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
                                        ? 'border-[#8484AE]' 
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
                                    <div className="font-semibold text-[26px] pb-[24px] leading-[1.2] break-keep">{item.event_title}</div>
                                    <div className="flex-1 relative overflow-hidden">
                                        <p className="text-sm leading-relaxed">
                                            {item.reflection_text}
                                        </p>
                                        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                                    </div>
                                </button>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            
            {/* Bottom index display - 현재 페이지 표시 */}
            {groupedData.length > 1 && (
                <div className="absolute bottom-[20px] left-1/2 transform -translate-x-1/2 z-20">
                    <div className="text-white text-sm font-mono">
                        {currentPage + 1}/{groupedData.length}
                    </div>
                </div>
            )}
        </div>
    );
}