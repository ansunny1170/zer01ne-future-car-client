'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// Web Speech API 타입 정의
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
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

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export default function SpeechPage() {
  const [isListening, setIsListening] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [hasAlertedSilence, setHasAlertedSilence] = useState(false);

  const lastSpeechTimeRef = useRef<number | null>(null);
  const SILENCE_TIMEOUT = 3000; // 타임 버퍼

  // 음성 인식 초기화
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('이 브라우저는 음성 인식을 지원하지 않습니다.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ko-KR';

    recognition.onstart = () => {
      console.log('Speech recognition started');
      setIsListening(true);
      lastSpeechTimeRef.current = Date.now();
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          const now = Date.now();
          const last = lastSpeechTimeRef.current;
          const shouldStartNew = last && now - last > SILENCE_TIMEOUT;

          setFinalTranscript((prev) =>
            shouldStartNew ? prev + '\n' + transcript : prev + transcript
          );

          lastSpeechTimeRef.current = now;
          setHasAlertedSilence(false); // 다시 말했으므로 알림 상태 초기화
        } else {
          interimText += transcript;
        }
      }

      setInterimTranscript(interimText);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    setRecognition(recognition);

    return () => {
      recognition.stop();
    };
  }, []);

  // 5초 정적 상태 감지
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const last = lastSpeechTimeRef.current;

      if (
        isListening &&
        last &&
        now - last > SILENCE_TIMEOUT &&
        !hasAlertedSilence
      ) {
        recognition?.stop();
        setHasAlertedSilence(true);
      }
    }, 1000); // 매초 확인

    return () => clearInterval(interval);
  }, [isListening, hasAlertedSilence]);

  // 마이크 on/off
  const toggleListening = useCallback(() => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
        setFinalTranscript('');
        setInterimTranscript('');
        setHasAlertedSilence(false);
        lastSpeechTimeRef.current = null;
        
        // 약간의 지연을 주어 이전 세션이 완전히 종료되도록 함
        setTimeout(() => {
          recognition.start();
        }, 100);
      } catch (error) {
        console.error('Failed to start recognition:', error);
      }
    }
  }, [recognition, isListening]);

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 p-4">
      <button
        onClick={toggleListening}
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
          isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-400 hover:bg-gray-500'
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
        <div className="text-red-500 font-bold animate-pulse">음성입력 받는 중...</div>
      )}

      <div className="max-w-md p-4 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg min-h-[100px] whitespace-pre-wrap">
        <p className="text-gray-800">{finalTranscript}</p>
        {interimTranscript && (
          <p className="text-gray-500 inline-block">{interimTranscript}</p>
        )}
      </div>
    </div>
  );
}
