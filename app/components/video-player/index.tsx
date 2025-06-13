import { useEffect, useState } from 'react';

export default function VideoPlayer({ step, category, direction }: { step: number, category: string, direction: "left" | "right" | "center" }) {
    const [currentVideo, setCurrentVideo] = useState(`${step}_${category}_${direction}`);
    const [previousVideo, setPreviousVideo] = useState('');

    useEffect(() => {
        const newVideo = `${step}_${step === 0 ? "a" : category}_${direction}`;
        if (currentVideo !== newVideo) {
            setPreviousVideo(currentVideo);
            setCurrentVideo(newVideo);

            const timer = setTimeout(() => {
                setPreviousVideo('');
            }, 800);

            return () => clearTimeout(timer);
        }
    }, [step, category, direction]);

    return (
        <div className="absolute inset-0 overflow-hidden -z-10">
            {/* Current video - always visible */}
            <video 
                key={currentVideo}
                src={`/videos/step${step}/${currentVideo}.mp4`}
                poster={`/images/thumbnails/step${step}/${currentVideo}.jpg`}
                autoPlay 
                loop 
                muted 
                className="w-full h-full object-cover absolute inset-0 -z-10"
            />
            {/* Previous video - fades out with zoom out effect */}
            {previousVideo && (
                <video 
                    key={previousVideo}
                    src={`/videos/${previousVideo}.mp4`}
                    autoPlay 
                    loop 
                    muted 
                    className="w-full h-full object-cover absolute inset-0 -z-10 transition-all duration-1200 opacity-0 scale-140"
                />
            )}
        </div>
    );
}