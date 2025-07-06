import React, { createContext, useContext, useState, useRef, useEffect, useMemo } from "react";
import { StepInfo } from "../\btype";

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
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [uiPath, setUiPath] = useState<string | null>(null);
  const [bgmPath, setBgmPath] = useState<string | null>(null);
  const [sfxPath, setSfxPath] = useState<string | null>(null);


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

  const goNextStep = (stepInfo: StepInfo) => {
    setStepNumber(stepNumber + 1);
    setVideoPath(stepInfo.video);
    setUiPath(stepInfo.ui);
    setBgmPath(stepInfo.bgm);
    setSfxPath(stepInfo.sfx);
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
        setAnswers
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