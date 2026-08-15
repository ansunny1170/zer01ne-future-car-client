  "use client";

import Step0 from "@/components/steps/step0";
import StepRepeat from "@/components/steps/step-repeat";
import { useScene } from "@/context/scene-context";
import { AnimatePresence, motion } from "framer-motion";
import StepAudioPlayer from "@/components/audio-player/step-audio-player";
import StepVideoPlayer from "@/components/video-player/step-video-player";
import { useState, useEffect, useRef } from "react";
import StepComplete from "@/components/steps/step-complete";
import BottomLayout from "@/components/fixed-layout/bottom-layout";
import TopLayout from "@/components/fixed-layout/top-layout";
import Step1 from "@/components/steps/step1";
import { useDevTrigger } from "@/hooks/useDevTrigger";

// Speech 컴포넌트의 longPressThreshold 와 맞춰야 한다 (app/components/speech/index.tsx)
const LONG_PRESS_MS = 1200;

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

  // 🥚 개발자 전용: 키보드 조작(S/Space)을 버튼으로 대체.
  // Speech 가 window 의 keydown/keyup 을 직접 듣고 있어서, 합성 키 이벤트를 쏘면
  // 실제 키 입력과 똑같은 경로를 탄다. 키 동작 로직을 여기서 복제하지 않으므로
  // Speech 쪽이 바뀌어도 버튼이 자동으로 따라간다.
  const [sKeyLongPressing, setSKeyLongPressing] = useState(false);
  const sKeyTimerRef = useRef<NodeJS.Timeout | null>(null);

  const dispatchKey = (type: "keydown" | "keyup", code: string) => {
    window.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }));
  };

  // 짧게: 첫 번째는 마이크 시작, 이후는 녹음 재시작(스크립트 초기화)
  const pressSKeyShort = () => {
    if (sKeyTimerRef.current) return;
    dispatchKey("keydown", "KeyS");
    sKeyTimerRef.current = setTimeout(() => {
      dispatchKey("keyup", "KeyS");
      sKeyTimerRef.current = null;
    }, 60);
  };

  // 길게: Speech 의 전송 타이머가 발동하려면 threshold 를 넘겨서 눌러야 한다
  const pressSKeyLong = () => {
    if (sKeyTimerRef.current) return;
    setSKeyLongPressing(true);
    dispatchKey("keydown", "KeyS");
    sKeyTimerRef.current = setTimeout(() => {
      dispatchKey("keyup", "KeyS");
      sKeyTimerRef.current = null;
      setSKeyLongPressing(false);
    }, LONG_PRESS_MS + 150);
  };

  const pressSpaceKey = () => dispatchKey("keydown", "Space");

  // 언마운트 시 keyup 을 못 보내면 Speech 의 keyDownTimeRef 가 0 으로 안 돌아가
  // 이후 실제 S 키 입력이 막힌다 — 타이머를 정리하면서 keyup 을 반드시 내보낸다.
  useEffect(() => {
    return () => {
      if (sKeyTimerRef.current) {
        clearTimeout(sKeyTimerRef.current);
        sKeyTimerRef.current = null;
        window.dispatchEvent(new KeyboardEvent("keyup", { code: "KeyS", bubbles: true }));
      }
    };
  }, []);

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
            {/* step info 박스(z-999, left-16)를 가리지 않도록 z-index 를 그 아래로 두고
                버튼은 세로로 쌓아 좌측 폭만 차지하게 한다 */}
            <div className="absolute top-[15%] left-4 flex flex-col items-start gap-2 z-[998]">
              <button
                className="bg-white text-black px-4 py-2 rounded-md"
                onClick={() => {
                  goPrevStep();
                }}
              >
                {stepInfo?.step}
              </button>

              {/* 🥚 개발자 전용: 키보드 없이 S/Space 조작을 대신하는 버튼 */}
              <div className="flex flex-col gap-1 text-[12px] w-fit">
                <button
                  className="bg-white text-black px-2 py-1 rounded-md whitespace-nowrap w-full"
                  title="S 짧게 누르기 — 첫 번째는 마이크 시작, 이후는 녹음 재시작(스크립트 초기화)"
                  onClick={pressSKeyShort}
                >
                  S 짧게
                </button>
                <button
                  className="bg-white text-black px-2 py-1 rounded-md whitespace-nowrap w-full disabled:opacity-50"
                  title={`S 길게 누르기(${LONG_PRESS_MS}ms) — 녹음된 텍스트 전송`}
                  onClick={pressSKeyLong}
                  disabled={sKeyLongPressing}
                >
                  {sKeyLongPressing ? "S 길게…" : "S 길게"}
                </button>
                <button
                  className="bg-white text-black px-2 py-1 rounded-md whitespace-nowrap w-full"
                  title="Space — 기본 답변(defaultComment) 즉시 전송"
                  onClick={pressSpaceKey}
                >
                  Space
                </button>
              </div>
            </div>

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
              {stepInfo?.aiPromptName && (
                <span className="ml-2 text-green-700 font-bold">prompt {stepInfo.aiPromptName}</span>
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
