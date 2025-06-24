import { random } from "@/app/utils";
import QuestionArea from "./question-area";
import { SCENE_LIST, STEP_QUESTION_LIST } from "@/app/utils/constants";
import { useEffect, useRef, useState } from "react";
import { useScene } from "@/app/context/scene-context";
import Speech from "../speech";

type Scene1Category = keyof typeof SCENE_LIST.scene1;

export default function Scene1() {
  const { setCategoryNumber, category, setSceneNumber, setCategory } = useScene();
  const buttons = STEP_QUESTION_LIST?.scene1?.category;
  const initialCategoryNumber = useRef(false);
  const [dialogTimeOut, setDialogTimeOut] = useState(false);

  const handleSpeechTrigger = () => {
    setSceneNumber(2);
    setCategory("a");
  }

  useEffect(() => {
    if (!initialCategoryNumber.current) {
      const value = SCENE_LIST?.scene1?.[category as Scene1Category];
      if (value !== undefined) {
        const randomNumber = random(value);
        setCategoryNumber(randomNumber);
      }
      initialCategoryNumber.current = true;
    }

    // 마운트 되고 1.5초 후에 dialogTimeOut.current를 true로 변경
    setTimeout(() => {
      setDialogTimeOut(true);
    }, 0);

    return () => {
      initialCategoryNumber.current = false;
    }
  }, []);

  return (
    <div className="pl-8">
      {
        dialogTimeOut && (
          <div className="absolute inset-0">
            <QuestionArea
              mainText={STEP_QUESTION_LIST?.scene1?.mainText}
              subText={STEP_QUESTION_LIST?.scene1?.subText}
              buttons={buttons}
              className="center"
            />
            <div className="absolute top-1/2 translate-y-full left-0 ">
              <Speech keyword="시작" onTrigger={handleSpeechTrigger}/>
            </div>
          </div>
        )
      }

    </div>
  );
}