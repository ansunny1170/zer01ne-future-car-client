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
    const { bgmPath, sfxPath } = useScene();
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
        if (idx >= list.length) return; // 모두 재생 완료
        audioRef.current = new Audio(`${BASE_URL}/${list[idx]}`);
        audioRef.current.play();
        audioRef.current.onended = () => {
            playSequential(list, idx + 1);
        };
    }, [BASE_URL]);

    useEffect(() => {
        if (!isSfxActive) return;
        if (!sfxPath || sfxPath.length === 0) return;
        playSequential(sfxPath, 0);
        // cleanup: 재생 중인 오디오 stop
        return () => {
            audioRef.current?.pause();
            audioRef.current = null;
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


