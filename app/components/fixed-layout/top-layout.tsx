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
                className="fixed left-0 bottom-[20px] w-full backdrop-blur-xl"
                style={{
                    maskImage: 'url(#bottom-frame-mask)',
                    WebkitMaskImage: 'url(#bottom-frame-mask)'
                }}
            >
                <svg viewBox="0 0 1920 103" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <mask id="bottom-frame-mask">
                            <path d="M1100.08 33.8185C1104.87 47.2292 1117.3 56.4011 1131.53 57.0143L1920 91V103H0V91L788.468 57.0143C802.695 56.4011 815.132 47.2292 819.922 33.8185L824.889 19.9099C829.154 7.97013 840.463 0 853.142 0H1066.86C1079.54 0 1090.85 7.97012 1095.11 19.9099L1100.08 33.8185Z" fill="white"/>
                        </mask>
                        <clipPath id="bgblur_0_541_404_clip_path" transform="translate(300 300)"><path d="M1100.08 33.8185C1104.87 47.2292 1117.3 56.4011 1131.53 57.0143L1920 91V103H0V91L788.468 57.0143C802.695 56.4011 815.132 47.2292 819.922 33.8185L824.889 19.9099C829.154 7.97013 840.463 0 853.142 0H1066.86C1079.54 0 1090.85 7.97012 1095.11 19.9099L1100.08 33.8185Z"/>
                        </clipPath>
                        <clipPath id="bgblur_1_541_404_clip_path" transform="translate(-725.939 105.671)"><path d="M853.696 36.8379C853.354 37.0851 853.354 37.5948 853.696 37.842L874.313 52.7323C874.723 53.0281 875.295 52.7354 875.295 52.2302V44.7714H885.203C886.571 44.7714 887.68 43.6624 887.68 42.2943V32.3857C887.68 31.0176 886.571 29.9086 885.203 29.9086H875.295V22.4497C875.295 21.9445 874.723 21.6519 874.313 21.9477L853.696 36.8379Z"/>
                        </clipPath>
                        <clipPath id="bgblur_2_541_404_clip_path" transform="translate(-904.939 105.671)"><path d="M1066.42 36.8379C1066.77 37.0851 1066.77 37.5948 1066.42 37.842L1045.81 52.7323C1045.4 53.0281 1044.82 52.7354 1044.82 52.2302V44.7714H1034.92C1033.55 44.7714 1032.44 43.6624 1032.44 42.2943V32.3857C1032.44 31.0176 1033.55 29.9086 1034.92 29.9086H1044.82V22.4497C1044.82 21.9445 1045.4 21.6519 1045.81 21.9477L1066.42 36.8379Z"/>
                        </clipPath>
                        <linearGradient id="paint0_linear_541_404" x1="963" y1="29.5798" x2="963" y2="43.5647" gradientUnits="userSpaceOnUse">
                            <stop stopColor="white" stopOpacity="0"/>
                            <stop offset="0.538462" stopColor="white"/>
                            <stop offset="0.990385" stopColor="white" stopOpacity="0"/>
                        </linearGradient>
                        <linearGradient id="paint1_linear_541_404" x1="966.545" y1="29.2619" x2="967.232" y2="46.1755" gradientUnits="userSpaceOnUse">
                            <stop stopColor="white"/>
                            <stop offset="1" stopColor="white" stopOpacity="0"/>
                        </linearGradient>
                        <linearGradient id="paint2_linear_541_404" x1="870.56" y1="52.8506" x2="870.56" y2="21.8293" gradientUnits="userSpaceOnUse">
                            <stop stopColor="white" stopOpacity="0.64"/>
                            <stop offset="1" stopColor="white" stopOpacity="0.58"/>
                        </linearGradient>
                        <linearGradient id="paint3_linear_541_404" x1="1049.56" y1="52.8506" x2="1049.56" y2="21.8293" gradientUnits="userSpaceOnUse">
                            <stop stopColor="white" stopOpacity="0.64"/>
                            <stop offset="1" stopColor="white" stopOpacity="0.58"/>
                        </linearGradient>
                    </defs>
                    <foreignObject x="-300" y="-300" width="2520" height="703">
                    <div style={{backdropFilter: 'blur(150px)', clipPath: 'url(#bgblur_0_541_404_clip_path)', height: '100%', width: '100%'}}></div>
                    </foreignObject>
                    <path data-figma-bg-blur-radius="300" d="M1100.08 33.8185C1104.87 47.2292 1117.3 56.4011 1131.53 57.0143L1920 91V103H0V91L788.468 57.0143C802.695 56.4011 815.132 47.2292 819.922 33.8185L824.889 19.9099C829.154 7.97013 840.463 0 853.142 0H1066.86C1079.54 0 1090.85 7.97012 1095.11 19.9099L1100.08 33.8185Z" fill="black" fillOpacity="0.4"/>
                    <g opacity="0.9">
                    <path d="M961.25 21.8838C966.095 21.8838 969.709 23.3137 972.113 25.8779C974.52 28.4448 975.75 32.1839 975.75 36.8682C975.75 41.5524 974.521 45.3016 972.065 47.8789C969.612 50.4541 965.898 51.8965 960.852 51.8965H950.25V21.8838H961.25ZM955.862 47.4336H960.586C964.122 47.4336 966.535 46.5609 968.053 44.7607C969.562 42.9708 970.138 40.3166 970.138 36.8682C970.138 33.4197 969.561 30.7792 968.104 29.001C966.638 27.2108 964.325 26.3467 960.984 26.3467H955.862V47.4336Z" fill="white" fillOpacity="0.96"/>
                    <path d="M961.25 21.8838C966.095 21.8838 969.709 23.3137 972.113 25.8779C974.52 28.4448 975.75 32.1839 975.75 36.8682C975.75 41.5524 974.521 45.3016 972.065 47.8789C969.612 50.4541 965.898 51.8965 960.852 51.8965H950.25V21.8838H961.25ZM955.862 47.4336H960.586C964.122 47.4336 966.535 46.5609 968.053 44.7607C969.562 42.9708 970.138 40.3166 970.138 36.8682C970.138 33.4197 969.561 30.7792 968.104 29.001C966.638 27.2108 964.325 26.3467 960.984 26.3467H955.862V47.4336Z" fill="url(#paint0_linear_541_404)"/>
                    <path d="M961.25 21.8838C966.095 21.8838 969.709 23.3137 972.113 25.8779C974.52 28.4448 975.75 32.1839 975.75 36.8682C975.75 41.5524 974.521 45.3016 972.065 47.8789C969.612 50.4541 965.898 51.8965 960.852 51.8965H950.25V21.8838H961.25ZM955.862 47.4336H960.586C964.122 47.4336 966.535 46.5609 968.053 44.7607C969.562 42.9708 970.138 40.3166 970.138 36.8682C970.138 33.4197 969.561 30.7792 968.104 29.001C966.638 27.2108 964.325 26.3467 960.984 26.3467H955.862V47.4336Z" stroke="url(#paint1_linear_541_404)" strokeWidth="0.5"/>
                    </g>
                    <g opacity="0.3">
                    <foreignObject x="725.939" y="-105.671" width="289.24" height="286.021"><div style={{backdropFilter:'blur(63.75px)', clipPath:'url(#bgblur_1_541_404_clip_path)', height:'100%', width:'100%'}}></div></foreignObject><path data-figma-bg-blur-radius="127.5" d="M853.696 36.8379C853.354 37.0851 853.354 37.5948 853.696 37.842L874.313 52.7323C874.723 53.0281 875.295 52.7354 875.295 52.2302V44.7714H885.203C886.571 44.7714 887.68 43.6624 887.68 42.2943V32.3857C887.68 31.0176 886.571 29.9086 885.203 29.9086H875.295V22.4497C875.295 21.9445 874.723 21.6519 874.313 21.9477L853.696 36.8379Z" fill="url(#paint2_linear_541_404)" fillOpacity="0.5"/>
                    </g>
                    <g opacity="0.3">
                    <foreignObject x="904.939" y="-105.671" width="289.24" height="286.021"><div style={{backdropFilter:'blur(63.75px)', clipPath:'url(#bgblur_2_541_404_clip_path)', height:'100%', width:'100%'}}></div></foreignObject><path data-figma-bg-blur-radius="127.5" d="M1066.42 36.8379C1066.77 37.0851 1066.77 37.5948 1066.42 37.842L1045.81 52.7323C1045.4 53.0281 1044.82 52.7354 1044.82 52.2302V44.7714H1034.92C1033.55 44.7714 1032.44 43.6624 1032.44 42.2943V32.3857C1032.44 31.0176 1033.55 29.9086 1034.92 29.9086H1044.82V22.4497C1044.82 21.9445 1045.4 21.6519 1045.81 21.9477L1066.42 36.8379Z" fill="url(#paint3_linear_541_404)" fillOpacity="0.5"/>
                    </g>
                </svg>
            </div>


            <div className="fixed left-0 bottom-0 w-full">
                <img src="/assets/images/img_frame_bottom.png" alt="fixed-layout" className="w-full" />
            </div>

        </div>
    );
}