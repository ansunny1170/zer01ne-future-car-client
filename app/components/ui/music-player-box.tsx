import { cn } from "@/utils/cn";
import MusicIcon from "../icons/musix";
import PlayerButtons from "../icons/player-buttons";
import BasicBox from "./basic-box";

interface MusicPlayerBoxProps {
  className?: string;
}

export default function MusicPlayerBox({ className }: MusicPlayerBoxProps) {
  return (
    <BasicBox className={cn("flex items-center gap-[16px]", className)}>
        <div className="w-[62px] h-[62px] rounded-[7px] bg-[#C6C6C6]/20 grow flex items-center justify-center">
            <MusicIcon />
        </div>
        <div className="leading-[1.2]">
            <p className="text-[23px] font-bold">Song Title</p>
            <p className="text-[21px] opacity-60">Song Artist</p>
        </div>
        <PlayerButtons />
    </BasicBox>
  );
} 