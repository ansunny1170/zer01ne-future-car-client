import Speech from "../speech";

export default function Step1({ category, handleClick }: { category: string, handleClick: (category: string) => void }) {
  return (
    <div>
      <h1>Step 2</h1>
      <div className="pl-8">
        <div className="pb-4">
            <h1 className="text-4xl font-bold text-red-600 mb-4">Center Page</h1>
            <p className="text-gray-600">{category}</p>
        </div>

        <div className="
          flex flex-row gap-4 
          *:p-2 *:bg-gray-200 *:text-gray-800 *:rounded-md *:transition-all *:duration-500 *:cursor-none123
          *:hover:bg-gray-400 *:hover:scale-110 *:hover:text-white *:hover:font-bold
          *:focus:bg-gray-400 *:focus:scale-110 *:focus:text-white *:focus:font-bold *:focus:outline-none
        ">
          <button
            className={`w-20 h-20 rounded-full bg-white/80 backdrop-blur-sm`}
            onClick={() => handleClick("a")}
          >
            A
          </button>
          <button
            className={`w-20 h-20 rounded-full bg-white/80 backdrop-blur-sm`}
            onClick={() => handleClick("b")}
          >
            B
          </button>
          <button
            className={`w-20 h-20 rounded-full bg-white/80 backdrop-blur-sm`}
            onClick={() => handleClick("c")}
          >
            C
          </button>
        </div>
      </div>

      <div className="">
        <Speech />
      </div>
    </div>
  );
}