"use client";

import Step0 from "../components/Steps/step0";
import Step1 from "../components/Steps/step1";
import Step2 from "../components/Steps/step2";
import StepVideoPlayer from "../components/video-player/step-video-player";
import { useScene } from "../context/scene-context";
import { AnimatePresence, motion } from "framer-motion";
import { STEP_DUMMY } from "../utils/constants";
import { StepInfo } from "../\btype";
import StepAudioPlayer from "../components/audio-player/step-audio-player";


export default function Home() {
  const { stepNumber, setStepNumber, lastSceneNumber, videoPath, bgmPath, goPrevStep } = useScene();

  const fadeVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const renderStep = () => {
    switch (stepNumber) {
      case 0:
        return (
          <motion.div
            key="step0"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            <Step0/>
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
            transition={{ duration: 0.2 }}
          >
            <Step1/>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            key="step2"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            <Step2/>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-start justify-center text-left h-screen cursor-none123 overflow-hidden">

      <div className="absolute top-4 right-4 text-white z-10 bg-amber-200">
        [DEBUG] videoPath: {videoPath} / bgmPath: {bgmPath}
      </div>
      
      <StepVideoPlayer
        direction="center"
      />

      <StepAudioPlayer/>

      {/* <div className="hidden">
        <audio 
          key={category}
          src={`/audios/${category}_music.m4a`} 
          autoPlay
          loop
        />
      </div> */}

      <AnimatePresence mode="wait">
        {renderStep()}
      </AnimatePresence>

      <div>
        {
          stepNumber > 0 && (
          <button
            className="absolute top-4 left-4 bg-white text-black px-4 py-2 rounded-md z-10"
            onClick={() => {
              const prevStep = STEP_DUMMY[stepNumber - 1 as keyof typeof STEP_DUMMY];
              if (prevStep) {
                goPrevStep(prevStep as StepInfo);
              }
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
