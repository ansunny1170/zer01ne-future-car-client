import { useScene } from "@/context/scene-context";
import { BASE_S3_LINK } from "@/constants";
import QuestionArea from "./question-area";
import CommonPopupUI from "../ui/popup_ui/common";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import UspPopupWrapper from "../ui/usp-popup-wrapper";
import CloneTalkSplit from "../ui/clone-talk-split";
import HudLayer from "../ui/popup_ui/hud-layer";

export default function StepRepeat({ dafultComment }: { dafultComment?: string }) {
    const BASE_URL = BASE_S3_LINK;
    const { stepInfo, setSfxPath, setOnSfxComplete, setPreloadedAudio } = useScene();
    const { assets_timeline, question, choices } = stepInfo || {};
    const [questionFlag, setQuestionFlag] = useState(false);
    // 현재 보여줄 timeline 인덱스
    const [currentIdx, setCurrentIdx] = useState(0);
    const [currentUspPool, setCurrentUspPool] = useState<any[]>([]);
    const preloadedAudio = useRef<Map<string, HTMLAudioElement>>(new Map());
    
    // 타이밍 설정 변수들
    const COMPONENT_SHOW_DELAY = 0; // 컴포넌트 표시 지연 시간 (ms) - timeline 시작 속도
    const QUESTION_SHOW_DELAY = 300; // 질문 표시 지연 시간 (ms)
    const USP_POOL_INTERVAL = 2000; // USP Pool 간격 (ms)
    const USP_POOL_FINAL_DELAY = 1000; // USP Pool 마지막 지연 (ms)
    const CLONE_TALK_DELAY = 1000; // CloneTalk 완료 후 지연 (ms)
    const POPUP_COMPLETE_DELAY = 500; // 팝업 완료 후 지연 (ms)
    const AUDIO_COMPLETE_DELAY = 50; // 음성요소 완료 후 지연 시간 (ms)
    // 오디오 처리를 위한 별도 useEffect

    // 오디오 에셋 preload 함수
    const preloadAudioAssets = useCallback(() => {
        if (!assets_timeline) return;
        
        console.log(`🔄 오디오 에셋 preload 시작`);
        
        // 기존 preload된 오디오들 정리
        preloadedAudio.current.forEach((audio) => {
            audio.pause();
            audio.src = '';
        });
        preloadedAudio.current.clear();
        
        // 모든 타임라인에서 오디오 파일 수집
        const audioFiles = new Set<string>();
        assets_timeline.forEach((item) => {
            const asset = item.assets;
            if ((asset?.type === "VEHICLE_SOUND_EFFECT" || asset?.type === "COMPANION_VOICE") && asset.file_name) {
                audioFiles.add(asset.file_name);
            }
        });
        
        // 각 오디오 파일 preload
        audioFiles.forEach((fileName) => {
            const audio = new Audio(`${BASE_URL}/${fileName}`);
            audio.preload = 'auto';
            audio.volume = 1.0;
            
            // 🔧 preload 시 자동 재생 방지
            audio.muted = true;
            
            audio.addEventListener('canplaythrough', () => {
                // 🔧 preload 완료 후에도 mute 유지 (실제 재생시에만 unmute)
                console.log(`✅ 오디오 preload 완료: ${fileName}`);
            });
            
            audio.addEventListener('error', (error) => {
                console.log(`❌ 오디오 preload 실패: ${fileName}`, error);
            });
            
            preloadedAudio.current.set(fileName, audio);
        });
        
        console.log(`📝 총 ${audioFiles.size}개 오디오 파일 preload 시작: [${Array.from(audioFiles).join(', ')}]`);
        
        // Context에 preloaded audio 공유
        setPreloadedAudio(preloadedAudio.current);
    }, [assets_timeline, BASE_URL, setPreloadedAudio]);

    // stepInfo가 변경될 때 상태 초기화 및 오디오 preload
    useEffect(() => {
        if (stepInfo) {
            setCurrentIdx(0);
            setQuestionFlag(false);
            setCurrentUspPool([]);
            
            // 기존 오디오 완료 콜백 초기화
            setOnSfxComplete(undefined);
            
            // 오디오 에셋 preload
            preloadAudioAssets();
            
            // assets_timeline이 null인 경우에만 질문 표시
            // step 2에서는 타임라인이 비어있어도 바로 질문을 표시하지 않음
            if (!stepInfo.assets_timeline && stepInfo.question && stepInfo.step !== 2) {
                setTimeout(() => {
                    setQuestionFlag(true);
                }, QUESTION_SHOW_DELAY);
            }
        }
    }, [stepInfo, setOnSfxComplete, preloadAudioAssets]);

    // timeline 처리 완료 여부
    const isTimelineFinished = useMemo(() => {
        if (!assets_timeline) return true;
        return currentIdx >= assets_timeline.length;
    }, [assets_timeline, currentIdx]);

    // 타임라인이 끝났을 때 questionFlag를 true로 설정
    useEffect(() => {
        if (isTimelineFinished && !questionFlag) {
            // step 2에서는 더 긴 지연시간 적용
            const delay = stepInfo?.step === 2 ? QUESTION_SHOW_DELAY + 500 : 0;
            setTimeout(() => {
                setQuestionFlag(true);
            }, delay);
        }
    }, [isTimelineFinished, questionFlag, stepInfo]);


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
            
            // 🔧 오디오이고 다른 요소가 없으면 수집 (preload 성공한 파일만)
            if (isAudioAsset && !isOtherAsset && asset.file_name) {
                const preloadedAudioFile = preloadedAudio.current.get(asset.file_name);
                if (preloadedAudioFile && !preloadedAudioFile.error) {
                    audioFiles.push(asset.file_name);
                    console.log(`🎵 연속 오디오 수집: ${asset.file_name} (인덱스: ${currentIndex})`);
                } else {
                    console.log(`⚠️ 오디오 로드 실패로 건너뛰기: ${asset.file_name} (인덱스: ${currentIndex})`);
                }
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
            
            // 비주얼과 함께 오디오도 백그라운드에서 재생 (단일 객체는 백그라운드 오디오 없음)
            setOnSfxComplete(undefined); // Visual 완료를 기다림
        } else if (isUspPoolAsset) {
            setOnSfxComplete(undefined); // USP Pool effect에서 처리
        } else if (isAudioAsset) {
            // 🔧 오디오 에셋은 별도 useEffect에서 처리하므로 여기서는 스킵
            console.log(`🎵 오디오 에셋 스킵 - 별도 useEffect에서 처리: ${asset?.type} (인덱스: ${currentIdx})`);
            setOnSfxComplete(undefined);
            return;
        } else {
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
            const timer = setTimeout(() => setCurrentIdx(idx => idx + 1), AUDIO_COMPLETE_DELAY);
            return () => clearTimeout(timer);
        }
    }, [assets_timeline, currentIdx, isTimelineFinished]);

    // 오디오 에셋 처리 전용 useEffect
    useEffect(() => {
        if (!assets_timeline || isTimelineFinished) return;

        const item = assets_timeline[currentIdx];
        const asset = item.assets;
        
        const isAudioAsset = asset?.type === "VEHICLE_SOUND_EFFECT" || asset?.type === "COMPANION_VOICE";
        
        if (isAudioAsset && asset.file_name) {
            console.log(`🎵 오디오 재생 시작: ${asset.type} (인덱스: ${currentIdx})`);
            
            // 오디오 재생 시작
            setSfxPath([asset.file_name]);
            
            // preloaded audio에서 실제 duration 가져오기, 없으면 추정값 사용
            const preloadedAudioFile = preloadedAudio.current.get(asset.file_name);
            const actualDuration = preloadedAudioFile?.duration ? preloadedAudioFile.duration * 1000 : 
                                  (asset.file_name.includes('aw') || asset.file_name.includes('am') ? 3000 : 2000);
            
            console.log(`⏰ 오디오 길이: ${actualDuration}ms (${asset.file_name})`);
            
            // 오디오 길이만큼 대기 후 다음 인덱스로 이동
            const timer = setTimeout(() => {
                console.log(`✅ 오디오 완료 - 다음 인덱스로: ${currentIdx + 1}`);
                setSfxPath(null); // 오디오 정리
                setCurrentIdx(idx => idx + 1);
            }, actualDuration);
            
            // cleanup function
            return () => {
                clearTimeout(timer);
                setSfxPath(null);
            };
        }
    }, [assets_timeline, currentIdx, isTimelineFinished, setSfxPath]);

    // 현재 보여줄 콘텐츠 결정
    const renderContent = () => {  
        if (!assets_timeline || isTimelineFinished) {
            // 모든 timeline 처리가 끝나면 null 반환 (questionFlag로 별도 렌더링)
            return null;
        }

        const item = assets_timeline[currentIdx];
        
        // 🎯 단일 객체로 변경된 assets 처리
        const asset = item.assets;
        
        // 🔧 오디오 에셋일 때는 빈 div 렌더링 (재생과 타이밍은 useEffect에서 처리)
        const isAudioAsset = asset?.type === "VEHICLE_SOUND_EFFECT" || asset?.type === "COMPANION_VOICE";
        if (isAudioAsset) {
            console.log(`🎵 오디오 에셋 렌더링 - 빈 div 표시: ${asset.type} (인덱스: ${currentIdx})`);
            return <div className="w-full h-full" />; // 빈 div 렌더링
        }
        

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
                        setTimeout(() => setCurrentIdx(idx => idx + 1), POPUP_COMPLETE_DELAY);
                    }}
                />
            );
        }

        // 팝업 UI 처리 (DEFAULT_POPUP, TRIGGER_POPUP 등)
        if (asset?.type === "DEFAULT_POPUP" || asset?.type === "TRIGGER_POPUP") {
            // id가 있으면 id를 keyName으로 사용, 없으면 type 사용
            const keyName = asset.id ? asset.id.toString().toUpperCase() : asset.type;
            return (
                <CommonPopupUI
                    key={currentIdx}
                    keyName={keyName}
                    text={asset.description}
                    description={asset.subtext_popup}
                    onComplete={() => {
                        setTimeout(() => setCurrentIdx(idx => idx + 1), POPUP_COMPLETE_DELAY);
                    }}
                />
            );
        }

        // 처리되지 않은 경우 (오디오나 비주얼 요소가 모두 없음)
        
        // 즉시 상태 업데이트 대신 useEffect에서 처리하도록 변경
        return null;
    };



    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="fixed inset-0 h-1/3 bg-[linear-gradient(to_top,rgba(0,0,0,0)_0%,rgba(0,0,0,0.35)_100%)]"/>

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