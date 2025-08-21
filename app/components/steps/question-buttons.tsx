import { useScene } from "@/context/scene-context";
import { useState, useEffect } from "react";
import BasicBox from "../ui/basic-box";

export default function QuestionButtons({
    buttons,
    onSelect,
    isProcessing = false,
}: {
    buttons: { [key: string]: string },
    onSelect?: (key: string) => void,
    isProcessing?: boolean,
}) {
    const { stepNumber, setStepNumber } = useScene();
    const [visible, setVisible] = useState<number>(-1);
    const [hasAnimated, setHasAnimated] = useState(false);

    // 단축키 1~4 매핑
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (isProcessing || !hasAnimated) return; // 처리 중이거나 애니메이션 완료 전에는 허용하지 않음
            const key = event.key;
            if (['1','2','3','4'].includes(key)) {
                const idx = parseInt(key, 10) - 1;
                const btnKeys = Object.keys(buttons);
                if (idx >= 0 && idx < btnKeys.length) {
                    if (onSelect) onSelect(btnKeys[idx]);
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [buttons, hasAnimated, stepNumber, setStepNumber, onSelect, isProcessing]);

    useEffect(() => {
        if (hasAnimated) return; // 이미 애니메이션이 완료되었으면 다시 실행하지 않음
        
        setVisible(-1); // 초기화
        let i = 0;
        const interval = setInterval(() => {
            setVisible(v => v + 1);
            i++;
            if (i >= Object.keys(buttons).length) {
                clearInterval(interval);
                setHasAnimated(true); // 애니메이션 완료 표시
            }
        }, 200);
        return () => clearInterval(interval);
    }, [buttons, hasAnimated]);

    return (
        <div className="flex flex-row gap-4 *:p-2 *:bg-gray-200 *:text-gray-800 *:rounded-md *:duration-500 *:cursor-none
            *:hover:bg-gray-300 *:hover:scale-[105%] *:hover:text-white *:hover:font-bold *:hover:outline-none
            *:focus:bg-gray-300 *:focus:scale-[105%] *:focus:text-white *:focus:font-bold *:focus:outline-none z-[999]">
            {Object.keys(buttons).map((button, index) => (
                <BasicBox key={index} className="w-[20vw] break-keep items-center justify-center flex bg-black/20 backdrop-blur-2x">
                    <button
                        key={index}
                        style={{
                            opacity: visible >= index ? 1 : 0,
                            transform: visible >= index ? "translateY(0)" : "translateY(20px)",
                            transition: "all 0.3s, transform 0.5s",
                            transitionDelay: `${index * 0.2}s`
                        }}
                        onClick={() => {
                            if (isProcessing) return;
                            if (onSelect) onSelect(button);
                        }}
                        disabled={isProcessing}
                    >
                        <p className="font-bold text-lg">{button}</p>
                        {buttons[button]}
                    </button>
                </BasicBox>
            ))}
        </div>
    );
}