  "use client";

import Step0 from "../components/steps/step0";
import StepRepeat from "../components/steps/step-repeat";
import { useScene } from "../context/scene-context";
import { AnimatePresence, motion } from "framer-motion";
import { STEP_DUMMY } from "../utils/constants";
import StepAudioPlayer from "../components/audio-player/step-audio-player";
import FixedLayout from "../components/fixed-layout";
import StepVideoPlayer from "../components/video-player/step-video-player";
import { useState } from "react";
import StepAudioSfxPlayer from "@/components/audio-player/step-audio-sfx-player";
import StepComplete from "@/components/steps/step-complete";

export default function Home() {
  const [debug, setDebug] = useState(false);
  const { stepNumber, setStepNumber, lastSceneNumber, goPrevStep, stepInfo } = useScene();

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
            transition={{ duration: 0.2 }}
          >
            <Step0 dafultComment="출발하자"/>
          </motion.div>
        );
      case 1:
        return (
          <motion.div
            key="step0"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
          <StepRepeat dafultComment="아이랑 산으로 캠핑"/>
          </motion.div>
        );
      case 6:
        return (
          <motion.div
            key="step0"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            <StepRepeat dafultComment="네 감사해요"/>
          </motion.div>
        );
      case 7:
        return (
          <motion.div
            key="step0"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
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
            transition={{ duration: 0.2 }}
          >
            <StepRepeat/>
          </motion.div>
        );
    }
  };

  return (
    <div className="flex flex-col items-start justify-center text-left w-full h-full overflow-hidden">

      {/* <div className="absolute top-4 right-4 text-white z-10 bg-amber-200">
        [DEBUG] videoPath: {videoPath} / bgmPath: {bgmPath}
      </div> */}

      {
        stepNumber > 0 && (
          <FixedLayout/>
        )
      }

      <StepVideoPlayer/>

      <StepAudioPlayer/> 

      <AnimatePresence mode="wait">
        {renderStep()}
      </AnimatePresence>

      <div>
        {
          stepNumber > 0 && (
          <button
            className="absolute top-4 left-4 bg-white text-black px-4 py-2 rounded-md z-10 z-[999]"
            onClick={() => {
              const prevStep = STEP_DUMMY[stepNumber - 1 as keyof typeof STEP_DUMMY];
              if (prevStep) {
                goPrevStep();
              }
            }}
            disabled={stepNumber === 0}
          >
            {stepInfo?.step}
          </button>
        )}

        {
          stepNumber > 0 && (
            <div className="absolute top-4 left-16 max-h-[90vh] overflow-y-auto bg-white max-w-1/2 text-black px-4 py-2 rounded-md z-[999]"> 
              <button
                onClick={() => {
                  setDebug(!debug);
                }}
              >
                step info 디버깅
              </button>
              {debug && (
                <pre>
                  {JSON.stringify(stepInfo, null, 2)}
                </pre>
              )}
          </div>
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
