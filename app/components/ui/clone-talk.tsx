/* eslint-disable @next/next/no-img-element */
import { cn } from "@/app/utils/cn";
import { motion, useAnimate, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
interface Message {
  text: string;
  isActive: boolean;
  id: number;
}

export default function CloneTalk({text, keepLastLine = false}: {text: string, keepLastLine?: boolean}) {
  const [scope] = useAnimate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const lines = text.split("\n");
  
  useEffect(() => {
    let currentIndex = 0;
    
    const showNextMessage = () => {
      setMessages(prev => {
        const newMessages = prev.map(msg => ({
          ...msg,
          isActive: false
        }));
        return [...newMessages, { 
          text: lines[currentIndex], 
          isActive: true,
          id: currentIndex 
        }];
      });
      
      if (currentIndex === lines.length - 1) {
        // 마지막 메시지 표시 후 3초 뒤에 페이드아웃
        setTimeout(() => {
          setIsComplete(true);
        }, 3000);
      } else {
        currentIndex++;
        setTimeout(showNextMessage, 3000);
      }
    };
    
    showNextMessage();
  }, [lines.length]);

  return (
    <motion.div 
      className="absolute inset-0 z-10"
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
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.p
              key={message.id}
              className={cn(
                "text-white text-center text-[52px] font-semibold",
                "shadow-sm absolute",
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