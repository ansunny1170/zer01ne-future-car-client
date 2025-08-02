import { useEffect, useRef, useState } from "react";
import QuestionArea from "./question-area";
import { useScene } from "@/context/scene-context";
import CloneTalk from "../ui/clone-talk";
import PopupUiArray from "../ui/popup_ui/popup-ui-array";

export default function StepRepeat() {
    const { stepInfo } = useScene();    
    const { question, choices, assets_timeline } = stepInfo || {};
    const [questionFlag, setQuestionFlag] = useState(false);
    const [currentTimelineIndex, setCurrentTimelineIndex] = useState(0);
    // parallel item 완료 여부 추적
    const [cloneDone, setCloneDone] = useState(false);
    const [popupDone, setPopupDone] = useState(false);

    // CloneTalk 완료 핸들러
    const handleCloneTalkComplete = () => {
        const currentItem = assets_timeline?.[currentTimelineIndex];
        if (currentItem?.parallel) {
            setCloneDone(true);
            // parallel 상황에서 두 컴포넌트가 모두 끝난 경우에만 다음 타임라인으로 이동
            if (!currentItem.assets.some(asset => asset.type !== 'CLONE_TALKS') || popupDone) {
                setCurrentTimelineIndex(prev => prev + 1);
            }
        } else {
            setCurrentTimelineIndex(prev => prev + 1);
        }
    };

    // PopupUiArray 완료 핸들러
    const handlePopupComplete = () => {
        const currentItem = assets_timeline?.[currentTimelineIndex];
        if (currentItem?.parallel) {
            setPopupDone(true);
            if (!currentItem.assets.some(asset => asset.type === 'CLONE_TALKS') || cloneDone) {
                setCurrentTimelineIndex(prev => prev + 1);
            }
        } else {
            setCurrentTimelineIndex(prev => prev + 1);
        }
    };

    // 현재 타임라인 아이템 가져오기
    const currentTimelineItem = assets_timeline?.[currentTimelineIndex];

    // 타임라인 인덱스가 바뀔 때 parallel 완료 플래그 초기화
    useEffect(() => {
        setCloneDone(false);
        setPopupDone(false);
    }, [currentTimelineIndex]);

    // 타임라인 완료 체크
    useEffect(() => {
        if (!assets_timeline?.length) {
            setQuestionFlag(true);
            return;
        }

        if (currentTimelineIndex >= assets_timeline.length) {
            setQuestionFlag(true);
        }
    }, [currentTimelineIndex, assets_timeline]);

    // 현재 타임라인 아이템이 없으면 질문만 표시
    if (!currentTimelineItem && !questionFlag) return null;

    return (
        <div className="absolute inset-0 text-amber-50 text-xl flex flex-col items-center justify-center text-center">
            {currentTimelineItem && (
                (() => {
                    const hasClone = currentTimelineItem.assets.some(asset => asset.type === 'CLONE_TALKS');
                    const nonCloneAssets = currentTimelineItem.assets.filter(asset => asset.type !== 'CLONE_TALKS');

                    if (currentTimelineItem.parallel) {
                        return (
                            <>
                                {hasClone && (
                                    <CloneTalk
                                        text={currentTimelineItem.assets.find(asset => asset.type === 'CLONE_TALKS')?.text || ""}
                                        onComplete={handleCloneTalkComplete}
                                    />
                                )}
                                {nonCloneAssets.length > 0 && (
                                    <PopupUiArray
                                        assets_timeline={[{ ...currentTimelineItem, assets: nonCloneAssets }]}
                                        onComplete={handlePopupComplete}
                                    />
                                )}
                            </>
                        );
                    }

                    // parallel이 아닌 경우 기존 로직 유지
                    if (hasClone) {
                        return (
                            <CloneTalk
                                text={currentTimelineItem.assets.find(asset => asset.type === 'CLONE_TALKS')?.text || ""}
                                onComplete={handleCloneTalkComplete}
                            />
                        );
                    }

                    return (
                        <PopupUiArray 
                            assets_timeline={[currentTimelineItem]}
                            onComplete={handlePopupComplete}
                        />
                    );
                })()
            )}

            <div className="text-2xl">
                {questionFlag && (
                    <QuestionArea 
                        mainText={question || ""} 
                        buttons={(choices || []).reduce((acc, choice) => {
                            acc[choice?.usp || ""] = choice?.description || "";
                            return acc;
                        }, {} as { [key: string]: string })} 
                    />
                )}
            </div>
        </div>
    );
}