import { useScene } from "@/context/scene-context";
import { motion } from "framer-motion";
import { useEffect } from "react";


export default function StepComplete() { 
  const { reStart } = useScene();

  // r키 누르면 맨 첫 페이지로 이동
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'r' || event.key.toLowerCase() === 'ㄱ') {
        reStart();
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [reStart])

  return (
    <div className="pl-8 absolute inset-0 text-white">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="animate-fade-in absolute inset-0 flex flex-col gap-8 items-center justify-center backdrop-blur-lg bg-black/10 z-[22]"
      >
        <h1>체험이 모두 끝났습니다!</h1>
        <p>뒷쪽 출구로 퇴장해 주세요.</p>
      </motion.div>
    </div>
  );
}
