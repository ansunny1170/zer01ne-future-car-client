import DirectionLeft from "../icons/direction-left";

export default function NavigationBox() {
  return (
    <div className="flex items-center gap-[16px] text-white">
        <div className="w-[64px] h-[64px] grow flex items-center justify-center">
            <DirectionLeft />
        </div>
        <div className="leading-[1.2]">
            <p className="text-[35px] font-bold">450m</p>
            <p className="text-[22px] opacity-60">Daewangpangyo-ro</p>
        </div>
    </div>
  );
} 