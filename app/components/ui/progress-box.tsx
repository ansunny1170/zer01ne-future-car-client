/* eslint-disable @next/next/no-img-element */
import { useScene } from "@/context/scene-context";
import { useState, useEffect } from "react";

export default function ProgressBox() {
  const {stepInfo} = useScene();
  const progress = Number(stepInfo?.step);
  const totalStep = 7;
  const [currentSpeed, setCurrentSpeed] = useState(60);

  // 60~70 범위에서 천천히 랜덤 속도 변경
  useEffect(() => {
    const speedInterval = setInterval(() => {
      // 60 ~ 70 범위에서 정수 랜덤 값 생성
      const randomSpeed = Math.floor(Math.random() * 5) + 60;
      setCurrentSpeed(randomSpeed);
    }, 2000 + Math.random() * 3000); // 2~5초 간격으로 변경

    return () => clearInterval(speedInterval);
  }, []);
  
  return (
    <div className="flex gap-[48px] items-center justify-between text-center text-white">
      <div className="opacity-90 flex">
        <p id="progress-box-speed" className="text-[65px] font-semibold pl-[30px] pr-[20px]">{currentSpeed}</p>

        <div className="flex flex-col items-center justify-center leading-[1.4]">
          <p className="text-[20px] text-[#FF3826] font-bold">100</p>
          <p className="text-[16px] uppercase">km/h</p>
        </div>
      </div>

      {/* 진행바 */}
      <div className="h-[6px] rounded-full bg-black/40 grow w-[263px] relative">
        <div 
          className="h-full rounded-full relative transition-all duration-500 delay-100 bg-white"
          style={{ 
            width: `${(progress || 1) / totalStep * 100}%`
          }}
        />
      </div>

      <ul className="flex gap-[27px] opacity-90 uppercase">
        <li className="leading-[1.4]">
          <p className="text-[20px] font-bold">21</p>
          <p className="text-[16px]">km</p>
        </li>
        <li className="leading-[1.4]">
          <p className="text-[20px] font-bold">13:00</p>
          <p className="text-[16px]">ETA</p>
        </li>
      </ul>
    </div>
  );
} 