import { BASE_S3_LINK } from "@/constants";
import { useScene } from "@/context/scene-context";
import { useEffect, useRef, useState } from "react";

export default function StepAudioPlayer() {
    // 키보드 아무키나 누르면 audio태그 활성화
    const [isSfxActive, setIsSfxActive] = useState(false);
    const [isBgmActive, setIsBgmActive] = useState(false);
    const sfxRef = useRef<HTMLAudioElement>(null);
    const bgmRef = useRef<HTMLAudioElement>(null);
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
        if (isSfxActive && sfxRef.current && sfxPath) {
            const timer = setTimeout(() => {
                if (sfxRef.current) {
                    sfxRef.current.load();
                    sfxRef.current.play();
                }
            }, 500); // 0.5초 지연 후 재생
            return () => clearTimeout(timer);
        }
    }, [isSfxActive, sfxPath]);
    useEffect(() => {
        if (isBgmActive && bgmRef.current && bgmPath) {
            bgmRef.current.load();
            bgmRef.current.play();
        }
    }, [isBgmActive, bgmPath]);

    
    const BASE_URL = BASE_S3_LINK;
    return (
        // bgtm
        <div>
            {bgmPath && isBgmActive && (
              <audio key={bgmPath} ref={bgmRef} src={`${BASE_URL}/${bgmPath}`} autoPlay loop />
            )}
            {/* sfx */}
            {sfxPath && isSfxActive && (
              <audio key={sfxPath} ref={sfxRef} src={`${BASE_URL}/${sfxPath}`} />
            )}
        </div>
    );
}


