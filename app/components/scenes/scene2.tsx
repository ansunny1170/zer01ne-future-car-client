import { random } from "@/app/utils";
import { SCENE_LIST, STEP_QUESTION_LIST } from "@/app/utils/constants";
import { useEffect, useRef } from "react";
import QuestionArea from "./question-area";
import { useScene } from "@/app/context/scene-context";

export default function Scene2() {
  const { setCategoryNumber } = useScene();
  const scene = STEP_QUESTION_LIST?.scene2;
  const initialCategoryNumber = useRef(false);

  useEffect(() => {
    if (!initialCategoryNumber.current) {
      const randomNumber = random(SCENE_LIST?.scene2?.a);
      setCategoryNumber(randomNumber);
      initialCategoryNumber.current = true;
    }
  }, []);

  return (
    <div className="pl-8">
      <QuestionArea
        mainText={scene?.mainText}
        subText={scene?.subText}
        buttons={scene?.category}
      />
    </div>
  );
}