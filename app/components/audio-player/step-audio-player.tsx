import { BASE_S3_LINK } from "@/constants";
import { useScene } from "@/context/scene-context";
import { useEffect, useRef, useState, useCallback } from "react";

export default function StepAudioPlayer() {
    // 키보드 아무키나 누르면 audio태그 활성화
    const [isSfxActive, setIsSfxActive] = useState(false);
    const [isBgmActive, setIsBgmActive] = useState(false);
    const [currentVolume, setCurrentVolume] = useState(0.3); // 초기 볼륨 40%
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const bgmRef = useRef<HTMLAudioElement>(null);
    const BASE_URL = BASE_S3_LINK;
    // 현재 재생할 오디오 경로
    const { bgmPath, sfxPath, onSfxComplete, stepInfo } = useScene();
    useEffect(() => {
        const handleKeyDown = () => {
            setIsSfxActive(true);
            setIsBgmActive(true);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // stepInfo?.step 조건에 따른 볼륨 조절
    useEffect(() => {
        const targetVolume = (!stepInfo?.step || stepInfo.step < 2) ? 0.3 : 0.85; // step 없거나 2 미만이면 30%, 나머지는 85%
        
        if (targetVolume === currentVolume) return;
        
        // 서서히 볼륨 변경 (0.5초에 걸쳐)
        const startVolume = currentVolume;
        const volumeDiff = targetVolume - startVolume;
        const duration = 500; // 500ms
        const steps = 20; // 20단계로 나누어 부드럽게 변경
        const stepDuration = duration / steps;
        
        let currentStep = 0;
        const volumeInterval = setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;
            const newVolume = startVolume + (volumeDiff * progress);
            
            setCurrentVolume(newVolume);
            
            // BGM 볼륨 적용
            if (bgmRef.current) {
                bgmRef.current.volume = newVolume;
            }
            
            if (currentStep >= steps) {
                clearInterval(volumeInterval);
                setCurrentVolume(targetVolume);
            }
        }, stepDuration);
        
        return () => clearInterval(volumeInterval);
    }, [stepInfo?.step, currentVolume]);

    // 볼륨 변경 시 재생 중인 BGM 볼륨만 업데이트
    useEffect(() => {
        if (bgmRef.current && !bgmRef.current.paused) {
            bgmRef.current.volume = currentVolume;
        }
    }, [currentVolume]);
    useEffect(() => {
        if (isBgmActive && bgmRef.current && bgmPath) {
            bgmRef.current.load();
            bgmRef.current.volume = currentVolume; // 현재 동적 볼륨으로 설정
            
            // canplaythrough 이벤트를 기다린 후 재생
            const handleCanPlayThrough = () => {
                if (bgmRef.current) {
                    bgmRef.current.play().catch(error => {
                    });
                }
                bgmRef.current?.removeEventListener('canplaythrough', handleCanPlayThrough);
            };
            
            bgmRef.current.addEventListener('canplaythrough', handleCanPlayThrough);
            
            // 정리 함수
            return () => {
                bgmRef.current?.removeEventListener('canplaythrough', handleCanPlayThrough);
            };
        }
    }, [isBgmActive, bgmPath]);

    // sfxpath 배열 바뀌면 하나씩 순차적으로 재생할 것. 중간에 200ms 간격으로 재생.
    // 순차 재생 함수
    const playSequential = useCallback((list: string[], idx: number) => {
        console.log(`🎶 playSequential 호출 - idx: ${idx}/${list.length}, 파일: ${list[idx] || 'none'}`);
        
        if (idx >= list.length) {
            // 모든 재생 완료
            console.log(`🏁 모든 오디오 재생 완료 - onSfxComplete 콜백 호출`);
            if (onSfxComplete) {
                onSfxComplete();
            }
            return;
        }
        
        const fileName = list[idx];
        console.log(`▶️ 오디오 재생 시작: ${fileName}`);
        
        // 새로운 Audio 객체 생성 (preload와 별개로)
        const audioUrl = `${BASE_URL}/${fileName}`;
        audioRef.current = new Audio(audioUrl);
        audioRef.current.volume = 1.0; // SFX는 항상 최대 볼륨
        audioRef.current.preload = 'auto';
        
        audioRef.current.onerror = (error) => {
            console.log(`❌ 오디오 로드 에러: ${fileName}`, error);
        };
        
        // canplaythrough 이벤트를 기다린 후 재생 (즉시 재생 보장)
        audioRef.current.addEventListener('canplaythrough', () => {
            console.log(`🎵 오디오 로드 완료 - 재생 시작: ${fileName}`);
            audioRef.current?.play().catch(error => {
                console.log(`❌ 오디오 재생 에러: ${fileName}`, error);
            });
        });
        
        audioRef.current.onended = () => {
            console.log(`✅ 오디오 재생 완료: ${fileName} - 다음 파일로 진행`);
            playSequential(list, idx + 1);
        };
        
        // 즉시 로드 시작
        audioRef.current.load();
    }, [BASE_URL, onSfxComplete]);

    useEffect(() => {
        console.log(`🔄 StepAudioPlayer useEffect 실행 - isSfxActive: ${isSfxActive}, sfxPath: [${(sfxPath || []).join(', ')}]`);
        if (!isSfxActive) {
            console.log(`⚠️ isSfxActive가 false라서 오디오 처리하지 않음`);
            return;
        }
        if (!sfxPath || sfxPath.length === 0) {
            console.log(`⚠️ sfxPath가 비어있어서 오디오 처리하지 않음`);
            return;
        }
        
        console.log(`🎵 StepAudioPlayer - 새로운 sfxPath 배열: [${sfxPath.join(', ')}]`);
        
        // 기존 오디오가 재생 중이면 완료될 때까지 기다린 후 새로운 배열 재생
        if (audioRef.current && !audioRef.current.paused) {
            console.log(`⏳ 기존 오디오 완료 대기 중... 완료 후 새로운 배열 재생`);
            const currentAudio = audioRef.current;
            const originalOnEnded = currentAudio.onended;
            
            currentAudio.onended = () => {
                // 기존 onended 처리 (원래 단일 파일의 완료 콜백)
                if (originalOnEnded) {
                    console.log(`🔄 기존 onended 콜백 실행`);
                    originalOnEnded.call(currentAudio, new Event('ended'));
                }
                
                // 새 배열 재생 (첫 번째 파일은 이미 재생 완료되었으므로 1번 인덱스부터)
                console.log(`🎶 기존 오디오 완료 - 나머지 배열 재생: [${sfxPath.slice(1).join(', ')}]`);
                if (sfxPath.length > 1) {
                    playSequential(sfxPath, 1);
                } else {
                    console.log(`✅ 단일 파일 재생 완료`);
                }
            };
            return; // 현재 재생 중이므로 바로 리턴
        }
        
        playSequential(sfxPath, 0);
        
        // cleanup: 재생 중인 오디오 stop
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [sfxPath, isSfxActive, playSequential]);
    
    return (
        // bgtm
        <div>
            {bgmPath && isBgmActive && (
              <audio key={bgmPath} ref={bgmRef} src={`${BASE_URL}/${bgmPath}`} autoPlay loop />
            )}
            {/* sfx */}
            
        </div>
    );
}


