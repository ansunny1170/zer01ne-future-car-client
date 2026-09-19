"use client";

/**
 * useCarListener — /ambient 화면의 차량 마이크 청취 (S/D 키 수동 조작, 2026-09-19).
 *
 * 전시 정책: 차량 스텝 진행은 **차량 클라이언트에 연결한 마이크**로 관람객 발화를 STT 해 서버에
 * 보내는 것으로만 이뤄진다(태블릿은 미래차 모드에서 입력이 잠긴다). 브라우저 Web Speech API
 * (Chrome — 구글 서버 STT, 인터넷 필요)를 쓴다.
 *
 * 조작 (과거 키오스크 UX 복원):
 * - **S 키**: 마이크 열기(STT 시작). 이미 듣는 중이면 버퍼를 비우고 다시 듣는다(재녹음).
 * - **D 키**: 지금까지 인식한 발화를 서버로 전송.
 * - 자동 개방·자동(침묵) 전송은 없다. 운영자/관람객이 S 로 열고 말한 뒤 D 로 보낸다.
 *
 * 게이트: `active`(page 의 visitorTurn — **모든 에셋 렌더가 끝나 관람객 차례가 된 구간**)가
 * 참일 때만 S 키에 반응한다. 렌더 중에는 S 를 눌러도 마이크가 열리지 않는다(자기수신 방지).
 * `active` 가 false 로 바뀌면(재생 시작·스텝 전환) 마이크를 닫고 무장 해제한다.
 * `onFinal` 이 `true`(서버 수집)를 돌려주면 이 창에서는 더 듣지 않는다(중복 발화 방지).
 */
import { useCallback, useEffect, useRef, useState } from "react";

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

// 하위 호환(디버그 패널이 import) — 이제 자동 전송이 없어 실제로는 쓰이지 않는다.
export const SEND_DELAY_MS = 2000;

// off: 관람객 차례 아님 / armed-off: 차례지만 S 대기(마이크 닫힘) / listening: 듣는 중 /
// paused: 전송 완료로 이 창 청취 종료 / error·unsupported
export type CarListenerStatus = "unsupported" | "off" | "armed-off" | "listening" | "paused" | "error";

export interface CarListenerState {
  status: CarListenerStatus;
  interim: string;
  pending: string;
  lastFinal: string | null;
  error: string | null;
  /** 전송 대기 중인 발화를 버리고 처음부터 다시 듣는다 */
  reset: () => void;
}

export interface UseCarListenerOptions {
  /** 지금 관람객 차례인가(에셋 렌더 완료 후) — 참일 때만 S 키에 반응한다 */
  active: boolean;
  /** 확정 발화 처리. 서버가 수집했으면 true — 이 창에서는 더 듣지 않는다 */
  onFinal: (text: string) => Promise<boolean>;
  lang?: string;
  /** (미사용) 하위 호환용 — 자동 전송이 없어 무시된다 */
  sendDelayMs?: number;
}

