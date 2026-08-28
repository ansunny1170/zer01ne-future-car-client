"use client";

/**
 * useCarListener — /ambient 화면의 차량 마이크 청취.
 *
 * 전시 정책(2026-08-28): 차량 스텝 진행은 **차량 클라이언트에 연결한 마이크**로 관람객 발화를
 * STT 해 서버에 보내는 것으로만 이뤄진다(태블릿은 미래차 모드에서 입력이 잠긴다).
 * 이 훅은 브라우저 Web Speech API(Chrome — 구글 서버 STT, 인터넷 필요)를 쓰며
 * `active` 가 참인 동안만 듣는다.
 *
 * 왜 창(window)이 필요한가: 우리 자신이 TTS·BGM 을 크게 틀기 때문에, 재생 중에 마이크를 열어
 * 두면 우리 목소리를 관람객 발화로 받아 적는다(자기수신). 그래서 페이지가 "지금은 관람객 차례"
 * 인 구간(대기 화면, 스텝 렌더 완료 뒤 ~ 다음 스텝 수신 전)에서만 `active` 를 켠다.
 *
 * 최종 인식 결과(isFinal)가 나오면 `onFinal` 을 부른다. 이게 `true`(서버가 수집)를 돌려주면
 * 더 듣지 않는다 — 다음 스텝이 오기 전까지 중복 발화로 생성이 두 번 걸리는 것을 막는다.
 * `active` 가 다시 켜지면(다음 창) 재개한다.
 */
import { useCallback, useEffect, useRef, useState } from "react";

// speech/index.tsx 가 Window 에 붙여 둔 생성자 타입에 의존하지 않도록, 여기서 쓰는 멤버만 좁게 적는다.
interface Recognizer {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((e: RecognizerResultEvent) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
interface RecognizerResultEvent {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}
type RecognizerCtor = new () => Recognizer;

function getCtor(): RecognizerCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognizerCtor; webkitSpeechRecognition?: RecognizerCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type CarListenerStatus = "unsupported" | "off" | "listening" | "paused" | "error";

export interface CarListenerState {
  status: CarListenerStatus;
  /** 아직 확정되지 않은 중간 인식 텍스트(자막용) */
  interim: string;
  /** 마지막으로 서버에 보낸 확정 발화 */
  lastFinal: string | null;
  /** 마지막 브라우저 인식 오류 코드(not-allowed, network, no-speech …) */
  error: string | null;
}

export interface UseCarListenerOptions {
  /** 지금 관람객 차례인가 — 참인 동안만 마이크를 연다 */
  active: boolean;
  /** 확정 발화 처리. 서버가 수집했으면 true — 이 창에서는 더 듣지 않는다 */
  onFinal: (text: string) => Promise<boolean>;
  lang?: string;
}

export function useCarListener({ active, onFinal, lang = "ko-KR" }: UseCarListenerOptions): CarListenerState {
  const [status, setStatus] = useState<CarListenerStatus>("off");
  const [interim, setInterim] = useState("");
  const [lastFinal, setLastFinal] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recRef = useRef<Recognizer | null>(null);
  // 이 창에서 이미 서버가 수집한 발화를 보냈는가 — 참이면 active 여도 다시 열지 않는다.
  const sentRef = useRef(false);
  // 우리가 stop() 을 부른 뒤 도착하는 onend 에서 자동 재시작하지 않기 위한 표식.
  const wantRef = useRef(false);
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  // 창이 새로 열릴 때(active false→true) "보냈음" 표식을 지운다.
  const prevActive = useRef(false);
  if (active && !prevActive.current) sentRef.current = false;
  prevActive.current = active;

  const stop = useCallback(() => {
    wantRef.current = false;
    try {
      recRef.current?.stop();
    } catch {
      /* 이미 멈춤 */
    }
  }, []);

  useEffect(() => {
    const Ctor = getCtor();
    if (!Ctor) {
      setStatus("unsupported");
      return;
    }
    if (!active || sentRef.current) {
      stop();
      setStatus(sentRef.current && active ? "paused" : "off");
      setInterim("");
      return;
    }

    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    recRef.current = rec;
    wantRef.current = true;

    rec.onstart = () => {
      setStatus("listening");
      setError(null);
    };
    rec.onresult = (e) => {
      let interimText = "";
      let finalText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interimText += r[0].transcript;
      }
      setInterim(interimText);
      const text = finalText.trim();
      if (!text) return;
      setLastFinal(text);
      setInterim("");
      // 서버 판정을 기다리는 동안 추가 인식이 겹치지 않도록 먼저 멈춘다. 수집되지 않았으면
      // (창 밖·빈 문자열) 다시 연다.
      stop();
      void onFinalRef.current(text).then((collected) => {
        if (collected) {
          sentRef.current = true;
          setStatus("paused");
        } else if (prevActive.current) {
          wantRef.current = true;
          try {
            rec.start();
          } catch {
            /* onend 경로에서 재시작 */
          }
        }
      });
    };
    rec.onerror = (e) => {
      const code = e.error ?? "unknown";
      // no-speech / aborted 는 정상 종료에 가깝다 — onend 가 재시작한다.
      if (code !== "no-speech" && code !== "aborted") {
        setError(code);
        setStatus("error");
      }
      if (code === "not-allowed" || code === "service-not-allowed") wantRef.current = false;
    };
    rec.onend = () => {
      // Chrome 은 무음이 이어지면 스스로 끝낸다. 아직 관람객 차례면 다시 연다.
      if (wantRef.current && !sentRef.current) {
        try {
          rec.start();
          return;
        } catch {
          /* 곧바로 재시작이 거부되면 아래로 */
        }
      }
      setStatus((s) => (s === "error" ? s : sentRef.current ? "paused" : "off"));
    };

    try {
      rec.start();
    } catch (err) {
      setError(String(err));
      setStatus("error");
    }

    return () => {
      wantRef.current = false;
      rec.onend = null;
      rec.onresult = null;
      try {
        rec.abort();
      } catch {
        /* noop */
      }
      if (recRef.current === rec) recRef.current = null;
    };
  }, [active, lang, stop]);

  return { status, interim, lastFinal, error };
}
