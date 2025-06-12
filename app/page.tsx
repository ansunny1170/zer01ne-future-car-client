"use client";

import { useEffect } from "react";
import VideoPlayer from "./components/video-player";
import Step0 from "./components/steps/step0";
import Step1 from "./components/steps/step1";
import useBroadcast from "./hooks/useBroadcast";

export default function Home() {
  const { channel, step, category, handlePostMessage } = useBroadcast();

  useEffect(() => {
    channel.addEventListener("message", (event) => {
      handlePostMessage(event.data);
    });
    return () => {
      channel.removeEventListener("message", (event) => {
        handlePostMessage(event.data);
      });
      channel.close();
    };
  }, []);

  const renderStep = () => {
    switch (step) {
      case 0:
        return <Step0 handleNextStep={() => handlePostMessage({step: 1, category: "a"})} />;
      case 1:
        return <Step1 category={category} handleClick={(selectedCategory) => handlePostMessage({step: 2, category: selectedCategory})} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-start justify-center text-left h-screen cursor-none123 overflow-hidden">
      <VideoPlayer step={step} category={category} direction="center" />
      <div className="hidden">
        <audio 
          key={category}
          src={`/audios/${category}_music.m4a`} 
          autoPlay
          loop
        />
      </div>

      {renderStep()}

    </div>
  );
}
