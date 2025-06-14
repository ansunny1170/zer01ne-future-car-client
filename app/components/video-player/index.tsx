import { useEffect, useRef, useState } from 'react';

export default function VideoPlayer({ step, category, direction }: { step: number, category: string, direction: "left" | "right" | "center" }) {
    const [currentVideo, setCurrentVideo] = useState(`${step}_${category}_${direction}`);
    const [previousVideo, setPreviousVideo] = useState<string | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isCurrentReady, setIsCurrentReady] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const BASE_URL = "https://pub-4114e99d6d9b4e79a59dff9e8e904235.r2.dev";

    useEffect(() => {
        const newVideo = `${step}_${category}_${direction}`;
        if (currentVideo !== newVideo) {
            if (timerRef.current) clearTimeout(timerRef.current);

            setPreviousVideo(currentVideo);
            setCurrentVideo(newVideo);
            setIsCurrentReady(false);
            setIsTransitioning(false);
        }
        // eslint-disable-next-line
    }, [step, category, direction, currentVideo]);

    // 새 비디오가 준비되면 crossfade 시작
    useEffect(() => {
        if (isCurrentReady && previousVideo) {
            setIsTransitioning(true);
            timerRef.current = setTimeout(() => {
                setPreviousVideo(null);
                setIsTransitioning(false);
            }, 800);
        }
    }, [isCurrentReady, previousVideo]);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden isolate">
            {
                isTransitioning && (
                    <video
                        src={`${BASE_URL}/videos/loading.mp4`}
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
                key={currentVideo}
                src={`${BASE_URL}/videos/step${step}/${currentVideo}.mp4`}
                poster={`${BASE_URL}/images/thumbnails/step${step}/${currentVideo}.jpg`}
                autoPlay
                loop
                muted
                playsInline
                preload='auto'
                onCanPlay={() => setIsCurrentReady(true)}
                className="w-full h-full object-cover absolute inset-0 -z-20"
            />
            {/* Previous video (fades out above) */}
            {previousVideo && (() => {
                const [stepStr] = previousVideo.split('_');
                return (
                    <video
                        key={previousVideo}
                        src={`${BASE_URL}/videos/step${stepStr}/${previousVideo}.mp4`}
                        poster={`${BASE_URL}/images/thumbnails/step${stepStr}/${previousVideo}.jpg`}
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