/* eslint-disable @next/next/no-img-element */
import { cn } from "@/utils/cn";
import MusicIcon from "../icons/musix";
import PlayerButtons from "../icons/player-buttons";
import { useScene } from "@/context/scene-context";
import { useEffect, useRef, useState } from "react";
import { getArtistName } from "@/utils";

interface MusicPlayerBoxProps {
  className?: string;
}

export default function MusicPlayerBox({ className }: MusicPlayerBoxProps) {
  const {stepInfo} = useScene();
  const textRef = useRef<HTMLParagraphElement>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const bgmCover = `/assets/bgm_cover/${stepInfo?.bgm?.description}.jpeg`;
  const artistName = getArtistName()

  // 이미지 로딩 시도
  useEffect(() => {
    if (stepInfo?.bgm?.description) {
      setIsTransitioning(true);
      
      // 페이드 아웃 후 새 이미지 로드
      setTimeout(() => {
        setImageLoaded(false);
        setImageError(false);
        
        const img = new Image();
        img.onload = () => {
          setImageLoaded(true);
          // 페이드 인
          setTimeout(() => setIsTransitioning(false), 150);
        };
        img.onerror = () => {
          setImageError(true);
          setIsTransitioning(false);
        };
        img.src = bgmCover;
      }, 150);
    }
  }, [bgmCover, stepInfo?.bgm?.description]);

  useEffect(() => {
    if (textRef.current && stepInfo?.bgm?.file_name) {
      const textWidth = textRef.current.scrollWidth;
      const containerWidth = 100; // max-w-[100px]
      setShouldAnimate(textWidth > containerWidth);
      
      if (textWidth > containerWidth) {
        // CSS 변수로 이동 거리 설정
        const moveDistance = textWidth - containerWidth;
        textRef.current.style.setProperty('--move-distance', `-${moveDistance}px`);
        
        // 속도를 일정하게 유지 (50px당 1초)
        const animationDuration = (moveDistance / 50) + 4; // 4초는 대기시간
        textRef.current.style.setProperty('--animation-duration', `${animationDuration}s`);
      }
    }
  }, [stepInfo?.bgm?.file_name]);

  return (
    <div className={cn("flex items-center p-[16px] gap-[16px] text-white backdrop-blur-lg rounded-[24px]", className)}>
        <div className="w-[62px] h-[62px] rounded-[7px] bg-[#C6C6C6]/20 grow flex items-center justify-center relative overflow-hidden">
          {imageLoaded && !imageError ? (
            <img 
              src={bgmCover} 
              alt="bgm-cover" 
              className={cn(
                "w-full h-full object-cover rounded-[7px] transition-opacity duration-300 ease-in-out",
                isTransitioning ? "opacity-0" : "opacity-80"
              )}
            />
          ) : (
            <div className={cn(
              "absolute inset-0 flex items-center justify-center transition-opacity duration-300 ease-in-out",
              isTransitioning ? "opacity-0" : "opacity-80"
            )}>
              <MusicIcon />
            </div>
          )}
        </div>
        <div className="leading-[1.2] max-w-[100px] overflow-hidden">
            <p 
              ref={textRef}
              className={cn(
                "text-[18px] font-bold whitespace-nowrap",
                shouldAnimate && "animate-marquee"
              )}
            >
              {stepInfo?.bgm?.description}
            </p>
            <p className={cn("text-[14px] pt-[4px] font-semibold whitespace-nowrap opacity-60", shouldAnimate && "animate-marquee")}>
              {artistName}
            </p>
        </div>
        <div className="opacity-70 pl-[20px]">
          <PlayerButtons />
        </div>
    </div>
  );
} 