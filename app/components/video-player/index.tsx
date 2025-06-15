import { useEffect, useRef, useState } from 'react';

export default function VideoPlayer({ sceneNumber, category, categoryNumber, direction }:
    {
        sceneNumber: number,
        category: string,
        categoryNumber: number,
        direction: "left" | "right" | "center"
    }) {
    const [currentVideoPath, setCurrentVideoPath] = useState(`scene${sceneNumber}/${sceneNumber}_${category}${categoryNumber}_${direction}`);
    const [previousVideoPath, setPreviousVideoPath] = useState<string | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isCurrentReady, setIsCurrentReady] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    // const BASE_URL = "https://pub-4114e99d6d9b4e79a59dff9e8e904235.r2.dev";
    const BASE_URL = "/videos";

    useEffect(() => {
        if (currentVideoPath !== `scene${sceneNumber}/${sceneNumber}_${category}${categoryNumber}_${direction}`) {
            if (timerRef.current) clearTimeout(timerRef.current);

            setPreviousVideoPath(currentVideoPath);
            setCurrentVideoPath(`scene${sceneNumber}/${sceneNumber}_${category}${categoryNumber}_${direction}`);
            setIsCurrentReady(false);
            setIsTransitioning(false);
        }
        // eslint-disable-next-line
    }, [sceneNumber, category, categoryNumber, direction]);

    // 새 비디오가 준비되면 crossfade 시작
    useEffect(() => {
        if (isCurrentReady && previousVideoPath) {
            setIsTransitioning(true);
            timerRef.current = setTimeout(() => {
                setPreviousVideoPath(null);
                setIsTransitioning(false);
            }, 800);
        }
    }, [isCurrentReady, previousVideoPath]);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden isolate">
            {
                isTransitioning && (
                    <div className="absolute inset-0 flex items-center bg-white/50 backdrop-blur-sm justify-center z-20 animate-fadeInOut">
                        {/* <p className="text-white text-2xl font-bold">Loading...</p> */}
                    </div>
                )
            }
            {
                isTransitioning && (
                    <video
                        src={`${BASE_URL}/loading.mp4`}
                        // poster={`${BASE_URL}/images/thumbnails/step${step}/${currentVideo}.jpg`}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload='auto'
                        className="w-full h-full object-cover absolute inset-0 opacity-0 fadeIn duration-800 -z-10"
                    />
                )
            }

            {/* New video (always below) */}
            <video
                key={currentVideoPath}
                // src={`${BASE_URL}/videos/scene${sceneNumber}/${currentVideo}.mp4`}
                src={`${BASE_URL}/${currentVideoPath}.mp4`}
                poster={`${BASE_URL}/images/thumbnails/scene${sceneNumber}/${currentVideoPath}.jpg`}
                autoPlay
                loop
                muted
                playsInline
                preload='auto'
                onCanPlay={() => setIsCurrentReady(true)}
                className="w-full h-full object-cover absolute inset-0 -z-20"
            />
            {/* Previous video (fades out above) */}
            {previousVideoPath && (() => {
                return (
                    <video
                        key={`${previousVideoPath}`}
                        src={`${BASE_URL}/${previousVideoPath}.mp4`}
                        poster={`${BASE_URL}/images/thumbnails/scene${sceneNumber}/${previousVideoPath}.jpg`}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload='auto'
                        className={`w-full h-full object-cover absolute inset-0 transition-all duration-800 z-10
                            ${isTransitioning ? 'opacity-0 scale-110' : 'opacity-100 scale-100'}`}
                    />
                );
            })()}
        </div>
    );
}