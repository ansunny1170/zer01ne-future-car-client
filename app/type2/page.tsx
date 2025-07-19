"use client";

import Step0 from "../components/steps/step0";
import Step1 from "../components/steps/step1";
import StepRepeat from "../components/steps/step-repeat";
import StepVideoPlayer from "../components/video-player/step-video-player";
import { useScene } from "../context/scene-context";
import { AnimatePresence, motion } from "framer-motion";
import { STEP_DUMMY } from "../utils/constants";
import { StepInfo } from "../\btype";
import StepAudioPlayer from "../components/audio-player/step-audio-player";
import FixedLayout from "../components/fixed-layout";

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
      case 7:
        return (
          <motion.div
            key="step7"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            <StepRepeat stepInfo={STEP_DUMMY[7 as keyof typeof STEP_DUMMY] as StepInfo}/>
          </motion.div>
        );
      default:
        if (stepNumber >= 2 && stepNumber <= 6) {
          return (
            <motion.div
              key={`step${stepNumber}`}
              variants={fadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <StepRepeat stepInfo={STEP_DUMMY[stepNumber as keyof typeof STEP_DUMMY] as StepInfo}/>
            </motion.div>
          );
        }
        return null;
    }
  };

  return (
    <div className="flex flex-col items-start justify-center text-left w-full h-full overflow-hidden border-2 border-red-500">

      {/* <div className="absolute top-4 right-4 text-white z-10 bg-amber-200">
        [DEBUG] videoPath: {videoPath} / bgmPath: {bgmPath}
      </div> */}

      <FixedLayout/>

      <img src="/assets/images/bg_test.png" alt="fixed-layout" className="w-full object-cover" />
      
      {/* <StepVideoPlayer
        direction="center"
      /> */}

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
