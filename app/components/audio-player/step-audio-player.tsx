import { BASE_S3_LINK } from '@/constants';
import { useScene } from '@/context/scene-context';
import { useEffect, useRef, useState } from 'react';

export default function StepAudioPlayer({ 
    className 
}: {
    className?: string
}) {
    const { bgmPath } = useScene();
    const BASE_URL = BASE_S3_LINK;
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isUserInteracted, setIsUserInteracted] = useState(false);
    const [hasError, setHasError] = useState(false);
    const DEFAULT_VOLUME = 0.6;

    // 사용자 상호작용 감지 후 음소거 해제
    useEffect(() => {
        const handleUserInteraction = (eventType: string) => {
            return () => {
                if (!isUserInteracted) {
                    console.log(`🎵 사용자 상호작용 감지됨 (${eventType}) - 음소거 해제`);
                    setIsUserInteracted(true);
                    
                    // 오디오 음소거 해제 및 재생
                    if (audioRef.current && !hasError) {
                        audioRef.current.muted = false;
                        audioRef.current.volume = DEFAULT_VOLUME;
                        
                        // 일시정지된 오디오를 재생
                        if (audioRef.current.paused) {
                            audioRef.current.play()
                                .then(() => console.log('🎵 오디오 재생 성공'))
                                .catch(error => {
                                    console.error('🎵 오디오 재생 실패:', error);
                                    // 약간의 지연 후 재시도
                                    setTimeout(() => {
                                        if (audioRef.current && audioRef.current.paused) {
                                            audioRef.current.play()
                                                .then(() => console.log('🎵 재시도 재생 성공'))
                                                .catch(err => console.error('🎵 재시도 재생 실패:', err));
                                        }
                                    }, 100);
                                });
                        }
                    }
                }
            };
        };

        // 사용자 상호작용 이벤트 등록
        const clickHandler = handleUserInteraction('click');
        const keydownHandler = handleUserInteraction('keydown');
        
        document.addEventListener('click', clickHandler, { once: true });
        document.addEventListener('keydown', keydownHandler, { once: true });

        return () => {
            document.removeEventListener('click', clickHandler);
            document.removeEventListener('keydown', keydownHandler);
        };
    }, [isUserInteracted, hasError]);

    // 컴포넌트 마운트 시 초기 오디오 로드
    useEffect(() => {
        if (audioRef.current && bgmPath) {
            audioRef.current.load();
            if (isUserInteracted && !hasError) {
                audioRef.current.play()
                    .catch(error => console.error('🎵 초기 오디오 재생 실패:', error));
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // bgmPath가 변경될 때 오디오 소스 업데이트
    useEffect(() => {
        if (audioRef.current && bgmPath) {
            audioRef.current.src = `${BASE_URL}/${bgmPath}`;
            audioRef.current.load();
            if (isUserInteracted && !hasError) {
                audioRef.current.play()
                    .catch(error => console.error('🎵 오디오 재생 실패:', error));
            }
        }
    }, [bgmPath, isUserInteracted, hasError, BASE_URL]);

    return (
        <div className={className}>
            <audio
                ref={audioRef}
                src={`${BASE_URL}/${bgmPath}`}
                autoPlay
                loop
                muted={!isUserInteracted || hasError}
                preload='auto'
                onCanPlay={() => {
                    console.log('🎵 오디오 로드 완료:', bgmPath);
                    if (audioRef.current && isUserInteracted && !hasError) {
                        audioRef.current.volume = DEFAULT_VOLUME;
                    }
                    setHasError(false);
                }}
                onError={(e) => {
                    console.error('🎵 오디오 로드 에러:', e);
                    console.error('🎵 에러 발생 파일:', bgmPath);
                    setHasError(true);
                }}
                style={{ display: 'none' }}
            />
        </div>
    );
} 