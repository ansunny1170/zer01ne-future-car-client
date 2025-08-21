import { cn } from "@/utils/cn";
import QuestionButtons from "./question-buttons";
import Speech from "../speech"; 
import { useScene } from "@/context/scene-context";
import { useRef, useState } from "react";
import { StepInfo } from "@/type";
import { useSpeechProcessing } from "@/hooks/useSpeechProcessing";
import CloneTalkSplit from "../ui/clone-talk-split";
import HyundaiLoading from "../ui/hyundai-loading";

export default function QuestionArea({
    mainText,
    buttons,
    className,
    defaultComment,
}: {
    mainText: string | null;
    subText?: string | null;
    className?: string;
    buttons: {
        [key: string]: string;
    };
    defaultComment?: string;
}) {
    // 한 글자씩 배열로 분리
    // const mainChars = mainText ? mainText.split('') : [];
    const { sessionId, setStepInfo, goNextStep, reStart } = useScene();
    const { mutateAsync: processSpeech, isPending } = useSpeechProcessing();

    // 추가 가드: 렌더 사이에도 동작을 막기 위한 ref/state
    const processingRef = useRef(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSpeechTrigger = async (ttsText: string) => {
        // 이미 처리 중이면 추가 호출을 방지
        if (processingRef.current) return;
        processingRef.current = true;
        setIsProcessing(true);
        const user_message = ttsText;
        const session_id = sessionId;
    
        try {
         const response = await processSpeech({session_id: session_id || "", user_message, is_new_session: false});
         if(response?.data?.step === 7){
            reStart();
            return;
         }
         setStepInfo(response as unknown as StepInfo);
         goNextStep();
        } catch (error) {
          console.error('Speech processing failed:', error);
        } finally {
          processingRef.current = false;
          setIsProcessing(false);
        }
      }

    return (
        <div className={cn("flex flex-col items-center justify-center h-full gap-16", className)}>
            {
                !isProcessing && (
                    <>
                    {mainText && (
                        <CloneTalkSplit text={mainText} keepLastLine={true} onComplete={() => {}} />
                    )}
                    <div className="absolute top-[20%] inset-0 flex flex-col items-center justify-start gap-24">
                        {
                            buttons && (
                                <QuestionButtons buttons={buttons} onSelect={handleSpeechTrigger} isProcessing={isProcessing || isPending} />
                            )
                        }
                        {
                            (mainText) && (
                                <Speech onTrigger={handleSpeechTrigger} isProcessing={isProcessing} defaultComment={defaultComment}/>
                            )
                        }
                    </div>
                    </>
                )
            }

            {
                isProcessing && (
                    <div className="fixed top-[5%] w-full flex flex-col items-center justify-center">
                        <HyundaiLoading size={177} text="더 좋은 응답을 위해 생각하는 중입니다..."/>
                    </div>
                )
            }
        </div>
    );
}