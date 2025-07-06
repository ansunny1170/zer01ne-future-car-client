"use client";

import Step0 from "../components/Steps/step0";
import Step1 from "../components/Steps/step1";
import Step2 from "../components/Steps/step2";
import VideoPlayer from "../components/video-player";
import { useScene } from "../context/scene-context";


export default function Home() {
  const { stepNumber, setStepNumber, setCategory, setCategoryNumber, lastSceneNumber, persona } = useScene();

  const renderStep = () => {
    switch (stepNumber) {
      case 0:
        return <Step0/>;
      case 1:
        return <Step1/>;
      case 2:
        return <Step2/>;
      case 3:
        return <Step1/>;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-start justify-center text-left h-screen cursor-none123 overflow-hidden">
      <VideoPlayer
        direction="center"
      />

      {/* <div className="hidden">
        <audio 
          key={category}
          src={`/audios/${category}_music.m4a`} 
          autoPlay
          loop
        />
      </div> */}

      <div className="absolute top-0 left-0 text-white z-10">[DEBUG] persona : {persona} / stepNumber : {stepNumber}</div>

      {renderStep()}

      <div>
        {
          stepNumber > 0 && (
          <button
            className="absolute top-4 left-4 bg-white text-black px-4 py-2 rounded-md z-10"
            onClick={() => {
              setStepNumber(stepNumber - 1);
              setCategory("a");
              setCategoryNumber(1);
            }}
            disabled={stepNumber === 0}
          >
            {stepNumber}
          </button>
        )}

        {
          stepNumber === lastSceneNumber && (
            <button
              className="absolute top-4 right-4 bg-white text-black px-4 py-2 rounded-md"
              onClick={() => {
                setStepNumber(0);
              }}
            >
              처음으로
            </button>
          )
        }
      </div>
    </div>
  );
}
