import BasicPopupBox from "./basic-popup-box";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function BreakPadPopup() {
  const [count, setCount] = useState(0);
  const targetValue = 78;

  useEffect(() => {
    const duration = 1500; // 1.5초 동안 카운트업
    const steps = 60; // 60단계로 나누어 부드럽게
    const increment = targetValue / steps;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const newValue = Math.min(Math.round(increment * currentStep), targetValue);
      setCount(newValue);
      
      if (newValue >= targetValue) {
        clearInterval(timer);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, []);

  return (
    <BasicPopupBox type="warm" className="min-w-auto py-[30px] items-start">
      <p className="text-[70px] font-bold opacity-80 text-left"><b>{count}</b>%</p>
      <p className="text-[22px] text-left">브레이크 패드 마모도</p>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <img className="w-[513px]" src="/assets/images/img_content_break_popup.png" alt="break-pad" />
      </motion.div>
    </BasicPopupBox>    
  );
}