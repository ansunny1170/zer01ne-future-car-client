import { cn } from "@/app/utils/cn";
import QuestionButtons from "../buttons/question-buttons";

export default function QuestionArea({
    mainText,
    subText,
    buttons,
    className,
    sceneNumber,
    setSceneNumber,
    setCategory,
    setCategoryNumber,
}: {
    mainText: string;
    subText?: string;
    className?: string;
    buttons: {
        [key: string]: string;
    };
    sceneNumber: number;
    setSceneNumber: (sceneNumber: number) => void;
    setCategory: (category: string) => void;
    setCategoryNumber?: (categoryNumber: number) => void;
}) {

    return (
        <div className={
            cn("flex flex-col items-start justify-center text-left h-screen cursor-none123 overflow-hidden z-10", className)
        }>
            <h1 className="text-2xl font-bold">{mainText}</h1>
            <p className="text-sm text-gray-500">{subText}</p>

            <QuestionButtons
                buttons={buttons}
                sceneNumber={sceneNumber}
                setSceneNumber={setSceneNumber}
                setCategory={setCategory}
            />
        </div>
    )
}