  "use client";

import Step0 from "@/components/steps/step0";
import StepRepeat from "@/components/steps/step-repeat";
import { useScene } from "@/context/scene-context";
import { AnimatePresence, motion } from "framer-motion";
import StepAudioPlayer from "@/components/audio-player/step-audio-player";
import StepVideoPlayer from "@/components/video-player/step-video-player";
import { useState, useEffect } from "react";
import StepComplete from "@/components/steps/step-complete";
import BottomLayout from "@/components/fixed-layout/bottom-layout";
import TopLayout from "@/components/fixed-layout/top-layout";
import Step1 from "@/components/steps/step1";
import { useDevTrigger } from "@/hooks/useDevTrigger";

export default function Home() {
  const [debug, setDebug] = useState(false);
  // 🥚 개발자 전용 디버그 패널 표시 여부 (localStorage 영속)
  const [devMode, setDevMode] = useState(false);
  const { stepNumber, goPrevStep, stepInfo } = useScene();

  // localStorage에서 devMode 초기값 로드 (SSR 하이드레이션 불일치 방지 위해 effect에서)
  useEffect(() => {
    setDevMode(localStorage.getItem("ftcar_dev_mode") === "true");
  }, []);

  const toggleDevMode = () => {
    setDevMode((prev) => {
      const next = !prev;
      localStorage.setItem("ftcar_dev_mode", String(next));
      return next;
    });
  };

  // 트리거: Ctrl/Cmd+Shift+D 또는 좌상단 구석 3연속 클릭
  useDevTrigger({ code: "KeyD", corner: "top-left" }, toggleDevMode);

  const fadeVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const renderStep = () => {
    switch (stepInfo?.step) {
      case undefined:
        return (
          <motion.div
            key="step0"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.05 }}
          >
            <Step0 dafultComment="출발하자"/>
          </motion.div>
        );
      case 1:
        return (
          <motion.div
            key="step1"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.05 }}
          >
            <Step1 dafultComment="제로원 팀원들이랑 다같이 야구보러 갔다가 제로원데이전시보러 가려고"/>
          </motion.div>
        );
      case 6:
        return (
          <motion.div
            key="step6"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.05 }}
          >
            <StepRepeat dafultComment="네 감사해요"/>
          </motion.div>
        );
      case 7:
        return (
          <motion.div
            key="step7"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.05 }}
          >
            <StepComplete/>
          </motion.div>
        );
      default:
        return (
          <motion.div
            key={`step${stepNumber}`}
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.05 }}
          >
            <StepRepeat/>
          </motion.div>
        );
    }
  };

  return (
    <div className="flex flex-col items-start justify-center text-left w-full h-full overflow-hidden">

      {
        stepNumber > 0 && (
          <>
            <TopLayout/>
            <BottomLayout/>
          </>
        )
      }

      <StepVideoPlayer/>

      <StepAudioPlayer/> 

      <AnimatePresence>
        {renderStep()}
      </AnimatePresence>

      {
        devMode && (
          <div>
            <button
              className="absolute top-[15%] left-4 bg-white text-black px-4 py-2 rounded-md z-[999]"
              onClick={() => {
                goPrevStep();
              }}
            >
              {stepInfo?.step}
            </button>

            <div className="absolute top-[15%] left-16 max-h-[90vh] overflow-y-auto bg-white max-w-1/2 text-black px-4 py-2 rounded-md z-[999]"> 
              <button
                onClick={() => {
                  setDebug(!debug);
                }}
              >
                step info 디버깅
              </button>
              {stepInfo?.flatAssetsParsed && (
                <span className="ml-2 text-red-600 font-bold">flat asset 파싱 진행함</span>
              )}
              {typeof stepInfo?.aiResponseTime === "number" && (
                <span className="ml-2 text-blue-600 font-bold">AI 응답시간 {stepInfo.aiResponseTime}초</span>
              )}
              {stepInfo?.aiModel && (
                <span className="ml-2 text-blue-600 font-bold">
                  model {stepInfo.aiModel}
                  {stepInfo.aiReasoningEffort ? ` · reasoning ${stepInfo.aiReasoningEffort}` : ""}
                  {stepInfo.aiVerbosity ? ` · verbosity ${stepInfo.aiVerbosity}` : ""}
                </span>
              )}
              {debug && (
                <pre className="h-[40vh] overflow-y-auto">
                  {JSON.stringify(stepInfo, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )
      }
    </div>
  );
}
