export default function PopupUI({children}: {children: React.ReactNode}) {
  return (
    <div className="relative w-fit ml-24 rounded-[32px] overflow-hidden">  
          {/* 그라데이션 */}
          <p className="absolute inset-0 scale-[calc(100%+2px)] blur-lg opacity-40 bg-[linear-gradient(to_right,#BB00FF_0%,#FF4D00_50%,#FF0033_100%)] [mask-image:linear-gradient(to_top,black_0%,transparent_20%)] mix-blend-color-dodge"/>

          {/* 기본블러 */}
          <p className="absolute inset-0  backdrop-blur-sm"/>
          {/* 기본 테두리 */}
          <p className="absolute inset-0 border-[1.5px] border-white/40 bg-white/10 rounded-[32px] [mask-image:linear-gradient(to_top,black_0%,transparent_80%)]"/>
          {/* overlay 테두리 */}
          <p className="absolute inset-0 border-[1.5px] border-white/30 rounded-[32px] backdrop-blur-md [mask-image:linear-gradient(to_bottom,black_50%,transparent_80%)] mix-blend-overlay"/>
          
          <div className="relative px-8 py-6">
            {children}
          </div>
    </div>
  );
}