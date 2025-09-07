import { useScene } from "@/context/scene-context";
import { BASE_S3_LINK } from "@/constants";
import QuestionArea from "./question-area";
import CommonPopupUI from "../ui/popup_ui/common";
import { useEffect, useState, useMemo, useCallback } from "react";
import UspPopupWrapper from "../ui/usp-popup-wrapper";
import CloneTalkSplit from "../ui/clone-talk-split";
import HudLayer from "../ui/popup_ui/hud-layer";


export default function StepRepeat({ dafultComment }: { dafultComment?: string }) {
    const BASE_URL = BASE_S3_LINK;
    const { stepInfo, setSfxPath, setOnSfxComplete } = useScene();
    const { assets_timeline, question, choices } = stepInfo || {};
    const [questionFlag, setQuestionFlag] = useState(false);
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
    const AUDIO_COMPLETE_DELAY = 500; // 음성요소 완료 후 지연 시간 (ms)
    // 오디오 처리를 위한 별도 useEffect

    // stepInfo가 변경될 때 상태 초기화
    useEffect(() => {
        if (stepInfo) {
            console.log('StepInfo updated, resetting timeline:', stepInfo);
            setCurrentIdx(0);
            setQuestionFlag(false);
            setCurrentUspPool([]);
            
            // 기존 오디오 완료 콜백 초기화
            setOnSfxComplete(undefined);
            
            // assets_timeline이 null인 경우 질문 표시
            if (!stepInfo.assets_timeline && stepInfo.question) {
                setTimeout(() => {
                    setQuestionFlag(true);
                }, QUESTION_SHOW_DELAY);
            }
        }
    }, [stepInfo, setOnSfxComplete]);

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


    // FUNCTION_POPUP 순차 표시 처리 (단일 객체로 수정)
    useEffect(() => {
        if (!assets_timeline) return;
        if (isTimelineFinished) return;
        const item = assets_timeline[currentIdx];
        const asset = item.assets;
        
        if (asset?.type === "FUNCTION_POPUP") {
            const timer = setTimeout(() => {
                setCurrentUspPool(prev => [...prev, {
                    ...asset,
                    description: asset.description,
                }]);
            }, USP_POOL_INTERVAL);
            
            const nextTimer = setTimeout(() => setCurrentIdx(idx => idx + 1), USP_POOL_INTERVAL + USP_POOL_FINAL_DELAY);
            
            return () => {
                clearTimeout(timer);
                clearTimeout(nextTimer);
            };
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
            const asset = item.assets; // 단일 객체
            
            const isAudioAsset = asset?.type === "VEHICLE_SOUND_EFFECT" || asset?.type === "COMPANION_VOICE";
            const isOtherAsset = asset?.type && asset.type !== "VEHICLE_SOUND_EFFECT" && asset.type !== "COMPANION_VOICE";
            
            // 오디오이고 다른 요소가 없으면 수집
            if (isAudioAsset && !isOtherAsset && asset.file_name) {
                audioFiles.push(asset.file_name);
                currentIndex++;
            } else {
                break;
            }
        }
        
        console.log(`Found consecutive audio items from ${startIdx} to ${currentIndex - 1}:`, audioFiles);
        return { audioFiles, endIdx: currentIndex };
    }, [assets_timeline]);

    // 단일 타임라인 처리기 - Race Condition 제거 + 연속 오디오 처리
    useEffect(() => {
        if (!assets_timeline || isTimelineFinished) return;

        const item = assets_timeline[currentIdx];
        console.log(`Processing timeline ${currentIdx}:`, item);
        
        // 🎯 assets가 단일 객체로 변경됨에 따른 수정
        const asset = item.assets; // 단일 객체
        
        const isAudioAsset = asset?.type === "VEHICLE_SOUND_EFFECT" || asset?.type === "COMPANION_VOICE";
        const isVisualAsset = asset?.type === "CLONE_TALKS" || 
                             asset?.type === "DEFAULT_POPUP" || 
                             asset?.type === "TRIGGER_POPUP" ||
                             asset?.type === "HUD_POPUP";
        const isUspPoolAsset = asset?.type === "FUNCTION_POPUP";

        // 진행 조건 결정 (우선순위: Visual > USP_Pool > Audio > Empty)
        if (isVisualAsset) {
            console.log('Timeline has visual elements - waiting for visual completion');
            
            // 비주얼과 함께 오디오도 백그라운드에서 재생 (단일 객체는 백그라운드 오디오 없음)
            setOnSfxComplete(undefined); // Visual 완료를 기다림
        } else if (isUspPoolAsset) {
            console.log('Timeline has USP Pool - handled by separate effect');
            setOnSfxComplete(undefined); // USP Pool effect에서 처리
        } else if (isAudioAsset) {
            console.log('Audio asset detected - checking for consecutive audio sequence');
            
            // 연속된 오디오 아이템들을 찾아서 한 번에 처리
            const { audioFiles, endIdx } = getConsecutiveAudioItems(currentIdx);
            
            if (audioFiles.length > 1) {
                console.log(`Processing consecutive audio sequence (${audioFiles.length} files):`, audioFiles);
                
                // 연속 오디오 완료 콜백 설정
                const capturedEndIdx = endIdx;
                setOnSfxComplete(() => {
                    console.log(`Consecutive audio sequence completed, jumping to timeline ${capturedEndIdx}`);
                    setTimeout(() => {
                        setCurrentIdx(capturedEndIdx);
                    }, AUDIO_COMPLETE_DELAY);
                });
                
                // 모든 오디오 파일을 순차 재생
                setSfxPath(audioFiles);
            } else {
                // 단일 오디오 처리 (기존 로직)
                console.log('Single audio timeline - processing:', asset.file_name, 'currentIdx:', currentIdx);
                
                const capturedIdx = currentIdx;
                const capturedFileName = asset.file_name;
                
                setOnSfxComplete(undefined);
                setSfxPath(null);
                
                setOnSfxComplete(() => {
                    console.log(`Audio COMPLETED for timeline ${capturedIdx} (${capturedFileName}), moving to next timeline after ${AUDIO_COMPLETE_DELAY}ms`);
                    setTimeout(() => {
                        console.log(`Actually moving to next timeline from ${capturedIdx} to ${capturedIdx + 1}`);
                        setCurrentIdx(capturedIdx + 1);
                    }, AUDIO_COMPLETE_DELAY);
                });
                
                setTimeout(() => {
                    console.log('Starting audio playback for:', capturedFileName);
                    setSfxPath([capturedFileName]);
                }, 10);
            }
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
        const asset = item.assets;
        
        const isAudioAsset = asset?.type === "VEHICLE_SOUND_EFFECT" || asset?.type === "COMPANION_VOICE";
        const isVisualAsset = asset?.type === "CLONE_TALKS" || 
                             asset?.type === "DEFAULT_POPUP" || 
                             asset?.type === "TRIGGER_POPUP" ||
                             asset?.type === "FUNCTION_POPUP" ||
                             asset?.type === "HUD_POPUP";

        // 오디오도 비주얼도 없으면 바로 다음으로 진행
        if (!isAudioAsset && !isVisualAsset) {
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
        
        // 🎯 단일 객체로 변경된 assets 처리
        const asset = item.assets;
        
        console.log('Asset type found:', asset?.type);

        // CloneTalk인 경우
        if (asset?.type === "CLONE_TALKS" && "text" in asset) {
            return (
                <CloneTalkSplit
                    text={asset.text || ""}
                    onComplete={() => {
                        setTimeout(() => setCurrentIdx(idx => idx + 1), CLONE_TALK_DELAY);
                    }}
                />
            );
        }

        // FUNCTION_POPUP 처리: effect에서 순차적으로 표시
        if (asset?.type === "FUNCTION_POPUP") {
            return null; // 화면 표시는 별도 effect에서 진행
        }

        // HUD_POPUP 처리: 3초 유지 후 다음 타임라인으로 이동
        if (asset?.type === "HUD_POPUP") {
            const keyName = asset.id ? asset.id.toString().toUpperCase() : asset.type;
            return (
                <HudLayer
                    key={currentIdx}
                    keyName={keyName}
                    onComplete={() => {
                        console.log('HUD_POPUP completed after 3 seconds, moving to next timeline');
                        setTimeout(() => setCurrentIdx(idx => idx + 1), POPUP_COMPLETE_DELAY);
                    }}
                />
            );
        }

        // 팝업 UI 처리 (DEFAULT_POPUP, TRIGGER_POPUP 등)
        if (asset?.type === "DEFAULT_POPUP" || asset?.type === "TRIGGER_POPUP") {
            console.log('Rendering popup:', asset);
            // id가 있으면 id를 keyName으로 사용, 없으면 type 사용
            const keyName = asset.id ? asset.id.toString().toUpperCase() : asset.type;
            return (
                <CommonPopupUI
                    key={currentIdx}
                    keyName={keyName}
                    text={asset.description}
                    description={asset.subtext_popup}
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
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
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