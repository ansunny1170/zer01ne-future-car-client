import { useEffect, useState } from "react";
import Speech from "../speech";
import { useSpeechProcessing } from "@/app/hooks/useSpeechProcessing";
import Loading from "../loading";
import TextAnimation from "./text-animation";
import CloneTalk from "../ui/clone-talk";

export default function Step0() {
  const [dialogTimeOut, setDialogTimeOut] = useState(false);
  const { mutateAsync: processSpeech, isPending: isProcessing } = useSpeechProcessing();

  const handleSpeechTrigger = async (ttsText: string) => {
    const session_id = new Date().getTime().toString();
    const is_new_session = true;
    const user_message = ttsText;

    try {
      await processSpeech({session_id, user_message, is_new_session});
      // setStepNumber(1);
    } catch (error) {
      console.error('Speech processing failed:', error);
    }
  }

  useEffect(() => {
    // 마운트 되고 1.5초 후에 dialogTimeOut.current를 true로 변경
    setTimeout(() => {
      setDialogTimeOut(true);
    }, 0);
  }, []);

  return (
    <div className="pl-8 absolute inset-0">
      {dialogTimeOut && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {/* <TextAnimation 
            text={`안녕하세요. 저는 오늘 날씨를 알려드리는 인공지능 에이전트 조이입니다.\n오늘 날씨는 어때요? 기분은 어떠신가요?\n퇴근길에 맞는 노래를 들으며 퇴근하세요.`}
            // onComplete={handleAnimationComplete}
            className="text-white text-[42px] font-bold"
            groupSize={2}
            hideDuration={2000}
            nextLineDuration={2800}
            keepLastLine={true}
          /> */}
          <CloneTalk
            text={`안녕하세요. 저는 오늘 날씨를 알려드리는 인공지능 에이전트 조이입니다.\n오늘 날씨는 어때요? 기분은 어떠신가요?\n퇴근길에 맞는 노래를 들으며 퇴근하세요.`}
            keepLastLine={true}
          />

          <div className="absolute top-0 -translate-x-full left-1/2">
            <Speech onTrigger={handleSpeechTrigger}/>
          </div>
        </div>
      )}

      {isProcessing && (
        <Loading />
      )}
    </div>
  );
}
