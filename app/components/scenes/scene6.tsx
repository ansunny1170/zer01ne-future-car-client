import { useEffect } from "react";
import { useScene } from "@/context/scene-context";

export default function Scene6() {
  const { setCategoryNumber, setSceneNumber, sceneNumber, setCategory } = useScene();

  useEffect(() => {

    // 마운트 되고 1.5초 후에 dialogTimeOut.current를 true로 변경
    const timeout = setTimeout(() => {
      setSceneNumber(sceneNumber + 1);
      setCategoryNumber(1);
      setCategory("a");
    }, 5000);

    return () => clearTimeout(timeout);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}