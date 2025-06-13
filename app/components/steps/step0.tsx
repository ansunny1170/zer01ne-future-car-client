export default function Step0({ setStep }: { setStep: (step: number) => void }) {
  return (
    <div className="flex flex-col items-start justify-center text-left h-screen cursor-none123 overflow-hidden z-10">
      <div className="pl-8">
        <button onClick={() => setStep(1)} className="bg-black text-white px-4 py-2 rounded-md">
            시작하시겠습니까?
        </button>
      </div>
    </div>
  );
}