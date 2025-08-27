import { useEffect } from "react";
import HudSamplePopup from "./hud-sample-popup";

export default function HudSampleLayer({ onComplete }: { onComplete?: () => void }) {
    useEffect(() => {
        // 3초 후 완료 콜백 호출
        if (onComplete) {
            const timer = setTimeout(() => {
                onComplete();
            }, 3000);
            
            return () => clearTimeout(timer);
        }
    }, [onComplete]);

    return (
        <div className="absolute inset-0 perspective-1000">
            <div className="absolute bottom-[50px] left-[5%]" style={{ transform: 'scale(0.4) rotateY(15deg)' }}>
                <HudSamplePopup />
            </div>
            <div className="absolute bottom-[70px] right-[8%]" style={{ transform: 'scale(0.4) rotateY(-10deg)' }}>
                <HudSamplePopup />
            </div>
        </div>
    )
}