import { random } from "@/utils";
import { SCENE_LIST, STEP_QUESTION_LIST } from "@/utils/constants";
import { useEffect, useRef, useState } from "react";
import QuestionArea from "./question-area";
import { useScene } from "@/context/scene-context";

type Scene6Category = keyof typeof SCENE_LIST.scene6;

export default function Scene5() {
  const { category, setCategoryNumber } = useScene();
  const scene = STEP_QUESTION_LIST?.scene5;
  const initialCategoryNumber = useRef(false);
  const [dialogTimeOut, setDialogTimeOut] = useState(false);

  useEffect(() => {
    if (!initialCategoryNumber.current) {
      const value = SCENE_LIST?.scene6?.[category as Scene6Category];
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