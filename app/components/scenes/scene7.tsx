import { random } from "@/app/utils";
import { SCENE_LIST, STEP_QUESTION_LIST } from "@/app/utils/constants";
import { useEffect, useRef, useState } from "react";
import QuestionArea from "./question-area";
import { useScene } from "@/app/context/scene-context";

type Scene7Category = keyof typeof SCENE_LIST.scene7;

export default function Scene7() {
  const { category, setCategoryNumber } = useScene();
  const scene = STEP_QUESTION_LIST?.scene7;
  const initialCategoryNumber = useRef(false);
  const [dialogTimeOut, setDialogTimeOut] = useState(false);

  useEffect(() => {
    if (!initialCategoryNumber.current) {
      const value = SCENE_LIST?.scene7?.[category as Scene7Category];
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