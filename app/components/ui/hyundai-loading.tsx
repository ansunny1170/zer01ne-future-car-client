import Lottie from 'lottie-react';
import loaderAnimation from '../../../public/assets/lotties/loader.json';

export default function HyundaiLoading({size = 137, text = "" }: { size?: number, text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-4 w-full">
        <div 
            className="flex flex-col items-center justify-center"
            style={{ width: `${size}px`, height: `${size}px` }}
        >
            <Lottie 
                animationData={loaderAnimation}
                loop={true}
                autoplay={true}
                style={{ width: '100%', height: '100%' }}
            />
            {
              text && (
                <p className="text-white text-center text-[29px] font-semibold whitespace-nowrap text-shadow-md">{text}</p>
              )
            }
        </div>
    </div>
  )
}