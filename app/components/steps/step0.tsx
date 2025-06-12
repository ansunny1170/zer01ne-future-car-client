export default function Step0({ handleNextStep }: { handleNextStep: () => void }) {
  return (
    <div className="flex flex-col items-start justify-center text-left h-screen cursor-none123 overflow-hidden">
      <div className="pl-8">
        <div className="pb-4">
          <h1 className="text-2xl font-bold">Step 0</h1>
        </div>

        <button onClick={handleNextStep} className="bg-black text-white px-4 py-2 rounded-md">
            시작하시겠습니까?
        </button>
      </div>
    </div>
  );
}