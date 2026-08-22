import { BASE_S3_LINK } from '@/constants';
import { useScene } from '@/context/scene-context';
import { cn } from '@/utils/cn' ;
import { useEffect, useRef, useState } from 'react';

// ambient: /ambient 전시 화면 전용 모드. classic(`/`)과 세 가지가 다르다.
// - 재생 시작: classic 은 관람객의 keydown 이 신호지만 ambient 는 키 입력이 없어 마운트 즉시 시작
// - 루프: classic 은 step<2(인트로)를 한 번만 틀고 멈추지만, ambient 는 모든 step 이 정식
//   연출이라 영상이 끝나면 멈추는 게 아니라 계속 돌아야 한다
// - 블러: classic 의 "두 번째 재생부터 배경을 뿌옇게" 를 ambient 의 모든 step 에 적용한다
//   (대기 화면은 step 이 없으므로 블러 없음)
// 아래 videoMuted 로 항상 음소거라 브라우저 자동재생 정책에도 걸리지 않는다.
export default function StepVideoPlayer({ className, ambient = false }:
    {
        className?: string,
        ambient?: boolean
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
    const [isVideoActive, setIsVideoActive] = useState(ambient);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const currentVideoRef = useRef<HTMLVideoElement | null>(null);
    const previousVideoRef = useRef<HTMLVideoElement | null>(null);
    const prevNextVideoPathRef = useRef(nextVideoPath);
    // classic: step<2(인트로)는 1회 재생 후 정지, 그 뒤부터 루프+블러.
    const classicLoop = !stepInfo?.step || (stepInfo?.step && stepInfo?.step < 2) ? false : true;
    // ambient: 항상 루프. 블러는 step 연출 중에만(대기 화면 제외).
    const loopVideo = ambient ? true : classicLoop;
    const blurAfterFirst = ambient ? !!stepInfo?.step : classicLoop;
    // step1 에서 인트로 영상(intro 01.mp4)에 박힌 고정 내레이션이 재생되는 문제 — 잠시 항상 음소거
    // 원복하려면 아래 videoMuted 를 지우고 muted={classicLoop} 로 되돌린다
    const videoMuted = true;

    useEffect(() => {
        const handleKeyDown = () => {
            setIsVideoActive(true);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // isVideoActive가 true가 되면 autoPlay를 시도하고, 실패하면 수동 재생
    useEffect(() => {
        if (isVideoActive) {
            // 여러 번의 재시도로 안정성 향상
            const retryPlay = (attempt = 1, maxAttempts = 3) => {
                const videos = [
                    { ref: currentVideoRef.current, name: 'current' },
                    { ref: previousVideoRef.current, name: 'previous' }
                ];
                
                videos.forEach(({ ref, name }) => {
                    if (ref && ref.paused) {
                        console.log(`Attempt ${attempt}: Trying to play ${name} video`);
                        ref.play().catch(error => {
                            console.log(`Play failed for ${name} video (attempt ${attempt}):`, error);
                            
                            // 재시도
                            if (attempt < maxAttempts) {
                                setTimeout(() => {
                                    if (ref.paused) {
                                        retryPlay(attempt + 1, maxAttempts);
                                    }
                                }, 500 * attempt); // 점진적 지연
                            }
                        });
                    }
                });
            };

            // 첫 번째 시도 (autoPlay 실패 체크)
            const firstCheck = setTimeout(() => retryPlay(), 200);
            
            // 두 번째 시도 (네트워크 지연 대비)
            const secondCheck = setTimeout(() => retryPlay(), 1000);

            return () => {
                clearTimeout(firstCheck);
                clearTimeout(secondCheck);
            };
        }
    }, [isVideoActive]);

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
                ref={currentVideoRef}
                key={`${stepInfo?.step ? BASE_URL : ''}/${currentVideoPath}`}
                src={`${stepInfo?.step ? BASE_URL : ''}/${currentVideoPath}`}
                autoPlay={isVideoActive}
                // muted = {classicLoop}
                muted = {videoMuted}
                loop = {loopVideo}
                playsInline
                preload='auto'
                onCanPlay={() => {
                    setIsCurrentReady(true);
                    // 활성화된 상태인데 재생되지 않으면 즉시 시도
                    if (isVideoActive && currentVideoRef.current && currentVideoRef.current.paused) {
                        console.log('Video ready but not playing, forcing play');
                        currentVideoRef.current.play().catch(error => {
                            console.log('Immediate play after canPlay failed:', error);
                        });
                    }
                }}
                onPlay={() => {
                    console.log('Current video started playing successfully');
                }}
                onLoadedData={() => {
                    console.log('Current video data loaded');
                    // 데이터 로드 완료 시에도 재생 시도
                    if (isVideoActive && currentVideoRef.current && currentVideoRef.current.paused) {
                        currentVideoRef.current.play().catch(error => {
                            console.log('Play after loadedData failed:', error);
                        });
                    }
                }}
                onTimeUpdate={(e) => {
                    const video = e.target as HTMLVideoElement;
                    if (!hasCurrentPlayedOnce && video.duration > 0 && video.currentTime >= video.duration - 0.2) {
                        setHasCurrentPlayedOnce(true);
                    }
                }}
                className={`w-full h-full object-cover absolute inset-0 z-0 transition-all duration-[2000ms] ${
                    hasCurrentPlayedOnce && blurAfterFirst ? 'blur-lg' : ''
                }`}
            />
            {/* Previous video (fades out above) */}
            {previousVideoPath && (
                <video
                    ref={previousVideoRef}
                    key={`${BASE_URL}/${previousVideoPath}`}
                    src={`${BASE_URL}/${previousVideoPath}`}
                    autoPlay={isVideoActive}
                    // muted = {classicLoop}
                    muted = {videoMuted}
                    loop
                    playsInline
                    preload='none'
                    onTimeUpdate={(e) => {
                        const video = e.target as HTMLVideoElement;
                        if (!hasPreviousPlayedOnce && video.duration > 0 && video.currentTime >= video.duration - 0.2) {
                            setHasPreviousPlayedOnce(true);
                        }
                    }}
                    className={`w-full h-full object-cover absolute inset-0 transition-all duration-800 z-10 ${
                        isTransitioning ? 'opacity-0 scale-150' : 'opacity-100 scale-100'
                    } ${hasPreviousPlayedOnce && blurAfterFirst ? 'blur-lg' : ''}`}
                />
            )}
        </div>
    );
}