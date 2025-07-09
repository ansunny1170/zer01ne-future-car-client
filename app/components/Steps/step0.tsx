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
      <div className="absolute w-[230px] h-[230px] rounded-2xl">
        {/* bg layer */}
        <div className="w-full h-full rounded-2xl relative">
          <p className="absolute inset-0 bg-radial-[at_50%_75%] from-indigo-400 to-sky-900/0 to-90% mix-blend-difference"></p>
          <p className="absolute inset-0 bg-white/10 p-16 rounded-2xl backdrop-blur-md z-[1]"></p>
        </div>

        {/* content layer */}
        <p className="text-center text-white absolute inset-0 flex items-center justify-center z-[2]">1234</p>
      </div>
      {
        dialogTimeOut && (
          <div className="absolute inset-0">
            <QuestionArea
              mainText={STEP_DUMMY[0].question?.title}
              subText={STEP_DUMMY[0].question?.subtitle}
              buttons={
                {
                  "시작": "시작"
                }
              }
              className="center"
            />
            <div className="absolute top-0 -translate-x-full left-1/2 ">
              <Speech keyword="시작" onTrigger={handleSpeechTrigger}/>
            </div>
          </div>
        )
      }

    </div>
  );
}