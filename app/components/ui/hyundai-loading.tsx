import Lottie from 'lottie-react';
import loaderAnimation from '/public/assets/lotties/loader.json';

export default function HyundaiLoading() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-4">
        <div className="w-137 h-137">
            <Lottie 
                animationData={loaderAnimation}
                loop={true}
                autoplay={true}
                style={{ width: '100%', height: '100%' }}
            />
            <p className="text-white text-center text-[29px] font-semibold">더 좋은 응답을 위해 생각하는 중입니다...</p>
        </div>
    </div>
  )
}