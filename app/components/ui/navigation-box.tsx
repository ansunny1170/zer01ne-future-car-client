/* eslint-disable @next/next/no-img-element */
import { useScene } from "@/context/scene-context";

export default function NavigationBox() {
  const {stepInfo} = useScene();

  return (
    <div className="flex items-center gap-[10px] text-white">
        <div className="grow flex items-center justify-center">
            <img src="/assets/images/icon_flag.svg" alt="navigation-box" className="w-[21px]" />
        </div>
        <div className="leading-[1.4] whitespace-nowrap">
            <p className="text-[20px] font-bold opacity-90">{stepInfo?.path_state?.destination || ''}</p>
            <div className="flex items-center gap-[4px] opacity-80">
              <p className="text-[14px]">{stepInfo?.path_state?.detour1 || ''}</p>
              <p>→</p>
              <p className="text-[14px]">{stepInfo?.path_state?.detour2 || ''}</p>
            </div>
        </div>
    </div>
  );
} 