import { EmotionPlace, Reflection } from "@/type";

// /review 가 보여줄 엔딩 버전. URL ?editions=2025-car 처럼 골라 볼 수 있고, 여러 개면 OR.
// 설계: zer01ne-future-car-server docs/superpowers/specs/2026-10-03-ending-reflection-2026-design.md
export const DEFAULT_EDITIONS = ["2025-car", "2026-ambient"];

export function parseEditions(raw: string | null): string[] {
    const list = (raw ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    return list.length > 0 ? list : DEFAULT_EDITIONS;
}

// WS reflection_update 를 목록에 반영한다.
// - mode:"append"(신버전 서버): 새 일기만 온다 → 고른 버전에 속하고 아직 없는 것만 맨 앞에 붙인다.
// - mode 없음(구버전 서버): 전체 목록이 온다 → 통째로 바꾼다.
// 반환값 added 는 total 을 늘릴 건수.
export function applyReflectionUpdate(
    current: Reflection[],
    message: { mode?: string; data: Reflection[] },
    editions: string[],
): { list: Reflection[]; added: number } {
    if (message.mode !== "append") {
        return { list: message.data, added: 0 };
    }
    const known = new Set(current.map((r) => r.id));
    const fresh = message.data.filter(
        (r) => !known.has(r.id) && (!r.edition || editions.includes(r.edition)),
    );
    return { list: [...fresh, ...current], added: fresh.length };
}

// 2026 일기의 장소별 감정(payload.emotion_places). 작년 일기·구버전 서버·표정 기록이 없는 세션은 [] — 화면은 그래프를 숨긴다.
export function emotionPlacesOf(item: Reflection | null): EmotionPlace[] {
    const payload = item?.payload;
    if (!payload || typeof payload !== "object" || !("emotion_places" in payload)) return [];
    const places = (payload as { emotion_places?: unknown }).emotion_places;
    return Array.isArray(places) ? (places as EmotionPlace[]) : [];
}

export function hasEmotionData(places: EmotionPlace[]): boolean {
    return places.some((p) => p.dominant);
}

// 상세 화면 날짜 — "yyyy년 mm월 dd일 HH시 mm분", 서울 시각 고정(전시 기기 시간대와 무관하게).
export function formatReflectionDate(createdAt: string | undefined): string {
    if (!createdAt) return "";
    const d = new Date(createdAt);
    if (Number.isNaN(d.getTime())) return "";
    const parts = Object.fromEntries(
        new Intl.DateTimeFormat("ko-KR", {
            timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
            hour: "2-digit", minute: "2-digit", hourCycle: "h23",
        }).formatToParts(d).map((p) => [p.type, p.value]),
    );
    return `${parts.year}년 ${parts.month}월 ${parts.day}일 ${parts.hour}시 ${parts.minute}분`;
}

// 2026 일기에서 관람객이 고른 AI 동행자(payload.companion, 예: "어릴적 키우던 강아지"). 작년 일기는 없어서 "".
export function companionOf(item: Reflection | null): string {
    const payload = item?.payload;
    if (!payload || typeof payload !== "object" || !("companion" in payload)) return "";
    const c = (payload as { companion?: unknown }).companion;
    return typeof c === "string" ? c.trim() : "";
}

// 체험 시간(2026 일기 payload.started_at·ended_at·duration_sec) — "14:02 ~ 14:53 (51분 15초)".
// 날짜를 넘긴 세션은 끝에 날짜를 붙인다("10월 9일 22:40 ~ 10월 10일 09:12"). 작년 일기는 없어서 "".
export function formatSessionTime(item: Reflection | null): string {
    const p = item?.payload;
    if (!p || typeof p !== "object") return "";
    const { started_at, ended_at, duration_sec } = p as { started_at?: unknown; ended_at?: unknown; duration_sec?: unknown };
    if (typeof started_at !== "string" || typeof ended_at !== "string") return "";
    const a = new Date(started_at), b = new Date(ended_at);
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return "";
    const fmt = (d: Date, withDate: boolean) => {
        const x = Object.fromEntries(new Intl.DateTimeFormat("ko-KR", {
            timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
        }).formatToParts(d).map((t) => [t.type, t.value]));
        return `${withDate ? `${x.month}월 ${x.day}일 ` : ""}${x.hour}:${x.minute}`;
    };
    const sameDay = (d: Date) => d.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });
    const crosses = sameDay(a) !== sameDay(b);
    const span = `${fmt(a, crosses)} ~ ${fmt(b, crosses)}`;
    const sec = typeof duration_sec === "number" ? duration_sec : Math.round((b.getTime() - a.getTime()) / 1000);
    return sec >= 0 ? `${span} (${formatDuration(sec)})` : span;
}

export function formatDuration(sec: number): string {
    const s = Math.max(0, Math.round(sec));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
    if (h > 0) return `${h}시간${m ? ` ${m}분` : ""}`;
    if (m > 0) return `${m}분${r ? ` ${r}초` : ""}`;
    return `${r}초`;
}
