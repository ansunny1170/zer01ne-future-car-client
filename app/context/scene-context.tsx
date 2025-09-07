import React, { createContext, useContext, useState, useRef, useEffect, useMemo } from "react";
import { StepInfo } from "../type";
import { bgmDict, bgvDict } from "@/utils/constants";

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
  goPrevStep: () => void;
  goNextStep: () => void;
  videoPath: string | null;
  setVideoPath: (v: string | null) => void;
  uiPath: string | null;
  setUiPath: (u: string | null) => void;
  bgmPath: string | null;
  setBgmPath: (b: string | null) => void;
  sfxPath: string[] | null;
  setSfxPath: (s: string[] | null) => void;
  onSfxComplete?: () => void;
  setOnSfxComplete: (callback: (() => void) | undefined) => void;
  stepInfo: StepInfo | null;
  setStepInfo: (s: StepInfo | null) => void;
  sessionId: string | null;
  setSessionId: (s: string | null) => void;
  reStart: () => void;
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
  const [sfxPath, setSfxPath] = useState<string[] | null>(null);
  const [onSfxComplete, setOnSfxComplete] = useState<(() => void) | undefined>();
  const [stepInfo, setStepInfo] = useState<StepInfo | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

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
    setStepInfo(stepInfo);
    setVideoPath(stepInfo?.bgv?.file_name || bgvDict[Math.floor(Math.random() * bgvDict.length)].file_name || null );
    setBgmPath(stepInfo?.bgm?.file_name || bgmDict[Math.floor(Math.random() * bgmDict.length)].file_name || null);

    if (!stepInfo?.step){
      setVideoPath("intro1_1.mp4");
    }
    
    // stepInfo 변경 시 sfxPath 초기화 - null로 설정
    setSfxPath(null);
  }, [stepInfo]);

  const goPrevStep = () => {
    setStepNumber(stepNumber - 1);
  }

  const goNextStep = () => {
    setStepNumber(stepNumber + 1);
  }

  const reStart = () => {
    setStepNumber(0);
    setSessionId(null);
    setStepInfo(null);
    setVideoPath(null);
    setUiPath(null);
    setBgmPath(null);
    setSfxPath(null);
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
        onSfxComplete,
        setOnSfxComplete,
        stepInfo,
        setStepInfo,
        sessionId,
        setSessionId,
        reStart
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