import React, { createContext, useContext, useState, useRef, useEffect, useMemo } from "react";

// Context에서 사용할 타입 정의
export type SceneContextType = {
  sceneNumber: number;
  setSceneNumber: (n: number) => void;
  category: string;
  setCategory: (c: string) => void;
  categoryNumber: number | null;
  setCategoryNumber: (n: number | null) => void;
  lastSceneNumber: number;
};

const SceneContext = createContext<SceneContextType | undefined>(undefined);

export const SceneProvider = ({ children }: { children: React.ReactNode }) => {
  const [sceneNumber, setSceneNumber] = useState(1);
  const [category, setCategory] = useState("a");
  const [categoryNumber, setCategoryNumber] = useState<number | null>(1);

  // BroadcastChannel 동기화 로직 추가
  const senderId = useRef(Date.now() + Math.random()).current;
  const channel = useMemo(
    () => (typeof window !== "undefined" ? new window.BroadcastChannel("my-channel") : null),
    []
  );
  const lastSceneNumber = 7;

  // 메시지 수신: 다른 탭/페이지에서 온 메시지로 상태 동기화
  useEffect(() => {
    if (!channel) return;
    channel.onmessage = (event: MessageEvent) => {
      if (event.data.senderId === senderId) return;
      if (event.data.sceneNumber > lastSceneNumber) {
        if (sceneNumber !== 1) setSceneNumber(1);
        if (categoryNumber !== event.data.categoryNumber) setCategoryNumber(event.data.categoryNumber);
      } else if (event.data.sceneNumber < 1) {
        if (sceneNumber !== lastSceneNumber) setSceneNumber(lastSceneNumber);
        if (categoryNumber !== 1) setCategoryNumber(1);
      } else if (event.data.sceneNumber === 1) {
        if (categoryNumber !== 1) setCategoryNumber(1);
        if (category !== "a") setCategory("a");
      } else {
        if (sceneNumber !== event.data.sceneNumber) setSceneNumber(event.data.sceneNumber);
        if (category !== event.data.category) setCategory(event.data.category);
        if (categoryNumber !== event.data.categoryNumber) setCategoryNumber(event.data.categoryNumber);
      }
    };
    return () => { channel.onmessage = null; };
  }, [channel, senderId, sceneNumber, category, categoryNumber, lastSceneNumber]);

  // 상태가 바뀐 뒤에만 메시지 전파 (모든 페이지에서 동기화)
  useEffect(() => {
    if (!channel) return;
    channel.postMessage({
      senderId,
      sceneNumber,
      category,
      categoryNumber
    });
  }, [sceneNumber, category, categoryNumber, channel, senderId]);

  return (
    <SceneContext.Provider
      value={{
        sceneNumber,
        setSceneNumber,
        category,
        setCategory,
        categoryNumber,
        setCategoryNumber,
        lastSceneNumber
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