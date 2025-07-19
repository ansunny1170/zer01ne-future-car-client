import { useEffect, useState } from "react";
import Speech from "../speech";
import { useSpeechProcessing } from "@/app/hooks/useSpeechProcessing";
import Loading from "../loading";
import CloneTalk from "../ui/clone-talk";

export default function Step0() {
  const [talkingEnd, setTalkingEnd] = useState(false);
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

  return (
    <div className="pl-8 absolute inset-0">
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
          text={`안녕하세요. 저는 클론-21g입니다.\n저와 함께 미래차 경험을 시작해보시겠어요?`}
          keepLastLine={true}
          onComplete={() => alert('complete')}
        />

        <div className="">
          <Speech onTrigger={handleSpeechTrigger}/>
        </div>
      </div>

      {isProcessing && (
        <Loading />
      )}
    </div>
  );
}
