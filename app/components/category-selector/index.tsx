import Speech from "../speech";

export default function CategorySelector({ setCategory }: { setCategory: (category: string) => void }) {
    return (
        <>
            <div className="
            flex flex-row gap-4 
            *:p-2 *:bg-gray-200 *:text-gray-800 *:rounded-md *:transition-all *:duration-500 *:cursor-none123
            *:hover:bg-gray-400 *:hover:scale-110 *:hover:text-white *:hover:font-bold
            *:focus:bg-gray-400 *:focus:scale-110 *:focus:text-white *:focus:font-bold *:focus:outline-none
            ">
                <button
                    className={`w-20 h-20 rounded-full bg-white/80 backdrop-blur-sm`}
                    onClick={() => setCategory("a")}
                >
                    A
                </button>
                <button
                    className={`w-20 h-20 rounded-full bg-white/80 backdrop-blur-sm`}
                    onClick={() => setCategory("b")}
                >
                    B
                </button>
                <button
                    className={`w-20 h-20 rounded-full bg-white/80 backdrop-blur-sm`}
                    onClick={() => setCategory("c")}
                >
                    C
                </button>
            </div>

            <Speech />
        </>
    );
}