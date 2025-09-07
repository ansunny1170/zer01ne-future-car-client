import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import HudPopup from "./hud-popup";

export default function HudLayer({ onComplete, keyName }: { onComplete?: () => void, keyName: string }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // 컴포넌트 마운트 시 fade in
        setIsVisible(true);

        if (onComplete) {
            // 2.5초 후 fade out 시작 (0.5초 fade out 시간 고려)
            const fadeOutTimer = setTimeout(() => {
                setIsVisible(false);
            }, 2500);

            // 3초 후 완료 콜백 호출 (fade out 완료 후)
            const completeTimer = setTimeout(() => {
                onComplete();
            }, 4000);
            
            return () => {
                clearTimeout(fadeOutTimer);
                clearTimeout(completeTimer);
            };
        }
    }, [onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="absolute inset-0 perspective-1000"
                >
                    <div className="absolute bottom-[24%] left-[12%]" style={{ transform: 'scaleX(0.3) scaleY(0.35) rotateY(18deg)' }}>
                        <HudPopup keyName={keyName} />
                    </div>
                    <div className="absolute bottom-[15%] right-[16%]" style={{ transform: 'scaleX(0.4) scaleY(0.5) rotateY(-25deg)' }}>
                        <HudPopup keyName={keyName} />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}