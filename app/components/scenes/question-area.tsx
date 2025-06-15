import { cn } from "@/app/utils/cn";
import QuestionButtons from "../buttons/question-buttons";

export default function QuestionArea({
    mainText,
    subText,
    buttons,
    className,
}: {
    mainText: string;
    subText?: string;
    className?: string;
    buttons: {
        [key: string]: string;
    };
}) {

    return (
        <div className={
            cn("absolute bottom-1/2 translate-y-1/2 left-8 z-10 flex flex-col gap-4", className)
        }>
            {
                mainText && (
                    <h1 className="text-2xl font-bold">{mainText}</h1>
                )
            }
            {
                subText && (
                    <p className="text-sm text-gray-500">{subText}</p>
                )
            }

            <QuestionButtons buttons={buttons} />
        </div>
    )
}