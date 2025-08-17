/* eslint-disable @next/next/no-img-element */
import { cn } from "@/utils/cn";
import { motion, useAnimate, Variants } from "framer-motion";
import { useEffect, useState } from "react";

export default function CloneTalkSplit({
  text, 
  keepLastLine = false, 
  onComplete, 
  duration = 5000,
  charStagger = 0.05,
  speed = 1
}: {
  text: string; 
  keepLastLine?: boolean; 
  onComplete?: () => void; 
  duration?: number | number[]; 
  charStagger?: number;
  speed?: number;
}) {
  const [scope] = useAnimate();
  const [isComplete, setIsComplete] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const lines = text.split("\n");
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  
  const adjustedCharStagger = charStagger / speed;
  const totalChars = text.replace(/\n/g, '').length;
  const totalDuration = Array.isArray(duration) ? duration[0] : duration;
  const charDelay = totalDuration / totalChars / 1000; // ms를 s로 변환
  
  useEffect(() => {
    setIsComplete(false);
  }, [text]);

  const containerVariants: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.1 / speed,
        delayChildren: 0,
      },
    },
    exit: {
      opacity: 0,
      transition: { duration: 1 }
    }
  };

  const lineVariants: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: adjustedCharStagger,
      },
    },
  };

  const charVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  };

  useEffect(() => {
    if (isMounted) {
      const timer = setTimeout(() => {
        if (!keepLastLine) {
          setIsComplete(true);
        }
        onComplete?.();
      }, totalDuration);
      
      return () => clearTimeout(timer);
    }
  }, [isMounted, totalDuration, keepLastLine, onComplete]);

  return (
    <motion.div 
      key={text}
      className="absolute inset-0 z-50"
      initial={{ opacity: 1 }}
      animate={{ opacity: isComplete ? 0 : 1 }}
      transition={{ duration: 1 }}
    >
      <p
        style={{
          animation: 'hueRotate 10s ease infinite'
        }}
      >
        <img src="/assets/images/effect_agent_talk.png" alt="clone-talk" className="animate-hueRotate w-full object-cover mix-blend-screen" />
      </p>

      <motion.div 
        ref={scope}
        className="fixed bottom-[85%] left-1/2 -translate-x-1/2 flex flex-col items-center justify-center w-full"
        variants={containerVariants}
        initial="hidden"
        animate="show"
        exit="exit"
      >
        <motion.div className="text-white text-center text-[43px] max-w-[50vw] break-keep font-semibold leading-[1.2] flex flex-col items-center" style={{ filter: 'drop-shadow(0 3px 3px rgb(0 0 0 / 0.12)) drop-shadow(0 9px 7px rgb(0 0 0 / 0.1))' }}>
          {lines.map((line, lineIndex) => (
            <motion.div 
              key={`line-${lineIndex}-${text}`} 
              className="whitespace-nowrap flex justify-center"
              variants={lineVariants}
            >
              {Array.from(line).map((char, charIndex) => (
                <motion.span
                  key={`char-${lineIndex}-${charIndex}-${text}`}
                  className="inline-block"
                  variants={charVariants}
                >
                  {char === ' ' ? '\u00A0' : char}
                </motion.span>
              ))}
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}