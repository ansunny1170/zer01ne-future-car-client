import { STEP_DUMMY } from "@/app/utils/constants";
import MovingCards from "../moving-cards";
import { motion } from "framer-motion";

export default function Step1() {
    
    // Framer Motion variants
    const container = {
        hidden: { opacity: 1 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,  // 글자 간 딜레이 조정
                delayChildren: 0.3     // 전체 시작 전 딜레이
            }
        }
    };

    const letterVariants = {
        hidden: {
            opacity: 0,
        },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.3  // 각 글자 페이드인 시간
            }
        }
    };

    // 텍스트를 한 글자씩 분리
    const text = STEP_DUMMY[1].text;
    const chars = text.split('').map((char, index) => {
        if (char === '\n') return <br key={`br-${index}`} />;
        if (char === ' ') return <span key={`space-${index}`}>&nbsp;</span>;
        return (
            <motion.span
                key={index}
                variants={letterVariants}
                className="inline-block text-3xl font-extrabold"  // 글자 간격 유지를 위해 추가
            >
                {char}
            </motion.span>
        );
    });
    
    return (
        <div className="animate-fade-in absolute inset-0 text-amber-50 text-xl flex flex-col items-center justify-center text-center">
            <motion.h1
                className="text-2xl font-bold text-white mb-8"
                variants={container}
                initial="hidden"
                animate="visible"
            >
                {chars}
            </motion.h1>

            <MovingCards/>
        </div>
    );
}