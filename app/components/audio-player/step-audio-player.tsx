import { BASE_S3_LINK } from "@/constants";
import { useScene } from "@/context/scene-context";
import { useEffect, useRef, useState, useCallback } from "react";

export default function StepAudioPlayer() {
    // 키보드 아무키나 누르면 audio태그 활성화
    const [isSfxActive, setIsSfxActive] = useState(false);
    const [isBgmActive, setIsBgmActive] = useState(false);
    const [currentVolume, setCurrentVolume] = useState(0.4); // 초기 볼륨 40%
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

    // stepInfo?.step 유무에 따른 볼륨 조절
    useEffect(() => {
        const targetVolume = stepInfo?.step ? 0.85 : 0.4; // step 있으면 85%, 없으면 40%
        
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
                        console.error('BGM play error:', error);
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
        if (idx >= list.length) {
            // 모든 재생 완료
            console.log('All audio completed, calling onSfxComplete');
            if (onSfxComplete) {
                onSfxComplete();
            }
            return;
        }
        
        const audioUrl = `${BASE_URL}/${list[idx]}`;
        console.log('Playing audio:', audioUrl);
        
        audioRef.current = new Audio(audioUrl);
        audioRef.current.volume = currentVolume; // 현재 동적 볼륨으로 설정
        audioRef.current.onerror = (error) => {
            console.error('Audio load error:', error);
            console.error('Failed URL:', audioUrl);
        };
        
        audioRef.current.play().catch(error => {
            console.error('Audio play error:', error);
            console.error('Failed URL:', audioUrl);
        });
        
        audioRef.current.onended = () => {
            playSequential(list, idx + 1);
        };
    }, [BASE_URL, onSfxComplete, currentVolume]);

    useEffect(() => {
        if (!isSfxActive) return;
        if (!sfxPath || sfxPath.length === 0) {
            console.log('StepAudioPlayer: No valid sfxPath to play');
            return;
        }
        
        console.log('StepAudioPlayer: Attempting to play audio:', sfxPath);
        console.log('Full audio URLs:', sfxPath.map(path => `${BASE_URL}/${path}`));
        
        // 새로운 오디오 재생 전에 기존 오디오가 재생 중인지 확인
        if (audioRef.current && !audioRef.current.paused) {
            console.log('Previous audio still playing, waiting for completion...');
            // 기존 오디오가 끝나면 새 오디오 재생하도록 대기
            const currentAudio = audioRef.current;
            const originalOnEnded = currentAudio.onended;
            
            currentAudio.onended = () => {
                // 기존 onended 처리
                if (originalOnEnded) originalOnEnded.call(currentAudio, new Event('ended'));
                
                // 새 오디오 재생
                setTimeout(() => {
                    playSequential(sfxPath, 0);
                }, 100);
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
    console.log("sfxPath", sfxPath);
    
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


