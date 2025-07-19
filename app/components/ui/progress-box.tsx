import { getFormattedTime } from "@/app/utils";
import BasicBox from "./basic-box";
import CloudIcon from "../icons/cloud";

interface ProgressBoxProps {
  stop?: boolean;
  progress?: number;
}

export default function ProgressBox({
  stop = true,
  progress = 60
}: ProgressBoxProps) {
  const time = 14;
  const distance = 9;
  const speed = { kmh: 128, mph: 5 };
  
  return (
    <div className="flex flex-col gap-[10px]">
      <div className="flex items-center gap-[4px]">
        <CloudIcon />
        <p className="text-white text-[23px] opacity-60 font-semibold">27.5 º</p>
      </div>
      <BasicBox className="w-full flex gap-[30px] items-center justify-between text-center">
        <div className="leading-[1.2] whitespace-nowrap">
          {
            !stop ? (
              <p className="text-[17px] font-bold opacity-60">목적지가 없습니다.</p>
            ) : (
              <div className="">
                <p className="text-[35px] font-bold">{time}min</p>
                <p className="text-[17px] opacity-60">{distance}km {getFormattedTime()}</p>
              </div>
            )
          }
          
        </div>

        {/* 진행바 */}
        <div className="h-[10px] rounded-full bg-black/20 grow min-w-[300px]">
          <div 
            className="relative h-full rounded-full bg-gradient-to-r from-[#FF4800] via-[#00FF85] to-[#FFE600]"
            style={{ width: `${progress}%` }}
          >
            <p
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
      </BasicBox>
    </div>
  );
} 