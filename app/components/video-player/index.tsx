import { useScene } from '@/app/context/scene-context';
import { useEffect, useRef, useState } from 'react';

export default function VideoPlayer({ direction }:
    {
        direction: "left" | "right" | "center"
    }) {
    const { sceneNumber, category, categoryNumber } = useScene();
    const nextVideoPath = `scene${sceneNumber}/${sceneNumber}_${category}${categoryNumber}_${direction}`;
    const [currentVideoPath, setCurrentVideoPath] = useState(nextVideoPath);
    const [previousVideoPath, setPreviousVideoPath] = useState<string | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isCurrentReady, setIsCurrentReady] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const prevSceneNumberRef = useRef(sceneNumber);
    // const BASE_URL = "https://pub-4114e99d6d9b4e79a59dff9e8e904235.r2.dev";
    const BASE_URL = "/videos";

    useEffect(() => {
        // sceneNumber가 변경될 때만 비디오 전환
        if (prevSceneNumberRef.current !== sceneNumber) {
            if (timerRef.current) clearTimeout(timerRef.current);

            setPreviousVideoPath(currentVideoPath);
            setCurrentVideoPath(nextVideoPath);
            setIsCurrentReady(false);
            setIsTransitioning(false);
            prevSceneNumberRef.current = sceneNumber;
        } else if (currentVideoPath !== nextVideoPath) {
            // sceneNumber가 같을 때는 현재 비디오를 바로 업데이트
            setCurrentVideoPath(nextVideoPath);
        }
    }, [sceneNumber, nextVideoPath, currentVideoPath]);

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

    // categoryNumber가 null이면 렌더링하지 않음 (모든 훅 호출 이후)
    if (categoryNumber == null) return null;

    // categoryNumber가 null이 포함된 비디오 경로는 렌더링하지 않음
    const isValidPath = (path: string) => !path.includes('null');

    return (
        <div className="absolute inset-0 overflow-hidden isolate">
            {
                // isTransitioning && (
                //     <div className="absolute inset-0 flex items-center bg-white/50 backdrop-blur-sm justify-center z-[1] animate-fadeInOut">
                //         {/* <p className="text-white text-2xl font-bold">Loading...</p> */}
                //     </div>
                // )
            }
            {/* {
                isTransitioning && (
                    <video
                        src={`${BASE_URL}/loading.mp4`}
                        // poster={`${BASE_URL}/images/thumbnails/step${step}/${currentVideo}.jpg`}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload='auto'
                        className="w-full h-full object-cover absolute inset-0 opacity-0 fadeIn duration-800 -z-[1]"
                    />
                )
            } */}

            {/* New video (always below) */}
            {isValidPath(currentVideoPath) && (
                <video
                    key={currentVideoPath}
                    src={`${BASE_URL}/${currentVideoPath}.mp4`}
                    poster={`${BASE_URL}/images/thumbnails/scene${sceneNumber}/${currentVideoPath}.jpg`}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload='auto'
                    onCanPlay={() => setIsCurrentReady(true)}
                    className="w-full h-full object-cover absolute inset-0 -z-[1]"
                />
            )}
            {/* Previous video (fades out above) */}
            {previousVideoPath && isValidPath(previousVideoPath) && (
                <video
                    key={`${previousVideoPath}`}
                    src={`${BASE_URL}/${previousVideoPath}.mp4`}
                    poster={`${BASE_URL}/images/thumbnails/scene${sceneNumber}/${previousVideoPath}.jpg`}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload='auto'
                    className={`w-full h-full object-cover absolute inset-0 transition-all duration-800 z-1
                        ${isTransitioning ? 'opacity-0 scale-150' : 'opacity-100 scale-100'}`}
                />
            )}

            {/* <div className='absolute bottom-0 left-0 text-right p-20 bg-white/50 backdrop-blur-sm z-20'>
                <p>previousVideoPath: {previousVideoPath}</p>
                <p>currentVideoPath: {currentVideoPath}</p>
                <p>nextVideoPath: {nextVideoPath}</p>
                <p>isTransitioning: {isTransitioning ? "true" : "false"}</p>
                <p>isCurrentReady: {isCurrentReady ? "true" : "false"}</p>
                <p>sceneNumber: {sceneNumber}</p>
                <p>category: {category}</p>
                <p>categoryNumber: {categoryNumber}</p>
            </div> */}
        </div>
    );
}