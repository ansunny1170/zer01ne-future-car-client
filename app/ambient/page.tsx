"use client";

/**
 * /ambient — main-2026(ambient) 전시용 미래차 화면.
 *
 * classic(`/`)과 달리 이 화면은 수신·렌더 전용이다: 음성 입력도, 질문 UI도 없다.
 * 태블릿이 MQTT로 미래차 서버를 조작하고, 서버는 그 결과를 WS로 이 화면에 push 한다.
 *
 * session_id 는 두 가지 모드로 정해진다:
 * - 고정 세션 모드: ?sid= 쿼리가 있으면 `/ws/futurecar/{sid}` 로 접속해 그 세션만 받는다.
 * - 자동 추종(와일드카드) 모드: ?sid= 가 없으면 `/ws/futurecar` 로 접속해 모든 세션의
 *   메시지를 받는다(차 1대·화면 1개뿐이라 실제 상영 중인 세션이 하나뿐이라는 전제).
 *   서버가 각 메시지에 session_id 를 붙여 보내주므로, 새 plan(state.idle)이 오면 그
 *   세션으로 갈아타고, 그 외에는 지금 따라가는 세션의 메시지만 받는다.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useScene } from "@/context/scene-context";
import { wsUrl } from "@/utils/wsUrl";
import { StepInfo } from "@/type";
import StepRepeat from "@/components/steps/step-repeat";
import StepAudioPlayer from "@/components/audio-player/step-audio-player";
import StepVideoPlayer from "@/components/video-player/step-video-player";
import { useDevTrigger } from "@/hooks/useDevTrigger";
import GuideModal from "@/components/ui/guide-modal";
import TabletSimModal from "@/components/ui/tablet-sim-modal";
import DevLogPanel from "@/components/dev/dev-log-panel";
import { appendDevLog } from "@/utils/devLog";
import { BASE_API_LINK } from "@/constants";
import { cn } from "@/utils/cn";

type Screen = "connecting" | "waiting" | "step" | "done";

type ErrorMsg = { type: "error"; step: number; code: string; message: string };

// 개발자 조작 패널이 발행할 수 있는 요청 종류 (manual_tablet.py 가 보내는 것과 동일)
// 진행은 advance 로 통일했다(서버에서 start 는 advance 별칭). 버튼에서는 start 를 뺀다.
const TABLET_CONTROL_TYPES = ["enter", "advance", "exit"] as const;
type TabletControlType = (typeof TABLET_CONTROL_TYPES)[number];
// 버튼별 클릭 후 잠깐 보여줄 결과 상태
type PublishState = "idle" | "success" | "error";

const fadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

// devMode 배지용: 긴 UUID는 앞 8자만 보여준다
function truncateSid(v: string): string {
  return v.length > 8 ? `${v.slice(0, 8)}…` : v;
}

export default function AmbientScreen() {
  const { stepInfo, setStepInfo, reStart } = useScene();
  // sid === null → 자동 추종(와일드카드) 모드. ?sid= 쿼리가 있으면 그 값으로 고정된다.
  const [sid, setSid] = useState<string | null>(null);
  // 와일드카드 모드에서 지금 화면이 따라가고 있는 session_id
  const [activeSid, setActiveSid] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [screen, setScreen] = useState<Screen>("connecting");
  const [lastError, setLastError] = useState<ErrorMsg | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  // screen 최신값을 이벤트 핸들러에서 참조하기 위한 ref (stale closure 방지)
  const screenRef = useRef<Screen>("connecting");
  screenRef.current = screen;
  // activeSid 최신값을 이벤트 핸들러에서 참조하기 위한 ref (stale closure 방지, screenRef와 동일 패턴)
  const activeSidRef = useRef<string | null>(null);
  activeSidRef.current = activeSid;

  // 🥚 개발자 전용
  const [guide, setGuide] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [debug, setDebug] = useState(false);
  // 🥚 중앙 우측 3연속 클릭(또는 Ctrl/Cmd+Shift+T)으로 여는 태블릿 시뮬레이터 사용법, devMode와 무관하게 독립 동작
  const [tabletSim, setTabletSim] = useState(false);
  // 🥚 상단 중앙 3연속 클릭(또는 Ctrl/Cmd+Shift+L)으로 여는 dev_log 패널, devMode와 무관하게 독립 동작
  const [devLogOpen, setDevLogOpen] = useState(false);
  // 개발자 조작 패널: 버튼별 클릭 결과 표시(성공 ✓ / 실패 ✕), 일정 시간 후 idle로 복귀
  const [publishState, setPublishState] = useState<Record<TabletControlType, PublishState>>({
    enter: "idle",
    advance: "idle",
    exit: "idle",
  });

  // localStorage에서 devMode 초기값 로드 (SSR 하이드레이션 불일치 방지 위해 effect에서)
  useEffect(() => {
    setDevMode(localStorage.getItem("ftcar_dev_mode") === "true");
  }, []);

  // 트리거: Ctrl/Cmd+Shift+G 또는 우상단 구석 3연속 클릭
  useDevTrigger({ code: "KeyG", corner: "top-right" }, () => setGuide((prev) => !prev));

  // 트리거: Ctrl/Cmd+Shift+T 또는 중앙 우측 영역 3연속 클릭 (devMode와 독립)
  useDevTrigger({ code: "KeyT", corner: "center-right" }, () => setTabletSim((prev) => !prev));

  // 트리거: Ctrl/Cmd+Shift+L 또는 상단 중앙 영역 3연속 클릭 (devMode와 독립)
  useDevTrigger({ code: "KeyL", corner: "top-center" }, () => setDevLogOpen((prev) => !prev));

  // 쿼리(?sid=) 에서 세션 id 읽기 (클라이언트 전용)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("sid");
    if (q) setSid(q);
  }, []);

  useEffect(() => {
    let closed = false;
    let retry: ReturnType<typeof setTimeout>;
    // sid 가 있으면 고정 세션 모드(그 세션만 옴), 없으면 와일드카드(모든 세션이 옴)
    const isWildcard = sid === null;

    const connect = () => {
      const ws = new WebSocket(wsUrl(sid ?? undefined));
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);

        // dev_log 는 세션 필터보다 먼저 통과시킨다 — 아래 와일드카드 블록이 세션
        // 불일치로 return 해버리면 관측 로그가 조용히 사라진다.
        if (msg.type === "dev_log") {
          appendDevLog({
            category: msg.category,
            stage: msg.stage,
            level: msg.level,
            message: msg.message,
            sessionId: typeof msg.session_id === "string" ? msg.session_id : undefined,
            at: msg.at ?? undefined,
            elapsed: typeof msg.elapsed === "number" ? msg.elapsed : undefined,
            detail: msg.detail ?? null,
            serverTs: msg.ts,
            source: "server",
          });
          return;
        }

        // 와일드카드 모드에서만: 어떤 세션 메시지를 받아들일지 판단(고정 모드는 서버가
        // 이미 해당 세션만 보내주므로 건너뛴다).
        if (isWildcard) {
          // 빈 문자열/undefined/null 은 전부 "세션 없음"으로 본다.
          const msgSid =
            typeof msg.session_id === "string" && msg.session_id ? msg.session_id : null;
          if (msgSid === null) {
            // 🔴 세션을 특정할 수 없는 메시지는 채택하지 않는다.
            // null 을 추종 세션으로 채택해 버리면, 이후 실제 세션 메시지가 전부
            // 아래 불일치 분기에 걸려 버려져 전시 화면이 영구히 멈춘다.
            console.warn("[ambient] session_id 없는 메시지 무시:", msg.type);
            return;
          }
          if (msg.type === "state" && msg.phase === "idle") {
            // 새 plan/여정 시작 → 이 세션으로 갈아탄다 (이후 정상 처리로 이어짐)
            setActiveSid(msgSid);
            activeSidRef.current = msgSid;
          } else if (activeSidRef.current === null) {
            // 페이지 로드 후 처음 받은 메시지 → 일단 이 세션을 채택
            setActiveSid(msgSid);
            activeSidRef.current = msgSid;
          } else if (msgSid !== activeSidRef.current) {
            // 다른 세션의 트래픽은 무시
            return;
          }
        }

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

  // 고정 세션 모드면 sid, 와일드카드 모드면 지금 추종 중인 activeSid를 사용
  const controlSid = sid ?? activeSid;

  // 개발자 조작 버튼: manual_tablet.py 대신 화면에서 직접 MQTT 요청을 발행
  const publishTabletRequest = (type: TabletControlType) => {
    if (!controlSid) return;
    const API = BASE_API_LINK.replace(/\/+$/, "");
    fetch(`${API}/mqtt/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: controlSid, type }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`status ${res.status}`);
        setPublishState((prev) => ({ ...prev, [type]: "success" }));
      })
      .catch((err) => {
        console.error("[ambient] tablet control publish 실패", type, err);
        setPublishState((prev) => ({ ...prev, [type]: "error" }));
      })
      .finally(() => {
        setTimeout(() => {
          setPublishState((prev) => ({ ...prev, [type]: "idle" }));
        }, 1200);
      });
  };

  // 이 스텝의 asset 을 전부 렌더·재생했음을 서버에 알린다.
  // MQTT(태블릿 명령 채널)가 아니라 HTTP 로 보낸다 — 이건 명령이 아니라 화면의
  // 사실 보고이고, 서버는 이걸 받아야 phase 를 arrived 로 올려 state.next(advance|exit)
  // 를 켜준다. 즉 "다음으로 넘어가도 된다"를 태블릿이 알 수 있게 되는 지점이다.
  // 화면은 응답을 기다리지 않는다(fire-and-forget) — 보고가 실패해도 렌더는 이미 끝났고,
  // 태블릿 조작은 여전히 가능해야 하기 때문.
  const notifyStepRendered = useCallback(
    (step: number) => {
      const sessionId = sid ?? activeSidRef.current;
      if (!sessionId) {
        console.warn("[ambient] session_id 없음 — 렌더 완료 보고 생략", step);
        return;
      }
      appendDevLog({
        category: "ambient",
        stage: "render_complete",
        level: "info",
        message: `step ${step} 렌더 완료 → 서버 보고`,
        sessionId,
        source: "client",
      });
      const API = BASE_API_LINK.replace(/\/+$/, "");
      fetch(`${API}/ambient/step-rendered`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, step }),
      }).catch((err) => {
        console.error("[ambient] 렌더 완료 보고 실패", step, err);
        appendDevLog({
          category: "ambient",
          stage: "render_complete",
          level: "error",
          message: `step ${step} 렌더 완료 보고 실패: ${err}`,
          sessionId,
          source: "client",
        });
      });
    },
    [sid],
  );

  return (
    <div className="w-full h-full min-h-screen overflow-hidden bg-black text-white">
      {/* autoStart: 이 화면은 키 입력이 없다(태블릿이 MQTT 로 조작) → 마운트 즉시 재생 */}
      <StepVideoPlayer autoStart />
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
            <StepRepeat onTimelineComplete={notifyStepRendered} />
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
          <div>
            {connected ? "연결됨" : "연결 대기"} ·{" "}
            {sid
              ? `모드=고정 · sid=${sid}`
              : `모드=자동추종 · 세션=${activeSid ? truncateSid(activeSid) : "대기중"}`}
          </div>
          <div>screen={screen} · step={stepInfo?.step ?? "-"}</div>
          {lastError && (
            <div className="text-red-400">
              error {lastError.code}: {lastError.message}
            </div>
          )}
        </div>
      )}

      {devMode && (
        <div className="absolute top-[15%] left-4 w-28 z-[999] flex flex-col gap-1.5 rounded-md border border-neutral-700 bg-neutral-900/90 px-2 py-2 text-white">
          <div className="text-center">
            <div className="text-[10px] text-neutral-400">현재 STEP</div>
            <div className="text-2xl font-bold leading-tight">{stepInfo?.step ?? "-"}</div>
          </div>
          <div className="my-0.5 h-px bg-neutral-700" />
          {TABLET_CONTROL_TYPES.map((type) => {
            const state = publishState[type];
            return (
              <button
                key={type}
                type="button"
                disabled={!controlSid}
                onClick={() => publishTabletRequest(type)}
                className={cn(
                  "rounded px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors",
                  controlSid
                    ? "cursor-pointer bg-neutral-700 hover:bg-neutral-600"
                    : "cursor-not-allowed bg-neutral-800 text-neutral-500",
                  state === "success" && "bg-green-700",
                  state === "error" && "bg-red-700"
                )}
              >
                {state === "success" ? "✓" : state === "error" ? "✕" : type}
              </button>
            );
          })}
          {!controlSid && <div className="text-center text-[10px] text-neutral-500">세션 대기중</div>}
        </div>
      )}

      {devMode && (
        <div className="absolute top-[15%] left-32 max-h-[90vh] overflow-y-auto bg-white max-w-1/2 text-black px-4 py-2 rounded-md z-[999]">
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
          {stepInfo?.aiPromptName && (
            <span className="ml-2 text-green-700 font-bold">prompt {stepInfo.aiPromptName}</span>
          )}
          {debug && (
            <pre className="h-[40vh] overflow-y-auto">
              {JSON.stringify(stepInfo, null, 2)}
            </pre>
          )}
        </div>
      )}

      <GuideModal open={guide} onClose={() => setGuide(false)} />
      <TabletSimModal open={tabletSim} onClose={() => setTabletSim(false)} />
      <DevLogPanel open={devLogOpen} onClose={() => setDevLogOpen(false)} />
    </div>
  );
}
