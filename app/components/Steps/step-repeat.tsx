import { useEffect, useState } from "react";
import QuestionArea from "./question-area";
import TextAnimation from "./text-animation";
import { StepInfo } from "@/app/\btype";

export default function StepRepeat({stepInfo}: {stepInfo: StepInfo}) {
    const { ui, bgm, sfx, video, text, question } = stepInfo;
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
                <h1>{ui}</h1>
                <h1>{bgm}</h1>
                <h1>{sfx}</h1>
                <h1>{video}</h1>
            </div>

            <div className="text-2xl">
                {questionFlag ? (
                    <QuestionArea 
                        mainText={question?.title || ""} 
                        buttons={question?.content?.reduce((acc, item) => {
                            acc[item.main_text] = item.sub_text;
                            return acc;
                        }, {} as { [key: string]: string }) || {}} 
                    />
                ) : (
                    <TextAnimation 
                        text={text || ""}
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