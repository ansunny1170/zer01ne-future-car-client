import { cn } from "@/utils/cn";

export default function BasicBox({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <div 
            className={cn(
                "text-white py-[16px] px-[18px] rounded-[18px] backdrop-blur-md relative",
                "bg-linear-to-b from-black/100 to-black/0",
                className
            )}
            style={{
                filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.25))',
                backdropFilter: 'blur(150px)',
            }}
        >
            {/* 기본 테두리 */}
            <p className="absolute inset-0 border-[1.5px] border-white/40 bg-white/10 rounded-[18px] [mask-image:linear-gradient(to_bottom,black_0%,transparent_80%)]"/>          
            {children}
        </div>
    );
}