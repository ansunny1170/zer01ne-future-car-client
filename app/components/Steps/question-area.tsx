import { cn } from "@/app/utils/cn";
import QuestionButtons from "./question-buttons";
import { motion } from "framer-motion";

export default function QuestionArea({
    mainText,
    subText,
    buttons,
    className,
}: {
    mainText: string | null;
    subText?: string | null;
    className?: string;
    buttons: {
        [key: string]: string;
    };
}) {
    // 한 글자씩 배열로 분리
    const mainChars = mainText ? mainText.split('') : [];
    const subChars = subText ? subText.split('') : [];

    // Framer Motion variants
    const container = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.04 // 글자 간 딜레이
            }
        }
    };
    const char = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    };

    return (
        <div className={cn("flex flex-col items-center justify-center h-full gap-16", className)}>
            <div>
                {mainChars.length > 0 && (
                    <motion.h1
                        className="text-[32px] leading-[1.2] font-bold text-white break-keep max-w-[50vw]"
                        variants={container}
                        initial="hidden"
                        animate="visible"
                    >
                        {mainChars.map((c, idx) => (
                            <motion.span key={idx} variants={char}>
                                {c === '\n' ? <br /> : c}
                            </motion.span>
                        ))}
                    </motion.h1>
                )}
                {subChars.length > 0 && (
                    <motion.p
                        className="text-lg text-white/60 font-bold pt-2 break-keep max-w-[50vw]"
                        variants={container}
                        initial="hidden"
                        animate="visible"
                        transition={{ delayChildren: 1.5 }}
                    >
                        {subChars.map((c, idx) => (
                            <motion.span key={idx} variants={char}>
                                {c === '\n' ? <br /> : c}
                            </motion.span>
                        ))}
                    </motion.p>
                )}
            </div>
            <QuestionButtons buttons={buttons} />
        </div>
    );
}