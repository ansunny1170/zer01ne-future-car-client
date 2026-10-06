// 화면 전체 소리 일괄 제어(2026-10-06) — 차 세션이 끝나면 7초 안에 모든 소리를 0으로, 새 세션이면 원래대로.
//
// 배경음은 DOM <audio> 지만 효과음·음성은 DOM 에 붙지 않는 Audio 객체(미리 불러 둔 것·즉석 생성)라
// querySelectorAll 로는 다 못 잡는다. 그래서 HTMLMediaElement.play 를 한 번 감싸 재생되는 미디어를 모두
// 등록해 두고, 무음 동안 새로 재생되는 소리도 바로 음소거한다. 다음 차 세션을 방해하지 않기 위함.

type Tracked = HTMLMediaElement;

const tracked = new Set<Tracked>();
const originalVolume = new WeakMap<Tracked, number>();
let installed = false;
let silenced = false;
let fadeTimer: ReturnType<typeof setInterval> | null = null;
let holdTimer: ReturnType<typeof setInterval> | null = null;

function all(): Tracked[] {
    if (typeof document !== "undefined") {
        document.querySelectorAll<HTMLMediaElement>("audio,video").forEach((el) => tracked.add(el));
    }
    // 끝났고 화면에도 없는 것은 정리(전시 장시간 운영 중 무한히 쌓이지 않게)
    tracked.forEach((el) => {
        if (el.paused && el.ended && !el.isConnected) tracked.delete(el);
    });
    return [...tracked];
}

function remember(el: Tracked) {
    if (!originalVolume.has(el)) originalVolume.set(el, el.volume);
}

// 앱 시작 시 한 번 — 재생되는 모든 미디어를 등록한다.
export function installAudioTracker() {
    if (installed || typeof window === "undefined") return;
    installed = true;
    const origPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
        tracked.add(this);
        if (silenced) {
            remember(this);
            this.muted = true;
            this.volume = 0;
        }
        return origPlay.call(this);
    };
}

export function isSessionSilenced() {
    return silenced;
}

function clearTimers() {
    if (fadeTimer) clearInterval(fadeTimer);
    if (holdTimer) clearInterval(holdTimer);
    fadeTimer = holdTimer = null;
}

// 지금부터 holdMs 동안은 그대로, 그 뒤 fadeMs 에 걸쳐 모든 소리를 0으로 줄이고 음소거한다(기본 1초+6초=7초).
// 무음이 된 뒤에 재생되는 소리도 계속 음소거한다(restoreSessionAudio 전까지). 이미 진행 중이면 무시.
export function fadeOutSessionAudio(holdMs = 1000, fadeMs = 6000) {
    if (silenced || fadeTimer) return;
    const start = Date.now();
    fadeTimer = setInterval(() => {
        const t = Date.now() - start;
        const g = t <= holdMs ? 1 : Math.max(0, 1 - (t - holdMs) / fadeMs);
        for (const el of all()) {
            remember(el);
            el.volume = (originalVolume.get(el) ?? 1) * g;
        }
        if (g <= 0) {
            clearTimers();
            silenced = true;
            const enforce = () => all().forEach((el) => { remember(el); el.volume = 0; el.muted = true; });
            enforce();
            holdTimer = setInterval(enforce, 300);   // 늦게 생긴 DOM 미디어·BGM 재로딩까지 계속 묶는다
        }
    }, 100);
}

// 새 세션 — 줄였던 음량을 원래대로. operatorMuted(운영자 소리 끔)면 음소거는 유지.
export function restoreSessionAudio(operatorMuted: boolean) {
    if (!silenced && !fadeTimer) return;
    clearTimers();
    silenced = false;
    for (const el of all()) {
        const v = originalVolume.get(el);
        if (v !== undefined) el.volume = v;
        originalVolume.delete(el);
        // 배경 영상은 항상 무음이어야 한다(내레이션 유출 방지) — 비디오는 음소거를 풀지 않는다
        el.muted = el instanceof HTMLVideoElement ? true : operatorMuted;
    }
}
