import { cn } from "@/utils/cn";
import { useState, useEffect } from "react";

interface TextAnimationProps {  
    text: string;
    onComplete?: () => void;
    groupSize?: number;
    showDuration?: number;
    hideDuration?: number;
    nextLineDuration?: number;
    keepLastLine?: boolean;
    className?: string;
}

export default function TextAnimation({ 
    text, 
    onComplete,
    groupSize = 2,
    hideDuration = 1800,
    nextLineDuration = 2000,
    keepLastLine = false,
    className
}: TextAnimationProps) {
    const [currentLineIndex, setCurrentLineIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    
    const textLines = text.split('\n').filter(line => line.trim() !== '');
    const textGroups = [];
    for (let i = 0; i < textLines.length; i += groupSize) {
        textGroups.push(textLines.slice(i, i + groupSize).join('\n'));
    }
    
    useEffect(() => {
        if (currentLineIndex >= textGroups.length) {
            onComplete?.();
            return;
        }
        
        // 현재 줄을 보이게 함
        setIsVisible(true);
        
        // hideDuration 후 현재 줄을 숨김
        const hideTimer = setTimeout(() => {
            if (!(keepLastLine && currentLineIndex === textGroups.length - 1)) {
                setIsVisible(false);
            }
        }, hideDuration);
        
        // nextLineDuration 후 다음 줄로 이동
        const nextLineTimer = setTimeout(() => {
            if (!(keepLastLine && currentLineIndex === textGroups.length - 1)) {
                setCurrentLineIndex(prev => prev + 1);
            }
        }, nextLineDuration);
        
        return () => {
            clearTimeout(hideTimer);
            clearTimeout(nextLineTimer);
        };
    }, [currentLineIndex, textGroups.length, hideDuration, nextLineDuration, onComplete, keepLastLine]);
    
    return (
        <div className={cn("whitespace-pre-wrap max-w-[90vw]", className)}>
            {(currentLineIndex < textGroups.length || (keepLastLine && currentLineIndex === textGroups.length)) && (
                <div 
                    className={`transition-opacity duration-500 ${
                        isVisible ? 'opacity-100' : 'opacity-0'
                    }`}
                >
                    {textGroups[Math.min(currentLineIndex, textGroups.length - 1)]}
                </div>
            )}
        </div>
    );
} 