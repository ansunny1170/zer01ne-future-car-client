import { cn } from "@/utils/cn";

export default function BasicPopupBox({children, type = "warm", className}: {children: React.ReactNode, type?: "warm" | "cold", className?: string}) {

  return (
    <div className="relative w-fit mt-24 rounded-[32px] overflow-hidden text-white">  
          {/* 그라데이션 */}
          <p className={cn(
            "absolute inset-0 scale-[calc(100%+2px)] blur-lg opacity-40 transition-all duration-300",
            type === "warm" ? "bg-[linear-gradient(to_right,#BB00FF_0%,#FF4D00_50%,#FF0033_100%)]"
            : "bg-[linear-gradient(to_right,#BFFF00_0%,#5CFFD9_50%,#0099FF_100%)]",
            "[mask-image:linear-gradient(to_top,black_0%,transparent_50%)] mix-blend-color-dodge",
            )}/>

          {/* 기본블러 */}
          <p className="absolute inset-0 [mask-image:linear-gradient(to_top,white_0%,transparent_100%)] backdrop-blur-2xl"/>
          {/* 기본 테두리 */}
          <p className="absolute inset-0 border-[1.5px] border-white/40 bg-white/10 rounded-[32px] [mask-image:linear-gradient(to_top,black_0%,transparent_80%)]"/>
          {/* overlay 테두리 */}
          <p className="absolute inset-0 border-[1.5px] border-white/30 rounded-[32px] [mask-image:linear-gradient(to_bottom,black_30%,transparent_80%)] mix-blend-overlay"/>
          
          <div className={cn("relative px-8 py-[90px] flex flex-col items-center gap-6 min-w-[500px]", className)}>
            {children}
          </div>
    </div>
  );
}