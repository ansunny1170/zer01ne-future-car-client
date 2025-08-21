import { useScene } from "@/context/scene-context";
import { BASE_S3_LINK } from "@/constants";
import QuestionArea from "./question-area";
import CommonPopupUI from "../ui/popup_ui/common";
import { useEffect, useState, useMemo, useCallback } from "react";
import { cn } from "@/utils/cn";
import UspPopupWrapper from "../ui/usp-popup-wrapper";
import CloneTalkSplit from "../ui/clone-talk-split";


export default function StepRepeat({ dafultComment }: { dafultComment?: string }) {
    const BASE_URL = BASE_S3_LINK;
    const { stepInfo, setSfxPath, setOnSfxComplete } = useScene();
    const { assets_timeline, question, choices } = stepInfo || {};
    const [questionFlag, setQuestionFlag] = useState(false);
    const [componentsView, setComponentsView] = useState(false);
    // 현재 보여줄 timeline 인덱스
    const [currentIdx, setCurrentIdx] = useState(0);
    const [currentUspPool, setCurrentUspPool] = useState<any[]>([]);
    
    // 타이밍 설정 변수들
    const COMPONENT_SHOW_DELAY = 0; // 컴포넌트 표시 지연 시간 (ms) - timeline 시작 속도
    const QUESTION_SHOW_DELAY = 300; // 질문 표시 지연 시간 (ms)
    const USP_POOL_INTERVAL = 2000; // USP Pool 간격 (ms)
    const USP_POOL_FINAL_DELAY = 1000; // USP Pool 마지막 지연 (ms)
    const CLONE_TALK_DELAY = 1000; // CloneTalk 완료 후 지연 (ms)
    const POPUP_COMPLETE_DELAY = 500; // 팝업 완료 후 지연 (ms)
    const AUDIO_COMPLETE_DELAY = 1000; // 음성요소 완료 후 지연 시간 (ms)
    // 오디오 처리를 위한 별도 useEffect

    // stepInfo가 변경될 때 상태 초기화
    useEffect(() => {
        if (stepInfo) {
            console.log('StepInfo updated, resetting timeline:', stepInfo);
            setCurrentIdx(0);
            setQuestionFlag(false);
            setCurrentUspPool([]);
            setComponentsView(false);
            // 새로운 stepInfo가 오면 설정된 시간 후에 표시
            setTimeout(() => {
                setComponentsView(true);
            }, COMPONENT_SHOW_DELAY);
            
            // assets_timeline이 null인 경우 질문 표시
            if (!stepInfo.assets_timeline && stepInfo.question) {
                setTimeout(() => {
                    setQuestionFlag(true);
                }, QUESTION_SHOW_DELAY);
            }
        }
    }, [stepInfo]);

    // timeline 처리 완료 여부
    const isTimelineFinished = useMemo(() => {
        if (!assets_timeline) return true;
        return currentIdx >= assets_timeline.length;
    }, [assets_timeline, currentIdx]);

    // 타임라인이 끝났을 때 questionFlag를 true로 설정
    useEffect(() => {
        if (isTimelineFinished && !questionFlag) {
            setQuestionFlag(true);
        }
    }, [isTimelineFinished, questionFlag]);


    // FUNCTION_USP_POOL 순차 표시 처리 (parallel true 포함)
    useEffect(() => {
        if (!assets_timeline) return;
        if (isTimelineFinished) return;
        const item = assets_timeline[currentIdx];
        const uspPoolAssets = item.assets.filter(asset => asset.type === "FUNCTION_USP_POOL");
        if (uspPoolAssets.length > 0) {
            const timers: ReturnType<typeof setTimeout>[] = [];
            uspPoolAssets.forEach((asset, index) => {
                const timer = setTimeout(() => {
                    setCurrentUspPool(prev => [...prev, {
                        ...(asset as any),
                        description: (asset as any).description,
                    }]);
                }, index * USP_POOL_INTERVAL);
                timers.push(timer);
            });
            const totalDuration = uspPoolAssets.length * USP_POOL_INTERVAL + USP_POOL_FINAL_DELAY;
            const nextTimer = setTimeout(() => setCurrentIdx(idx => idx + 1), totalDuration);
            timers.push(nextTimer);
            return () => timers.forEach(clearTimeout);
        }
    }, [assets_timeline, currentIdx, isTimelineFinished]);

    // 연속된 오디오 아이템들을 하나로 묶어서 처리하는 함수
    const getConsecutiveAudioItems = useCallback((startIdx: number) => {
        if (!assets_timeline) return { audioFiles: [], endIdx: startIdx };
        
        const audioFiles: string[] = [];
        let currentIndex = startIdx;
        
        // 현재 인덱스부터 연속된 오디오 전용 아이템들을 수집
        while (currentIndex < assets_timeline.length) {
            const item = assets_timeline[currentIndex];
            
            const audioAssets = item.assets.filter(asset => 
                asset.type === "VEHICLE_SOUND_EFFECT" || asset.type === "COMPANION_VOICE"
            );
            
            const hasOtherAssets = item.assets.some(asset => 
                asset.type !== "VEHICLE_SOUND_EFFECT" && asset.type !== "COMPANION_VOICE"
            );
            
            // 오디오가 있고 다른 요소가 없으면 수집
            if (audioAssets.length > 0 && !hasOtherAssets) {
                audioFiles.push(...audioAssets.map(asset => asset.file_name));
                currentIndex++;
            } else {
                break;
            }
        }
        
        return { audioFiles, endIdx: currentIndex };
    }, [assets_timeline]);

    // 단일 타임라인 처리기 - Race Condition 제거 + 연속 오디오 처리
    useEffect(() => {
        if (!assets_timeline || isTimelineFinished) return;

        const item = assets_timeline[currentIdx];
        console.log(`Processing timeline ${currentIdx}:`, item);
        
        const audioAssets = item.assets.filter(asset => 
            asset.type === "VEHICLE_SOUND_EFFECT" || asset.type === "COMPANION_VOICE"
        );

        const visualAssets = item.assets.filter(asset => 
            asset.type === "CLONE_TALKS" || 
            asset.type === "DEFAULT_POPUP" || 
            asset.type === "TRIGGER_POPUP"
        );
        
        const uspPoolAssets = item.assets.filter(asset => asset.type === "FUNCTION_USP_POOL");

        // 진행 조건 결정 (우선순위: Visual > USP_Pool > Audio > Empty)
        if (visualAssets.length > 0) {
            console.log('Timeline has visual elements - waiting for visual completion');
            
            // 비주얼과 함께 오디오도 백그라운드에서 재생
            if (audioAssets.length > 0) {
                const audioFiles = audioAssets.map(asset => asset.file_name);
                console.log('Starting background audio for visual timeline', currentIdx, ':', audioFiles);
                setSfxPath(audioFiles);
            }
            
            setOnSfxComplete(undefined); // Visual 완료를 기다림
        } else if (uspPoolAssets.length > 0) {
            console.log('Timeline has USP Pool - handled by separate effect');
            setOnSfxComplete(undefined); // USP Pool effect에서 처리
        } else if (audioAssets.length > 0) {
            console.log('Timeline is audio-only - checking for consecutive audio items');
            
            // 연속된 오디오 아이템들을 하나로 묶어서 처리
            const { audioFiles, endIdx } = getConsecutiveAudioItems(currentIdx);
            console.log(`Found consecutive audio items from ${currentIdx} to ${endIdx - 1}:`, audioFiles);
            
            setSfxPath(audioFiles);
            setOnSfxComplete(() => {
                console.log(`Consecutive audio completed, jumping to timeline ${endIdx}`);
                setTimeout(() => setCurrentIdx(endIdx), AUDIO_COMPLETE_DELAY);
            });
        } else {
            console.log('Timeline is empty - moving immediately');
            // 빈 타임라인은 빈 아이템 처리 useEffect에서 처리
            setOnSfxComplete(undefined);
        }
    }, [assets_timeline, currentIdx, isTimelineFinished, setSfxPath, setOnSfxComplete, getConsecutiveAudioItems]);

    // 빈 아이템 처리 (오디오도 비주얼도 없는 경우)
    useEffect(() => {
        if (!assets_timeline || isTimelineFinished) return;

        const item = assets_timeline[currentIdx];
        const audioAssets = item.assets.filter(asset => 
            asset.type === "VEHICLE_SOUND_EFFECT" || asset.type === "COMPANION_VOICE"
        );

        const hasVisualElements = item.assets.some(asset => 
            asset.type === "CLONE_TALKS" || 
            asset.type === "DEFAULT_POPUP" || 
            asset.type === "TRIGGER_POPUP" ||
            asset.type === "FUNCTION_USP_POOL"
        );

        // 오디오도 비주얼도 없으면 바로 다음으로 진행
        if (audioAssets.length === 0 && !hasVisualElements) {
            console.log('Empty timeline item, moving to next');
            const timer = setTimeout(() => setCurrentIdx(idx => idx + 1), AUDIO_COMPLETE_DELAY);
            return () => clearTimeout(timer);
        }
    }, [assets_timeline, currentIdx, isTimelineFinished]);

    // 현재 보여줄 콘텐츠 결정
    const renderContent = () => {  
        if (!assets_timeline || isTimelineFinished) {
            // 모든 timeline 처리가 끝나면 null 반환 (questionFlag로 별도 렌더링)
            return null;
        }

        const item = assets_timeline[currentIdx];
        console.log('Rendering timeline item:', currentIdx, item);
        
        // 각 asset 타입 확인
        const cloneAsset = item.assets.find(asset => asset.type === "CLONE_TALKS");
        const popupAsset = item.assets.find(asset => ["DEFAULT_POPUP", "TRIGGER_POPUP"].includes(asset.type));
        const uspPoolAssets = item.assets.filter(asset => asset.type === "FUNCTION_USP_POOL");
        
        console.log('Asset types found:', {
            clone: !!cloneAsset,
            popup: !!popupAsset,
            uspPool: uspPoolAssets.length
        });

        // CloneTalk이 포함된 경우
        if (cloneAsset && "text" in (cloneAsset as any)) {
            return (
                <CloneTalkSplit
                    text={(cloneAsset as any).text || ""}
                    onComplete={() => {
                        setTimeout(() => setCurrentIdx(idx => idx + 1), CLONE_TALK_DELAY);
                    }}
                />
            );
        }

        // FUNCTION_USP_POOL 처리: effect에서 순차적으로 표시
        if (uspPoolAssets.length > 0) {
            return null; // 화면 표시는 별도 effect에서 진행
        }

        // 팝업 UI 처리 (DEFAULT_POPUP, TRIGGER_POPUP 등)
        if (popupAsset) {
            console.log('Rendering popup:', popupAsset);
            // id가 있으면 id를 keyName으로 사용, 없으면 type 사용
            const keyName = (popupAsset as any).id ? (popupAsset as any).id.toUpperCase() : (popupAsset as any).type;
            return (
                <CommonPopupUI
                    key={currentIdx}
                    keyName={keyName}
                    text={(popupAsset as any).description}
                    description={(popupAsset as any).subtext_usp_pool}
                    onComplete={() => {
                        console.log('Popup completed, moving to next timeline');
                        setTimeout(() => setCurrentIdx(idx => idx + 1), POPUP_COMPLETE_DELAY);
                    }}
                />
            );
        }

        // 처리되지 않은 경우 (오디오나 비주얼 요소가 모두 없음)
        console.log('No content found, should move to next timeline');
        
        // 즉시 상태 업데이트 대신 useEffect에서 처리하도록 변경
        return null;
    };



    return (
        <div className={cn("absolute inset-0 flex flex-col items-center justify-center text-center opacity-0 transition-all duration-300", componentsView && "opacity-100") }>
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
