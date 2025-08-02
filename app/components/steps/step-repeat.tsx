import { useEffect, useRef, useState } from "react";
import QuestionArea from "./question-area";
import { useScene } from "@/context/scene-context";
import CloneTalk from "../ui/clone-talk";
import PopupUiArray from "../ui/popup_ui/popup-ui-array";

export default function StepRepeat() {
    const { stepInfo } = useScene();    
    const { question, choices, assets_timeline } = stepInfo || {};
    const [questionFlag, setQuestionFlag] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    
    // const handleAnimationComplete = () => {
    //     if (question) {
    //         timeoutRef.current = setTimeout(() => {
    //             setQuestionFlag(true);
    //         }, 1000);
    //     }

    //     return () => {
    //         if (timeoutRef.current) {
    //             clearTimeout(timeoutRef.current);
    //         }
    //     }
    // };

    // useEffect(() => {
    //     if (!assets_timeline?.find(item => item.assets.find(asset => asset.type === 'CLONE_TALKS'))) {
    //         handleAnimationComplete();
    //     }
    // }, [assets_timeline]);
    
    return (
        <div className="absolute inset-0 text-amber-50 text-xl flex flex-col items-center justify-center text-center">
            
            {/* {
                assets_timeline?.[0]?.assets?.[0]?.type === 'CLONE_TALKS' && (
                    <CloneTalk
                        text={assets_timeline?.[0]?.assets?.[0]?.text || ""}
                        onComplete={handleAnimationComplete}
                    />
                )
            } */}

            <PopupUiArray assets_timeline={assets_timeline} setQuestionFlag={setQuestionFlag}/>

            <div className="text-2xl">
                {questionFlag && (
                    <QuestionArea 
                        mainText={question || ""} 
                        buttons={(choices || []).reduce((acc, choice) => {
                            acc[choice?.usp || ""] = choice?.description || "";
                            return acc;
                        }, {} as { [key: string]: string })} 
                    />
                )}
            </div>
        </div>
    );
}