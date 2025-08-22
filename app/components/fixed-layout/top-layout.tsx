import { getFormattedTime } from "@/utils";
import MusicPlayerBox from "../ui/music-player-box";
import NavigationBox from "../ui/navigation-box";
import ProgressBox from "../ui/progress-box";

/* eslint-disable @next/next/no-img-element */
export default function TopLayout() {
    // 현재 시각 6:32 AM 포맷으로 가져오기

    return (
        <div className="absolute inset-0 z-[6] perspective-1000">
            {/* 상단 우측 영역 */}
            <div className="z-[20] drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] text-white/[0.6] text-[23px] font-semibold pt-[35px] pr-[38px] fixed left-0 top-0 w-full flex justify-end">
                <div className="flex justify-end items-center gap-[24px]">
                    <p className="flex items-center gap-[8px]">
                        <img src="/assets/images/img_cloud.png" alt="fixed-layout" className="w-[38px] opacity-60" />
                        <span>27.5 º</span>
                    </p>
                    <p className="flex items-center gap-[8px]">
                        <span>68%</span>
                        <img src="/assets/images/img_battery.png" alt="fixed-layout" className="w-[38px] opacity-60" />
                    </p>
                    <span>{getFormattedTime()}</span>
                </div>
            </div>

            {/* 하단 좌측 영역 */}
            <div className="fixed right-1/2 bottom-[64px] -translate-x-[7.5vw] flex gap-[21px]">
                <div className="rotate-y--15">
                    <ProgressBox/>
                </div>

                
            </div>

            {/* 하단 우측 영역 */}
            <div className="fixed left-1/2 bottom-[64px] translate-x-[7.5vw] ">
                <div className="flex gap-[21px] rotate-y-15">
                    <NavigationBox />
                    <MusicPlayerBox />
                </div>
            </div>


            {/* 하단 기본프레임 */}
            <div className="fixed left-0 top-0 w-full">
                <img src="/assets/images/img_frame_top.png" alt="fixed-layout" className="w-full" />
            </div>

            {/* 프레임 블러 영역 */}
            <div 
                className="fixed left-0 bottom-[22px] w-full"
            >
                <img id="frame-middle-blur" src="/assets/images/img_frame_middle.svg" alt="fixed-layout" className="w-full" />
            </div>


            <div className="fixed left-0 bottom-0 w-full">
                <img src="/assets/images/img_frame_bottom.png" alt="fixed-layout" className="w-full" />
            </div>

        </div>
    );
}