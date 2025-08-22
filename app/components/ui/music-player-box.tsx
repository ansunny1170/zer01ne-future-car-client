import { cn } from "@/utils/cn";
import MusicIcon from "../icons/musix";
import PlayerButtons from "../icons/player-buttons";
import { useScene } from "@/context/scene-context";
import { useEffect, useRef, useState } from "react";

interface MusicPlayerBoxProps {
  className?: string;
}

export default function MusicPlayerBox({ className }: MusicPlayerBoxProps) {
  const {stepInfo} = useScene();
  const textRef = useRef<HTMLParagraphElement>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);

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
    <div className={cn("flex items-center p-[16px] gap-[16px] text-white", className)}>
        <div className="w-[62px] h-[62px] rounded-[7px] bg-[#C6C6C6]/20 grow flex items-center justify-center">
            <MusicIcon />
        </div>
        <div className="leading-[1.2] max-w-[100px] overflow-hidden">
            <p 
              ref={textRef}
              className={cn(
                "text-[18px] font-bold whitespace-nowrap",
                shouldAnimate && "animate-marquee"
              )}
            >
              {stepInfo?.bgm?.file_name}
            </p>
        </div>
        <div className="opacity-70">
          <PlayerButtons />
        </div>
    </div>
  );
} 