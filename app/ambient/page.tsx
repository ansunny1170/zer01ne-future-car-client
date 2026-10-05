"use client";

/**
 * /ambient — main-2026(ambient) 전시용 미래차 화면.
 *
 * classic(`/`)과 달리 질문 UI 가 없다. 태블릿이 MQTT 로 enter/exit 만 보내고, 서버는 그 결과를
 * WS 로 이 화면에 push 한다. **스텝 진행은 이 화면에 연결된 마이크가 이끈다** — 대기 화면과
 * 각 스텝 렌더 완료 뒤(관람객 차례)에 운영자가 **S 키로 마이크를 열어** 관람객 발화를 STT 하고
 * **D 키로 전송**하면(`POST /ambient/utterance`) 서버가 다음 스텝을 생성한다(useCarListener).
 * 렌더 중에는 S 를 눌러도 마이크가 열리지 않는다(자기수신 방지).
 *
 * session_id 는 두 가지 모드로 정해진다:
 * - 고정 세션 모드: ?sid= 쿼리가 있으면 `/ws/futurecar/{sid}` 로 접속해 그 세션만 받는다.
 * - 자동 추종(와일드카드) 모드: ?sid= 가 없으면 `/ws/futurecar` 로 접속해 모든 세션의
 *   메시지를 받는다(차 1대·화면 1개뿐이라 실제 상영 중인 세션이 하나뿐이라는 전제).
 *   서버가 각 메시지에 session_id 를 붙여 보내주므로, 새 plan(state.idle) 또는 탑승
 *   (어떤 세션이 waiting 으로 바뀜)이 오면 그 세션으로 갈아타고, 그 외에는 지금 따라가는
 *   세션의 메시지만 받는다.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useScene } from "@/context/scene-context";
import { wsUrl } from "@/utils/wsUrl";
import { StepInfo } from "@/type";
import StepRepeat, { type TimelineTrace } from "@/components/steps/step-repeat";
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
import PopupPreview, { PreviewItem } from "@/components/ambient/popup-preview";
import NoticePopup, { type NoticeMsg } from "@/components/ambient/notice-popup";
import CloneTalkSplit from "@/components/ui/clone-talk-split";

// 서버와 같은 고정 스텝 수. 마지막 스텝 뒤에는 질문이 없으므로 마이크도 열지 않는다.
// 배경 영상 재생을 기다리는 비상 상한 — 영상 오류(없는 파일 등)는 즉시 진행하므로, 오류도 재생도 없이 멈춘 경우만 해당
const VIDEO_WAIT_MAX_MS = 30000;
const CHARGE_FILL_MS = 4000; // 배터리가 100% 까지 차오르는 시간
const TOTAL_STEPS = 3; // 스토리라인(2026-09-13): s1 선픽스 → s2 충전소 무인 → s3 경유지+최종

// standby: exit ~ 다음 enter 사이(그리고 plan 만 온 idle, 세션이 아직 없을 때)의 대기 화면. 글자 없이 조용히.
// waiting: enter 뒤 ~ step1 전. 관람객 차례(S 키로 마이크 열림) 구간 — 환영 문구 없음.
// ending:  마지막 step 의 asset 재생이 끝난 뒤(state arrived · next=exit) 보여주는 고정 엔딩. exit 가 오면 standby 로.
type Screen = "standby" | "waiting" | "step" | "ending";

type ErrorMsg = { type: "error"; step: number; code: string; message: string };

// 개발자 조작 패널이 발행할 수 있는 요청 종류 (manual_tablet.py 가 보내는 것과 동일)
// 진행은 advance 로 통일했다(서버에서 start 는 advance 별칭). 버튼에서는 start 를 뺀다.
const TABLET_CONTROL_TYPES = ["enter", "advance", "exit"] as const;

// 세션 목록의 updated_at 은 오프셋 없는 UTC(MySQL) — 한국시간 "MM-DD HH:mm" 으로 보여준다.
function sessionTimeKst(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(/Z$|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : `${iso}Z`);
  if (isNaN(d.getTime())) return iso.slice(5, 16).replace("T", " ");
  const p = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(d);
  const v = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${v("month")}-${v("day")} ${v("hour")}:${v("minute")}`;
}
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

// 복제 재시작 세션 id — 서버 규칙 '{원본}-tN' (app/services/mqtt/client.py _next_clone_sid)
const isCloneSid = (sessionId: string) => /-t\d+$/.test(sessionId);

export default function AmbientScreen() {
  const { stepInfo, setStepInfo, reStart, preloadedAudio, videoPath, setVideoPath, playingVideoPath, failedVideoPath } = useScene();
  // 영상 재생 직후 대사(2026-10-05): 스텝의 배경 영상(bgv)이 실제로 재생을 시작한 뒤에야 타임라인(대사·팝업·효과음)을
  // 시작한다. 전에는 스텝이 오자마자 대사가 시작돼 영상 준비가 늦으면 이전 영상 위에 새 대사가 먼저 떴다.
  // 영상을 끝까지 기다린다. 단 영상이 오류(없는 파일·네트워크 실패)면 바로, 오류도 재생도 없이 멈추면 VIDEO_WAIT_MAX_MS
  // 뒤에 시작한다 — 여정(렌더 완료 보고 → 다음 스텝)이 멈추지 않게.
  const stepVideo = stepInfo?.bgv?.file_name || null;
  const [videoWaitOver, setVideoWaitOver] = useState<object | null>(null);
  const stepVideoReady = !stepInfo || !stepVideo || playingVideoPath === stepVideo || failedVideoPath === stepVideo
    || videoWaitOver === stepInfo;
  const videoWaitStart = useRef<{ info: object; at: number } | null>(null);
  useEffect(() => {
    if (!stepInfo || stepVideoReady) return;
    videoWaitStart.current = { info: stepInfo, at: Date.now() };
    const t = setTimeout(() => {
      setVideoWaitOver(stepInfo);
      appendDevLog({
        category: "ambient", stage: "video_wait", level: "warn", source: "client",
        message: `step ${stepInfo.step} 배경 영상(${stepVideo}) ${VIDEO_WAIT_MAX_MS / 1000}초 안에 재생 안 됨 — 대사 먼저 시작`,
      });
    }, VIDEO_WAIT_MAX_MS);
    return () => clearTimeout(t);
  }, [stepInfo, stepVideo, stepVideoReady]);
  useEffect(() => {
    const w = videoWaitStart.current;
    if (!stepVideoReady || !w || w.info !== stepInfo) return;
    videoWaitStart.current = null;
    const failed = failedVideoPath === stepVideo && playingVideoPath !== stepVideo;
    appendDevLog({
      category: "ambient", stage: "video_wait", level: failed ? "warn" : "info", source: "client",
      message: failed
        ? `step ${stepInfo?.step} 배경 영상(${stepVideo}) 불러오기 실패 — 대사 바로 시작 (대기 ${Date.now() - w.at}ms)`
        : `step ${stepInfo?.step} 배경 영상 재생 시작 → 대사 시작 (대기 ${Date.now() - w.at}ms)`,
    });
  }, [stepVideoReady, stepInfo, stepVideo, failedVideoPath, playingVideoPath]);
  // sid === null → 자동 추종(와일드카드) 모드. ?sid= 쿼리가 있으면 그 값으로 고정된다.
  const [sid, setSid] = useState<string | null>(null);
  // 와일드카드 모드에서 지금 화면이 따라가고 있는 session_id
  const [activeSid, setActiveSid] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [screen, setScreen] = useState<Screen>("standby");
  const [lastError, setLastError] = useState<ErrorMsg | null>(null);
  // 서버 단발 알림(수소충전 게이트 등) — 받을 때마다 NoticePopup 이 3초 띄우고 스스로 닫는다.
  const [notice, setNotice] = useState<NoticeMsg | null>(null);
  // 수소충전 게이트 래치 — 게이트 진입(sticky 팝업 등장)부터 **다음 step(step2) 도착 전까지** true.
  // 게이트 중에는 마이크를 열지 않는다(음성으로는 게이트가 안 풀린다 — 태블릿 완료만 푼다).
  // step1 질문(수소충전 승인 요청)은 태블릿 완료 → step2 도착 전까지 계속 보인다(QA 2026-09-29).
  // 주의: 팝업이 clear 되는 순간(완료 대행 직후)이 아니라, 실제로 step2 가 도착할 때 풀어야 한다.
  // clear 시점에 풀면 step2 생성 전 짧은 틈에 step1 질문·마이크 UI 가 튀어나온다(관측된 버그).
  const [gateLatched, setGateLatched] = useState(false);
  const gateLatchedRef = useRef(false);
  gateLatchedRef.current = gateLatched;
  // sticky 팝업이 뜨면 래치를 건다. clear(active=false)로는 풀지 않는다 — step 수신에서만 푼다.
  const handleStickyChange = useCallback((active: boolean) => {
    if (active) setGateLatched(true);
  }, []);
  // 관람객 차례(마이크 열림): 대기 화면, 스텝 렌더 완료 뒤 ~ 다음 step 수신 전, 서버 error 뒤.
  const [visitorTurn, setVisitorTurn] = useState(false);
  // 게이트가 걸리면 이미 열려 있던 관람객 차례(마이크)를 즉시 닫는다.
  useEffect(() => {
    if (gateLatched) setVisitorTurn(false);
  }, [gateLatched]);
  // 차 화면 환영 대사 — 서버가 경로 픽스 후 waiting state 에 실어 보낸다(태블릿 AI 가 차로 이어지는 연출).
  const [greeting, setGreeting] = useState<string | null>(null);
  // 우상단 배터리(2026-10-05): 여정마다 33~49% 중 하나로 시작한다. step2 이후 CLONE_TALKS·팝업에
  // "충전 완료"가 보이는 즉시 100% 까지 차오르고, 그런 말이 없으면 step2 재생이 끝날 때 차오른다.
  // SSR 과 값이 달라지지 않게 첫 값은 고정, 마운트 후 무작위로 바꾼다.
  const [battery, setBattery] = useState(41);
  const chargeTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopCharge = useCallback(() => {
    if (chargeTimer.current) clearInterval(chargeTimer.current);
    chargeTimer.current = null;
  }, []);
  const rollBattery = useCallback(() => {
    stopCharge();
    setBattery(33 + Math.floor(Math.random() * 17));
  }, [stopCharge]);
  // 지금 값에서 100% 까지 4초에 걸쳐 차오른다(사람이 보고 알 수 있게). 이미 차는 중이거나 100% 면 그대로.
  const batteryRef = useRef(41);
  batteryRef.current = battery;
  const chargeToFull = useCallback(() => {
    if (chargeTimer.current) return;
    const from = batteryRef.current;
    if (from >= 100) return;
    const started = Date.now();
    chargeTimer.current = setInterval(() => {
      const t = Math.min(1, (Date.now() - started) / CHARGE_FILL_MS);
      setBattery(Math.round(from + (100 - from) * t));
      if (t >= 1) stopCharge();
    }, 50);
  }, [stopCharge]);
  useEffect(() => {
    rollBattery();
    return stopCharge;
  }, [rollBattery, stopCharge]);
  const onAssetShown = useCallback(
    (asset: Record<string, unknown>, step: number) => {
      // 서버가 끼워 넣은 태블릿 완료 표시("수소 충전 완료" 등)는 실제 충전 진행이 아니다
      if (step < 2 || asset.origin === "tablet") return;
      const text = ["description", "subtext_popup", "text", "title"]
        .map((k) => (typeof asset[k] === "string" ? (asset[k] as string) : ""))
        .join(" ");
      if (/충전\s*(이|을)?\s*(모두\s*)?완료/.test(text)) chargeToFull();
    },
    [chargeToFull],
  );
  // 디버그 '시계 표시' — 우상단 시각을 보일지(이 브라우저에 기억, 기본 표시).
  const [showClock, setShowClock] = useState(true);
  useEffect(() => {
    try {
      setShowClock(localStorage.getItem("ftcar_show_clock") !== "false");
    } catch {
      // 저장소 차단 — 기본(표시)
    }
  }, []);
  const toggleShowClock = (next: boolean) => {
    setShowClock(next);
    try {
      localStorage.setItem("ftcar_show_clock", String(next));
    } catch {
      // 저장 실패해도 이번 화면에서는 동작한다
    }
  };
  // 엔딩 화면에 보여줄 최종 목적지(한글) — next=exit state 의 next_place 에서 받는다.
  const [endingPlace, setEndingPlace] = useState<string | null>(null);
  // 서버 state.ending(2026-09-26): 마지막 step 렌더 완료에만 실린다 — 최종 목적지 영상(file_name)과 하차 문구.
  // video 가 있으면 배경을 그 영상으로 바꾸고 블러를 끈다. 없으면(구 서버·매핑 없음) 스텝 3 영상 + 기존 문구.
  const [endingInfo, setEndingInfo] = useState<{ video?: string | null; message?: string | null } | null>(null);
  // 소리 뮤트(운영자 토글, localStorage 지속) — 화면의 모든 audio/video 와 프리로드 오디오를 음소거.
  // 뮤트면 우상단 아이콘이 디버그 여부와 무관하게 항상 보이고, 아니면 아무것도 안 보인다
  // (투명하지만 같은 자리가 토글 버튼이다). 마이크 입력(STT)에는 영향 없다.
  const [muted, setMuted] = useState(false);
  useEffect(() => {
    try {
      setMuted(localStorage.getItem("ftcar_muted") === "true");
    } catch {
      /* 접근 불가 환경 — 기본 소리 켬 */
    }
  }, []);
  const applyMute = useCallback((m: boolean) => {
    document.querySelectorAll<HTMLMediaElement>("audio,video").forEach((el) => {
      el.muted = m;
    });
    // COMPANION_VOICE·효과음은 DOM 밖의 프리로드 Audio 로 재생된다 — 맵도 같이 덮는다.
    preloadedAudio?.forEach((el) => {
      el.muted = m;
    });
  }, [preloadedAudio]);
  useEffect(() => {
    applyMute(muted);
    if (!muted) return;
    // 스텝 전환마다 미디어 요소가 새로 생기므로, 뮤트 동안엔 주기적으로 다시 덮는다.
    const timer = setInterval(() => applyMute(true), 800);
    return () => clearInterval(timer);
  }, [muted, applyMute, stepInfo, screen]);
  const toggleMute = () => {
    setMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("ftcar_muted", String(next));
      } catch {
        /* noop */
      }
      return next;
    });
  };
  // 스텝 질문 표시 종료 플래그 — 발화가 서버에 "수집됨" 응답을 받은 순간에만 켠다.
  // 마이크 상태 전이에 묶으면 전송 전에 이른 숨김이 생겨서(2026-09-13 관측) 명시 이벤트로 분리.
  const [questionDismissed, setQuestionDismissed] = useState(false);
  // 인사(greeting)가 오기 전/안 올 때의 마이크 개방 폴백 타이머 — waiting 화면에서만 발화한다.
  const greetingWaitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 스텝 질문 구간 표식: 렌더 완료 ~ 다음 step 수신 전. 질문 타이핑 완료 +2초 뒤 마이크를 열고,
  // 질문이 안 뜨는 예외는 8초 폴백으로 연다. ref 는 타이머 콜백의 stale 값 방지.
  const [stepQuestionActive, setStepQuestionActive] = useState(false);
  const stepQuestionActiveRef = useRef(false);
  stepQuestionActiveRef.current = stepQuestionActive;
  const stepMicFallback = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  // ── 배경/대기 영상 항상 무음 (2026-09-20) ─────────────────────────────────────
  // 인트로 브금(intro1_1.mp4)은 scene-context 에서 재생 자체를 껐고, 나머지 배경 영상(대기
  // en6.mp4, 스텝 배경)에 박힌 내레이션도 안 나오게 무음 고정. React 의 <video muted> prop 은
  // DOM 에 실제로 안 먹는 버그가 있어(JSX muted 만으로는 소리가 남), ref 로 직접 박는다.
  const standbyVideoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = standbyVideoRef.current;
    if (el) el.muted = true;
  }, [standbyVideo, screen]);
  // (2026-09-19) 발화 전송이 침묵 디바운스 → S/D 수동 조작으로 바뀌어 '발화 딜레이' 설정은 제거됐다.
  // LLM 모델·옵션 — 다른 현장 설정과 달리 localStorage 가 아니라 **서버 런타임 값**이다
  // (GET/PUT /ambient/llm-config). 즉시 반영되고, 서버 컨테이너 재시작 시 env 기본값으로 복귀.
  type LlmConfig = { model: string; reasoning_effort: string; verbosity: string };
  const [llmConfig, setLlmConfig] = useState<LlmConfig | null>(null);
  const [llmDraft, setLlmDraft] = useState<LlmConfig>({ model: "", reasoning_effort: "", verbosity: "" });
  const [llmState, setLlmState] = useState<"idle" | "busy" | "success" | "error">("idle");
  // 디버그 패널의 설정 3종(대기 영상·발화 딜레이·LLM) 접기/펼치기 — 평소엔 접어 화면을 아낀다.
  const [settingsOpen, setSettingsOpen] = useState(false);
  // 현재 적용 중인 프롬프트 이름(서버 DB 최신 레코드) — 표시 전용. 교체는 MinIO 업로드+레코드 갱신.
  const [promptNames, setPromptNames] = useState<{ step: string; ending: string } | null>(null);
  // 세션 여정 요약(디버그) — /ambient/session/{sid} 스냅샷의 여정 양끝·픽스 경로·차량 태스크 전체.
  type SessionDebug = {
    journey_from_place?: string | null;
    journey_to_place?: string | null;
    path_plan?: { step1?: string; final?: string };
    tasks?: { key: string; title: string; kind: string; done: boolean }[];
    // 마지막 스텝 렌더 완료 때 실릴 엔딩(서버 ending_for) — 디버그 '엔딩 화면 보기'가 같은 영상·문구로 미리 본다
    ending?: { place?: string | null; place_name?: string | null; video?: string | null; message?: string | null } | null;
  };
  const [sessionDebug, setSessionDebug] = useState<SessionDebug | null>(null);
  const applyLlmConfig = () => {
    const API = BASE_API_LINK.replace(/\/+$/, "");
    setLlmState("busy");
    fetch(`${API}/ambient/llm-config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...llmDraft, model: llmDraft.model.trim() }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        const cfg = (await res.json()) as LlmConfig;
        setLlmConfig(cfg);
        setLlmDraft(cfg);
        setLlmState("success");
      })
      .catch((err) => {
        console.error("[ambient] LLM 설정 변경 실패", err);
        setLlmState("error");
      })
      .finally(() => setTimeout(() => setLlmState("idle"), 1500));
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
  // 와일드카드 모드: 세션별 마지막 phase — 어떤 세션이 waiting 으로 '바뀌는' 순간(탑승)을 잡는다.
  const lastPhaseBySidRef = useRef<Map<string, string>>(new Map());
  // 복제 세션 격리(2026-10-05): 복제 재시작 세션('{원본}-tN')은 그걸 실행한 화면만 따라간다.
  // 다른 화면(전시 화면)은 무시해서 테스트가 관람객 여정 화면을 빼앗지 않는다. 무시한 메시지는
  // 세션별로 잠깐 담아 두었다가, 이 화면에서 복제 재시작을 눌러 그 세션으로 고정할 때 재생한다
  // (재시작 응답보다 idle·waiting state 가 먼저 도착하기 때문).
  const pinnedCloneRef = useRef<string | null>(null);
  const cloneBufferRef = useRef<Map<string, string[]>>(new Map());
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
  // 수소충전 완료 대행 버튼 상태 (태블릿 없이 게이트 해제)
  const [hydrogenState, setHydrogenState] = useState<PublishState | "busy">("idle");
  // 디버그 재시작 대상 세션 선택 — 서버 GET /ambient/sessions (plan 보유, 2026-08 이후만) 목록.
  // 빈 값이면 기존처럼 자동(추종 중인 세션 또는 최근 세션).
  const [sessionChoices, setSessionChoices] = useState<
    { session_id: string; updated_at: string | null; step?: number | null; persona_title?: string; username?: string }[]
  >([]);
  const [restartSid, setRestartSid] = useState("");
  // 디버그 '리뷰 생성하기' — 켜 두면 재시작한 테스트 여정이 끝날 때(엔딩 화면) 서버가 일기를 만들어 /review 에 올린다.
  // 이 브라우저에만 기억한다(새로고침해도 유지).
  const [reviewOnRestart, setReviewOnRestart] = useState(false);
  // 디버그 '시작 스텝'(복제 재시작 전용) — 2·3 이면 서버가 앞 스텝을 화면 없이 자동 진행하고 그 스텝부터 보여준다.
  const [startStep, setStartStep] = useState(1);
  useEffect(() => {
    try {
      setReviewOnRestart(localStorage.getItem("ftcar_review_on_restart") === "true");
    } catch {
      // 저장소 차단(사생활 보호 모드 등) — 기본값(꺼짐)으로 둔다
    }
  }, []);
  const toggleReviewOnRestart = (next: boolean) => {
    setReviewOnRestart(next);
    try {
      localStorage.setItem("ftcar_review_on_restart", String(next));
    } catch {
      // 저장 실패해도 이번 화면에서는 동작한다
    }
  };

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

  // devMode 를 켤 때마다 재시작 후보 세션 목록과 서버 LLM 설정을 새로 받는다(실패해도 나머지는 동작).
  useEffect(() => {
    if (!devMode) return;
    const API = BASE_API_LINK.replace(/\/+$/, "");
    fetch(`${API}/ambient/sessions`)
      .then((r) => (r.ok ? r.json() : { sessions: [] }))
      .then((body: { sessions?: unknown }) => {
        if (Array.isArray(body.sessions)) setSessionChoices(body.sessions);
      })
      .catch(() => {});
    fetch(`${API}/ambient/llm-config`)
      .then((r) => (r.ok ? r.json() : null))
      .then((cfg) => {
        if (cfg && typeof cfg.model === "string") {
          setLlmConfig(cfg);
          setLlmDraft(cfg);
        }
      })
      .catch(() => {});
    // 현재 적용 프롬프트 — 제목(H1) 우선, 없으면 파일명. 엔딩(일기)도 신시스템(kind=ending)
    // 우선이고, 아직 레코드가 없으면 구 ending-reflection-prompt 테이블 파일명으로 폴백한다.
    const basename = (u?: string) => (u ? decodeURIComponent(u.split("/").pop() || u) : "?");
    const nameOf = (p: { title?: string; filename?: string; file_url?: string } | null) =>
      p?.title || p?.filename || basename(p?.file_url);
    Promise.all([
      fetch(`${API}/prompt/latest`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(`${API}/prompt/latest?kind=ending`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(`${API}/ending-reflection-prompt/latest`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([p, en, legacy]) => setPromptNames({
      step: nameOf(p),
      ending: en ? nameOf(en) : basename(legacy?.file_url),
    }));
  }, [devMode]);

  // 트리거: Ctrl/Cmd+Shift+D 또는 좌상단 구석 3연속 클릭. 끄기는 패널의 "디버깅 창 닫기" 버튼으로도 된다.
  // 기본 80px 은 전시장 화면에서 조준하기 어려워 200px 로 넓혔다(600ms 안 3연속이 실질적 오발동 방지책).
  useDevTrigger({ code: "KeyD", corner: "top-left", cornerSize: 200 }, toggleDevMode);

  // 트리거: Ctrl/Cmd+Shift+G 또는 우상단 구석 3연속 클릭
  useDevTrigger({ code: "KeyG", corner: "top-right" }, () => setGuide((prev) => !prev));

  // 트리거: Ctrl/Cmd+Shift+T 또는 중앙 우측 영역 3연속 클릭 (devMode와 독립)
  useDevTrigger({ code: "KeyT", corner: "center-right" }, () => setTabletSim((prev) => !prev));

  // 트리거: Ctrl/Cmd+Shift+L 또는 상단 중앙 영역 3연속 클릭 (devMode와 독립)
  useDevTrigger({ code: "KeyL", corner: "top-center" }, () => setDevLogOpen((prev) => !prev));

  // M 키: 음소거 토글. 이 키와 디버그창 버튼 외에는 뮤트를 바꿀 수 없다(화면 오터치 방지).
  // 물리 키 위치(code) 기준 — 한글 자판(ㅡ=M)에서도 동작. 입력칸 타이핑 중엔 무시.
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.code !== "KeyM" || ev.repeat) return;
      const t = ev.target as HTMLElement | null;
      if (t && ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      toggleMute();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
          if (isCloneSid(msgSid) && msgSid !== pinnedCloneRef.current) {
            // 남이 띄운 복제(테스트) 세션 — 따라가지 않는다. 이 화면이 고정할 때를 대비해 최근 것만 담아 둔다.
            const buf = cloneBufferRef.current.get(msgSid) ?? [];
            buf.push(e.data);
            if (buf.length > 40) buf.shift();
            cloneBufferRef.current.delete(msgSid);
            cloneBufferRef.current.set(msgSid, buf);
            if (cloneBufferRef.current.size > 5) {
              cloneBufferRef.current.delete(cloneBufferRef.current.keys().next().value as string);
            }
            return;
          }
          const prevPhase = lastPhaseBySidRef.current.get(msgSid);
          if (msg.type === "state" && typeof msg.phase === "string") {
            lastPhaseBySidRef.current.set(msgSid, msg.phase);
          }
          if (msg.type === "state" && msg.phase === "idle") {
            // 새 plan/여정 시작 → 이 세션으로 갈아탄다 (이후 정상 처리로 이어짐)
            if (msgSid !== pinnedCloneRef.current) pinnedCloneRef.current = null; // 관람객 새 여정이 테스트 고정을 푼다
            setActiveSid(msgSid);
            activeSidRef.current = msgSid;
          } else if (
            msg.type === "state" && msg.phase === "waiting" && prevPhase !== "waiting" &&
            msgSid !== activeSidRef.current
          ) {
            // 탑승(enter)한 세션으로 갈아탄다 — 실제로 차에 탄 세션이 화면을 가져간다(2026-10-03).
            // 다른 세션(복제 재시작 등)이 먼저 화면을 잡아도 실관람 세션의 탑승이 되찾는다.
            // waiting→waiting(인사 갱신) 재발행으로는 전환하지 않아 서로 뺏고 뺏기지 않는다.
            // 이 화면이 복제 테스트에 고정돼 있어도 관람객 탑승이 우선이다(고정 해제).
            pinnedCloneRef.current = null;
            setActiveSid(msgSid);
            activeSidRef.current = msgSid;
            reStart();
            setGateLatched(false);
            setGreeting(null);
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
            // step3 부터 시작(복제 '시작 스텝')·충전 이후 스텝은 이미 충전된 상태
            if (((msg.data as StepInfo)?.step ?? 0) >= 3) {
              stopCharge();
              setBattery(100);
            }
            setScreen("step");
            setVisitorTurn(false); // 재생 시작 — 우리 소리를 받아 적지 않도록 마이크를 닫는다
            setStepQuestionActive(false); // 직전 질문 구간 종료 — 폴백 타이머 오발동 방지
            setGateLatched(false); // 다음 step(step2) 도착 — 수소충전 게이트 해제
            if (stepMicFallback.current) {
              clearTimeout(stepMicFallback.current);
              stepMicFallback.current = null;
            }
            break;
          case "state":
            if (msg.phase === "idle") {
              rollBattery(); // 새 여정 — 배터리 다시 뽑기
              // 새 plan 도착 → 클라 세션 리프레시
              reStart();
              setScreen("standby");   // plan 만 도착 — enter 전. 조용한 대기 화면
              setVisitorTurn(false);
              setGateLatched(false);  // 새 여정 — 게이트 래치 초기화
              setGreeting(null);
            } else if (msg.phase === "waiting") {
              setScreen("waiting");
              // 마이크는 바로 열지 않는다 — 시작 인사(clone talk) 타이핑이 끝나고 1초 뒤에 연다
              // (인사 렌더의 onComplete 경로). 인사가 안 오는 예외(경로판정 실패·구버전)에는
              // 8초 폴백으로 그냥 연다. 타이머 발화 시 여전히 waiting 인지 확인해 오발동을 막는다.
              setVisitorTurn(false);
              if (typeof (msg as { greeting?: unknown }).greeting === "string") {
                if (greetingWaitTimer.current) clearTimeout(greetingWaitTimer.current);
                setGreeting((msg as { greeting: string }).greeting);
              } else if (!greetingWaitTimer.current) {
                // 25초: 복제 재시작은 인사가 사전 생성(step1 포함) 완료 후에 와서 10~20초
                // 걸린다 — 폴백이 인사보다 먼저 마이크를 열지 않도록 그보다 길게 잡는다.
                greetingWaitTimer.current = setTimeout(() => {
                  greetingWaitTimer.current = null;
                  if (screenRef.current === "waiting") setVisitorTurn(true);
                }, 25000);
              }
            } else if (msg.phase === "done") {
              setScreen("standby");   // exit(또는 태블릿 종료) — 다음 탑승까지 대기
              setVisitorTurn(false);
              setGateLatched(false);
            } else if (msg.phase === "arrived" && msg.next === "exit") {
              // 마지막 step 재생 완료 — 서버가 next=exit 를 실어 보내는 유일한 지점.
              // 태블릿이 exit 버튼을 켜는 동안 화면은 고정 엔딩을 보여준다.
              setScreen("ending");
              setVisitorTurn(false);
              setEndingPlace(typeof msg.next_place === "string" && msg.next_place ? msg.next_place : null);
              const ending = msg.ending && typeof msg.ending === "object" ? msg.ending : null;
              setEndingInfo(ending ? { video: typeof ending.video === "string" ? ending.video : null,
                                       message: typeof ending.message === "string" ? ending.message : null } : null);
              if (ending && typeof ending.video === "string" && ending.video) setVideoPath(ending.video); // 최종 목적지 영상
            }
            // 그 외 "driving" / "arrived" 는 화면 전환 없음 (step 메시지가 비주얼을 이끈다)
            break;
          case "error":
            console.error("[ambient] server error", msg);
            setLastError(msg as ErrorMsg);
            // 생성 실패 등 — 관람객이 다시 말하면 서버가 재시도하므로 마이크를 다시 연다
            setVisitorTurn(true);
            break;
          case "notice":
            // 단발 알림(수소충전 게이트 등) — 매번 새 객체로 넣어 NoticePopup 이 재트리거된다
            setNotice({ ...(msg as unknown as NoticeMsg) });
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
  }, [sid, setStepInfo, reStart, setVideoPath, rollBattery, stopCharge]); // 배터리 콜백은 안정 참조 — 재연결 안 일으킴

  // 고정 세션 모드면 sid, 와일드카드 모드면 지금 추종 중인 activeSid를 사용
  const controlSid = sid ?? activeSid;

  // 디버그 창이 켜져 있는 동안 세션 스냅샷(여정 양끝·픽스 경로·태스크)을 따라간다 —
  // 스텝/관람객 차례가 바뀔 때마다 새로 읽어 done 표시가 갱신되게 한다.
  useEffect(() => {
    if (!devMode || !controlSid) {
      setSessionDebug(null);
      return;
    }
    const API = BASE_API_LINK.replace(/\/+$/, "");
    fetch(`${API}/ambient/session/${controlSid}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.exists) setSessionDebug(d as SessionDebug);
      })
      .catch(() => {});
  }, [devMode, controlSid, stepInfo, visitorTurn]);

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

  // 디버그: 태블릿 대행으로 수소충전(modal) 태스크를 완료 처리 → 서버가 게이트를 풀고 step2 를 생성한다.
  // 실제 태블릿 완료와 동일 경로(POST /mqtt/complete-task)이며 공용 브로커 발행은 하지 않는다.
  const completeHydrogen = () => {
    if (!controlSid || hydrogenState === "busy") return;
    const API = BASE_API_LINK.replace(/\/+$/, "");
    setHydrogenState("busy");
    fetch(`${API}/mqtt/complete-task`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: controlSid, type: "hydrogen_charging" }),
    })
      .then((res) => res.json())
      .then((body: { ok?: boolean; error?: string }) => {
        if (!body.ok) throw new Error(body.error ?? "실패");
        setHydrogenState("success");
      })
      .catch((err) => {
        console.error("[ambient] 수소충전 완료 대행 실패", err);
        setHydrogenState("error");
      })
      .finally(() => {
        setTimeout(() => setHydrogenState("idle"), 1600);
      });
  };

  // 디버그: 엔딩 화면 미리보기. 이 화면에서만 바뀌고 서버·태블릿·OC 에는 아무것도 보내지 않는다.
  // 세션이 있으면 서버 스냅샷의 엔딩(최종 목적지 영상·하차 문구)을, 없으면 기본 문구를 쓴다.
  // 다시 누르면 들어오기 전 화면·영상·마이크 상태로 돌아간다(그사이 실제 흐름이 화면을 바꿨으면 그대로 둔다).
  const endingPreviewRef = useRef<{ screen: Screen; video: string | null; visitorTurn: boolean } | null>(null);
  // 디버그 '이미지 팝업 미리보기' — 스텝과 무관하게 이미지 팝업(관리자 '팝업 설정'의 14종)을 이 화면에 띄운다. 조회만.
  const [popupPreviewId, setPopupPreviewId] = useState<string>("ALL");
  const [popupPreviewItems, setPopupPreviewItems] = useState<PreviewItem[] | null>(null);
  const [popupPreviewSeconds, setPopupPreviewSeconds] = useState(5);
  const [popupCatalog, setPopupCatalog] = useState<PreviewItem[]>([]);
  useEffect(() => {
    if (!devMode) return;
    const API = BASE_API_LINK.replace(/\/+$/, "");
    fetch(`${API}/popups/images`).then((r) => (r.ok ? r.json() : null))
      .then((d) => setPopupCatalog((d?.rows ?? []) as PreviewItem[])).catch(() => {});
  }, [devMode]);
  const startPopupPreview = () => {
    if (popupPreviewItems) {
      setPopupPreviewItems(null); // 다시 누르면 멈춤
      return;
    }
    const API = BASE_API_LINK.replace(/\/+$/, "");
    Promise.all([
      fetch(`${API}/popups/images`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(`${API}/popups/config`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([imgs, cfg]) => {
      const rows = (imgs?.rows ?? []) as PreviewItem[];
      setPopupCatalog(rows);
      const items = popupPreviewId === "ALL" ? rows : rows.filter((r) => r.id === popupPreviewId);
      if (items.length === 0) return;
      setPopupPreviewSeconds(Number(cfg?.default?.seconds) || 5); // 관리자 '팝업 설정'의 DEFAULT 표시 시간
      setPopupPreviewItems(items);
    });
  };

  const toggleEndingPreview = () => {
    const saved = endingPreviewRef.current;
    if (saved && screen === "ending") {
      endingPreviewRef.current = null;
      setScreen(saved.screen);
      setVideoPath(saved.video);
      setVisitorTurn(saved.visitorTurn);
      return;
    }
    endingPreviewRef.current = { screen, video: videoPath, visitorTurn };
    const ending = sessionDebug?.ending ?? null;
    setScreen("ending");
    setVisitorTurn(false);
    setEndingPlace(ending?.place_name ?? null);
    // 영상은 step 진행 중일 때만 — StepVideoPlayer 는 step 이 없으면 로컬 경로로 찾아서(classic 인트로용) 대기 화면에선 안 뜬다.
    const video = stepInfo?.step ? ending?.video ?? null : null;
    setEndingInfo(ending ? { video, message: ending.message ?? null } : null);
    if (video) setVideoPath(video);
  };
  // 미리보기 중 실제 흐름이 화면을 바꾸면(새 step·exit) 되돌릴 대상이 사라진 것 — 기억을 버린다.
  useEffect(() => {
    if (screen !== "ending") endingPreviewRef.current = null;
  }, [screen]);

  // 디버그: 가장 최근 세션(추종 중인 세션이 있으면 그 세션)의 plan 으로 여정을 처음부터 다시 시작.
  // 태블릿에서 새 세션을 만들고 차로 이동 확정을 누르는 과정을 건너뛴다. 서버가 state idle → waiting
  // 을 발행하므로 와일드카드 모드면 그 세션으로 자동 추종된다.
  // 이 화면을 복제 세션에 고정하고, 그동안 무시해 둔 그 세션 메시지(idle·waiting·인사 등)를 순서대로 재생한다.
  const pinClone = (cloneSid: string) => {
    pinnedCloneRef.current = cloneSid;
    const buffered = cloneBufferRef.current.get(cloneSid) ?? [];
    cloneBufferRef.current.delete(cloneSid);
    const ws = wsRef.current;
    if (ws?.onmessage) {
      for (const data of buffered) ws.onmessage(new MessageEvent("message", { data }));
    }
    setActiveSid(cloneSid);
    activeSidRef.current = cloneSid;
  };

  const restartJourney = () => {
    const API = BASE_API_LINK.replace(/\/+$/, "");
    setRestartState("busy");
    fetch(`${API}/ambient/restart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // 드롭다운에서 고른 세션이 우선, 없으면 기존처럼 추종 중인 세션 → 서버 자동(최근).
      // 명시적으로 고른 세션은 복제(clone) 모드 — 원본 DB 기록을 덮지 않고 '{원본}-tN' 사본으로 시작.
      body: JSON.stringify({
        session_id: restartSid || sid || activeSidRef.current || undefined,
        clone: !!restartSid,
        review: reviewOnRestart,
        // 시작 스텝은 복제(세션을 고른 경우)에서만 — 실세션 되감기는 OC 에 태스크 완료를 보고하므로 서버가 막는다.
        start_step: restartSid ? startStep : 1,
      }),
    })
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as { session_id?: string; detail?: string };
        appendDevLog({
          category: "ambient",
          stage: "restart",
          level: res.ok ? "info" : "warn",
          message: res.ok
            ? `여정 재시작 → ${body.session_id}${restartSid && startStep > 1 ? ` (step${startStep} 부터)` : ""}${reviewOnRestart ? " (리뷰 생성)" : ""}`
            : `재시작 실패 ${res.status}: ${body.detail ?? ""}`,
          sessionId: body.session_id ?? undefined,
          source: "client",
        });
        setRestartState(res.ok ? "success" : "error");
        // 자동 추종 화면에서 복제 재시작을 눌렀으면 이 화면만 그 복제 세션으로 고정한다.
        // 다른 화면(전시 화면)은 복제 세션을 무시하므로 관람객 여정이 그대로 보인다.
        if (res.ok && sid === null && body.session_id && isCloneSid(body.session_id)) {
          pinClone(body.session_id);
        }
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
    (step: number, trace?: TimelineTrace[]) => {
      if (step >= 2) chargeToFull(); // step2(무인 수소 충전) 재생 완료 — "충전 완료" 말이 없었어도 이때 차오른다
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
      // 렌더 완료 — 질문을 먼저 띄우고, 마이크는 질문 타이핑 완료 +2초 뒤에 연다(아래 onComplete).
      // 마지막 스텝은 질문이 없어 열지 않는다(엔딩으로 넘어감).
      setQuestionDismissed(false);
      setStepQuestionActive(step < TOTAL_STEPS);
      if (stepMicFallback.current) clearTimeout(stepMicFallback.current);
      if (step < TOTAL_STEPS) {
        // 질문이 없거나 렌더되지 못하는 예외 — 8초 뒤에도 질문 구간이면 그냥 연다
        stepMicFallback.current = setTimeout(() => {
          stepMicFallback.current = null;
          if (stepQuestionActiveRef.current) setVisitorTurn(true);
        }, 8000);
      } else {
        setVisitorTurn(false);
      }
      fetch(`${API}/ambient/step-rendered`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, step, ...(trace ? { trace } : {}) }),
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
    [sid, chargeToFull],
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
        if (body.ok === true) setQuestionDismissed(true);   // 수집 성공 — 질문 UI 내림
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
  // 게이트(수소충전 sticky 알림) 중에는 마이크·발화 UI 를 열지 않는다.
  const listener = useCarListener({ active: visitorTurn && !!controlSid && !gateLatched, onFinal: sendUtterance });

  return (
    <div className="w-full h-full min-h-screen overflow-hidden bg-black text-white">
      <ListenIndicator state={listener} />
      {popupPreviewItems && (
        <PopupPreview items={popupPreviewItems} seconds={popupPreviewSeconds} onDone={() => setPopupPreviewItems(null)} />
      )}
      <NoticePopup notice={notice} onStickyChange={handleStickyChange} />
      {/* 소리 뮤트 표시(표시 전용) — 뮤트면 디버그 여부와 무관하게 항상 보이고, 아니면 없다.
          토글은 M 키 또는 디버그창 상단 음소거 버튼으로만 한다(화면 오터치 방지). */}
      {muted && (
        <div className="pointer-events-none fixed right-24 top-3 z-[1000] flex h-14 w-14 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ff5a5a" strokeWidth="2.2" strokeLinecap="round">
            <path d="M11 5 6 9H3v6h3l5 4z" fill="white" stroke="none" />
            <line x1="16.5" y1="9.5" x2="21.5" y2="14.5" />
            <line x1="21.5" y1="9.5" x2="16.5" y2="14.5" />
          </svg>
        </div>
      )}
      {/* 스텝 질문을 clone talk 자리에 표시 — 렌더 완료(visitorTurn) 후 관람객 발화가
          서버에 수집되기 전(paused 전)까지 유지한다. 태블릿 없이 화면만 보고도
          무엇에 답할지 알 수 있게. 다음 step 이 오면 visitorTurn 이 꺼져 사라진다. */}
      {screen === "step" && stepQuestionActive && !questionDismissed && stepInfo?.question && (
        // 게이트 중에도 질문(충전 승인 요청)은 유지 — sticky 알림의 전체 블러(z-40) 위로 올린다.
        <div className={gateLatched ? "relative z-50" : undefined}>
          <CloneTalkSplit
            key={`q-${stepInfo.step}`}
            text={stepInfo.question}
            keepLastLine
            onComplete={() => {
              // 질문 타이핑 완료 +2초 뒤 마이크 개방 — 시작 인사와 동일한 리듬. 게이트 중엔 열지 않는다.
              setTimeout(() => {
                if (stepQuestionActiveRef.current && !gateLatchedRef.current) setVisitorTurn(true);
              }, 2000);
            }}
          />
        </div>
      )}
      {/* ambient 모드: 키 입력 없이 즉시 재생, 전 스텝 루프, 두 번째 재생부터 블러 */}
      <StepVideoPlayer ambient clear={screen === "ending" && !!endingInfo?.video} />
      <StepAudioPlayer />

      {/* classic(`/`)과 같은 고정 프레임·HUD. step 연출 중에만 띄운다 — 대기/작별 화면은
          전용 레이아웃이라 프레임이 겹치면 안 된다. classic 은 stepNumber 로 HUD 를 가리지만
          ambient 는 step1 부터 정식 연출이라 hud 를 강제로 켠다. */}
      {screen === "step" && (
        <>
          <TopLayout hud totalSteps={3} battery={battery} showClock={showClock} />
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
              // 대기 영상은 항상 무음. JSX muted 만으로는 React 버그로 소리가 남아서,
              // 노드가 붙는 즉시(콜백 ref, paint 전) el.muted=true 를 강제한다.
              ref={(el) => {
                standbyVideoRef.current = el;
                if (el) el.muted = true;
              }}
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
            {/* enter 뒤 ~ step1 전. 서버가 경로 픽스 후 보내는 환영 대사(greeting)를 스텝과 동일한
                clone talk UI(CloneTalkSplit — 타자기 효과·글로우·상단 위치)로 보여준다 —
                태블릿에서 대화하던 AI 가 차로 이어졌다는 연출. keepLastLine 으로 관람객이
                답할 때까지 문장을 유지한다. 도착 전엔 마이크 인디케이터가 "듣고 있어요" 를 맡는다. */}
            {greeting && (
              <CloneTalkSplit
                key={greeting}
                text={greeting}
                keepLastLine
                onComplete={() => {
                  // 타이핑 완료 + 2초 뒤 마이크 개방 — 인사를 읽을 틈을 주고 나서 듣는다.
                  setTimeout(() => {
                    if (screenRef.current === "waiting") setVisitorTurn(true);
                  }, 2000);
                }}
              />
            )}
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
            {/* 배경 영상이 재생을 시작하기 전에는 타임라인을 띄우지 않는다(영상 재생 직후 대사) */}
            {stepVideoReady && (
              <StepRepeat onTimelineComplete={notifyStepRendered} onAssetShown={onAssetShown} />
            )}
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
            className={`fixed inset-0 z-[22] flex flex-col items-center justify-center text-center text-white ${endingInfo?.video ? "bg-black/20" : "backdrop-blur-lg bg-black/10"}`}
          >
            {/* 서버가 하차 문구를 주면 그것을(예: "마트에 도착했습니다. 하차해 주세요."), 없으면 기존 문구 */}
            <h1 className="text-[96px] font-bold">{endingInfo?.message || (endingPlace ? `${endingPlace}에 도착했습니다.` : "목적지에 도착했습니다.")}</h1>
            <HyundaiLoading />
            <p className="text-[28px] opacity-60">다음 장소에서 경험을 이어주세요.</p>
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
        <div className="absolute top-[15%] left-4 w-60 z-[999] grid grid-cols-2 content-start gap-1.5 rounded-md border border-neutral-700 bg-neutral-900/90 px-2 py-2 text-white">
          {/* 2열 그리드(2026-10-05) — 세로로 너무 길어 짝 버튼은 나란히, 선택 상자·구분선·닫기는 두 칸 차지 */}
          {/* 명시적 닫기 — 호버하면 다시 켜는 방법(단축키·클릭 영역)이 뜬다 */}
          <div className="group relative col-span-2">
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
          {/* 관리자 허브 — 프롬프트·LLM·로그·세션을 넓은 화면에서 관리. 새 탭으로 연다 */}
          <button
            type="button"
            onClick={() => window.open("/admin", "_blank", "noopener")}
            className="w-full rounded bg-sky-700 px-2 py-1 text-[11px] font-semibold hover:bg-sky-600"
          >
            관리자 페이지 ↗
          </button>
          {/* 엔딩 리플렉션(일기) 목록 /review — 차 화면 연결이 끊기지 않게 새 탭으로 연다 */}
          <button
            type="button"
            onClick={() => window.open("/review", "_blank", "noopener")}
            className="w-full rounded bg-teal-700 px-2 py-1 text-[11px] font-semibold hover:bg-teal-600"
          >
            리뷰 페이지 ↗
          </button>
          {/* 음소거 토글 — M 키와 이 버튼으로만 바꾼다(우상단 아이콘은 표시 전용). */}
          <button
            type="button"
            onClick={toggleMute}
            className={cn(
              "w-full rounded px-2 py-1 text-[11px] font-semibold text-white",
              muted ? "bg-neutral-500 hover:bg-neutral-400" : "bg-red-600 hover:bg-red-500",
            )}
          >
            {muted ? "🔇 음소거 해제 (M)" : "🔊 음소거 (M)"}
          </button>
          <div className="text-center">
            <div className="text-[10px] text-neutral-400">현재 STEP</div>
            <div className="text-2xl font-bold leading-tight">{stepInfo?.step ?? "-"}</div>
          </div>
          <div className="col-span-2 my-0.5 h-px bg-neutral-700" />
          {/* 재시작할 세션 선택 — 비우면 자동(추종/최근). 목록은 devMode 켤 때 서버에서 받는다 */}
          <select
            value={restartSid}
            onChange={(e) => setRestartSid(e.target.value)}
            title="여정 재시작에 쓸 세션 (2026-08 이후, plan 보유). 자동 = 추종 중인 세션 또는 최근 세션"
            className="col-span-2 w-full rounded border border-neutral-600 bg-neutral-800 px-1 py-1 text-[10px]"
          >
            <option value="">세션: 자동(최근)</option>
            {sessionChoices.map((s) => (
              <option key={s.session_id} value={s.session_id}>
                {sessionTimeKst(s.updated_at)} · {s.username ? `${s.username} · ` : ""}
                {s.persona_title || s.session_id.slice(0, 8)}
                {typeof s.step === "number" ? ` · s${s.step}` : ""}
              </option>
            ))}
          </select>
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
            {restartState === "success" ? "✓ 재시작" : restartState === "error" ? "✕ 재시작" : restartState === "busy" ? "…" : restartSid ? "복제 재시작" : "여정 재시작"}
          </button>
          {/* 시작 스텝 — 복제 재시작 전용. 앞 스텝은 서버가 화면 없이 자동 진행(스텝당 LLM 생성 시간만큼 대기) */}
          <label
            title="복제 재시작(세션 선택)에서만 — 2·3 을 고르면 앞 스텝을 화면 없이 자동으로 진행하고 그 스텝부터 보여줍니다(step3 은 약 15~20초 대기)"
            className={cn(
              "flex items-center justify-between gap-1 rounded px-1 py-0.5 text-[11px]",
              restartSid ? "text-neutral-200" : "text-neutral-500",
            )}
          >
            시작 스텝
            <select
              value={restartSid ? startStep : 1}
              disabled={!restartSid}
              onChange={(e) => setStartStep(Number(e.target.value))}
              className="rounded border border-neutral-600 bg-neutral-800 px-1 py-0.5 text-[11px] disabled:opacity-50"
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </label>
          {/* 리뷰 생성하기 — 켜고 재시작하면 그 여정이 끝날 때(엔딩) 일기가 생성돼 /review 에 뜬다 */}
          <label
            title="체크하고 여정 재시작하면, 그 여정이 끝날 때(마지막 스텝 → 엔딩 화면) 일기를 만들어 리뷰 페이지에 올립니다 (2026-ambient · 테스트 표시)"
            className="flex cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 text-[11px] text-neutral-200 hover:bg-neutral-800"
          >
            <input
              type="checkbox"
              checked={reviewOnRestart}
              onChange={(e) => toggleReviewOnRestart(e.target.checked)}
              className="h-3 w-3 accent-teal-500"
            />
            리뷰 생성하기
          </label>
          {/* 시계 표시 — 우상단 시각을 끄고 켠다(이 브라우저에 기억) */}
          <label
            title="차량 화면 우상단에 현재 시각을 보일지 정합니다 (이 브라우저에만 기억)"
            className="flex cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 text-[11px] text-neutral-200 hover:bg-neutral-800"
          >
            <input
              type="checkbox"
              checked={showClock}
              onChange={(e) => toggleShowClock(e.target.checked)}
              className="h-3 w-3 accent-teal-500"
            />
            시계 표시
          </label>
          {/* 전송 대기(2초 디바운스) 중인 발화를 버리고 다시 듣는다. 이미 전송된 발화는
              서버가 수집 즉시 다음 스텝 생성을 시작하므로 되돌릴 수 없다. */}
          <button
            type="button"
            onClick={listener.reset}
            disabled={!listener.pending && !listener.interim}
            title="전송 대기 중인 발화를 버리고 처음부터 다시 듣기 (이미 전송된 발화는 취소 불가)"
            className={cn(
              "rounded px-2 py-1.5 text-[11px] font-semibold transition-colors",
              listener.pending || listener.interim
                ? "cursor-pointer bg-amber-800 hover:bg-amber-700"
                : "cursor-not-allowed bg-neutral-800 text-neutral-500"
            )}
          >
            발화 초기화
          </button>
          <div className="col-span-2 my-0.5 h-px bg-neutral-700" />
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
          <div className="col-span-2 my-0.5 h-px bg-neutral-700" />
          {/* 태블릿 대행: 수소충전 게이트 해제. step1 후 sticky 팝업이 떠 있을 때 누르면
              서버가 완료를 감지해 팝업을 내리고 step2 를 생성한다. */}
          <button
            type="button"
            disabled={!controlSid || hydrogenState === "busy"}
            onClick={completeHydrogen}
            title="태블릿 없이 수소충전(modal) 태스크를 완료 처리 — 게이트 해제 + step2 생성"
            className={cn(
              "rounded px-2 py-1.5 text-[11px] font-semibold transition-colors",
              controlSid
                ? "cursor-pointer bg-sky-800 hover:bg-sky-700"
                : "cursor-not-allowed bg-neutral-800 text-neutral-500",
              hydrogenState === "success" && "bg-green-700",
              hydrogenState === "error" && "bg-red-700"
            )}
          >
            {hydrogenState === "success"
              ? "✓ 수소충전 완료"
              : hydrogenState === "error"
                ? "✕ 대기 세션 없음"
                : hydrogenState === "busy"
                  ? "…"
                  : "수소충전 완료 대행"}
          </button>
          {/* 이미지 팝업 미리보기 — 스텝과 무관하게 이 화면에만. 하나 또는 전체(순서대로), 다시 누르면 멈춤 */}
          <select
            value={popupPreviewId}
            onChange={(e) => setPopupPreviewId(e.target.value)}
            title="미리 볼 이미지 팝업 — 관리자 '팝업 설정'의 14종"
            className="col-span-2 w-full rounded border border-neutral-600 bg-neutral-800 px-1 py-1 text-[10px]"
          >
            <option value="ALL">이미지 팝업: 전체</option>
            {popupCatalog.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
                {p.image_url ? "" : " (그림 없음)"}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={startPopupPreview}
            title="스텝과 무관하게 이미지 팝업을 이 화면에 띄웁니다(서버·태블릿에는 보내지 않음). 표시 시간은 팝업 설정의 DEFAULT 값"
            className={cn(
              "rounded px-2 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer",
              popupPreviewItems ? "bg-teal-500 hover:bg-teal-400" : "bg-teal-800 hover:bg-teal-700"
            )}
          >
            {popupPreviewItems ? "미리보기 멈춤" : "팝업 미리보기"}
          </button>
          {/* 엔딩 화면 미리보기 — 이 화면만 바뀐다(서버·태블릿에는 알리지 않음). 다시 누르면 원래 화면으로 */}
          <button
            type="button"
            onClick={toggleEndingPreview}
            title="엔딩 화면(최종 목적지 영상·하차 문구)으로 바로 이동 — 이 화면에서만 보이고 여정은 그대로"
            className={cn(
              "rounded px-2 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer",
              screen === "ending" && endingPreviewRef.current ? "bg-violet-600 hover:bg-violet-500" : "bg-violet-800 hover:bg-violet-700"
            )}
          >
            {screen === "ending" && endingPreviewRef.current ? "엔딩 닫기" : "엔딩 화면 보기"}
          </button>
          {!controlSid && <div className="col-span-2 text-center text-[10px] text-neutral-500">세션 대기중</div>}
        </div>
      )}

      {devMode && (
        <div className="absolute top-[15%] left-[264px] max-h-[90vh] overflow-y-auto bg-white max-w-1/2 text-black px-4 py-2 rounded-md z-[999]">
          {/* 설정 토글 — 대기 영상·발화 딜레이·LLM 세 줄을 접었다 편다(평소엔 접어 화면을 아낀다) */}
          <button
            type="button"
            onClick={() => setSettingsOpen((prev) => !prev)}
            className={cn("mr-3 rounded px-2 py-0.5 text-[12px] font-semibold", settingsOpen ? "bg-sky-700 text-white" : "bg-neutral-200")}
          >
            설정
          </button>
          <button
            onClick={() => {
              setDebug(!debug);
            }}
          >
            step info 디버깅
          </button>
          {settingsOpen && (<>
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
          {/* 현장 설정: 대기(standby) 영상 소리 on/off (2026-09-20 비활성화 — 대기 영상은 항상 무음).
              미래차 설명음이 새로고침·복제 재시작마다 흘러나와서 껐다. 되살리려면 아래 주석 해제.
          <div className="mt-2 flex flex-wrap items-center gap-2 rounded border border-neutral-300 bg-neutral-50 px-2 py-1.5 text-[11px]">
            <span className="font-semibold">대기 영상 소리</span>
            <button
              type="button"
              onClick={toggleStandbySound}
              className={cn(
                "rounded px-2 py-0.5 font-semibold text-white",
                standbySound ? "bg-sky-700" : "bg-neutral-400"
              )}
            >
              {standbySound ? "켬" : "끔"}
            </button>
            {standbySound && muted && (
              <span className="text-amber-600">전역 뮤트(M) 켜져 있어 지금은 무음</span>
            )}
            {!standbySound && <span className="text-neutral-500">기본(무음)</span>}
          </div>
          */}
          {/* 마이크 조작 안내(2026-09-19: 자동 마이크 → S/D 수동 전환). 렌더 완료 후에만 S 가 먹는다. */}
          <div className="mt-2 flex flex-wrap items-center gap-2 rounded border border-neutral-300 bg-neutral-50 px-2 py-1.5 text-[11px]">
            <span className="font-semibold">마이크</span>
            <span className="font-mono text-sky-700">{listener.status}</span>
            <span className="text-neutral-600">
              <kbd className="rounded bg-neutral-200 px-1">S</kbd> 짧게=말하기(열기·재녹음) ·
              <kbd className="ml-1 rounded bg-neutral-200 px-1">S</kbd> 길게 / <kbd className="rounded bg-neutral-200 px-1">D</kbd> = 전송
            </span>
            <span className="text-neutral-400">— 에셋 렌더 완료 후에만 S 반응</span>
          </div>
          {/* 소리 뮤트는 디버깅 창 상단 '음소거' 버튼(또는 M 키)으로 옮겼다. */}
          {/* LLM 모델·옵션 — 서버 런타임 값(브라우저 저장 아님). 다음 스텝 생성부터 즉시 반영,
              서버 컨테이너 재시작 시 env 기본값으로 복귀. */}
          <div className="mt-2 flex flex-wrap items-center gap-2 rounded border border-neutral-300 bg-neutral-50 px-2 py-1.5 text-[11px]">
            <span className="font-semibold">LLM</span>
            {llmConfig ? (
              <>
                <select
                  value={llmDraft.model}
                  onChange={(e) => setLlmDraft((d) => ({ ...d, model: e.target.value }))}
                  className="rounded border border-neutral-300 px-1 py-0.5 font-mono"
                >
                  {/* 서버가 목록 밖 모델로 설정돼 있어도 표시가 깨지지 않게 그 값도 후보에 넣는다 */}
                  {[...new Set(["gpt-5.6-luna", "gpt-5.6-terra", "gpt-5.6-sol", llmDraft.model].filter(Boolean))].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <select
                  value={llmDraft.reasoning_effort}
                  onChange={(e) => setLlmDraft((d) => ({ ...d, reasoning_effort: e.target.value }))}
                  className="rounded border border-neutral-300 px-1 py-0.5"
                  title="reasoning effort — '없음'은 파라미터를 보내지 않음(미지원 모델용)"
                >
                  <option value="">reasoning 없음</option>
                  {["minimal", "low", "medium", "high"].map((v) => (
                    <option key={v} value={v}>reasoning {v}</option>
                  ))}
                </select>
                <select
                  value={llmDraft.verbosity}
                  onChange={(e) => setLlmDraft((d) => ({ ...d, verbosity: e.target.value }))}
                  className="rounded border border-neutral-300 px-1 py-0.5"
                  title="verbosity — '없음'은 파라미터를 보내지 않음(미지원 모델용)"
                >
                  <option value="">verbosity 없음</option>
                  {["low", "medium", "high"].map((v) => (
                    <option key={v} value={v}>verbosity {v}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={applyLlmConfig}
                  disabled={llmState === "busy" || !llmDraft.model.trim()}
                  className={cn(
                    "rounded px-2 py-0.5 font-semibold text-white",
                    llmState === "success" ? "bg-green-600" : llmState === "error" ? "bg-red-600" : "bg-sky-700 disabled:bg-neutral-300",
                  )}
                >
                  {llmState === "busy" ? "…" : llmState === "success" ? "✓ 적용" : llmState === "error" ? "✕ 실패" : "적용"}
                </button>
                <span className="text-neutral-500">서버 즉시 반영 · 서버 재시작 시 env 복귀</span>
              </>
            ) : (
              <span className="text-neutral-500">서버 설정 로드 실패 — 서버(4000/8100) 연결 확인</span>
            )}
          </div>
          {/* 현재 적용 프롬프트 — 표시는 제목(H1) 우선. 수정은 /prompt-admin 관리 화면에서 한다 */}
          <div className="mt-2 flex flex-wrap items-center gap-2 rounded border border-neutral-300 bg-neutral-50 px-2 py-1.5 text-[11px]">
            <span className="font-semibold">프롬프트</span>
            <span>스텝: <span className="font-mono text-sky-700">{promptNames?.step ?? "로드 중…"}</span></span>
            <span>엔딩: <span className="font-mono text-sky-700">{promptNames?.ending ?? ""}</span></span>
            <button
              type="button"
              onClick={() => window.open("/prompt-admin", "_blank", "noopener")}
              className="ml-auto rounded border border-sky-300 bg-white px-2 py-0.5 text-sky-700 hover:bg-sky-50"
            >
              수정하러 가기 ↗
            </button>
          </div>
          </>)}
          {/* 세션 지도(항상 표시): 여정 양끝(P0→최종)·픽스 경로·이 세션의 차량 태스크 전체 */}
          {sessionDebug && (
            <div className="mt-2 rounded border border-neutral-300 bg-neutral-50 px-2 py-1.5 text-[11px]">
              <div>
                <span className="font-semibold">여정</span>{" "}
                <span className="font-mono text-sky-700">
                  {sessionDebug.journey_from_place ?? "?"} → {sessionDebug.journey_to_place ?? "?"}
                </span>
                {sessionDebug.path_plan?.step1 && (
                  <span className="ml-2 text-neutral-600">
                    픽스: {sessionDebug.path_plan.step1} → charging_station → (경유) → {sessionDebug.path_plan.final ?? "?"}
                  </span>
                )}
              </div>
              <div className="mt-0.5">
                <span className="font-semibold">태스크</span>{" "}
                {(sessionDebug.tasks?.length ?? 0) === 0 ? (
                  <span className="text-neutral-500">없음 (dashboard 미수신)</span>
                ) : (
                  sessionDebug.tasks?.map((t) => (
                    <span key={t.key} className={cn("mr-2", t.done && "text-neutral-400 line-through")}>
                      {t.key} {t.title}{t.kind !== "auto" ? " (basic 아님)" : ""}
                    </span>
                  ))
                )}
              </div>
            </div>
          )}
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
