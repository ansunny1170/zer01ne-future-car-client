// 개발자용 이벤트 로그 스토어.
//
// 왜 필요한가: 엔딩 리플렉션처럼 서버 백그라운드에서 도는 작업은 실패해도 화면에
// 아무 흔적이 없다. 서버가 WebSocket 으로 흘려보내는 진행 로그를 브라우저에 쌓아두고,
// 개발자 패널에서 시간순으로 볼 수 있게 한다.
//
// 저장소는 localStorage — sessionStorage 는 탭을 닫으면 사라져서, 전시 중 키오스크를
// 새로고침하거나 브라우저를 다시 띄우면 정작 보고 싶던 로그가 날아간다.
//
// category 로 종류를 구분한다. 지금은 "reflection"(일기) 과 "client"(브라우저 자체
// 이벤트) 만 쓰지만, 다른 작업도 같은 스토어에 얹을 수 있게 열어 둔다.

export type DevLogLevel = "info" | "warn" | "error";

export interface DevLogEntry {
    id: string;
    category: string;
    stage: string;
    level: DevLogLevel;
    message: string;
    sessionId?: string;
    // 실패한 단계 이름 (level === "error" 일 때 서버가 채움)
    at?: string;
    elapsed?: number;
    detail?: Record<string, unknown> | null;
    // 서버가 찍은 시각(ISO, KST). 클라이언트 자체 로그에는 없다.
    serverTs?: string;
    // 브라우저가 기록한 시각(ISO)
    clientTs: string;
    source: "server" | "client";
}

const STORAGE_KEY = "ftcar_dev_logs";
// 한 건이 대략 200~600B. 500건이면 넉넉잡아 300KB 로 localStorage 쿼터에 여유가 있다.
const MAX_ENTRIES = 500;

let cache: DevLogEntry[] | null = null;
let seq = 0;
const listeners = new Set<(entries: DevLogEntry[]) => void>();

function canUseStorage(): boolean {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function read(): DevLogEntry[] {
    if (cache) return cache;
    if (!canUseStorage()) return [];
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        cache = Array.isArray(parsed) ? parsed : [];
    } catch {
        // 손상된 데이터 때문에 패널 자체가 못 열리면 안 되므로 조용히 버린다.
        cache = [];
    }
    return cache;
}

function write(entries: DevLogEntry[]) {
    cache = entries;
    if (canUseStorage()) {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
        } catch {
            // 쿼터 초과 등 — 저장 실패해도 메모리 캐시로는 계속 동작한다.
        }
    }
    listeners.forEach((cb) => cb(entries));
}

/** 저장된 순서(오래된 것 → 최신) 그대로 반환. 표시 순서는 호출부가 정한다. */
export function getDevLogs(): DevLogEntry[] {
    return read();
}

export function appendDevLog(
    entry: Omit<DevLogEntry, "id" | "clientTs"> & { clientTs?: string }
): DevLogEntry {
    const full: DevLogEntry = {
        ...entry,
        id: `${Date.now()}-${seq++}`,
        clientTs: entry.clientTs ?? new Date().toISOString(),
    };
    const next = [...read(), full];
    // 오래된 것부터 버린다.
    write(next.length > MAX_ENTRIES ? next.slice(next.length - MAX_ENTRIES) : next);
    return full;
}

/** 브라우저에서 발생한 이벤트를 남길 때 쓰는 단축 함수. */
export function appendClientLog(
    category: string,
    stage: string,
    message: string,
    options: { level?: DevLogLevel; sessionId?: string; detail?: Record<string, unknown> } = {}
): DevLogEntry {
    return appendDevLog({
        category,
        stage,
        message,
        level: options.level ?? "info",
        sessionId: options.sessionId,
        detail: options.detail ?? null,
        source: "client",
    });
}

export function clearDevLogs() {
    write([]);
}

export function subscribeDevLog(cb: (entries: DevLogEntry[]) => void): () => void {
    listeners.add(cb);
    return () => {
        listeners.delete(cb);
    };
}

// 다른 탭에서 로그가 쌓이거나 지워졌을 때도 따라가도록 한다(키오스크는 탭을 여러 개
// 띄우는 경우가 있다).
if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
        if (e.key !== STORAGE_KEY) return;
        cache = null;
        const entries = read();
        listeners.forEach((cb) => cb(entries));
    });
}
