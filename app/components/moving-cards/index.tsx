import { useScene } from "@/app/context/scene-context";
import { cn } from "@/app/utils/cn";
import { PERSONA_LIST } from "@/app/utils/constants";
import { motion } from "framer-motion";

interface MovingCardsProps {
    className?: string;
}

interface CardProps {
    text: string;
    index: number;
    rowNumber: number;
}

const Card = ({ text, index, rowNumber }: CardProps) => {
    const {goNextStep} = useScene();
    return (
        <div
            key={`row${rowNumber}-${index}`}
            className="min-w-[300px] px-4 flex items-center justify-center"
            onClick={() => goNextStep()}
        >
            <span className="text-lg font-medium text-amber-50 whitespace-nowrap">{text}</span>
        </div>
    );
};


export default function MovingCards({ className }: MovingCardsProps) {
    const row1 = [...PERSONA_LIST].sort(() => Math.random() - 0.5).slice(0, 10);
    const row2 = [...PERSONA_LIST].sort(() => Math.random() - 0.5).slice(0, 10);
    const row3 = [...PERSONA_LIST].sort(() => Math.random() - 0.5).slice(0, 10);

    return (
        <div className={cn("w-full flex flex-col gap-8 py-4", className)}>
            {/* 첫 번째 줄 - 왼쪽으로 이동 */}
            <div className="relative h-[60px] w-full overflow-hidden">
                <motion.div
                    initial={{ x: 0 }}
                    animate={{ x: "-50%" }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    className="absolute flex"
                >
                    {[...row1, ...row1].map((text, index) => (
                        <Card key={index} text={text} index={index} rowNumber={1} />
                    ))}
                </motion.div>
            </div>

            {/* 두 번째 줄 - 오른쪽으로 이동 */}
            <div className="relative h-[60px] w-full overflow-hidden">
                <motion.div
                    initial={{ x: "-50%" }}
                    animate={{ x: "0%" }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    className="absolute flex"
                >
                    {[...row2, ...row2].map((text, index) => (
                        <Card key={index} text={text} index={index} rowNumber={2} />
                    ))}
                </motion.div>
            </div>

            {/* 세 번째 줄 - 왼쪽으로 이동 (더 천천히) */}
            <div className="relative h-[60px] w-full overflow-hidden">
                <motion.div
                    initial={{ x: 0 }}
                    animate={{ x: "-50%" }}
                    transition={{
                        duration: 25,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    className="absolute flex"
                >
                    {[...row3, ...row3].map((text, index) => (
                        <Card key={index} text={text} index={index} rowNumber={3} />
                    ))}
                </motion.div>
            </div>
        </div>
    );
} 