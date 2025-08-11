/* eslint-disable @next/next/no-img-element */
import { cn } from "@/utils/cn";
import { motion, useAnimate, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
interface Message {
  text: string;
  isActive: boolean;
  id: number;
}

export default function CloneTalk({text, keepLastLine = false, onComplete, duration = 5000}: {text: string; keepLastLine?: boolean; onComplete?: () => void; duration?: number | number[]}) {
  const [scope] = useAnimate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const lines = text.split("\n");
  const idCounter = useRef(0);
  const getTimeout = (idx: number): number => {
    if (Array.isArray(duration)) {
      return duration[idx] ?? 5000;
    }
    return (duration as number) ?? 5000;
  };
  
  
  useEffect(() => {
    setMessages([]);
    setCurrentIndex(0);
    setIsComplete(false);
  }, [text]);

  useEffect(() => {
    // 모든 라인을 표시한 뒤 완료 처리 (단일 라인 포함)
    if (currentIndex >= lines.length) {
      if (!isComplete && !keepLastLine) {
        // keepLastLine이 false인 경우에만 페이드아웃 처리
        setIsComplete(true);
      }
      if (!isComplete) {
        onComplete?.();
      }
      return;
    }

    if (currentIndex === 0) {
      setMessages([{ 
        text: lines[0], 
        isActive: true,
        id: idCounter.current++ 
      }]);
      setTimeout(() => {
        setCurrentIndex(1);
      }, getTimeout(0));
      return;
    }

    const showNextMessage = () => {
      setMessages(prev => {
        const newMessages = prev.map(msg => ({
          ...msg,
          isActive: false
        }));
        return [...newMessages, { 
          text: lines[currentIndex], 
          isActive: true,
          id: idCounter.current++ 
        }];
      });
      
      if (currentIndex === lines.length - 1) {
        if (!keepLastLine) {
          setTimeout(() => {
            setIsComplete(true);
          }, getTimeout(currentIndex));
        }
        // keepLastLine이 true인 경우에는 마지막 라인을 유지하고 추가 업데이트를 수행하지 않습니다.
      } else {
        setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
        }, getTimeout(currentIndex));
      }

      if (currentIndex === lines.length - 1) {
        setTimeout(() => {
          onComplete?.();
        }, getTimeout(currentIndex));
      }
    };
    
    showNextMessage();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, lines.length, keepLastLine, onComplete]);

  return (
    <motion.div 
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

      <div 
        ref={scope}
        className="fixed bottom-[70%] left-1/2 -translate-x-1/2 flex flex-col items-center w-full"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {messages.slice(-2).map((message) => (
            <motion.p
              key={message.id}
              className={cn(
                "text-white text-center text-[52px] max-w-[50vw] break-keep font-semibold leading-[1.2]",
                "text-shadow-sm absolute",
                message.isActive 
                  ? 'opacity-100' 
                  : 'opacity-40'
              )}
              initial={message.isActive ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
              animate={{ 
                opacity: message.isActive ? 1 : 0.4,
                y: message.isActive ? 0 : -20,
                scale: message.isActive ? 1 : 0.6
              }}
              transition={{
                type: "spring",
                stiffness: 50,
                damping: 25,
                mass: 0.8,
                opacity: { duration: 0.6 }
              }}
              style={{ 
                position: 'relative',
                transformOrigin: 'center bottom'
              }}
            >
              {message.text}
            </motion.p>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}