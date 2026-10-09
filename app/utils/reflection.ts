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
