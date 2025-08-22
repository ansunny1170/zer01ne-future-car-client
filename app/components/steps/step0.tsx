
import { useSpeechProcessing } from "@/hooks/useSpeechProcessing";
import { useScene } from "@/context/scene-context";
import { StepInfo } from "@/type";
import { motion } from "framer-motion";
import TextSplitAnimation from "../text-split-animation";
import HyundaiLoading from "../ui/hyundai-loading";
import { useEffect } from "react";

export default function Step0({ dafultComment }: { dafultComment?: string }) { 
  const { mutateAsync: processSpeech, isPending: isProcessing } = useSpeechProcessing();
  const { setStepInfo, goNextStep, setSessionId, setBgmPath, setVideoPath } = useScene();

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // S키의 키코드 (83) 또는 한글 'ㄴ' 키를 눌렀을 때
      if ((event.code === 'KeyS') && !isProcessing) {
        handleSpeechTrigger("시작합시다");
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProcessing]);

  return (
    <div className="pl-8 absolute inset-0 text-white">
      <motion.div
        initial={{ opacity: 0, y: 0}}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="animate-fade-in absolute inset-0 flex flex-col items-center justify-center backdrop-blur-lg bg-black/10 z-[22]"
      >
        <HyundaiLoading size={177}/>
        <TextSplitAnimation delay={0.5} text="안녕하세요, 클론-21g입니다." className="text-center text-[83px] font-bold text-shadow-lg"/>
        <p className="text-center text-[36px] pt-[55px]">
          실시간 생성형 AI 체험에 오신 걸 환영합니다.<br/>
          이 체험은 대화로 진행됩니다.<br/>
          시작해 볼까요?
        </p>

      </motion.div>
    </div>
  );
}
