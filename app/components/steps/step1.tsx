import { useScene } from "@/context/scene-context";
import QuestionArea from "./question-area";
import DummySpeech from "../speech/dummy-speech";
import { motion } from "framer-motion";

const DummyText = [
    "{이름}과 함께 바다 구경가고 싶어",
    "아이와 함께 캠핑 가고 싶어",
    "혼자서 사무실 갔다가 등산 가자",
    "{이름}을 픽업하고 제로원 전시에 가자",
]

export default function Step1({ dafultComment }: { dafultComment?: string }) {
    const { stepInfo } = useScene();
    const { question, choices } = stepInfo || {};

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="fixed inset-0 h-1/3 bg-[linear-gradient(to_top,rgba(0,0,0,0)_0%,rgba(0,0,0,0.35)_100%)]"/>
            <QuestionArea 
                mainText={question || ""} 
                buttons={(choices || []).reduce((acc, choice) => {
                    acc[choice?.usp || ""] = choice?.description || "";
                    return acc;
                }, {} as { [key: string]: string })} 
                defaultComment={dafultComment}
            />

            {/* DummySpeechLayer */}
            <ul className="absolute bottom-[120px] flex gap-[16px] w-[80%] items-center justify-center flex-wrap">
                {DummyText.map((text, index) => (
                    <motion.li 
                        key={index}
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: "easeInOut", delay: index * 0.2, staggerChildren: 0.2 }}
                    >
                        <DummySpeech dummyText={text} />
                    </motion.li>
                ))}
            </ul>
        </div>
    );
}