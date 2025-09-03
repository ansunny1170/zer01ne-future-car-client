import { Reflection } from "@/type";

interface DetailAreaProps {
    selectedItem: Reflection | null;
}

export default function DetailArea({ selectedItem }: DetailAreaProps) {
    return (
        <div className="w-1/3 h-full bg-white shrink-0 p-8 overflow-y-auto">
            {selectedItem ? (
                <div className="space-y-6">
                    <div className="border-b pb-6">
                        <h1 className="text-2xl font-bold mb-2">생성된 체험 이벤트 아카이브</h1>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm">🎵</span>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{selectedItem.event_title}</h2>
                            <p className="text-gray-600 flex items-center gap-1">
                                <span>👤</span>
                                {selectedItem.nick_name}
                            </p>
                        </div>
                    </div>
                    
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                            {selectedItem.reflection_text}
                        </p>
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