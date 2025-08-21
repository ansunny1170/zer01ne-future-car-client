import { BASE_S3_LINK } from "@/constants";
import { useScene } from "@/context/scene-context";
import { useEffect, useRef, useState, useCallback } from "react";

export default function StepAudioPlayer() {
    // 키보드 아무키나 누르면 audio태그 활성화
    const [isSfxActive, setIsSfxActive] = useState(false);
    const [isBgmActive, setIsBgmActive] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const bgmRef = useRef<HTMLAudioElement>(null);
    const BASE_URL = BASE_S3_LINK;
    // 현재 재생할 오디오 경로
    const { bgmPath, sfxPath, onSfxComplete } = useScene();
    useEffect(() => {
        const handleKeyDown = () => {
            setIsSfxActive(true);
            setIsBgmActive(true);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    useEffect(() => {
        if (isBgmActive && bgmRef.current && bgmPath) {
            bgmRef.current.load();
            bgmRef.current.play();
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
    }, [BASE_URL, onSfxComplete]);

    useEffect(() => {
        if (!isSfxActive) return;
        if (!sfxPath || sfxPath.length === 0) return;
        
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
                if (originalOnEnded) originalOnEnded(new Event('ended'));
                
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


