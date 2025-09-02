interface ListAreaProps {
    data: any[];
}

export default function ListArea({ data }: ListAreaProps) {
    console.log("data????", data);
    return (
        <div className="bg-black h-full grow p-8">
            <div className="grid grid-cols-3 gap-6 h-full">
                {data.map((item, index) => (
                    <div 
                        key={index}
                        className="bg-white/10 h-1/2 backdrop-blur-md p-6 rounded-2xl border border-white/20 relative overflow-hidden"
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                        }}
                    >
                        {/* 선택된 카드 표시 (첫 번째 카드) */}
                        {index === 0 && (
                            <>
                                <div className="absolute top-0 left-0 w-4 h-4 bg-red-500 rounded-full -translate-x-2 -translate-y-2 border-2 border-white" />
                                <div className="absolute inset-0 border-2 border-red-500 rounded-2xl" />
                            </>
                        )}
                        
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                                <span className="text-xs text-white">👤</span>
                            </div>
                            <span className="text-white/60 text-sm">관람객 1001 (1/4)</span>
                        </div>
                        
                        <h3 className="text-white font-bold text-lg mb-4">Event Title</h3>
                        
                        <p className="text-white/80 text-sm leading-relaxed">
                            {item.description || "타이틀에 대한 설명 타이틀에 대한 설명타이틀에 대한 설명 타이틀에 대한 설명타이틀에 대한 설명 타이틀에 대한 설명타이틀에 대한 설명 타이틀에 대한 설명 타이틀에 대한 설명타이틀에 대한 설명 타이틀에 대한 설명 타이틀에 대한 설명타이틀에 대한 설명..."}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}