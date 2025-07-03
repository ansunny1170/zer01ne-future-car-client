'use client';

import { useEffect, useRef, useState } from 'react';

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

export default function Speech({ keyword, onTrigger }: { keyword: string, onTrigger: () => void }) {
  const [finalText, setFinalText] = useState<string | null>(null)
  const [keywordDetected, setKeywordDetected] = useState(false)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 키워드 감지 함수
  const checkKeyword = (text: string) => {
    if (keyword && text.toLowerCase().includes(keyword.toLowerCase())) {
      setKeywordDetected(true);
      onTrigger();
      console.log(`🎯 키워드 &quot;${keyword}&quot; 감지됨!`);
      console.log(`키워드 "${keyword}" 감지됨!`);
    }
  };

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
      setKeywordDetected(false)
    }

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join('')

      setFinalText(transcript)

      // 키워드 확인
      checkKeyword(transcript)

      // 무음 타이머 리셋
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = setTimeout(() => {
        recognition.stop()
        onTrigger()
      }, 3000)
    }

    recognition.onerror = (event) => {
      console.log(event)
    }

    recognition.onend = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      console.log("음성 인식 종료")
    }

    recognitionRef.current = recognition

    // 자동 시작: 1초 후
    const startTimer = setTimeout(() => {
      recognition.start()
    }, 1000)

    return () => {
      clearTimeout(startTimer)
      recognition.stop()
    }
  }, [keyword, onTrigger])

  return (
    <div className="p-6 space-y-4">
      {keywordDetected && (
        <div className="p-4 bg-green-100 text-green-800 rounded animate-pulse">
          🎯 키워드 &quot;{keyword}&quot; 감지됨!
        </div>
      )}

      <div className="p-4 bg-green-100 text-green-800 rounded">
        ✅ 음성인식 :<br />
        <strong>{finalText}</strong>
      </div>
    </div>
  )
}