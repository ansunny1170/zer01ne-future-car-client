import { cn } from "@/utils/cn";
import MusicIcon from "../icons/musix";
import PlayerButtons from "../icons/player-buttons";
import { useScene } from "@/context/scene-context";
interface MusicPlayerBoxProps {
  className?: string;
}

export default function MusicPlayerBox({ className }: MusicPlayerBoxProps) {
  const {stepInfo} = useScene();
  return (
    <div className={cn("flex items-center p-[16px] gap-[16px] text-white", className)}>
        <div className="w-[62px] h-[62px] rounded-[7px] bg-[#C6C6C6]/20 grow flex items-center justify-center">
            <MusicIcon />
        </div>
        <div className="leading-[1.2] max-w-[100px] overflow-hidden">
            <p className="text-[18px] font-bold">{stepInfo?.bgm?.file_name}</p>
        </div>
        <div className="opacity-70">
          <PlayerButtons />
        </div>
    </div>
  );
} 