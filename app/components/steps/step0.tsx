
import { useSpeechProcessing } from "@/hooks/useSpeechProcessing";
import { useScene } from "@/context/scene-context";
import { StepInfo } from "@/type";
import { motion } from "framer-motion";
import IntroSpeech from "../speech/intro-speech";

export default function Step0({ dafultComment }: { dafultComment?: string }) { 
  const { mutateAsync: processSpeech, isPending: isProcessing } = useSpeechProcessing();
  const { setStepInfo, goNextStep, setSessionId } = useScene();

  const handleSpeechTrigger = async (ttsText: string) => {
    const session_id = new Date().getTime().toString();
    setSessionId(session_id);
    const is_new_session = true;
    const user_message = ttsText;

    try {
     const response = await processSpeech({session_id, user_message, is_new_session});
     setStepInfo(response as unknown as StepInfo);
     goNextStep();
    } catch (error) {
      console.error('Speech processing failed:', error);
    }
  }

  return (
    <div className="pl-8 absolute inset-0 text-white">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="animate-fade-in absolute inset-0 flex flex-col items-center justify-center backdrop-blur-lg bg-black/10 z-[22]"
      >
        <p className="text-[24px] opacity-80 pb-[50px]">이 체험은 대화로 진행됩니다.</p>
        <h1 className="text-[96px] font-bold pb-[20px]">반가워요!</h1>
        <IntroSpeech
          onTrigger={handleSpeechTrigger}
          isProcessing={isProcessing}
          defaultComment={dafultComment}
          />
      </motion.div>
    </div>
  );
}
