export default function Loading() {
  return (
    <div className="animate-fade-in absolute inset-0 flex flex-col gap-8 items-center justify-center backdrop-blur-sm bg-black/10 z-[22]">
        <p>
            <svg className="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </p>
        <p className="text-2xl font-bold text-white">클론-21g가 생각중입니다...</p>
    </div>
  );
}