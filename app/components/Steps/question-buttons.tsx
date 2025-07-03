import { useScene } from "@/app/context/scene-context";
import { useState, useEffect } from "react";

export default function QuestionButtons({
    buttons
}: {
    buttons: { [key: string]: string },
}) {
    const { stepNumber, setStepNumber } = useScene();
    const [visible, setVisible] = useState<number>(-1);
    const [hasAnimated, setHasAnimated] = useState(false);

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
            *:focus:bg-gray-300 *:focus:scale-[105%] *:focus:text-white *:focus:font-bold *:focus:outline-none">
            {Object.keys(buttons).map((button, index) => (
                <button
                    key={index}
                    className={`min-w-40 h-30 rounded-full bg-white/80 backdrop-blur-sm duration-200`}
                    style={{
                        opacity: visible >= index ? 1 : 0,
                        transform: visible >= index ? "translateY(0)" : "translateY(20px)",
                        transition: "all 0.3s, transform 0.5s",
                        transitionDelay: `${index * 0.2}s`
                    }}
                    onClick={() => {
                        setStepNumber(stepNumber + 1);
                    }}
                >
                    {buttons[button]}
                </button>
            ))}
        </div>
    );
}