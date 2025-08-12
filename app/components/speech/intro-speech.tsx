'use client';

import { useEffect, useRef, useState } from 'react';
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
  // STT 재시작 플래그
  const restartAfterStopRef = useRef<boolean>(false)

  const startRecognition = () => {
    if (recognitionRef.current && !isProcessing) {
      setFinalText(null)
      recognitionRef.current.start()
    }
  }

  // s 키 토글을 위해 음성 인식 종료 함수 추가
  const stopRecognition = () => {
    if (recognitionRef.current && isListening) {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      recognitionRef.current.stop()
    }
  }

  useEffect(() => {
    // s 키(또는 한글 ㄴ)로 STT 재시작 처리
    const handleSTTKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 's' || event.key.toLowerCase() === 'ㄴ') {
        event.preventDefault()
        if (isListening) {
          restartAfterStopRef.current = true
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
          setFinalText(null)
          recognitionRef.current?.stop()
        } else if (!isProcessing) {
          startRecognition()
        }
      }
    }

    window.addEventListener('keydown', handleSTTKey)
    return () => window.removeEventListener('keydown', handleSTTKey)
  }, [isListening, isProcessing])

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
      if (restartAfterStopRef.current && !isProcessing) {
        setFinalText(null)
        restartAfterStopRef.current = false
        recognition.start()
        return
      }
      setIsListening(false)
    }

    recognitionRef.current = recognition

    // 더 이상 자동 시작을 하지 않고, 컴포넌트 언마운트 시에만 정리
    return () => {
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