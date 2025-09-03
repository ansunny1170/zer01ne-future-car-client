import { Reflection } from "@/type";
import { useState, useEffect } from "react";

interface ListAreaProps {
    data: Reflection[];
    onItemClick: (item: Reflection) => void;
}

export default function ListArea({ data, onItemClick }: ListAreaProps) {
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 6;
    const totalPages = Math.ceil(data.length / itemsPerPage);
    
    const currentData = data.slice(
        currentPage * itemsPerPage, 
        (currentPage + 1) * itemsPerPage
    );

    // 데이터가 변경되면 첫 페이지로 이동
    useEffect(() => {
        setCurrentPage(0);
    }, [data.length]);

    const nextPage = () => {
        if (currentPage < totalPages - 1) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 0) {
            setCurrentPage(prev => prev - 1);
        }
    };
    
    return (
        <div className="bg-black h-full grow p-8 flex flex-col">
            <ul className="grid grid-cols-3 gap-6 flex-1">
                {currentData.map((item, index) => (
                    <li 
                        key={index}
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
                    </li>
                ))}
            </ul>
            
            {/* 페이지네이션 컨트롤 */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                    <button 
                        onClick={prevPage}
                        disabled={currentPage === 0}
                        className="text-white/60 hover:text-white disabled:opacity-30"
                    >
                        ← 이전
                    </button>
                    <span className="text-white">
                        {currentPage + 1} / {totalPages}
                    </span>
                    <button 
                        onClick={nextPage}
                        disabled={currentPage === totalPages - 1}
                        className="text-white/60 hover:text-white disabled:opacity-30"
                    >
                        다음 →
                    </button>
                </div>
            )}
        </div>
    );
}