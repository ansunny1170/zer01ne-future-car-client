import { useEffect, useRef, useState } from 'react';

export default function VideoPlayer({ step, category, direction }: { step: number, category: string, direction: "left" | "right" | "center" }) {
    const [currentVideo, setCurrentVideo] = useState(`${step}_${category}_${direction}`);
    const [previousVideo, setPreviousVideo] = useState<string | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const newVideo = `${step}_${step === 0 ? "a" : category}_${direction}`;
        if (currentVideo !== newVideo) {
            if (timerRef.current) clearTimeout(timerRef.current);

            setPreviousVideo(currentVideo);
            setCurrentVideo(newVideo);
            setIsTransitioning(true);

            timerRef.current = setTimeout(() => {
                setPreviousVideo(null);
                setIsTransitioning(false);
            }, 800);
        }
        // eslint-disable-next-line
    }, [step, category, direction, currentVideo]);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden isolate">
            {/* New video (always below) */}
            <video
                key={currentVideo}
                src={`/videos/step${step}/${currentVideo}.mp4`}
                poster={`/images/thumbnails/step${step}/${currentVideo}.jpg`}
                autoPlay
                loop
                muted
                playsInline
                preload='auto'
                className="w-full h-full object-cover absolute inset-0 "
            />
            {/* Previous video (fades out above) */}
            {previousVideo && (() => {
                const [stepStr] = previousVideo.split('_');
                return (
                    <video
                        key={previousVideo}
                        src={`/videos/step${stepStr}/${previousVideo}.mp4`}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload='auto'
                        className={`w-full h-full object-cover absolute inset-0 transition-all duration-800 z-10
                            ${isTransitioning ? 'opacity-0 scale-150' : 'opacity-100 scale-100'}`}
                    />
                );
            })()}

            <div className={
                `w-full h-full flex items-center justify-center absolute inset-0 z-20 transition-all duration-1200
                ${isTransitioning ? 'bg-white/50 backdrop-blur-sm' : 'bg-none backdrop-blur-none'}`
            }>
                <p className="text-white text-2xl font-bold">로딩중...</p>  
            </div>
            
            <p className="absolute right-4 top-1/2 translate-y-1/2 z-20 bg-black/50 text-white text-2xl font-bold">
                isTransitioning: {isTransitioning ? 'true' : 'false'}<br /> 
                currentVideo: {currentVideo}<br />
                previousVideo: {previousVideo}
            </p>
        </div>
    );
}