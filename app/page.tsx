"use client";

import { useEffect } from "react";
import VideoPlayer from "./components/video-player";
import Step0 from "./components/steps/step0";
import Step1 from "./components/steps/step1";
import useBroadcast from "./hooks/useBroadcast";
import Step2 from "./components/steps/step2";
import Step3 from "./components/steps/step3";

export default function Home() {
  const { channel, step, category, setStep, setCategory } = useBroadcast();

  useEffect(() => {
    channel.addEventListener("message", (event) => {
      setStep(event.data.step);
      setCategory(event.data.category);
    });
    return () => {
      channel.removeEventListener("message", (event) => {
        setStep(event.data.step);
        setCategory(event.data.category);
      });
      channel.close();
    };
  }, []);

  const renderStep = () => {
    switch (step) {
      case 0:
        return <Step0 setStep={setStep} />;
      case 1:
        return <Step1 category={category} setCategory={setCategory} />;
      case 2:
        return <Step2 category={category} setCategory={setCategory} />;
      case 3:
        return <Step3 category={category} setCategory={setCategory} />;
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

      <div>
        <button className="absolute top-4 left-4 bg-white text-black px-4 py-2 rounded-md" onClick={() => setStep(step - 1)}>
          이전 스텝
        </button>
        <span className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-2xl font-bold">{step}</span>
        <button className="absolute top-4 right-4 bg-white text-black px-4 py-2 rounded-md" onClick={() => setStep(step + 1)}>
          다음 스텝
        </button>
      </div>
    </div>
  );
}
