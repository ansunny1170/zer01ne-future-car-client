import { useScene } from "@/context/scene-context";
import QuestionArea from "./question-area";
import CommonPopupUI from "../ui/popup_ui/common";
import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";
import UspPopupWrapper from "../ui/usp-popup-wrapper";
import CloneTalkSplit from "../ui/clone-talk-split";
import { useTimelineProcessor } from "@/hooks/useTimelineProcessor";

export default function StepRepeat({ dafultComment }: { dafultComment?: string }) {
    const { stepInfo } = useScene();
    const { question, choices } = stepInfo || {};
    
    const [questionFlag, setQuestionFlag] = useState(false);
    const [componentsView, setComponentsView] = useState(false);
    const [currentUspPool, setCurrentUspPool] = useState<any[]>([]);
    
    // 새로운 Timeline Processor 사용
    const { 
        currentIdx, 
        state, 
        isCompleted, 
        triggerVisualCompletion, 
        currentItem 
    } = useTimelineProcessor();
    
    // stepInfo 변경 시 UI 상태 초기화
    useEffect(() => {
        if (stepInfo) {
            console.log('StepInfo updated, resetting UI:', stepInfo);
            setQuestionFlag(false);
            setCurrentUspPool([]);
            setComponentsView(false);
            
            setTimeout(() => {
                setComponentsView(true);
            }, 50);
            
            // assets_timeline이 없으면 바로 질문 표시
            if (!stepInfo.assets_timeline && stepInfo.question) {
                setTimeout(() => {
                    setQuestionFlag(true);
                }, 300);
            }
        }
    }, [stepInfo]);
    
    // 타임라인 완료 시 질문 표시
    useEffect(() => {
        if (isCompleted && !questionFlag) {
            setQuestionFlag(true);
        }
    }, [isCompleted, questionFlag]);
    
    // USP Pool 처리 (별도 상태로 관리)
    useEffect(() => {
        if (!currentItem) return;
        
        const uspPoolAssets = currentItem.assets.filter(asset => asset.type === "FUNCTION_USP_POOL");
        if (uspPoolAssets.length > 0) {
            console.log('Processing USP Pool assets:', uspPoolAssets);
            
            const timers: ReturnType<typeof setTimeout>[] = [];
            uspPoolAssets.forEach((asset, index) => {
                const timer = setTimeout(() => {
                    setCurrentUspPool(prev => [...prev, {
                        ...asset,
                        description: asset.description,
                    }]);
                }, index * 2000);
                timers.push(timer);
            });
            
            return () => timers.forEach(clearTimeout);
        }
    }, [currentItem]);
    
    // 현재 타임라인 아이템의 컨텐츠 렌더링
    const renderContent = () => {
        if (!currentItem || isCompleted) {
            return null;
        }
        
        console.log('Rendering timeline item:', currentIdx, currentItem);
        
        // CloneTalk 처리
        const cloneAsset = currentItem.assets.find(asset => asset.type === "CLONE_TALKS");
        if (cloneAsset && "text" in cloneAsset) {
            return (
                <CloneTalkSplit
                    text={cloneAsset.text || ""}
                    onComplete={() => {
                        console.log('CloneTalk completed');
                        setTimeout(() => {
                            triggerVisualCompletion();
                        }, 1000);
                    }}
                />
            );
        }
        
        // 팝업 처리
        const popupAsset = currentItem.assets.find(asset => 
            ["DEFAULT_POPUP", "TRIGGER_POPUP"].includes(asset.type)
        );
        if (popupAsset) {
            console.log('Rendering popup:', popupAsset);
            const keyName = ('id' in popupAsset && popupAsset.id) ? popupAsset.id.toString().toUpperCase() : popupAsset.type;
            
            return (
                <CommonPopupUI
                    key={currentIdx}
                    keyName={keyName}
                    text={'description' in popupAsset ? popupAsset.description : ''}
                    description={'subtext_usp_pool' in popupAsset ? popupAsset.subtext_usp_pool : ''}
                    onComplete={() => {
                        console.log('Popup completed');
                        setTimeout(() => {
                            triggerVisualCompletion();
                        }, 500);
                    }}
                />
            );
        }
        
        // USP Pool은 화면에 직접 렌더링하지 않음 (별도 상태로 관리)
        const uspPoolAssets = currentItem.assets.filter(asset => asset.type === "FUNCTION_USP_POOL");
        if (uspPoolAssets.length > 0) {
            return null; // UspPopupWrapper에서 표시
        }
        
        // 오디오만 있거나 빈 컨텐츠
        console.log('Audio-only or empty content for timeline', currentIdx);
        return null;
    };
    
    return (
        <div className={cn(
            "absolute inset-0 flex flex-col items-center justify-center text-center opacity-0 transition-all duration-300", 
            componentsView && "opacity-100"
        )}>
            {/* 디버깅 정보 */}
            <div className="fixed top-4 left-4 bg-black/50 text-white p-2 rounded text-xs z-50">
                Timeline: {currentIdx} | State: {state} | Completed: {isCompleted.toString()}
            </div>
            
            {renderContent()}
            
            <UspPopupWrapper data={currentUspPool} />
            
            {questionFlag && (
                <QuestionArea 
                    mainText={question || ""} 
                    buttons={(choices || []).reduce((acc, choice) => {
                        acc[choice?.usp || ""] = choice?.description || "";
                        return acc;
                    }, {} as { [key: string]: string })} 
                    defaultComment={dafultComment}
                />
            )}
        </div>
    );
}