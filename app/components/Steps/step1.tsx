import { STEP_DUMMY } from "@/app/utils/constants";
import { useState, useEffect } from "react";
import QuestionArea from "./question-area";

export default function Step1() {
    const stepInfo = STEP_DUMMY[1];
    const { ui, bgm, sfx, video, text, question } = stepInfo;
    const [questionFlag, setQuestionFlag] = useState(false);
    const [currentLineIndex, setCurrentLineIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    
    const textLines = text.split('\n').filter(line => line.trim() !== '');
    // 두 줄씩 그룹화
    const textGroups = [];
    for (let i = 0; i < textLines.length; i += 2) {
        textGroups.push(textLines.slice(i, i + 2).join('\n'));
    }
    
    useEffect(() => {
        if (currentLineIndex >= textGroups.length) {
            // 나레이션이 끝난 후 1.5초 뒤에 질문 표시
            const questionTimer = setTimeout(() => {
                setQuestionFlag(true);
            }, 1500);
            
            return () => {
                clearTimeout(questionTimer);
            };
        }
        
        // 현재 줄을 보이게 함
        setIsVisible(true);
        
        // 1.8초 후 현재 줄을 숨김
        const hideTimer = setTimeout(() => {
            setIsVisible(false);
        }, 1800);
        
        // 2초 후 다음 줄로 이동
        const nextLineTimer = setTimeout(() => {
            setCurrentLineIndex(prev => prev + 1);
        }, 2000);
        
        return () => {
            clearTimeout(hideTimer);
            clearTimeout(nextLineTimer);
        };
    }, [currentLineIndex, textGroups.length]);
    
    return (
        <div className="absolute inset-0 text-amber-50 text-xl flex flex-col items-center justify-center text-center">
            <div className="absolute top-0">
                <h1>{ui}</h1>
                <h1>{bgm}</h1>
                <h1>{sfx}</h1>
                <h1>{video}</h1>
            </div>

            <div className="text-2xl">
                {
                    questionFlag ? (
                        <QuestionArea mainText={question.title} buttons={question.content.reduce((acc, item) => {
                            acc[item.main_text] = item.sub_text;
                            return acc;
                        }, {} as { [key: string]: string })} />
                    ) : (
                        <div className="whitespace-pre-wrap max-w-[90vw]">
                            {currentLineIndex < textGroups.length && (
                                <div 
                                    className={`transition-opacity duration-500 ${
                                        isVisible ? 'opacity-100' : 'opacity-0'
                                    }`}
                                >
                                    {textGroups[currentLineIndex]}
                                </div>
                            )}
                        </div>
                    )
                }
            </div>
        </div>
    );
}