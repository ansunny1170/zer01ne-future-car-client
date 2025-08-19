import { AnimatePresence, motion } from "framer-motion";
import Lottie from "lottie-react";
import { useEffect, useState, useRef } from "react";
import loaderAnimation from '/public/assets/lotties/mcp_motion.json';

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
      const updated = [...prev, newItemWithId];
      // 2개 초과시 첫 번째 제거
      return updated.length > 2 ? updated.slice(-2) : updated;
    });
    
    setItemIdCounter(prev => prev + 1);
  }, [data.length]);

  return (
    <ul className="flex flex-col absolute left-8 top-24 gap-4 items-start text-left z-[999]">
      <AnimatePresence initial={false}>
        {displayItems.map((item, index) => (
          <motion.li
            key={item.id} // 고유 ID 사용
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.35 }}
            layout // 레이아웃 변경 시 자연스러운 이동
            className="flex justify-start items-center gap-2 text-white font-semibold max-w-[24vw] bg-black/5 backdrop-blur-2xl p-4 rounded-[24px] overflow-hidden relative"
            style={{
              backgroundClip: 'padding-box',
            }}
          >
            <div 
              className="absolute inset-0 rounded-[24px] opacity-50"
              style={{
                background: 'linear-gradient(-90deg, #4C8BFF 0%, #F7B094 72%, #FFC73B 100%)',
                padding: '2px',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                maskComposite: 'exclude',
              }}
            />
            <div className="w-[24px] h-[24px] flex items-center justify-center shrink-0 relative z-10">
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