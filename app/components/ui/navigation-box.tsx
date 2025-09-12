/* eslint-disable @next/next/no-img-element */
import { useScene } from "@/context/scene-context";
import { Icons } from "./icons";

export default function NavigationBox() {
  const {stepInfo} = useScene();

  return (
    <div className="flex justify-start items-center gap-[14px] text-white w-[350px] ">
        <div className="flex items-center justify-center shrink-0">
            <img src="/assets/images/icon_flag.svg" alt="navigation-box" className="w-[16px]" />
        </div>

        <div className="flex w-full gap-[8px] justify-between items-center text-[16px] font-semibold break-keep text-center">
          <p>{stepInfo?.path_state?.detour1 || ''}</p>
          <p><Icons.filledArrowRight /></p>
          <p>{stepInfo?.path_state?.detour2 || ''}</p>
          <p><Icons.filledArrowRight /></p>
          <p>{stepInfo?.path_state?.destination || ''}</p>
        </div>
    </div>
  );
} 