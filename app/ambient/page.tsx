"use client";

/**
 * /ambient — main-2026(ambient) 전시용 미래차 화면.
 *
 * classic(`/`)과 달리 이 화면은 수신·렌더 전용이다: 음성 입력도, 질문 UI도 없다.
 * 태블릿이 MQTT로 미래차 서버를 조작하고, 서버는 그 결과를 WS(`/ws/futurecar/{sid}`)로
 * 이 화면에 push 한다. session_id 는 ?sid= 쿼리(기본 DEMO01).
 */
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useScene } from "@/context/scene-context";
import { wsUrl } from "@/utils/wsUrl";
import { StepInfo } from "@/type";
import StepRepeat from "@/components/steps/step-repeat";
import StepAudioPlayer from "@/components/audio-player/step-audio-player";
import StepVideoPlayer from "@/components/video-player/step-video-player";
import { useDevTrigger } from "@/hooks/useDevTrigger";
import GuideModal from "@/components/ui/guide-modal";

type Screen = "connecting" | "waiting" | "step" | "done";

type ErrorMsg = { type: "error"; step: number; code: string; message: string };

const fadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export default function AmbientScreen() {
  const { stepInfo, setStepInfo, reStart } = useScene();
  const [sid, setSid] = useState<string>("DEMO01");
  const [connected, setConnected] = useState(false);
  const [screen, setScreen] = useState<Screen>("connecting");
  const [lastError, setLastError] = useState<ErrorMsg | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  // screen 최신값을 이벤트 핸들러에서 참조하기 위한 ref (stale closure 방지)
  const screenRef = useRef<Screen>("connecting");
  screenRef.current = screen;

  // 🥚 개발자 전용
  const [guide, setGuide] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [debug, setDebug] = useState(false);

  // localStorage에서 devMode 초기값 로드 (SSR 하이드레이션 불일치 방지 위해 effect에서)
  useEffect(() => {
    setDevMode(localStorage.getItem("ftcar_dev_mode") === "true");
  }, []);

  // 트리거: Ctrl/Cmd+Shift+G 또는 우상단 구석 3연속 클릭
  useDevTrigger({ code: "KeyG", corner: "top-right" }, () => setGuide((prev) => !prev));

  // 쿼리(?sid=) 에서 세션 id 읽기 (클라이언트 전용)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("sid");
    if (q) setSid(q);
  }, []);

  useEffect(() => {
    let closed = false;
    let retry: ReturnType<typeof setTimeout>;

    const connect = () => {
      const ws = new WebSocket(wsUrl(sid));
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        switch (msg.type) {
          case "step":
            // 작별 화면 이후에는 새 plan(state.idle)이 오기 전까지 어떤 step도 무시한다
            if (screenRef.current === "done") return;
            setStepInfo(msg.data as StepInfo);
            setScreen("step");
            break;
          case "state":
            if (msg.phase === "idle") {
              // 새 plan 도착 → 클라 세션 리프레시
              reStart();
              setScreen("waiting");
            } else if (msg.phase === "waiting") {
              setScreen("waiting");
            } else if (msg.phase === "done") {
              setScreen("done");
            }
            // "driving" / "arrived" 는 화면 전환 없음 (step 메시지가 비주얼을 이끈다)
            break;
          case "error":
            console.error("[ambient] server error", msg);
            setLastError(msg as ErrorMsg);
            break;
          default:
            console.warn("[ambient] unknown message type", msg);
        }
      };
      ws.onclose = () => {
        setConnected(false);
        if (!closed) retry = setTimeout(connect, 1500); // 자동 재연결
      };
      ws.onerror = () => ws.close();
    };

    connect();
    return () => {
      closed = true;
      clearTimeout(retry);
      wsRef.current?.close();
    };
  }, [sid, setStepInfo, reStart]);

  return (
    <div className="w-full h-full min-h-screen overflow-hidden bg-black text-white">
      <StepVideoPlayer />
      <StepAudioPlayer />

      <AnimatePresence mode="wait">
        {screen === "connecting" && (
          <motion.div
            key="connecting"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="fixed inset-0 flex flex-col items-center justify-center gap-3 bg-neutral-950"
          >
            <div className="text-2xl">연결 중…</div>
            <div className="text-sm text-neutral-500">session={sid}</div>
          </motion.div>
        )}

        {screen === "waiting" && (
          <motion.div
            key="waiting"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="fixed inset-0 flex flex-col items-center justify-center gap-4"
          >
            <div className="text-4xl font-semibold">탑승을 환영합니다</div>
            <div className="text-lg text-neutral-300">곧 여정을 시작합니다</div>
          </motion.div>
        )}

        {screen === "step" && (
          <motion.div
            key="step"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <StepRepeat />
          </motion.div>
        )}

        {screen === "done" && (
          <motion.div
            key="done"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="fixed inset-0 flex flex-col items-center justify-center gap-4"
          >
            <div className="text-4xl font-semibold">오늘 여정을 함께해 주셔서 감사합니다</div>
            <div className="text-lg text-neutral-300">다음에 또 만나요</div>
          </motion.div>
        )}
      </AnimatePresence>

      {devMode && (
        <div className="fixed bottom-2 left-2 z-[999] rounded-md bg-black/70 px-3 py-2 text-xs text-neutral-200 leading-relaxed">
          <div>{connected ? "연결됨" : "연결 대기"} · sid={sid}</div>
          <div>screen={screen} · step={stepInfo?.step ?? "-"}</div>
          {lastError && (
            <div className="text-red-400">
              error {lastError.code}: {lastError.message}
            </div>
          )}
        </div>
      )}

      {devMode && (
        <div className="absolute top-[15%] left-4 max-h-[90vh] overflow-y-auto bg-white max-w-1/2 text-black px-4 py-2 rounded-md z-[999]">
          <button
            onClick={() => {
              setDebug(!debug);
            }}
          >
            step info 디버깅
          </button>
          {stepInfo?.flatAssetsParsed && (
            <span className="ml-2 text-red-600 font-bold">flat asset 파싱 진행함</span>
          )}
          {typeof stepInfo?.aiResponseTime === "number" && (
            <span className="ml-2 text-blue-600 font-bold">AI 응답시간 {stepInfo.aiResponseTime}초</span>
          )}
          {stepInfo?.aiModel && (
            <span className="ml-2 text-blue-600 font-bold">
              model {stepInfo.aiModel}
              {stepInfo.aiReasoningEffort ? ` · reasoning ${stepInfo.aiReasoningEffort}` : ""}
              {stepInfo.aiVerbosity ? ` · verbosity ${stepInfo.aiVerbosity}` : ""}
            </span>
          )}
          {debug && (
            <pre className="h-[40vh] overflow-y-auto">
              {JSON.stringify(stepInfo, null, 2)}
            </pre>
          )}
        </div>
      )}

      <GuideModal open={guide} onClose={() => setGuide(false)} />
    </div>
  );
}
