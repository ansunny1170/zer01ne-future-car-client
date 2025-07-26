import { useState } from "react";
import Speech from "../speech";
import { useSpeechProcessing } from "@/hooks/useSpeechProcessing";
import Loading from "../loading";
import CloneTalk from "../ui/clone-talk";
import { useScene } from "@/context/scene-context";
import { StepInfo } from "@/type";

export default function Step0() { 
  const [talkingEnd, setTalkingEnd] = useState(false);
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
    <div className="pl-8 absolute inset-0">
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">

        <CloneTalk
          text={`안녕하세요. 저는 클론-21g입니다.\n저와 함께 미래차 경험을 시작해보시겠어요?\n테스트문장입니다.`}
          keepLastLine={true}
          onComplete={() => setTalkingEnd(true)}
        />

        {talkingEnd && (
          <div className="animate-fade-in">
            <Speech onTrigger={handleSpeechTrigger} isProcessing={isProcessing} />
          </div>
        )}
      </div>

      {isProcessing && (
        <Loading />
      )}
    </div>
  );
}
