import { random } from "@/app/utils";
import { SCENE_LIST, STEP_QUESTION_LIST } from "@/app/utils/constants";
import { useEffect, useRef } from "react";
import QuestionArea from "./question-area";

export default function Scene2({ setSceneNumber, setCategory, setCategoryNumber }: { setSceneNumber: (sceneNumber: number) => void, setCategory: (category: string) => void, setCategoryNumber: (categoryNumber: number) => void }) {
  const buttons = STEP_QUESTION_LIST?.scene2?.category;
  const initialCategoryNumber = useRef(false);

  useEffect(() => {
    if (!initialCategoryNumber.current) {
      setCategoryNumber(random(SCENE_LIST?.scene2?.a));
      initialCategoryNumber.current = true;
    }
  }, []);

  return (
    <div>
      <div className="pl-8">
        <div className="pb-4">
          <QuestionArea
            mainText={STEP_QUESTION_LIST?.scene2?.mainText}
            subText={STEP_QUESTION_LIST?.scene2?.subText}
            buttons={buttons}
            sceneNumber={2}
            setSceneNumber={setSceneNumber}
            setCategory={setCategory}
          />
        </div>
      </div>
    </div>
  );
}