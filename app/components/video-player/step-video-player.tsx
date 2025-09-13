import { BASE_S3_LINK } from '@/constants';
import { useScene } from '@/context/scene-context';
import { cn } from '@/utils/cn' ;
import { useEffect, useRef, useState } from 'react';

export default function StepVideoPlayer({ className }:
    {
        className?: string
    }) {
    const { videoPath, stepInfo } = useScene();
    const BASE_URL = BASE_S3_LINK;
    const nextVideoPath = videoPath ? `${videoPath}` : null;
    const [currentVideoPath, setCurrentVideoPath] = useState<string | null>(nextVideoPath);
    const [previousVideoPath, setPreviousVideoPath] = useState<string | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isCurrentReady, setIsCurrentReady] = useState(false);
    const [hasCurrentPlayedOnce, setHasCurrentPlayedOnce] = useState(false);
    const [hasPreviousPlayedOnce, setHasPreviousPlayedOnce] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const prevNextVideoPathRef = useRef(nextVideoPath);
    const noLoop = !stepInfo?.step || (stepInfo?.step && stepInfo?.step < 2) ? false : true;

    useEffect(() => {
        // nextVideoPath가 변경될 때만 비디오 전환
        if (prevNextVideoPathRef.current !== nextVideoPath) {
            if (timerRef.current) clearTimeout(timerRef.current);

            // nextVideoPath가 있을 때만 새 비디오로 전환
            if (nextVideoPath) {
                // 현재 비디오와 다음 비디오가 같다면 전환하지 않음
                if (currentVideoPath !== nextVideoPath) {
                    setPreviousVideoPath(currentVideoPath);
                    setCurrentVideoPath(nextVideoPath);
                    setIsCurrentReady(false);
                    setHasCurrentPlayedOnce(false);
                    setHasPreviousPlayedOnce(false);
                    setIsTransitioning(false);
                }
            }
            // nextVideoPath가 null이면 현재 비디오 유지
            prevNextVideoPathRef.current = nextVideoPath;
        }
    }, [nextVideoPath, currentVideoPath]);

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

    // 현재 재생 중인 비디오가 없으면 어두운 배경만 보여줌
    if (!currentVideoPath) {
        return <div className={cn("absolute inset-0 overflow-hidden isolate bg-gray-900", className)} />;
    }

    return (
        <div className={cn("absolute inset-0 overflow-hidden isolate bg-gray-900", className)}>
            {/* New video (always below) */}
            <video
                key={currentVideoPath}
                src={`${stepInfo?.step ? BASE_URL : ''}/${currentVideoPath}`}
                autoPlay
                muted = {noLoop}
                loop = {noLoop}
                playsInline
                preload='metadata'
                onCanPlay={() => setIsCurrentReady(true)}
                onTimeUpdate={(e) => {
                    const video = e.target as HTMLVideoElement;
                    if (!hasCurrentPlayedOnce && video.duration > 0 && video.currentTime >= video.duration - 0.2) {
                        setHasCurrentPlayedOnce(true);
                    }
                }}
                className={`w-full h-full object-cover absolute inset-0 z-0 transition-all duration-[2000ms] ${
                    hasCurrentPlayedOnce && noLoop ? 'blur-lg' : ''
                }`}
            />
            {/* Previous video (fades out above) */}
            {previousVideoPath && (
                <video
                    key={previousVideoPath}
                    src={`${BASE_URL}/${previousVideoPath}`}
                    autoPlay
                    muted = {noLoop}
                    loop
                    playsInline
                    preload='metadata'
                    onTimeUpdate={(e) => {
                        const video = e.target as HTMLVideoElement;
                        if (!hasPreviousPlayedOnce && video.duration > 0 && video.currentTime >= video.duration - 0.2) {
                            setHasPreviousPlayedOnce(true);
                        }
                    }}
                    className={`w-full h-full object-cover absolute inset-0 transition-all duration-800 z-10 ${
                        isTransitioning ? 'opacity-0 scale-150' : 'opacity-100 scale-100'
                    } ${hasPreviousPlayedOnce && noLoop ? 'blur-lg' : ''}`}
                />
            )}
        </div>
    );
}