import { getFormattedTime } from "@/utils";
import { useScene } from "@/context/scene-context";

export default function ProgressBox() {
  const time = 14;
  const distance = 9;
  const speed = { kmh: 128, mph: 5 };
  const {stepInfo} = useScene();
  const progress = Number(stepInfo?.step);
  const totalStep = 7;
  
  return (
    <div className="flex gap-[30px] items-center justify-between text-center text-white">
      <div className="leading-[1.2]">
        <p className="text-[35px] font-bold">{time}min</p>
        <p className="text-[17px] opacity-60">{distance}km {getFormattedTime()}</p>
      </div>

      {/* 진행바 */}
      <div className="h-[10px] rounded-full bg-black/40 grow w-[378px] relative">
        <div 
          className="h-full rounded-full relative transition-all duration-500 delay-100"
          style={{ 
            width: `${(progress || 1) / totalStep * 100}%`,
            background: `linear-gradient(
              90deg, 
              #FF4800 0%, 
              #00FF85 50%, 
              #FFE600 100%
            )`,
            backgroundSize: '200% 100%',
            // animation: 'gradientMove 2s ease infinite'
          }}
        >
          <div
            className="absolute top-1/2 right-0 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
          />
        </div>
      </div>

      <ul className="flex gap-[10px]">
        <li className="leading-[1.2]">
          <p className="text-[35px] font-bold">{speed.kmh}</p>
          <p className="text-[22px] opacity-60">km/h</p>
        </li>
        <li className="leading-[1.2]">
          <p className="text-[35px] font-bold">{speed.mph}</p>
          <p className="text-[22px] opacity-60">MPH</p>
        </li>
      </ul>
    </div>
  );
} 