"use client";

import { cn } from "@/utils/cn";
import { motion, Variants } from "framer-motion";
import { useEffect, useState } from "react";

type TextSplitAnimationProps = {
  text: string;
  className?: string;
  lineClassName?: string;
  charClassName?: string;
  delay?: number; // 전체 시작 지연
  charStagger?: number; // 글자 간 간격
  duration?: number; // 각 글자 애니메이션 시간
  fromY?: number; // 시작 y 오프셋
  speed?: number; // 텍스트 전체 속도 배수 (1 = 기본속도, 2 = 2배속, 0.5 = 절반속도)
};

export default function TextSplitAnimation({
  text,
  className,
  lineClassName,
  charClassName,
  delay = 0,
  charStagger = 0.04,
  duration = 0.35,
  fromY = 8,
  speed = 1,
}: TextSplitAnimationProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  const lines = text.split("\n");

  // speed에 따라 조정된 타이밍 값들
  const adjustedCharStagger = charStagger / speed;
  const adjustedDuration = duration / speed;
  const adjustedDelay = delay / speed;

  const containerVariants: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.1 / speed,
        delayChildren: adjustedDelay,
      },
    },
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
    hidden: { opacity: 0, y: fromY },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: adjustedDuration, ease: "easeOut" },
    },
  };

  return (
    <motion.div
      key={text}
      className={cn("relative whitespace-pre-wrap", className)}
      variants={containerVariants}
      initial="hidden"
      animate="show"
      style={{ visibility: isMounted ? "visible" : "hidden" }}
    >
      {lines.map((line, lineIndex) => (
        <motion.p
          key={`line-${lineIndex}`}
          className={cn("m-0", lineClassName)}
          variants={lineVariants}
        >
          {Array.from(line).map((char, charIndex) => (
            <motion.span
              key={`char-${lineIndex}-${charIndex}`}
              variants={charVariants}
              className={cn("inline-block", charClassName)}
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </motion.p>
      ))}
    </motion.div>
  );
}