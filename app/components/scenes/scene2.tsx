import { random } from "@/utils";
import { SCENE_LIST, STEP_QUESTION_LIST } from "@/utils/constants";
import { useEffect, useRef, useState } from "react";
import QuestionArea from "./question-area";
import { useScene } from "@/context/scene-context";

type Scene2Category = keyof typeof SCENE_LIST.scene2;
export default function Scene2() {
  const { setCategoryNumber, category } = useScene();
  const scene = STEP_QUESTION_LIST?.scene2;
  const initialCategoryNumber = useRef(false);
  const [dialogTimeOut, setDialogTimeOut] = useState(false);

  useEffect(() => {
    if (!initialCategoryNumber.current) {
      const value = SCENE_LIST?.scene2?.[category as Scene2Category];
      if (value !== undefined) {
        const randomNumber = random(value);
        setCategoryNumber(randomNumber);
      }
      initialCategoryNumber.current = true;
    }

    // 마운트 되고 1.5초 후에 dialogTimeOut.current를 true로 변경
    setTimeout(() => {
      setDialogTimeOut(true);
    }, 1500);

    return () => {
      initialCategoryNumber.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="pl-8">
      {
        dialogTimeOut && (
          <QuestionArea
            mainText={scene?.mainText}
            subText={scene?.subText}
            buttons={scene?.category}
          />
        )
      }
    </div>
  );
}