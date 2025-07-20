import { useScene } from '@/app/context/scene-context';
import { useEffect, useRef, useState } from 'react';

export default function StepAudioPlayer({ 
    className 
}: {
    className?: string
}) {
    const { bgmPath } = useScene();
    const BASE_URL = "";
    const nextAudioPath = bgmPath ? `/bg_music/${bgmPath}` : null;
    const [currentAudioPath, setCurrentAudioPath] = useState<string | null>(nextAudioPath);
    const [previousAudioPath, setPreviousAudioPath] = useState<string | null>(null);
    const [isCurrentReady, setIsCurrentReady] = useState(false);
    const [isUserInteracted, setIsUserInteracted] = useState(false);
    const [hasError, setHasError] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const prevNextAudioPathRef = useRef(nextAudioPath);
    const currentAudioRef = useRef<HTMLAudioElement | null>(null);
    const previousAudioRef = useRef<HTMLAudioElement | null>(null);
    const DEFAULT_VOLUME = 0.6;


    // 사용자 상호작용 감지 후 음소거 해제
    useEffect(() => {
        const handleUserInteraction = (eventType: string) => {
            return () => {
                if (!isUserInteracted) {
                    console.log(`🎵 사용자 상호작용 감지됨 (${eventType}) - 음소거 해제`);
                    console.log('🎵 현재 상태:', {
                        currentAudioPath,
                        isCurrentReady,
                        hasError,
                        currentAudioExists: !!currentAudioRef.current
                    });
                    
                    setIsUserInteracted(true);
                    
                    // 현재 오디오 음소거 해제 및 재생
                    if (currentAudioRef.current && !hasError) {
                        currentAudioRef.current.muted = false;
                        currentAudioRef.current.volume = DEFAULT_VOLUME;
                        
                        // 일시정지된 오디오를 재생
                        if (currentAudioRef.current.paused) {
                            currentAudioRef.current.play()
                                .then(() => console.log('🎵 일시정지된 오디오 재생 성공'))
                                .catch(error => {
                                    console.error('🎵 오디오 재생 실패:', error);
                                    // 약간의 지연 후 재시도
                                    setTimeout(() => {
                                        if (currentAudioRef.current && currentAudioRef.current.paused) {
                                            currentAudioRef.current.play()
                                                .then(() => console.log('🎵 재시도 재생 성공'))
                                                .catch(err => console.error('🎵 재시도 재생 실패:', err));
                                        }
                                    }, 100);
                                });
                        }
                        
                        console.log('🎵 현재 오디오 음소거 해제 완료');
                        console.log('🎵 오디오 상태:', {
                            paused: currentAudioRef.current.paused,
                            muted: currentAudioRef.current.muted,
                            volume: currentAudioRef.current.volume,
                            readyState: currentAudioRef.current.readyState
                        });
                    } else {
                        console.log('🎵 현재 오디오 음소거 해제 실패:', {
                            audioExists: !!currentAudioRef.current,
                            hasError
                        });
                    }
                    
                    // 이전 오디오도 음소거 해제 (크로스페이드를 위해)
                    if (previousAudioRef.current) {
                        previousAudioRef.current.muted = false;
                        previousAudioRef.current.volume = DEFAULT_VOLUME;
                        console.log('🎵 이전 오디오 음소거 해제');
                    }
                }
            };
        };

        // 확실한 사용자 상호작용 이벤트만 등록 (mousemove 제거)
        const clickHandler = handleUserInteraction('click');
        const keydownHandler = handleUserInteraction('keydown');
        

        document.addEventListener('click', clickHandler, { once: true });
        document.addEventListener('keydown', keydownHandler, { once: true });

        return () => {
            document.removeEventListener('click', clickHandler);
            document.removeEventListener('keydown', keydownHandler);
        };
    }, [isUserInteracted, hasError, currentAudioPath, isCurrentReady]);

    useEffect(() => {
        console.log('🎵 bgmPath 변경됨:', bgmPath);
        console.log('🎵 nextAudioPath:', nextAudioPath);
        
        // nextAudioPath가 변경될 때만 오디오 전환
        if (prevNextAudioPathRef.current !== nextAudioPath) {
            if (timerRef.current) clearTimeout(timerRef.current);

            // nextAudioPath가 있을 때만 새 오디오로 전환
            if (nextAudioPath) {
                console.log('🎵 오디오 전환 시작:', nextAudioPath);
                setPreviousAudioPath(currentAudioPath);
                setCurrentAudioPath(nextAudioPath);
                setIsCurrentReady(false);
                setHasError(false);
            }
            // nextAudioPath가 null이면 현재 오디오 유지
            prevNextAudioPathRef.current = nextAudioPath;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nextAudioPath, currentAudioPath]);

    // 새 오디오가 준비되고 사용자가 상호작용했을 때 크로스페이드 시작
    useEffect(() => {
        if (isCurrentReady && previousAudioPath && isUserInteracted && !hasError) {
            console.log('🎵 크로스페이드 시작');
            
            // 이전 오디오 즉시 일시정지 및 빠른 페이드아웃
            if (previousAudioRef.current) {
                // 즉시 볼륨을 낮춰서 겹침 현상 방지
                previousAudioRef.current.volume = 0.2;
                
                const fadeOutInterval = setInterval(() => {
                    if (previousAudioRef.current) {
                        previousAudioRef.current.volume = Math.max(0, previousAudioRef.current.volume - 0.05); // 더 빠른 페이드아웃
                        if (previousAudioRef.current.volume <= 0) {
                            clearInterval(fadeOutInterval);
                            // 페이드아웃 완료 후 일시정지
                            previousAudioRef.current.pause();
                            console.log('🎵 이전 오디오 페이드아웃 완료 및 일시정지');
                        }
                    }
                }, 20); // 더 빠른 인터벌 (40ms -> 20ms)
            }
            
            // 현재 오디오 페이드인
            if (currentAudioRef.current) {
                currentAudioRef.current.volume = 0;
                const fadeInInterval = setInterval(() => {
                    if (currentAudioRef.current) {
                        currentAudioRef.current.volume = Math.min(DEFAULT_VOLUME, currentAudioRef.current.volume + 0.04); // 페이드인 속도 조정
                        if (currentAudioRef.current.volume >= DEFAULT_VOLUME) {
                            clearInterval(fadeInInterval);
                            console.log('🎵 새 오디오 페이드인 완료');
                        }
                    }
                }, 20); // 더 빠른 인터벌
            }
            
            timerRef.current = setTimeout(() => {
                setPreviousAudioPath(null);
            }, 400); // 시간 단축 (800ms -> 400ms)
        }
    }, [isCurrentReady, previousAudioPath, isUserInteracted, hasError]);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    // 현재 재생 중인 오디오가 없으면 아무것도 렌더링하지 않음
    if (!currentAudioPath) {
        console.log('🎵 currentAudioPath가 없어서 렌더링하지 않음');
        return null;
    }

    return (
        <div className={className}>
            {/* Current audio */}
            <audio
                ref={currentAudioRef}
                key={`current-${currentAudioPath}`}
                src={`${BASE_URL}${currentAudioPath}`}
                autoPlay
                loop
                muted={!isUserInteracted || hasError}
                preload='auto'
                onCanPlay={() => {
                    console.log('🎵 오디오 로드 완료:', currentAudioPath);
                    console.log('🎵 오디오 준비 상태:', {
                        isUserInteracted,
                        hasError,
                        muted: currentAudioRef.current?.muted
                    });
                    
                    // 새 오디오가 준비되면 이전 오디오 즉시 처리
                    if (previousAudioRef.current) {
                        previousAudioRef.current.volume = 0;
                        previousAudioRef.current.currentTime = 0; // 시간을 처음으로 리셋
                        console.log('🎵 이전 오디오 즉시 음소거 및 시간 리셋');
                    }
                    
                    setIsCurrentReady(true);
                    setHasError(false);
                }}
                onError={(e) => {
                    console.error('🎵 오디오 로드 에러:', e);
                    console.error('🎵 에러 발생 파일:', currentAudioPath);
                    setHasError(true);
                    setIsCurrentReady(false);
                }}
                onPlay={() => console.log('🎵 오디오 재생 시작:', currentAudioPath)}
                onPause={() => console.log('🎵 오디오 일시정지:', currentAudioPath)}
                onLoadStart={() => console.log('🎵 오디오 로드 시작:', currentAudioPath)}
                onLoadedMetadata={() => console.log('🎵 오디오 메타데이터 로드:', currentAudioPath)}
                style={{ display: 'none' }}
            />
            {/* Previous audio (fades out) */}
            {previousAudioPath && (
                <audio
                    ref={previousAudioRef}
                    key={`previous-${previousAudioPath}`}
                    src={`${BASE_URL}${previousAudioPath}`}
                    autoPlay
                    loop
                    muted={!isUserInteracted}
                    preload='auto'
                    style={{ display: 'none' }}
                />
            )}
        </div>
    );
} 