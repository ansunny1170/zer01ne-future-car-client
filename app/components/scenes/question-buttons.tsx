import { useScene } from "@/context/scene-context";
import { useState, useEffect } from "react";

export default function QuestionButtons({
    buttons
}: {
    buttons: { [key: string]: string },
}) {
    const { sceneNumber, setSceneNumber, setCategory } = useScene();
    const [visible, setVisible] = useState<number>(-1);

    // 단축키 1~4 매핑
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const key = event.key;
            if (['1','2','3','4'].includes(key)) {
                const idx = parseInt(key, 10) - 1;
                const btnKeys = Object.keys(buttons);
                if (idx >= 0 && idx < btnKeys.length) {
                    const categoryKey = btnKeys[idx];
                    setSceneNumber(sceneNumber + 1);
                    setCategory(categoryKey);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [buttons, sceneNumber, setSceneNumber, setCategory]);

    useEffect(() => {
        let i = 0;
        setVisible(-1); // 초기화
        const interval = setInterval(() => {
            setVisible(v => v + 1);
            i++;
            if (i >= Object.keys(buttons).length) clearInterval(interval);
        }, 200); // 0.5초 간격
        return () => clearInterval(interval);
    }, [buttons]);

    return (
        <div className="flex flex-row gap-4
            *:p-2 *:bg-gray-200 *:text-gray-800 *:rounded-md *:duration-500 *:cursor-none
            *:hover:bg-gray-400 *:hover:scale-110 *:hover:text-white *:hover:font-bold
            *:focus:bg-gray-400 *:focus:scale-110 *:focus:text-white *:focus:font-bold *:focus:outline-none">
            {Object.keys(buttons).map((button, index) => (
                <button
                    key={index}
                    className={`min-w-40 h-30 rounded-full bg-white/80 backdrop-blur-sm transition-all duration-200`}
                    style={{
                        opacity: visible >= index ? 1 : 0,
                        transform: visible >= index ? "translateX(0)" : "translateX(-40px)",
                        transition: "opacity 0.8s, transform 0.5s",
                        transitionDelay: `${index * 0.5}s`
                    }}
                    onClick={() => {
                        setSceneNumber(sceneNumber + 1);
                        setCategory(button);
                    }}
                >
                    {buttons[button]}
                </button>
            ))}
        </div>
    );
}