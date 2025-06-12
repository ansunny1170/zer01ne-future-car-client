'use client';

import { useState, useEffect, useCallback } from 'react';

// Web Speech API 타입 정의
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
    error: {
        error: string;
        message: string;
    };
}

interface SpeechRecognitionResult {
    isFinal: boolean;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionEvent) => void) | null;
    onend: (() => void) | null;
    onstart: (() => void) | null;
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}

export default function Speech() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

    // SpeechRecognition 초기화
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'ko-KR';

                recognition.onstart = () => {
                    setIsListening(true);
                };

                recognition.onend = () => {
                    setIsListening(false);
                };

                recognition.onresult = (event: SpeechRecognitionEvent) => {
                    const transcript = Array.from(event.results)
                        .map(result => result[0])
                        .map(result => result.transcript)
                        .join('');
                    setTranscript(transcript);
                };

                recognition.onerror = (event: SpeechRecognitionEvent) => {
                    console.error('Speech recognition error:', event.error);
                    setIsListening(false);
                };

                setRecognition(recognition);
            }
        }
    }, []);

    // 음성 인식 시작/중지
    const toggleListening = useCallback(() => {
        if (!recognition) return;

        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
        }
    }, [recognition, isListening]);

    return (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
            <button
                onClick={toggleListening}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isListening 
                    ? 'bg-red-500 animate-pulse' 
                    : 'bg-gray-400 hover:bg-gray-500'
                }`}
            >
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    strokeWidth={1.5} 
                    stroke="currentColor" 
                    className="w-8 h-8"
                >
                    <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" 
                    />
                </svg>
            </button>
            
            {isListening && (
                <div className="text-red-500 font-bold animate-pulse">
                    음성입력 받는 중...
                </div>
            )}
            
            {transcript && (
                <div className="max-w-md p-4 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg">
                    <p className="text-gray-800">{transcript}</p>
                </div>
            )}
        </div>
    );
}
