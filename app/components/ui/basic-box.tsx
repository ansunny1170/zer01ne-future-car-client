import { cn } from "@/utils/cn";

export default function BasicBox({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={cn(
            "[box-shadow:0_8px_32px_0_rgba(0,0,0,0.36),inset_0px_-8px_20px_rgba(255,255,255,0.3)]",
            "text-white py-[16px] px-[18px] rounded-[18px] backdrop-blur-md",
            "bg-linear-to-b from-black/100 to-black/0",
            className
        )}>
            {children}
        </div>
    );
}