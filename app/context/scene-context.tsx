import React, { createContext, useContext, useState, useRef, useEffect, useMemo } from "react";
import { StepInfo } from "../\btype";
import { STEP_DUMMY } from "../utils/constants";

// Context에서 사용할 타입 정의
export type SceneContextType = {
  channel: BroadcastChannel | null;
  sceneNumber: number;
  setSceneNumber: (n: number) => void;
  category: string;
  setCategory: (c: string) => void;
  categoryNumber: number | null;
  setCategoryNumber: (n: number | null) => void;
  lastSceneNumber: number;
  stepNumber: number;
  setStepNumber: (n: number) => void;
  persona: string | null;
  setPersona: (p: string | null) => void;
  goPrevStep: (stepInfo: StepInfo) => void;
  goNextStep: (stepInfo: StepInfo) => void;
  answers: {
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    step5: string;
    step6: string;
    step7: string;
  };
  videoPath: string | null;
  setVideoPath: (v: string | null) => void;
  uiPath: string | null;
  setUiPath: (u: string | null) => void;
  bgmPath: string | null;
  setBgmPath: (b: string | null) => void;
  sfxPath: string | null;
  setSfxPath: (s: string | null) => void;
  stepInfo: StepInfo | null;
  setStepInfo: (s: StepInfo | null) => void;

  setAnswers: (a: {
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    step5: string;
    step6: string;
    step7: string;
  }) => void;
};

const SceneContext = createContext<SceneContextType | undefined>(undefined);

export const SceneProvider = ({ children }: { children: React.ReactNode }) => {
  const [sceneNumber, setSceneNumber] = useState(1);
  const [category, setCategory] = useState("a");
  const [categoryNumber, setCategoryNumber] = useState<number | null>(1);
  const [stepNumber, setStepNumber] = useState(0);
  const [videoPath, setVideoPath] = useState<string | null>("prologue");
  const [uiPath, setUiPath] = useState<string | null>(null);
  const [bgmPath, setBgmPath] = useState<string | null>("night_synth.m4a");
  const [sfxPath, setSfxPath] = useState<string | null>(null);
  const [stepInfo, setStepInfo] = useState<StepInfo | null>(null);

  const [persona, setPersona] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    step5: string;
    step6: string;
    step7: string;
  }>({
    step1: "",
    step2: "",
    step3: "",
    step4: "",
    step5: "",
    step6: "",
    step7: "",
  });

  // BroadcastChannel 동기화 로직 추가
  const senderId = useRef(Date.now() + Math.random()).current;
  const channel = useMemo(
    () => (typeof window !== "undefined" ? new window.BroadcastChannel("my-channel") : null),
    []
  );
  const lastSceneNumber = 7;

  // 상태가 바뀐 뒤에만 메시지 전파 (모든 페이지에서 동기화)
  useEffect(() => {
    if (!channel) return;
    channel.postMessage({
      senderId,
      sceneNumber,
      category,
      categoryNumber,
      stepNumber
    });
  }, [sceneNumber, category, categoryNumber, channel, senderId, stepNumber]);

  useEffect(() => {
    setVideoPath(STEP_DUMMY[stepNumber as keyof typeof STEP_DUMMY]?.video || null);
    setUiPath(STEP_DUMMY[stepNumber as keyof typeof STEP_DUMMY]?.ui || null);
    setBgmPath(STEP_DUMMY[stepNumber as keyof typeof STEP_DUMMY]?.bgm || null);
    setSfxPath(STEP_DUMMY[stepNumber as keyof typeof STEP_DUMMY]?.sfx || null);

    // step 6에서 다음으로 넘어가면 (step 7) 부드러운 전환 후 0으로 이동
    if (stepNumber === 7) {
      setTimeout(() => {
        setStepNumber(0);
      }, 1000); // 1초 후 처음으로 돌아가기
    }
  }, [stepNumber]);

  const goPrevStep = () => {
    setStepNumber(stepNumber - 1);
  }

  const goNextStep = () => {
    setStepNumber(stepNumber + 1);
  }

  return (
    <SceneContext.Provider
      value={{
        channel,
        sceneNumber,
        setSceneNumber,
        category,
        setCategory,
        categoryNumber,
        setCategoryNumber,
        lastSceneNumber,
        stepNumber,
        setStepNumber,
        persona,
        setPersona,
        goPrevStep,
        goNextStep,
        videoPath,
        setVideoPath,
        uiPath,
        setUiPath,
        bgmPath,
        setBgmPath,
        sfxPath,
        setSfxPath,
        answers,
        setAnswers,
        stepInfo,
        setStepInfo
      }}
    >
      {children}
    </SceneContext.Provider>
  );
};

export const useScene = () => {
  const context = useContext(SceneContext);
  if (!context) throw new Error("useScene must be used within a SceneProvider");
  return context;
}; 