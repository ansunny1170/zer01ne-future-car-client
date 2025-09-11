/* eslint-disable @next/next/no-img-element */
import { useScene } from "@/context/scene-context";
import { Icons } from "./icons";

export default function NavigationBox() {
  const {stepInfo} = useScene();

  return (
    <div className="flex items-center gap-[10px] text-white">
        <div className="grow flex items-center justify-center">
            <img src="/assets/images/icon_flag.svg" alt="navigation-box" className="w-[21px]" />
        </div>

        <div className="flex gap-[8px] items-center whitespace-nowrap text-[20px]">
          <p className="text-[14px]">{stepInfo?.path_state?.detour1 || ''}</p>
          <p><Icons.filledArrowRight /></p>
          <p className="text-[14px]">{stepInfo?.path_state?.detour2 || ''}</p>
          <p><Icons.filledArrowRight /></p>
          <p className="text-[14px]">{stepInfo?.path_state?.destination || ''}</p>
        </div>
    </div>
  );
} 