import { BASE_S3_LINK } from "@/constants";
import { useScene } from "@/context/scene-context";
import { useEffect, useState } from "react";

export default function StepAudioPlayer() {
    // 키보드 아무키나 누르면 audio태그 활성화
    const [isAudioActive, setIsAudioActive] = useState(false);
    useEffect(() => {
        const handleKeyDown = () => {
            setIsAudioActive(true);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    
    const { bgmPath, sfxPath } = useScene();
    const BASE_URL = BASE_S3_LINK;
    return (
        // bgtm
        <div>
            {bgmPath && isAudioActive && (
              <audio src={`${BASE_URL}/${bgmPath}`} autoPlay loop />
            )}
            {/* sfx */}
            {sfxPath && isAudioActive && (
              <audio src={`${BASE_URL}/${sfxPath}`} autoPlay={false} />
            )}
        </div>
    );
}


