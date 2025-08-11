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
}: TextSplitAnimationProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  const lines = text.split("\n");

  const containerVariants: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: delay,
      },
    },
  };

  const lineVariants: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: charStagger,
      },
    },
  };

  const charVariants: Variants = {
    hidden: { opacity: 0, y: fromY },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration, ease: "easeOut" },
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