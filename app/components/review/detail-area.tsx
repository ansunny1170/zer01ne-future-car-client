import { Reflection } from "@/type";
import { useEffect, useRef } from "react";

interface DetailAreaProps {
    selectedItem: Reflection | null;
}

export default function DetailArea({ selectedItem }: DetailAreaProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    
    // selectedItem이 변경될 때마다 스크롤을 최상단으로 이동
    useEffect(() => {
        if (selectedItem && scrollRef.current) {
            scrollRef.current.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }, [selectedItem]);
    
    return (
        <div ref={scrollRef} className="w-1/3 h-full bg-white shrink-0 overflow-y-auto">
            <div className="pt-[24px] px-[14px] sticky top-0 bg-white text-[40px]">
                <h1 className="px-[12px] pb-[12px] text-[32px] font-bold border-b border-black">생성된 체험 이벤트 아카이브</h1>
            </div>
            {selectedItem ? (
                <div className="px-[28px] py-[70px]">
                    <div className="pb-[180px]">
                        <h2 className="text-[40px] font-semibold pb-[46px] leading-[1.2]">{selectedItem.event_title}</h2>
                        <div className="text-[18px] flex items-center gap-2">
                            <span className="text-gray-600">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M0 17.1696C0 15.8806 0.512034 14.6445 1.42346 13.733C2.33489 12.8216 3.57105 12.3096 4.86 12.3096H14.58C15.869 12.3096 17.1051 12.8216 18.0165 13.733C18.928 14.6445 19.44 15.8806 19.44 17.1696C19.44 17.814 19.184 18.4321 18.7283 18.8878C18.2726 19.3436 17.6545 19.5996 17.01 19.5996H2.43C1.78552 19.5996 1.16744 19.3436 0.71173 18.8878C0.256017 18.4321 0 17.814 0 17.1696Z" fill="#070707"/>
                                <path d="M9.71922 7.45016C11.7323 7.45016 13.3642 5.81823 13.3642 3.80516C13.3642 1.79208 11.7323 0.160156 9.71922 0.160156C7.70614 0.160156 6.07422 1.79208 6.07422 3.80516C6.07422 5.81823 7.70614 7.45016 9.71922 7.45016Z" fill="#070707"/>
                                </svg>
                            </span>
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