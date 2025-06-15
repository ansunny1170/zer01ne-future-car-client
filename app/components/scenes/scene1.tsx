import { random } from "@/app/utils";
import QuestionArea from "./question-area";
import { SCENE_LIST, STEP_QUESTION_LIST } from "@/app/utils/constants";
import { useEffect } from "react";
import { useScene } from "@/app/context/scene-context";

export default function Scene1() {
  const { setCategoryNumber } = useScene();
  const buttons = STEP_QUESTION_LIST?.scene1?.category;

  useEffect(() => {
    setCategoryNumber(random(SCENE_LIST?.scene1?.a));
  }, [setCategoryNumber]);

  return (
    <div className="pl-8">
      <QuestionArea
        mainText={STEP_QUESTION_LIST?.scene1?.mainText}
        subText={STEP_QUESTION_LIST?.scene1?.subText}
        buttons={buttons}
        className="center"
      />
    </div>
  );
}