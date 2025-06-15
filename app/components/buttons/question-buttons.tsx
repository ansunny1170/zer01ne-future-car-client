import { useScene } from "@/app/context/scene-context";

export default function QuestionButtons({
    buttons
}: {
    buttons: { [key: string]: string },
}) {
    const { sceneNumber, setSceneNumber, setCategory } = useScene();
    // const handleCategory = async (category: string) => {
    //     setCategory(category);
    //     await N8nApi.postScene(sceneNumber, category);
    // }

    const handleClick = (category: string) => {
        setSceneNumber(sceneNumber + 1);
        setCategory(category);
    }

    return (
        <>
            <div className="
            flex flex-row gap-4
            *:p-2 *:bg-gray-200 *:text-gray-800 *:rounded-md *:transition-all *:duration-500 *:cursor-none
            *:hover:bg-gray-400 *:hover:scale-110 *:hover:text-white *:hover:font-bold
            *:focus:bg-gray-400 *:focus:scale-110 *:focus:text-white *:focus:font-bold *:focus:outline-none
            ">
                {Object.keys(buttons).map((button, index) => (
                    <button
                        key={index}
                        className={`min-w-40 h-30 rounded-full bg-white/80 backdrop-blur-sm`}
                        onClick={() => handleClick(button)}
                    >
                        {buttons[button]}
                    </button>
                ))}
            </div>

            {/* <Speech /> */}
        </>
    );
}