export function useCarListener({ active, onFinal, lang = "ko-KR" }: UseCarListenerOptions): CarListenerState {
  const [status, setStatus] = useState<CarListenerStatus>("off");
  const [interim, setInterim] = useState("");
  const [pending, setPending] = useState("");
  const [lastFinal, setLastFinal] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // S 키로 마이크를 열었는가(무장). active 가 참일 때만 의미가 있다.
  const [armed, setArmed] = useState(false);

  const recRef = useRef<Recognizer | null>(null);
  const sentRef = useRef(false);
  const wantRef = useRef(false);
  const bufferRef = useRef("");
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;
  const finalSeenRef = useRef(-1);
  const interimRef = useRef("");
  const suppressRef = useRef(false);
  // flush(D 키 전송)를 인식 세션 밖(키 핸들러)에서 부를 수 있도록 최신 구현을 ref 로 노출.
  const flushRef = useRef<() => void>(() => {});
  // 재녹음(S 재누름)을 키 핸들러에서 부르기 위한 ref.
  const restartRef = useRef<() => void>(() => {});
  // 키 핸들러가 재등록 없이 최신 armed 를 읽도록 ref 로도 들고 있는다.
  const armedRef = useRef(false);
  armedRef.current = armed;

  const prevActive = useRef(false);
  // 창이 새로 열릴 때(active false→true) '보냈음' 표식을 지우고, 닫힐 때 무장을 해제한다.
  // 렌더 중 setState 를 피하려 effect 에서 처리한다.
  useEffect(() => {
    if (active && !prevActive.current) sentRef.current = false;
    if (!active && prevActive.current) setArmed(false);
    prevActive.current = active;
  }, [active]);

  const stop = useCallback(() => {
    wantRef.current = false;
    try {
      recRef.current?.stop();
    } catch {
      /* 이미 멈춤 */
    }
  }, []);

  // 초기화 — 버퍼를 비우고 **인식 세션도 재시작**한다. 세션만 안 끊으면 Chrome continuous
  // 모드가 이전 인식 결과를 다음 onresult 에 되살려(finalSeenRef·잔여 결과) 초기화 전 발화가
  // 이어붙는다. restart(인식 세션 안에서 정의)가 그 처리를 다 하므로 위임한다.
  const reset = useCallback(() => {
    bufferRef.current = "";
    interimRef.current = "";
    setPending("");
    setInterim("");
    restartRef.current(); // 마이크가 열려 있으면 세션 재시작, 아니면 no-op
  }, []);

  // ── S/D 키 핸들러 — active 인 동안 항상 붙어 있다(마이크 개방 여부와 무관) ──────────
  useEffect(() => {
    if (!active) return;
    const onKey = (ev: KeyboardEvent) => {
      // 물리 키 위치 기준(code) — 한글 자판이어도 같은 자리(ㄴ=S, ㅇ=D)면 동작한다.
      if (ev.repeat) return;
      const t = ev.target as HTMLElement | null;
      if (t && ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      if (ev.code === "KeyS") {
        ev.preventDefault();
        if (sentRef.current) return; // 이미 전송한 창 — 다음 스텝까지 대기
        if (!armedRef.current) setArmed(true); // 첫 S: 마이크 열기(무장)
        else restartRef.current(); // 듣는 중 S: 재녹음
      } else if (ev.code === "KeyD") {
        ev.preventDefault();
        flushRef.current(); // D: 전송(보낼 게 없으면 no-op)
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  // ── 인식 세션 — active && armed && 미전송 일 때만 마이크를 연다 ─────────────────────
  useEffect(() => {
    const Ctor = getCtor();
    if (!Ctor) {
      setStatus("unsupported");
      return;
    }
    if (!active) {
      stop();
      setStatus("off");
      setInterim("");
      return;
    }
    if (sentRef.current) {
      stop();
      setStatus("paused");
      setInterim("");
      return;
    }
    if (!armed) {
      // 관람객 차례지만 아직 S 를 안 눌렀다 — 마이크는 닫혀 있다.
      stop();
      setStatus("armed-off");
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
      finalSeenRef.current = -1;
      suppressRef.current = false;
      setStatus("listening");
      setError(null);
    };

    // D 키 전송 — 지금까지 인식된 확정+중간 발화를 합쳐 서버로.
    const flush = () => {
      const text = `${bufferRef.current} ${interimRef.current}`.replace(/\s+/g, " ").trim();
      bufferRef.current = "";
      interimRef.current = "";
      setPending("");
      if (!text) return;
      suppressRef.current = true;
      setLastFinal(text);
      setInterim("");
      stop();
      void onFinalRef.current(text).then((collected) => {
        if (collected) {
          sentRef.current = true;
          setArmed(false);
          setStatus("paused");
        } else if (prevActive.current) {
          // 서버가 안 받았으면(빈 문자열·창 밖) 계속 들을 수 있게 다시 연다.
          wantRef.current = true;
          try {
            rec.start();
          } catch {
            /* onend 경로에서 재시작 */
          }
        }
      });
    };
    flushRef.current = flush;

    // S 재누름 — 지금까지 모은 발화를 버리고 인식 세션을 새로 시작한다.
    const restart = () => {
      bufferRef.current = "";
      interimRef.current = "";
      finalSeenRef.current = -1;
      setPending("");
      setInterim("");
      suppressRef.current = true; // stop 뒤 잔여 결과를 다음 onstart 까지 무시
      try {
        rec.stop(); // onend → wantRef 참이라 자동 재시작
      } catch {
        /* noop */
      }
    };
    restartRef.current = restart;

    rec.onresult = (e) => {
      if (suppressRef.current) return;
      let interimText = "";
      let finalText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) {
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
    };

    rec.onerror = (e) => {
      const code = e.error ?? "unknown";
      if (code !== "no-speech" && code !== "aborted") {
        setError(code);
        setStatus("error");
      }
      if (code === "not-allowed" || code === "service-not-allowed") wantRef.current = false;
    };
    rec.onend = () => {
      if (wantRef.current && !sentRef.current) {
        try {
          rec.start();
          return;
        } catch {
          /* 곧바로 재시작 거부되면 아래로 */
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
  }, [active, armed, lang, stop]);

  return { status, interim, pending, lastFinal, error, reset };
}
