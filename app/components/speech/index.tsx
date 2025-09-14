/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useRef, useState } from 'react';
import { Icons } from '../ui/icons';
import { cn } from '@/utils/cn';
import HyundaiLoading from '../ui/hyundai-loading';
import { useScene } from '@/context/scene-context';

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

export default function Speech({ onTrigger, isProcessing, defaultComment }: { onTrigger: (text: string) => void, isProcessing: boolean, defaultComment?: string }) {
  const { stepInfo } = useScene();
  const [finalText, setFinalText] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // stepInfo.step에 따른 동적 텍스트 생성
  const getPlaceholderText = () => {
    switch (stepInfo?.step) {
      case 1:
        return '가고 싶은 장소와 함께 할 사람을 말해주세요.';
      case 6:
        return '오늘 하루 즐거우셨나요? 혹시 더 필요한 게 있으신가요?';
      default:
        return '선택지를 참고하여 자유롭게 말해주세요.';
    }
  };
  
  // 새로운 키 누름 추적 시스템
  const [pressCount, setPressCount] = useState(0) // 키 누름 횟수
  const keyDownTimeRef = useRef<number>(0) // 키 다운 시간
  const longPressThreshold = 1200 // 1200ms 이상이면 길게 누름
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null) // 길게 누름 타이머


  const startRecognition = () => {
    if (recognitionRef.current && !isProcessing) {
      setFinalText(null)
      recognitionRef.current.start()
    }
  }

  const restartRecording = () => {
    if (recognitionRef.current) {
      
      setFinalText(null)
      
      // 강제로 isListening을 false로 설정하고 새로 시작
      try {
        recognitionRef.current.stop()
        setIsListening(false) // 강제로 false 설정
      } catch (error) {
      }
      
      // 재시작 시도 (여러 번 시도)
      let retryCount = 0
      const maxRetries = 5
      
      const tryRestart = () => {
        if (!isProcessing && recognitionRef.current && retryCount < maxRetries) {
          try {
            recognitionRef.current.start()
          } catch (error) {
            retryCount++
            if (retryCount < maxRetries) {
              setTimeout(tryRestart, 100) // 100ms 후 다시 시도
            } else {
            }
          }
        }
      }
      
      // 200ms 후 첫 번째 재시작 시도
      setTimeout(tryRestart, 200)
    }
  }

  const sendTrigger = () => {
    
    if (finalText && recognitionRef.current) {
      recognitionRef.current.stop()
      onTrigger(finalText)
      setPressCount(0) // 전송 후 초기화
      setFinalText(null)
    } else {
    }
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'KeyS') {
        event.preventDefault()
        
        // 이미 키가 눌려있다면 무시 (키 반복 방지)
        if (keyDownTimeRef.current !== 0) return
        
        keyDownTimeRef.current = Date.now()
        
        // pressCount가 0이 아닐 때만 길게 누름 타이머 설정
        if (pressCount > 0) {
          longPressTimerRef.current = setTimeout(() => {
            sendTrigger()
            // 타이머 실행 후 정리
            longPressTimerRef.current = null
            keyDownTimeRef.current = 0
          }, longPressThreshold)
        }
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'KeyS') {
        event.preventDefault()
        
        // 길게 누름 타이머가 있으면 취소
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current)
          longPressTimerRef.current = null
        }
        
        const pressDuration = Date.now() - keyDownTimeRef.current
        keyDownTimeRef.current = 0 // 시간 초기화
        

        if (pressCount === 0) {
          // 1번째: 녹음 시작
          setPressCount(1)
          startRecognition()
        } else {
          // 2번째 이상: 짧게 누름만 처리 (길게 누름은 이미 타이머에서 처리됨)
          restartRecording()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      // 컴포넌트 언마운트 시 타이머 정리
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [pressCount, finalText, isProcessing, onTrigger])

  useEffect(() => {
    const handleSpaceKey = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
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
      setIsListening(true)
      // BGM 볼륨 낮추기
      const bgmAudio = document.querySelector('audio[loop]') as HTMLAudioElement
      if (bgmAudio) {
        bgmAudio.volume = 0.22
      }
    }

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join('')

      setFinalText(transcript)
      // 자동 타이머 제거 - 사용자가 S키로만 제어
    }

    recognition.onerror = (event) => {
      setIsListening(false)
      // BGM 볼륨 복구
      const bgmAudio = document.querySelector('audio[loop]') as HTMLAudioElement
      if (bgmAudio) {
        bgmAudio.volume = 0.5 // 원래 볼륨으로 복구
      }
    }

    recognition.onend = () => {
      setIsListening(false)
      // BGM 볼륨 복구
      const bgmAudio = document.querySelector('audio[loop]') as HTMLAudioElement
      if (bgmAudio) {
        bgmAudio.volume = 0.5 // 원래 볼륨으로 복구
      }
      // API 완료 시에만 pressCount 초기화
      if (!isProcessing) {
        // pressCount는 전송 후에만 초기화되도록 수정
      }
    }

    recognitionRef.current = recognition

    // 더 이상 자동 시작을 하지 않고, 컴포넌트 언마운트 시에만 정리
    return () => {
      recognition.stop()
    }
  }, [onTrigger, isProcessing])

  return (
    isProcessing ? (
      <HyundaiLoading/>
    ) : (
    <div className="flex flex-col gap-[25px] items-center justify-center max-w-[80vw]">
      <div className='flex items-center justify-center gap-4 p-4 backdrop-blur-2xl rounded-full bg-[#003A66]/30 text-[#9DE6FF] text-[20px]'>
        <span className={cn('animate-pulse', isListening && 'animate-in')}>
          <Icons.leftQuote/>
        </span>
        {
          !finalText ? (
            <strong className='opacity-60'>{getPlaceholderText()}</strong>
          ) : (
            <strong>{finalText}</strong>
          )
        }
        <span className={cn('animate-pulse', isListening && 'animate-in')}>
          <Icons.rightQuote/>
        </span>
      </div>

      <div className='flex items-center gap-[8px]'>
        <img src={isListening ? "/assets/images/icon_mic_on.png" : "/assets/images/icon_mic_off.png"} alt="mic" className='w-[34px]' />
        <span className='text-[18px] text-shadow-sm text-white'>
          {
            isListening ? '버튼을 길게 누르면 메시지가 전달됩니다' : '버튼을 누르면 마이크가 켜집니다'
          }
        </span>
      </div>
    </div>
    )
  )
}