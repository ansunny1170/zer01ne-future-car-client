import { Reflection } from "@/type";
import { useState, useEffect } from "react";

interface ListAreaProps {
    data: Reflection[];
    onItemClick: (item: Reflection) => void;
}

export default function ListArea({ data, onItemClick }: ListAreaProps) {
    // 3개씩 그룹으로 나누기
    const groupedData = [];
    for (let i = 0; i < data.length; i += 3) {
        groupedData.push(data.slice(i, i + 3));
    }
    
    return (
        <div className="bg-black h-full grow p-8">
            <div className="h-full overflow-y-auto snap-y snap-mandatory">
                {groupedData.map((group, groupIndex) => (
                    <div 
                        key={groupIndex}
                        className="grid grid-cols-3 gap-6 h-full snap-start flex-shrink-0 pb-8"
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
        </div>
    );
}