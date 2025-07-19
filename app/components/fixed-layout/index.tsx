import { getFormattedTime } from "@/app/utils";
import MusicPlayerBox from "../ui/music-player-box";
import NavigationBox from "../ui/navigation-box";
import ProgressBox from "../ui/progress-box";

/* eslint-disable @next/next/no-img-element */
export default function FixedLayout() {
    // 현재 시각 6:32 AM 포맷으로 가져오기

    return (
        <div className="absolute inset-0 z-10">
            {/* 좌우 그라데이션 */}
            <p className="fixed left-0 top-0 w-1/4 h-full bg-gradient-to-r from-black/50 to-black/0"/>
            <p className="fixed right-0 top-0 w-1/4 h-full bg-gradient-to-l from-black/50 to-black/0"/>

            {/* 상단 우측 영역 */}
            <div className="drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] text-white/[0.6] text-[23px] font-semibold pt-[35px] pr-[38px] fixed left-0 top-0 w-full flex justify-end">
                <div className="flex justify-end items-center gap-[24px]">
                    <p className="flex items-center gap-[8px]">
                        <span>68%</span>
                        <img src="/assets/images/img_battery.png" alt="fixed-layout" className="w-[38px] opacity-60" />
                    </p>
                    <span>{getFormattedTime()}</span>
                </div>
            </div>

            {/* 하단 좌측 영역 */}
            <div className="fixed right-1/2 bottom-[24px] -translate-x-[128px] flex gap-[21px]">
                <ProgressBox />
            </div>

            {/* 하단 우측 영역 */}
            <div className="fixed left-1/2 bottom-[24px] translate-x-[128px] flex gap-[21px]">
                <NavigationBox />
                <MusicPlayerBox />
            </div>


            {/* 하단 기본프레임 */}
            <div className="fixed left-0 bottom-0 w-full">
                <img src="/assets/images/img_frame.png" alt="fixed-layout" className="w-full" />
            </div>

            

        </div>
    );
}