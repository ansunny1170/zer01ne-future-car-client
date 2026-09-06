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
 * 인식 결과는 곧바로 보내지 않고 모아 둔다 — **마지막 입력(중간·최종 무관) 후 SEND_DELAY_MS(2초)
 * 동안 조용하면** 확정분과 아직 확정 안 된 중간 인식을 합쳐 `onFinal` 을 부른다. 크롬 continuous
 * 모드는 침묵해도 isFinal 을 한참 안 주는 일이 잦아, isFinal 을 기다리면 전송이 하염없이 늦는다.
 * 문장 사이에 잠깐 쉬어도 한 발화로 합쳐진다. 운영자는 **S 키**로 디바운스를 건너뛰고 즉시 전송할
 * 수 있다(잡음으로 침묵이 안 만들어질 때의 탈출구). `onFinal` 이 `true`(서버가 수집)를 돌려주면 더
 * 듣지 않는다 — 다음 스텝이 오기 전까지 중복 발화로 생성이 두 번 걸리는 것을 막는다. `active` 가
 * 다시 켜지면(다음 창) 재개한다.
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
  // 최신 중간 인식 텍스트(전송 시 확정분과 합치기 위해 ref 로도 보관)
  const interimRef = useRef("");
  // flush 가 stop() 한 직후 크롬이 방금 보낸 말의 확정본을 잔여 결과로 쏠 수 있다 —
  // 다음 세션(onstart)까지 결과를 무시해 중복 전송을 막는다.
  const suppressRef = useRef(false);

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
    interimRef.current = "";
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
      suppressRef.current = false;
      setStatus("listening");
      setError(null);
    };
    const clearSendTimer = () => {
      if (sendTimerRef.current) {
        clearTimeout(sendTimerRef.current);
        sendTimerRef.current = null;
      }
    };
    // 디바운스 만료 — 모아 둔 발화를 서버로 보낸다. 크롬 continuous 모드는 침묵해도
    // isFinal 을 한참 안 주는 일이 잦아, 확정분(buffer)에 아직 확정 안 된 중간 인식까지
    // 합쳐 보낸다 — "마지막 입력 후 N초 무입력이면 전송"이라는 의도 그대로.
    const flush = () => {
      sendTimerRef.current = null;
      const text = `${bufferRef.current} ${interimRef.current}`.replace(/\s+/g, " ").trim();
      bufferRef.current = "";
      interimRef.current = "";
      setPending("");
      if (!text) return;
      // stop() 뒤 도착하는 잔여 결과(방금 보낸 말의 확정본)를 다음 세션까지 무시한다.
      suppressRef.current = true;
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
      if (suppressRef.current) return; // flush 직후 잔여 결과 — 이미 보낸 말의 중복
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
      interimRef.current = interimText;
      const text = finalText.trim();
      if (text) {
        bufferRef.current = bufferRef.current ? `${bufferRef.current} ${text}` : text;
        setPending(bufferRef.current);
      }
      // 어떤 입력이든(중간·확정) 들어오면 딜레이를 다시 잰다 — 마지막 입력 후
      // 딜레이(기본 SEND_DELAY_MS) 동안 조용하면 flush 가 모아서 전송한다.
      if (text || interimText) {
        clearSendTimer();
        sendTimerRef.current = setTimeout(flush, delayRef.current);
      }
    };
    // 운영자 강제 전송: S 키를 누르면 디바운스를 기다리지 않고 지금까지 인식된 발화
    // (확정+중간)를 즉시 보낸다 — 마이크 잡음 등으로 입력이 끊기지 않아 2초 침묵이
    // 안 만들어질 때의 탈출구. 디버그 패널 입력칸에 타이핑 중일 때는 무시한다.
    const onForceSendKey = (ev: KeyboardEvent) => {
      if (ev.code !== "KeyS" || ev.repeat) return;
      const t = ev.target as HTMLElement | null;
      if (t && ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      clearSendTimer();
      flush(); // 보낼 텍스트가 없으면 no-op
    };
    window.addEventListener("keydown", onForceSendKey);

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
      window.removeEventListener("keydown", onForceSendKey);
      // 창이 닫히면(재생 시작·스텝 전환) 보내지 않은 발화는 버린다 — 더는 관람객 차례가 아니다.
      clearSendTimer();
      bufferRef.current = "";
      interimRef.current = "";
      suppressRef.current = false;
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
