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
      <div className="relative w-fit">
        
        {/* 배경 블러 효과 */}
        <div className="absolute inset-0 scale-90 rounded-[32px] bg-gradient-to-t from-sky-500 to-indigo-500 mix-blend-overlay"></div>
        
        {/* 그라데이션 테두리 */}
        <div className="relative rounded-[32px] p-[1.5px] bg-[linear-gradient(to_top,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0.8)_10%,rgba(255,255,255,0.2)_40%,rgba(255,255,255,0.1)_60%,rgba(255,255,255,0.2)_80%)]">
          {/* 내용 + 배경 */}
          <div className="animate-fade-in relative z-10 rounded-[31px] backdrop-blur-lg bg-white/5 px-8 py-6">
            
            <div className="text-white text-6xl font-bold mb-2">78%</div>
            <div className="text-white/80 text-xl">브레이크 패드 마모도</div>
          
            
          </div>
        </div>
      </div>

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
