import { useState, useEffect, useCallback, useRef } from 'react';
import { useScene } from '@/context/scene-context';

type TimelineState = 'IDLE' | 'PROCESSING_AUDIO' | 'PROCESSING_VISUAL' | 'WAITING_COMPLETION' | 'COMPLETED';

interface TimelineItem {
  assets: any;
}

interface ProcessorResult {
  type: 'AUDIO' | 'VISUAL' | 'USP_POOL' | 'EMPTY';
  completion: Promise<void>;
}

export function useTimelineProcessor() {
  const { stepInfo, setSfxPath, setOnSfxComplete } = useScene();
  const { assets_timeline } = stepInfo || {};
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [state, setState] = useState<TimelineState>('IDLE');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const completionResolveRef = useRef<(() => void) | null>(null);
  
  // 타임라인 아이템 분석기
  const analyzeTimelineItem = useCallback((item: TimelineItem): ProcessorResult => {
    // 🎯 단일 객체로 변경된 assets 처리
    const asset = item.assets;
    
    const isAudioAsset = asset?.type === "VEHICLE_SOUND_EFFECT" || asset?.type === "COMPANION_VOICE";
    const isVisualAsset = asset?.type === "CLONE_TALKS" || 
                         asset?.type === "DEFAULT_POPUP" || 
                         asset?.type === "TRIGGER_POPUP";
    const isUspPoolAsset = asset?.type === "FUNCTION_USP_POOL";
    
    // 우선순위: Visual > USP_Pool > Audio > Empty
    if (isVisualAsset) {
      return {
        type: 'VISUAL',
        completion: createVisualCompletion(asset, null) // 단일 객체이므로 별도 오디오 없음
      };
    } else if (isUspPoolAsset) {
      return {
        type: 'USP_POOL', 
        completion: createUspPoolCompletion(asset)
      };
    } else if (isAudioAsset) {
      return {
        type: 'AUDIO',
        completion: createAudioCompletion(asset)
      };
    } else {
      return {
        type: 'EMPTY',
        completion: Promise.resolve()
      };
    }
  }, []);
  
  // Audio 완료 Promise 생성 - Direct Audio Control
  const createAudioCompletion = useCallback((audioAsset: any): Promise<void> => {
    return new Promise((resolve) => {
      const audioFiles = audioAsset?.file_name ? [audioAsset.file_name] : [];
      console.log('Starting direct audio processing:', audioFiles);
      
      // Context를 통해 오디오 재생 시작
      setSfxPath(audioFiles);
      
      // 하지만 완료는 직접 계산된 시간으로 처리 (더 안정적)
      const estimatedDuration = 2000; // 단일 파일당 평균 2초로 가정
      setTimeout(() => {
        console.log('Audio estimated completion');
        resolve();
      }, estimatedDuration);
      
      // Fallback: Context 콜백도 설정 (더 정확한 완료 시점)
      setOnSfxComplete(() => {
        console.log('Audio actual completion via context');
        resolve();
      });
    });
  }, [setSfxPath, setOnSfxComplete]);
  
  // Visual 완료 Promise 생성 (단일 객체)
  const createVisualCompletion = useCallback((visualAsset: any, audioAsset: any): Promise<void> => {
    return new Promise((resolve) => {
      // 단일 객체이므로 별도의 백그라운드 오디오 없음
      setOnSfxComplete(undefined); // Visual 완료를 기다림
      
      // Visual 완료 콜백 설정
      completionResolveRef.current = resolve;
    });
  }, [setOnSfxComplete]);
  
  // USP Pool 완료 Promise 생성
  const createUspPoolCompletion = useCallback((uspPoolAsset: any): Promise<void> => {
    return new Promise((resolve) => {
      // 단일 USP Pool 객체 처리
      const totalDuration = 2000 + 1000; // 단일 객체 기본 시간
      setTimeout(resolve, totalDuration);
    });
  }, []);
  
  // Visual 완료 트리거 (외부에서 호출)
  const triggerVisualCompletion = useCallback(() => {
    if (completionResolveRef.current) {
      completionResolveRef.current();
      completionResolveRef.current = null;
    }
  }, []);
  
  // 메인 타임라인 프로세서
  const processCurrentItem = useCallback(async () => {
    if (!assets_timeline || currentIdx >= assets_timeline.length) {
      setState('COMPLETED');
      return;
    }
    
    if (isProcessing) return;
    
    setIsProcessing(true);
    setState('PROCESSING_AUDIO');
    
    const item = assets_timeline[currentIdx];
    const result = analyzeTimelineItem(item);
    
    console.log(`Processing timeline ${currentIdx}:`, { type: result.type, item });
    
    try {
      if (result.type === 'VISUAL') {
        setState('PROCESSING_VISUAL');
      } else if (result.type === 'AUDIO') {
        setState('PROCESSING_AUDIO');
      }
      
      setState('WAITING_COMPLETION');
      await result.completion;
      
      console.log(`Timeline ${currentIdx} completed`);
      setCurrentIdx(prev => prev + 1);
      
    } catch (error) {
      console.error('Timeline processing error:', error);
      setCurrentIdx(prev => prev + 1); // 에러 시에도 진행
    } finally {
      setIsProcessing(false);
      setState('IDLE');
    }
  }, [assets_timeline, currentIdx, isProcessing, analyzeTimelineItem]);
  
  // 타임라인 시작 트리거
  useEffect(() => {
    if (assets_timeline && !isProcessing && state === 'IDLE') {
      processCurrentItem();
    }
  }, [assets_timeline, currentIdx, isProcessing, state, processCurrentItem]);
  
  // stepInfo 변경 시 리셋
  useEffect(() => {
    if (stepInfo) {
      setCurrentIdx(0);
      setState('IDLE');
      setIsProcessing(false);
      completionResolveRef.current = null;
    }
  }, [stepInfo]);
  
  return {
    currentIdx,
    state,
    isProcessing,
    isCompleted: state === 'COMPLETED',
    triggerVisualCompletion,
    currentItem: assets_timeline?.[currentIdx] || null
  };
}