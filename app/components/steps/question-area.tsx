import { cn } from "@/utils/cn";
import QuestionButtons from "./question-buttons";
import { motion } from "framer-motion";
import Speech from "../speech"; 
import { useScene } from "@/context/scene-context";
import { StepInfo } from "@/type";
import { useSpeechProcessing } from "@/hooks/useSpeechProcessing";

export default function QuestionArea({
    mainText,
    subText,
    buttons,
    className,
}: {
    mainText: string | null;
    subText?: string | null;
    className?: string;
    buttons: {
        [key: string]: string;
    };
}) {
    // 한 글자씩 배열로 분리
    const mainChars = mainText ? mainText.split('') : [];
    const subChars = subText ? subText.split('') : [];
    const { sessionId, setStepInfo, goNextStep, reStart } = useScene();
    const { mutateAsync: processSpeech, isPending: isProcessing } = useSpeechProcessing();

    const container = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.04 // 글자 간 딜레이
            }
        }
    };
    const char = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    };

    const handleSpeechTrigger = async (ttsText: string) => {
        const user_message = ttsText;
        const session_id = sessionId;
    
        try {
         const response = await processSpeech({session_id: session_id || "", user_message, is_new_session: false});
         if(response?.data?.현재_단계 === "4/4 완료"){
            reStart();
            return;
         }
         setStepInfo(response as unknown as StepInfo);
         goNextStep();
        } catch (error) {
          console.error('Speech processing failed:', error);
        }
      }

    return (
        <div className={cn("flex flex-col items-center justify-center h-full gap-16", className)}>
            {
                (mainText) && (
                    <Speech onTrigger={handleSpeechTrigger} isProcessing={isProcessing} />
                )
            }
            <div>
                {mainChars.length > 0 && (
                    <motion.h1
                        className="text-[32px] leading-[1.2] font-bold text-white break-keep max-w-[50vw]"
                        variants={container}
                        initial="hidden"
                        animate="visible"
                    >
                        {mainChars.map((c, idx) => (
                            <motion.span key={idx} variants={char}>
                                {c === '\n' ? <br /> : c}
                            </motion.span>
                        ))}
                    </motion.h1>
                )}
                {subChars.length > 0 && (
                    <motion.p
                        className="text-lg text-white/60 font-bold pt-2 break-keep max-w-[50vw]"
                        variants={container}
                        initial="hidden"
                        animate="visible"
                        transition={{ delayChildren: 1.5 }}
                    >
                        {subChars.map((c, idx) => (
                            <motion.span key={idx} variants={char}>
                                {c === '\n' ? <br /> : c}
                            </motion.span>
                        ))}
                    </motion.p>
                )}
            </div>
            <QuestionButtons buttons={buttons} />
        </div>
    );
}