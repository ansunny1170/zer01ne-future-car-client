import { useRef, useState } from "react";
import QuestionArea from "./question-area";
import { useScene } from "@/app/context/scene-context";
import CloneTalk from "../ui/clone-talk";

export default function StepRepeat() {
    const { stepInfo } = useScene();
    const { question, choices, narrative } = stepInfo || {};
    const [questionFlag, setQuestionFlag] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    
    const handleAnimationComplete = () => {
        if (question) {
            timeoutRef.current = setTimeout(() => {
                setQuestionFlag(true);
            }, 1000);
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        }
    };
    
    return (
        <div className="absolute inset-0 text-amber-50 text-xl flex flex-col items-center justify-center text-center">
            <CloneTalk
                text={narrative || ""}
                onComplete={handleAnimationComplete}
            />

            <div className="text-2xl">
                {questionFlag && (
                    <QuestionArea 
                        mainText={question || ""} 
                        buttons={(choices || []).reduce((acc, choice) => {
                            acc[choice?.id || ""] = choice?.text || "";
                            return acc;
                        }, {} as { [key: string]: string })} 
                    />
                )}
            </div>
        </div>
    );
}