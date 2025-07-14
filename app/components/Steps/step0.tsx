import { useEffect, useState } from "react";
import { useScene } from "@/app/context/scene-context";
import Speech from "../speech";
import QuestionArea from "../Steps/question-area";
import { STEP_DUMMY } from "@/app/utils/constants";


export default function Step0() {
  const { setStepNumber } = useScene();
  const [dialogTimeOut, setDialogTimeOut] = useState(false);

  const handleSpeechTrigger = () => {
    setStepNumber(1);
  }

  useEffect(() => {
    // 마운트 되고 1.5초 후에 dialogTimeOut.current를 true로 변경
    setTimeout(() => {
      setDialogTimeOut(true);
    }, 0);
  }, []);

  return (
    <div className="pl-8">
      {dialogTimeOut && (
        <div className="absolute inset-0">
          <QuestionArea
            mainText={STEP_DUMMY[0].question?.title}
            subText={STEP_DUMMY[0].question?.subtitle}
            buttons={{
              "시작": "시작"
            }}
            className="center"
          />
          <div className="absolute top-0 -translate-x-full left-1/2">
            <Speech keyword="시작" onTrigger={handleSpeechTrigger}/>
          </div>
        </div>
      )}
    </div>
  );
}
