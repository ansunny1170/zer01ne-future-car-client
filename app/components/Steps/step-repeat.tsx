import { useEffect, useState } from "react";
import QuestionArea from "./question-area";
import TextAnimation from "./text-animation";
import { StepInfo } from "@/app/\btype";
import { useScene } from "@/app/context/scene-context";

export default function StepRepeat() {
    const { stepInfo } = useScene();
    const { assets, question, choices, narrative } = stepInfo as StepInfo;
    const [questionFlag, setQuestionFlag] = useState(false);

    useEffect(() => {
        console.log(stepInfo);
    }, [stepInfo]);
    
    const handleAnimationComplete = () => {
        // question이 있을 때만 나레이션이 끝난 후 1.5초 뒤에 질문 표시
        if (question) {
            setTimeout(() => {
                setQuestionFlag(true);
            }, 1500);
        }
    };
    
    return (
        <div className="absolute inset-0 text-amber-50 text-xl flex flex-col items-center justify-center text-center">
            <div className="absolute top-0">
                {assets.map((asset) => (
                    <h1 key={asset.id}>{asset.text}</h1>
                ))}
            </div>

            <div className="text-2xl">
                {questionFlag ? (
                    <QuestionArea 
                        mainText={question || ""} 
                        buttons={choices.reduce((acc, choice) => {
                            acc[choice.id] = choice.text;
                            return acc;
                        }, {} as { [key: string]: string })} 
                    />
                ) : (
                    <TextAnimation 
                        text={narrative || ""}
                        onComplete={handleAnimationComplete}
                        groupSize={2}
                        hideDuration={1800}
                        nextLineDuration={2000}
                    />
                )}
            </div>
        </div>
    );
}