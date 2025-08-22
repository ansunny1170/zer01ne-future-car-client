/* eslint-disable @next/next/no-img-element */
import { useScene } from "@/context/scene-context";

export default function ProgressBox() {
  const {stepInfo} = useScene();
  const progress = Number(stepInfo?.step);
  const totalStep = 7;
  
  return (
    <div className="flex gap-[48px] items-center justify-between text-center text-white">
      <div className="opacity-90 flex">
        <p className="flex items-center justify-center -translate-y-[48px]">
          <img src="/assets/images/icon_handle.svg" alt="progress-box" className="w-[36px] h-[36px]" />
        </p>

        <p className="text-[65px] font-semibold pl-[30px] pr-[20px]">68</p>

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