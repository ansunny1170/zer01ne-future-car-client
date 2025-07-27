'use client';

import { useEffect, useRef, useState } from 'react';
import BasicBox from '../ui/basic-box';

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

export default function Speech({ onTrigger, isProcessing }: { onTrigger: (text: string) => void, isProcessing: boolean }) {
  const [finalText, setFinalText] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const startRecognition = () => {
    if (recognitionRef.current && !isProcessing) {
      setFinalText(null)
      recognitionRef.current.start()
    }
  }

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 's') {
        startRecognition()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isProcessing])

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'ko-KR'

    recognition.onstart = () => {
      console.log("음성 인식 시작")
      setIsListening(true)
    }

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join('')

      setFinalText(transcript)

      // 무음 타이머 리셋
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = setTimeout(() => {
        recognition.stop()
        onTrigger(transcript)
        setFinalText(null) // onTrigger 실행 후 텍스트 리셋
      }, 3000)
    }

    recognition.onerror = (event) => {
      console.log(event)
      setIsListening(false)
    }

    recognition.onend = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      console.log("음성 인식 종료")
      setIsListening(false)
    }

    recognitionRef.current = recognition

    // 자동 시작: 1초 후 (isProcessing이 아닐 때만)
    const startTimer = setTimeout(() => {
      if (!isProcessing) {
        recognition.start()
      }
    }, 1000)

    return () => {
      clearTimeout(startTimer)
      recognition.stop()
    }
  }, [onTrigger, isProcessing])

  return (
    <div className="flex flex-col gap-4 items-center justify-center">
      <BasicBox className='flex items-center justify-center gap-4 p-4'>
        <span className={`inline-block w-[16px] h-[16px] bg-red-500 rounded-full ${isListening ? 'animate-pulse' : ''}`}/>
        {
          isProcessing ? (
            <strong className='opacity-60'>처리 중입니다...</strong>
          ) : !finalText ? (
            <strong className='opacity-60'>음성으로 답변해주세요.</strong>
          ) : (
            <strong>{finalText}</strong>
          )
        }
      </BasicBox>
    </div>
  )
}