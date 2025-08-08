'use client';

import { useEffect, useRef, useState } from 'react';
import { Icons } from '../ui/icons';
import { cn } from '@/utils/cn';
import HyundaiLoading from '../ui/hyundai-loading';

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

export default function IntroSpeech({ onTrigger, isProcessing, defaultComment, placeholder }: { onTrigger: (text: string) => void, isProcessing: boolean, defaultComment?: string, placeholder?: string }) {
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
    // 단축키 space 누르면  onTrigger에다가 text 넣어서 실행함
    const handleSpaceKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 's' || event.key.toLowerCase() === 'ㄴ') {
        event.preventDefault();
        if (defaultComment) {
          onTrigger(defaultComment)
        }
      }
    }
    window.addEventListener('keydown', handleSpaceKey)
    return () => window.removeEventListener('keydown', handleSpaceKey)
  }, [defaultComment, onTrigger])

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
    <>
      <HyundaiLoading/>
      <div className="flex flex-col gap-4 items-center justify-center pt-4">
        <div className='flex items-center justify-center text-[45px]'>
          {
            !finalText ? (
              <strong className='opacity-60'><b>&quot;출발&quot;</b>이라고 말해주세요.</strong>
            ) : (
              <strong>{finalText}</strong>
            )
          }
        </div>
      </div>
    </>
  )
}