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
 * 최종 인식 결과(isFinal)는 곧바로 보내지 않고 모아 둔다 — 발화 종료 후 SEND_DELAY_MS(2초) 동안
 * 새 입력(중간·최종 결과)이 없을 때 합쳐서 `onFinal` 을 부른다. 문장 사이에 잠깐 쉬어도 한 발화로
 * 전송되게 하기 위함이다. `onFinal` 이 `true`(서버가 수집)를 돌려주면 더 듣지 않는다 — 다음 스텝이
 * 오기 전까지 중복 발화로 생성이 두 번 걸리는 것을 막는다. `active` 가 다시 켜지면(다음 창) 재개한다.
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

// 발화 종료(최종 인식 결과) 후 이 시간 동안 새 입력이 없으면 모아 둔 텍스트를 전송한다.
// 기본값 — 디버그 패널에서 sendDelayMs 옵션으로 덮어쓸 수 있다.
export const SEND_DELAY_MS = 2000;

export type CarListenerStatus = "unsupported" | "off" | "listening" | "paused" | "error";

export interface CarListenerState {
  status: CarListenerStatus;
  /** 아직 확정되지 않은 중간 인식 텍스트(자막용) */
  interim: string;
  /** 전송 대기(디바운스) 중인 누적 확정 발화 — 아직 서버로 보내지 않았다 */
  pending: string;
  /** 마지막으로 서버에 보낸 확정 발화 */
  lastFinal: string | null;
  /** 마지막 브라우저 인식 오류 코드(not-allowed, network, no-speech …) */
  error: string | null;
  /** 전송 대기 중인 발화를 버리고 처음부터 다시 듣는다(디버그용). 이미 전송된 발화는 못 되돌린다 */
  reset: () => void;
}

export interface UseCarListenerOptions {
  /** 지금 관람객 차례인가 — 참인 동안만 마이크를 연다 */
  active: boolean;
  /** 확정 발화 처리. 서버가 수집했으면 true — 이 창에서는 더 듣지 않는다 */
  onFinal: (text: string) => Promise<boolean>;
  lang?: string;
  /** 발화 종료 후 전송까지의 대기 시간(ms). 없거나 0 이하면 기본 SEND_DELAY_MS(2초) */
  sendDelayMs?: number;
}

export function useCarListener({ active, onFinal, lang = "ko-KR", sendDelayMs }: UseCarListenerOptions): CarListenerState {
  const [status, setStatus] = useState<CarListenerStatus>("off");
  const [interim, setInterim] = useState("");
  const [pending, setPending] = useState("");
  const [lastFinal, setLastFinal] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recRef = useRef<Recognizer | null>(null);
  // 이 창에서 이미 서버가 수집한 발화를 보냈는가 — 참이면 active 여도 다시 열지 않는다.
  const sentRef = useRef(false);
  // 우리가 stop() 을 부른 뒤 도착하는 onend 에서 자동 재시작하지 않기 위한 표식.
  const wantRef = useRef(false);
  // 전송 대기 중인 확정 발화 누적 버퍼와 디바운스 타이머.
  const bufferRef = useRef("");
  const sendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;
  // ref 로 들고 있어 값이 바뀌어도 인식 세션을 재시작하지 않는다(디버그에서 실시간 변경).
  const delayRef = useRef(SEND_DELAY_MS);
  delayRef.current = sendDelayMs && sendDelayMs > 0 ? sendDelayMs : SEND_DELAY_MS;
  // 이 인식 세션에서 이미 소비한 최종(isFinal) 결과의 마지막 인덱스. Chrome 이 continuous
  // 모드에서 과거 결과를 통째로 다시 실어 보내는 일이 있어(발화 초기화 뒤 옛 텍스트가
  // 되살아나는 원인), 인덱스로 딱 한 번만 소비한다. 세션이 새로 시작되면(onstart) 리셋.
  const finalSeenRef = useRef(-1);

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

  // 전송 대기 중인 발화를 버린다 — 인식은 계속 돌고 있으므로 곧바로 다시 말하면 된다.
  // 이미 flush 로 서버에 보낸 발화는 되돌릴 수 없다(서버가 수집 즉시 다음 스텝 생성을 시작한다).
  const reset = useCallback(() => {
    if (sendTimerRef.current) {
      clearTimeout(sendTimerRef.current);
      sendTimerRef.current = null;
    }
    bufferRef.current = "";
    setPending("");
    setInterim("");
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
      finalSeenRef.current = -1; // 새 인식 세션 — 결과 인덱스가 0 부터 다시 시작한다
      setStatus("listening");
      setError(null);
    };
    const clearSendTimer = () => {
      if (sendTimerRef.current) {
        clearTimeout(sendTimerRef.current);
        sendTimerRef.current = null;
      }
    };
    // 디바운스 만료 — 모아 둔 발화를 서버로 보낸다.
    const flush = () => {
      sendTimerRef.current = null;
      const text = bufferRef.current.trim();
      bufferRef.current = "";
      setPending("");
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
    rec.onresult = (e) => {
      let interimText = "";
      let finalText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) {
          // 재전송된 과거 결과는 버린다 — 인덱스가 지나온 자리면 이미 소비한 것.
          if (i > finalSeenRef.current) {
            finalText += r[0].transcript;
            finalSeenRef.current = i;
          }
        } else interimText += r[0].transcript;
      }
      setInterim(interimText);
      // 중간 결과 = 아직 말하는 중 — 전송 대기를 취소하고 다음 확정 결과를 기다린다.
      if (interimText) clearSendTimer();
      const text = finalText.trim();
      if (!text) return;
      bufferRef.current = bufferRef.current ? `${bufferRef.current} ${text}` : text;
      setPending(bufferRef.current);
      // 발화 종료 후 딜레이(기본 SEND_DELAY_MS) 동안 새 입력이 없으면 그때 모아서 전송한다.
      clearSendTimer();
      sendTimerRef.current = setTimeout(flush, delayRef.current);
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
      // 창이 닫히면(재생 시작·스텝 전환) 보내지 않은 발화는 버린다 — 더는 관람객 차례가 아니다.
      clearSendTimer();
      bufferRef.current = "";
      setPending("");
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

  return { status, interim, pending, lastFinal, error, reset };
}
