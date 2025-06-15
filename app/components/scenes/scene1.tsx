import { random } from "@/app/utils";
import QuestionArea from "./question-area";
import { SCENE_LIST, STEP_QUESTION_LIST } from "@/app/utils/constants";
import { useEffect } from "react";

export default function Scene1({ setSceneNumber, setCategory, setCategoryNumber }: {
  setSceneNumber: (sceneNumber: number) => void,
  setCategory: (category: string) => void,
  setCategoryNumber: (categoryNumber: number) => void
}) {
  const buttons = STEP_QUESTION_LIST?.scene1?.category;

  useEffect(() => {
    setCategoryNumber(random(SCENE_LIST?.scene1?.a));
  }, [setCategoryNumber]);

  return (
    <div className="flex flex-col items-start justify-center text-left h-screen cursor-none123 overflow-hidden z-10">
      <div className="pl-8">
        <QuestionArea
          mainText={STEP_QUESTION_LIST?.scene1?.mainText}
          subText={STEP_QUESTION_LIST?.scene1?.subText}
          buttons={buttons}
          sceneNumber={1}
          setSceneNumber={setSceneNumber}
          setCategory={setCategory}
          className="center"
        />
      </div>
    </div>
  );
}