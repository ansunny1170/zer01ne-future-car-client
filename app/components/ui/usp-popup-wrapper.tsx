import { AnimatePresence, motion } from "framer-motion";
import Lottie from "lottie-react";
import { useEffect, useState, useRef } from "react";
import loaderAnimation from '../../../public/assets/lotties/mcp_motion.json';

export default function UspPopupWrapper({ data }: { data: { description: string }[] }) {
  const [displayItems, setDisplayItems] = useState<{ description: string, id: number, hasPlayed: boolean }[]>([]);
  const [itemIdCounter, setItemIdCounter] = useState(0);

  useEffect(() => {
    if (data.length === 0) {
      setDisplayItems([]);
      return;
    }

    const newItem = data[data.length - 1];
    setDisplayItems(prev => {
      // 이미 같은 아이템이 있는지 확인
      const alreadyExists = prev.some(item => item.description === newItem.description);
      if (alreadyExists) return prev;

      const newItemWithId = { ...newItem, id: itemIdCounter, hasPlayed: false };
      return [...prev, newItemWithId];
    });
    
    setItemIdCounter(prev => prev + 1);
  }, [data.length]);

  return (
    <ul className="flex flex-col absolute left-[32px] top-[50px] gap-4 items-start text-left z-[60]">
      <AnimatePresence initial={false}>
        {displayItems.map((item, index) => (
          <motion.li
            key={item.id} // 고유 ID 사용
            initial={{ opacity: 0, x: 150 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.35 }}
            layout // 레이아웃 변경 시 자연스러운 이동
            className="flex justify-start items-center gap-4 text-white font-semibold max-w-[21vw] backdrop-blur-xl p-6 rounded-[32px] overflow-hidden relative"
            style={{
              background: 'rgba(0, 0, 0, 0.1)',
              borderRadius: '32px',
              position: 'relative',
            }}
          >
            {/* 좌상단 테두리 강조 */}
            <div 
              className="absolute inset-0 border-[1.5px] border-white/40 bg-white/10 rounded-[32px] pointer-events-none"
              style={{
                maskImage: 'radial-gradient(ellipse 80% 60% at top left, black 0%, black 60%, transparent 100%)',
              }}
            />
            {/* 우하단 테두리 강조 */}
            <div 
              className="absolute inset-0 border-[1.5px] border-white/40 bg-white/10 rounded-[32px] pointer-events-none"
              style={{
                maskImage: 'radial-gradient(ellipse 80% 60% at bottom right, black 0%, black 60%, transparent 100%)',
              }}
            />
            <div className="w-[32px] h-[32px] flex items-center justify-center shrink-0 relative z-10">
              <Lottie
                key={`lottie-${item.id}`}
                animationData={JSON.parse(JSON.stringify(loaderAnimation))}
                loop={false}
                autoplay={!item.hasPlayed} // 이미 재생된 경우 자동재생 안함
                style={{ width: '100%', height: '100%' }}
                rendererSettings={{
                  preserveAspectRatio: 'xMidYMid slice'
                }}
                initialSegment={item.hasPlayed ? [loaderAnimation.op - 1, loaderAnimation.op] : undefined} // 재생된 경우 마지막 프레임으로
                onComplete={() => {
                  // 애니메이션 완료 시 hasPlayed를 true로 설정
                  setDisplayItems(prev => 
                    prev.map(prevItem => 
                      prevItem.id === item.id 
                        ? { ...prevItem, hasPlayed: true }
                        : prevItem
                    )
                  );
                }}
              />
            </div>

            <span className="relative z-10">{item.description}</span>

            <b 
              className="whitespace-nowrap ml-4 relative z-10 bg-gradient-to-rbg-clip-text text-transparent opacity-90"
              style={{
                background: 'linear-gradient(-90deg, #4C8BFF 0%, #F7B094 72%, #FFC73B 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              AI 제안
            </b>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}