"use client";

/**
 * /ambient — main-2026(ambient) 전시용 미래차 화면.
 *
 * classic(`/`)과 달리 질문 UI 가 없다. 태블릿이 MQTT 로 enter/exit 만 보내고, 서버는 그 결과를
 * WS 로 이 화면에 push 한다. **스텝 진행은 이 화면에 연결된 마이크가 이끈다** — 대기 화면과
 * 각 스텝 렌더 완료 뒤에 관람객 발화를 STT 해 `POST /ambient/utterance` 로 보내면 서버가
 * 다음 스텝을 생성한다(useCarListener). 재생 중에는 자기수신을 막기 위해 마이크를 닫는다.
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
import TopLayout from "@/components/fixed-layout/top-layout";
import BottomLayout from "@/components/fixed-layout/bottom-layout";
import { useDevTrigger } from "@/hooks/useDevTrigger";
import GuideModal from "@/components/ui/guide-modal";
import TabletSimModal from "@/components/ui/tablet-sim-modal";
import DevLogPanel from "@/components/dev/dev-log-panel";
import HyundaiLoading from "@/components/ui/hyundai-loading";
import { appendDevLog } from "@/utils/devLog";
import { BASE_API_LINK, BASE_S3_LINK, STANDBY_VIDEO, STANDBY_VIDEO_STORAGE_KEY, resolveMediaUrl } from "@/constants";
import { cn } from "@/utils/cn";
import { useCarListener } from "@/hooks/useCarListener";
import ListenIndicator from "@/components/ambient/listen-indicator";

// 서버와 같은 고정 스텝 수. 마지막 스텝 뒤에는 질문이 없으므로 마이크도 열지 않는다.
const TOTAL_STEPS = 4;

// standby: exit ~ 다음 enter 사이(그리고 plan 만 온 idle, 세션이 아직 없을 때)의 대기 화면. 글자 없이 조용히.
// waiting: enter 뒤 ~ step1 전. 마이크가 열려 있고 관람객이 "출발 할까요?" 에 답하는 구간 — 환영 문구 없음.
// ending:  마지막 step 의 asset 재생이 끝난 뒤(state arrived · next=exit) 보여주는 고정 엔딩. exit 가 오면 standby 로.
type Screen = "standby" | "waiting" | "step" | "ending";

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
  const [screen, setScreen] = useState<Screen>("standby");
  const [lastError, setLastError] = useState<ErrorMsg | null>(null);
  // 관람객 차례(마이크 열림): 대기 화면, 스텝 렌더 완료 뒤 ~ 다음 step 수신 전, 서버 error 뒤.
  const [visitorTurn, setVisitorTurn] = useState(false);
  // standby 반복 영상 — 코드 기본값(STANDBY_VIDEO) 위에 이 브라우저의 localStorage 값이 덮는다(현장 설정).
  const [standbyVideo, setStandbyVideo] = useState(STANDBY_VIDEO);
  const [standbyDraft, setStandbyDraft] = useState("");
  const [standbyChoices, setStandbyChoices] = useState<string[]>([]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STANDBY_VIDEO_STORAGE_KEY)?.trim();
      if (saved) setStandbyVideo(saved);
    } catch {
      /* 접근 불가 환경 — 기본값 유지 */
    }
  }, []);
  const applyStandbyVideo = (name: string) => {
    const v = name.trim();
    try {
      if (v) localStorage.setItem(STANDBY_VIDEO_STORAGE_KEY, v);
      else localStorage.removeItem(STANDBY_VIDEO_STORAGE_KEY);
    } catch {
      /* noop */
    }
    setStandbyVideo(v || STANDBY_VIDEO);
    setStandbyDraft("");
  };
  // 부팅 때 미디어 저장소의 mp4 목록을 한 번 받아 자동완성 후보로(실패해도 직접 입력은 된다).
  useEffect(() => {
    fetch(`${BASE_S3_LINK}/?list-type=2&max-keys=1000`)
      .then((r) => (r.ok ? r.text() : ""))
      .then((xml) => {
        const keys = Array.from(xml.matchAll(/<Key>([^<]+\.mp4)<\/Key>/g), (m) => m[1]);
        if (keys.length) setStandbyChoices(keys.sort());
      })
      .catch(() => {});
  }, []);
  const standbyVideoUrl = resolveMediaUrl(standbyVideo);
  const wsRef = useRef<WebSocket | null>(null);
  // screen 최신값을 이벤트 핸들러에서 참조하기 위한 ref (stale closure 방지)
  const screenRef = useRef<Screen>("standby");
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
  // 디버그 재시작 버튼 상태 (idle → 요청 중 → 결과)
  const [restartState, setRestartState] = useState<PublishState | "busy">("idle");

  // localStorage에서 devMode 초기값 로드 (SSR 하이드레이션 불일치 방지 위해 effect에서)
  useEffect(() => {
    setDevMode(localStorage.getItem("ftcar_dev_mode") === "true");
  }, []);

  // devMode(좌측 조작 패널 + step info + 좌하단 연결 배지) 토글. classic(`/`)과 같은 키·영역·저장소.
  const setDevModePersist = useCallback((next: boolean) => {
    setDevMode(next);
    localStorage.setItem("ftcar_dev_mode", String(next));
  }, []);
  const toggleDevMode = useCallback(() => {
    setDevMode((prev) => {
      localStorage.setItem("ftcar_dev_mode", String(!prev));
      return !prev;
    });
  }, []);

  // 트리거: Ctrl/Cmd+Shift+D 또는 좌상단 구석 3연속 클릭. 끄기는 패널의 "디버깅 창 닫기" 버튼으로도 된다.
  // 기본 80px 은 전시장 화면에서 조준하기 어려워 200px 로 넓혔다(600ms 안 3연속이 실질적 오발동 방지책).
  useDevTrigger({ code: "KeyD", corner: "top-left", cornerSize: 200 }, toggleDevMode);

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
            setStepInfo(msg.data as StepInfo);
            setScreen("step");
            setVisitorTurn(false); // 재생 시작 — 우리 소리를 받아 적지 않도록 마이크를 닫는다
            break;
          case "state":
            if (msg.phase === "idle") {
              // 새 plan 도착 → 클라 세션 리프레시
              reStart();
              setScreen("standby");   // plan 만 도착 — enter 전. 조용한 대기 화면
              setVisitorTurn(false);
            } else if (msg.phase === "waiting") {
              setScreen("waiting");
              setVisitorTurn(true); // enter 됨 — "출발 할까요?" 에 답할 차례
            } else if (msg.phase === "done") {
              setScreen("standby");   // exit(또는 태블릿 종료) — 다음 탑승까지 대기
              setVisitorTurn(false);
            } else if (msg.phase === "arrived" && msg.next === "exit") {
              // 마지막 step 재생 완료 — 서버가 next=exit 를 실어 보내는 유일한 지점.
              // 태블릿이 exit 버튼을 켜는 동안 화면은 고정 엔딩을 보여준다.
              setScreen("ending");
              setVisitorTurn(false);
            }
            // 그 외 "driving" / "arrived" 는 화면 전환 없음 (step 메시지가 비주얼을 이끈다)
            break;
          case "error":
            console.error("[ambient] server error", msg);
            setLastError(msg as ErrorMsg);
            // 생성 실패 등 — 관람객이 다시 말하면 서버가 재시도하므로 마이크를 다시 연다
            setVisitorTurn(true);
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

  // 디버그: 가장 최근 세션(추종 중인 세션이 있으면 그 세션)의 plan 으로 여정을 처음부터 다시 시작.
  // 태블릿에서 새 세션을 만들고 차로 이동 확정을 누르는 과정을 건너뛴다. 서버가 state idle → waiting
  // 을 발행하므로 와일드카드 모드면 그 세션으로 자동 추종된다.
  const restartJourney = () => {
    const API = BASE_API_LINK.replace(/\/+$/, "");
    setRestartState("busy");
    fetch(`${API}/ambient/restart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sid ?? activeSidRef.current ?? undefined }),
    })
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as { session_id?: string; detail?: string };
        appendDevLog({
          category: "ambient",
          stage: "restart",
          level: res.ok ? "info" : "warn",
          message: res.ok ? `여정 재시작 → ${body.session_id}` : `재시작 실패 ${res.status}: ${body.detail ?? ""}`,
          sessionId: body.session_id ?? undefined,
          source: "client",
        });
        setRestartState(res.ok ? "success" : "error");
      })
      .catch((err) => {
        console.error("[ambient] 재시작 요청 실패", err);
        setRestartState("error");
      })
      .finally(() => setTimeout(() => setRestartState("idle"), 1500));
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
      // 렌더가 끝났으니 관람객 차례 — 마지막 스텝은 질문이 없어 열지 않는다(엔딩으로 넘어감).
      setVisitorTurn(step < TOTAL_STEPS);
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

  // 차량 마이크 STT 발화 → 서버. 서버가 수집(collected)했으면 이 창에서는 더 듣지 않는다.
  const sendUtterance = useCallback(
    async (text: string): Promise<boolean> => {
      const sessionId = sid ?? activeSidRef.current;
      if (!sessionId) {
        console.warn("[ambient] session_id 없음 — 발화 전송 생략:", text);
        return false;
      }
      const API = BASE_API_LINK.replace(/\/+$/, "");
      try {
        const res = await fetch(`${API}/ambient/utterance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId, transcript: text, source: "car-stt" }),
        });
        const body = (await res.json()) as { ok?: boolean; result?: string };
        appendDevLog({
          category: "ambient",
          stage: "utterance",
          level: body.ok ? "info" : "warn",
          message: `발화 "${text}" → ${body.result ?? res.status}`,
          sessionId,
          source: "client",
        });
        return body.ok === true;
      } catch (err) {
        console.error("[ambient] 발화 전송 실패", err);
        appendDevLog({
          category: "ambient",
          stage: "utterance",
          level: "error",
          message: `발화 전송 실패: ${err}`,
          sessionId,
          source: "client",
        });
        return false;
      }
    },
    [sid],
  );
  const listener = useCarListener({ active: visitorTurn && !!controlSid, onFinal: sendUtterance });

  return (
    <div className="w-full h-full min-h-screen overflow-hidden bg-black text-white">
      <ListenIndicator state={listener} />
      {/* ambient 모드: 키 입력 없이 즉시 재생, 전 스텝 루프, 두 번째 재생부터 블러 */}
      <StepVideoPlayer ambient />
      <StepAudioPlayer />

      {/* classic(`/`)과 같은 고정 프레임·HUD. step 연출 중에만 띄운다 — 대기/작별 화면은
          전용 레이아웃이라 프레임이 겹치면 안 된다. classic 은 stepNumber 로 HUD 를 가리지만
          ambient 는 step1 부터 정식 연출이라 hud 를 강제로 켠다. */}
      {screen === "step" && (
        <>
          <TopLayout hud totalSteps={4} />
          <BottomLayout />
        </>
      )}

      <AnimatePresence mode="wait">
        {screen === "standby" && (
          <motion.div
            key="standby"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.6 }}
            className="fixed inset-0 flex flex-col items-center justify-center bg-neutral-950"
          >
            {/* exit ~ enter 사이 대기. 대기 영상(기본 constants.ts STANDBY_VIDEO, 현장에서는 dev 패널로 변경)을
                무음으로 무한 반복한다. 관람객에게 보이는 글자는 두지 않는다. 영상 로드 실패 시 로더만 남는다. */}
            <video
              key={standbyVideoUrl}
              src={standbyVideoUrl}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="absolute inset-0 h-full w-full object-cover"
              onError={(e) => console.warn("[ambient] standby 영상 로드 실패", standbyVideoUrl, e)}
            />
            <div className="relative opacity-60">
              <HyundaiLoading />
            </div>
            {!connected && <div className="relative mt-6 text-sm text-neutral-500">서버 연결 중…</div>}
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
            {/* enter 뒤 ~ step1 전. 환영 문구 없이 비워 둔다 — 마이크 인디케이터가 "듣고 있어요" 를 맡는다. */}
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

        {screen === "ending" && (
          <motion.div
            key="ending"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 1 }}
            className="fixed inset-0 z-[22] flex flex-col items-center justify-center text-center text-white backdrop-blur-lg bg-black/10"
          >
            <h1 className="text-[96px] font-bold">체험이 모두 끝났습니다!</h1>
            <HyundaiLoading />
            <p className="text-[28px] opacity-60">뒷쪽 출구로 퇴장해 주세요.</p>
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
          <div>screen={screen} · step={stepInfo?.step ?? "-"} · mic={listener.status}</div>
          {lastError && (
            <div className="text-red-400">
              error {lastError.code}: {lastError.message}
            </div>
          )}
        </div>
      )}

      {devMode && (
        <div className="absolute top-[15%] left-4 w-28 z-[999] flex flex-col gap-1.5 rounded-md border border-neutral-700 bg-neutral-900/90 px-2 py-2 text-white">
          {/* 명시적 닫기 — 호버하면 다시 켜는 방법(단축키·클릭 영역)이 뜬다 */}
          <div className="group relative">
            <button
              type="button"
              onClick={() => setDevModePersist(false)}
              aria-label="디버깅 창 닫기"
              className="w-full rounded bg-neutral-700 px-2 py-1 text-[11px] font-semibold hover:bg-red-700"
            >
              디버깅 창 닫기
            </button>
            {/* 위쪽으로 띄운다 — 오른쪽은 step info 창(z-999)에 가려진다. z 는 전체 화면 최상단. */}
            <div className="pointer-events-none absolute bottom-full left-0 mb-2 hidden w-max rounded bg-black/95 px-2 py-1.5 text-[10px] leading-snug text-neutral-200 shadow-lg group-hover:block z-[2147483647]">
              <div>다시 켜기: <kbd className="rounded bg-neutral-700 px-1">Ctrl/⌘</kbd>+<kbd className="rounded bg-neutral-700 px-1">Shift</kbd>+<kbd className="rounded bg-neutral-700 px-1">D</kbd></div>
              <div>또는 좌상단 모서리 3연속 클릭</div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-neutral-400">현재 STEP</div>
            <div className="text-2xl font-bold leading-tight">{stepInfo?.step ?? "-"}</div>
          </div>
          <div className="my-0.5 h-px bg-neutral-700" />
          {/* 디버그 재시작 — 최근 세션 plan 으로 idle→enter 까지 한 번에 */}
          <button
            type="button"
            onClick={restartJourney}
            disabled={restartState === "busy"}
            title="최근 세션의 plan 으로 여정을 처음부터 다시 시작 (태블릿 새 세션 불필요)"
            className={cn(
              "rounded px-2 py-1.5 text-[11px] font-semibold transition-colors",
              restartState === "busy" ? "cursor-wait bg-neutral-800 text-neutral-500" : "cursor-pointer bg-sky-800 hover:bg-sky-700",
              restartState === "success" && "bg-green-700",
              restartState === "error" && "bg-red-700"
            )}
          >
            {restartState === "success" ? "✓ 재시작" : restartState === "error" ? "✕ 재시작" : restartState === "busy" ? "…" : "여정 재시작"}
          </button>
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
          {/* 현장 설정: 대기(standby) 영상 — 이 브라우저에 저장, 즉시 반영 */}
          <div className="mt-2 flex flex-wrap items-center gap-2 rounded border border-neutral-300 bg-neutral-50 px-2 py-1.5 text-[11px]">
            <span className="font-semibold">대기 영상</span>
            <span className="font-mono text-sky-700" title={standbyVideoUrl}>{standbyVideo}</span>
            {standbyVideo !== STANDBY_VIDEO && <span className="text-neutral-500">(기본 {STANDBY_VIDEO})</span>}
            <input
              list="standby-video-choices"
              value={standbyDraft}
              onChange={(e) => setStandbyDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyStandbyVideo(standbyDraft);
              }}
              placeholder="파일명 또는 URL"
              className="w-44 rounded border border-neutral-300 px-1.5 py-0.5 font-mono"
            />
            <datalist id="standby-video-choices">
              {standbyChoices.map((k) => (
                <option key={k} value={k} />
              ))}
            </datalist>
            <button
              type="button"
              onClick={() => applyStandbyVideo(standbyDraft)}
              disabled={!standbyDraft.trim()}
              className="rounded bg-sky-700 px-2 py-0.5 font-semibold text-white disabled:bg-neutral-300"
            >
              적용
            </button>
            <button
              type="button"
              onClick={() => applyStandbyVideo("")}
              disabled={standbyVideo === STANDBY_VIDEO}
              className="rounded bg-neutral-200 px-2 py-0.5 disabled:opacity-40"
            >
              기본값
            </button>
          </div>
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
      <DevLogPanel open={devLogOpen} onClose={() => setDevLogOpen(false)} activeSessionId={controlSid} />
    </div>
  );
}
