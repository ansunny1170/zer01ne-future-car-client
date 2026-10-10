"use client";

import DetailArea from "@/components/review/detail-area";
import ListArea from "@/components/review/list-area";
import { Reflection } from "@/type";
import { useEffect, useRef, useState } from "react";
import { BASE_API_LINK } from "@/constants";
import { useFullscreen } from "@/hooks/useFullscreen";
import { applyReflectionUpdate, emotionPlacesOf, hasEmotionData, parseEditions } from "@/utils/reflection";

// .env(NEXT_PUBLIC_API_URL) 기반으로 REST/WS 주소 생성
// 예: "https://api.ftcar.org/" → API_BASE="https://api.ftcar.org", WS_BASE="wss://api.ftcar.org"
const API_BASE = BASE_API_LINK.replace(/\/+$/, "");
const WS_BASE = API_BASE.replace(/^http/, "ws"); // http→ws, https→wss
// 한 번에 받는 최대 건수(서버 상한 2000). 구버전 서버는 limit 을 무시하고 전부 준다.
const LIST_LIMIT = 2000;
// 새 일기가 도착하면 상세에 자동으로 띄워 두는 시간. 지나면 띄우기 전 화면으로 돌아간다.
// 출구 화면은 관람객이 조작하지 않으므로, 방금 체험을 끝낸 사람이 자기 일기를 바로 보게 하려는 것.
const SPOTLIGHT_MS = 60_000;
// WS 재연결 간격 상한(1초부터 두 배씩), 유휴 끊김 방지 핑, 놓친 일기 보충 주기와 건수.
const RECONNECT_MAX_MS = 15_000;
const HEARTBEAT_MS = 25_000;
const POLL_MS = 30_000;
const CATCH_UP_LIMIT = 20;

export default function Review() {
    const wsRef = useRef<WebSocket | null>(null);
    const [wsData, setWsData] = useState<Reflection[]>([]);
    // WS 핸들러는 마운트 시점 클로저라 최신 목록을 ref 로 본다.
    const dataRef = useRef<Reflection[]>([]);
    useEffect(() => {
        dataRef.current = wsData;
    }, [wsData]);
    const [selectedItem, setSelectedItem] = useState<Reflection | null>(null);
    // 자동 강조 — 강조 전 선택(돌아갈 곳)과 타이머. 강조 중에 새 일기가 또 오면 돌아갈 곳은 처음 것 그대로 둔다.
    const selectedRef = useRef<Reflection | null>(null);
    useEffect(() => {
        selectedRef.current = selectedItem;
    }, [selectedItem]);
    const spotlightRef = useRef<{ timer: ReturnType<typeof setTimeout>; previous: Reflection | null } | null>(null);
    const [listTopSignal, setListTopSignal] = useState(0);
    // 상세 펼쳐보기(감정 그래프 크게) — 펼치면 목록은 한 줄로 줄어든다.
    const [expanded, setExpanded] = useState(false);
    // 펼치기/접기 로딩 표시(2026-10-10) — 전시 기기가 느려 전환이 오래 걸린다. 스피너는 React 상태로 켜면 그것만으로
    // 페이지 전체(목록 카드 수백 개)를 다시 그려 늦게 뜨므로, 미리 깔아 둔 요소를 직접 보인다. 두 프레임 양보해 스피너가
    // 먼저 그려진 뒤 무거운 전환을 하고, 새 화면이 그려진 다음 프레임에 내린다. 스피너는 CSS 회전이라 렌더 중에도 돈다.
    const loadingRef = useRef<HTMLDivElement>(null);
    const togglingRef = useRef(false);
    const toggleExpand = () => {
        const el = loadingRef.current;
        if (togglingRef.current) return;
        togglingRef.current = true;
        if (el) {
            el.querySelector("p")!.textContent = expanded ? "접는 중…" : "펼치는 중…";
            el.style.display = "flex";
        }
        requestAnimationFrame(() => requestAnimationFrame(() => setExpanded((v) => !v)));
    };
    useEffect(() => {
        if (!togglingRef.current) return;
        const hide = () => {
            togglingRef.current = false;
            if (loadingRef.current) loadingRef.current.style.display = "none";
        };
        let id = requestAnimationFrame(() => { id = requestAnimationFrame(hide); });
        const guard = setTimeout(hide, 8000); // 혹시 못 내리는 경우의 안전장치
        return () => { cancelAnimationFrame(id); clearTimeout(guard); };
    }, [expanded]);
    const graphShown = hasEmotionData(emotionPlacesOf(selectedItem));

    const spotlight = (item: Reflection) => {
        const previous = spotlightRef.current ? spotlightRef.current.previous : selectedRef.current;
        if (spotlightRef.current) clearTimeout(spotlightRef.current.timer);
        const timer = setTimeout(() => {
            spotlightRef.current = null;
            setSelectedItem(previous);
        }, SPOTLIGHT_MS);
        spotlightRef.current = { timer, previous };
        setSelectedItem(item);
        setListTopSignal((n) => n + 1); // 새 일기는 목록 맨 앞(첫 페이지)에 있다
    };

    // 사람이 직접 고르면 자동 강조를 끝낸다 — 60초 뒤에 화면이 저절로 바뀌지 않게.
    const selectByHand = (item: Reflection) => {
        if (spotlightRef.current) {
            clearTimeout(spotlightRef.current.timer);
            spotlightRef.current = null;
        }
        setSelectedItem(item);
    };

    useEffect(() => () => {
        if (spotlightRef.current) clearTimeout(spotlightRef.current.timer);
    }, []);
    // 목록은 최근 LIST_LIMIT 건까지만 받으므로 DB 전체 건수는 따로 조회한다(실패 시 받은 건수로 대체).
    const [total, setTotal] = useState<number | null>(null);
    // 보여줄 엔딩 버전(작년 2025-car / 올해 2026-ambient). ?editions=2025-car 처럼 골라 본다. 기본은 둘 다.
    // useSearchParams 는 정적 빌드에서 Suspense 경계를 요구해서, 마운트 후 location 에서 한 번 읽는다.
    const [editions, setEditions] = useState<string[] | null>(null);
    // 상세 링크(2026-10-10) — /review?id=384(&expand=1) 로 열면 그 일기 상세(펼쳐보기)로 연다.
    // 고르거나 펼치면 주소도 그 상태로 바뀐다(replaceState — 방문 기록은 쌓지 않는다).
    const deepLinkRef = useRef<{ id: number | null; expand: boolean; applied: boolean }>({ id: null, expand: false, applied: false });
    const [listLoaded, setListLoaded] = useState(false);
    const [focus, setFocus] = useState<{ id: number; n: number } | null>(null);
    useEffect(() => {
        const q = new URLSearchParams(window.location.search);
        const id = q.get("id");
        deepLinkRef.current = { id: id && /^\d+$/.test(id) ? Number(id) : null, expand: q.get("expand") === "1", applied: false };
        setEditions(parseEditions(q.get("editions")));
    }, []);

    // 첫 목록을 받은 뒤 한 번 — 링크의 일기를 고른다. 목록(최근 LIST_LIMIT 건·고른 버전)에 없으면 단건으로 받는다.
    useEffect(() => {
        const link = deepLinkRef.current;
        if (!listLoaded || link.applied) return;
        link.applied = true;
        if (link.id === null) return;
        const found = dataRef.current.find((r) => r.id === link.id);
        const open = (item: Reflection) => {
            setSelectedItem(item);
            if (link.expand) setExpanded(true);
            setFocus((f) => ({ id: item.id, n: (f?.n ?? 0) + 1 }));
        };
        if (found) return open(found);
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/ending-reflection/${link.id}`);
                if (res.ok) open(await res.json());
            } catch (error) {
                console.error('Failed to fetch linked reflection:', error);
            }
        })();
    }, [listLoaded]);

    // 지금 보이는 상세를 주소에 반영 — 그대로 복사하면 같은 화면이 열리는 링크가 된다.
    useEffect(() => {
        if (!deepLinkRef.current.applied) return;
        const url = new URL(window.location.href);
        if (selectedItem) url.searchParams.set("id", String(selectedItem.id));
        else url.searchParams.delete("id");
        if (selectedItem && expanded && graphShown) url.searchParams.set("expand", "1");
        else url.searchParams.delete("expand");
        if (url.href !== window.location.href) window.history.replaceState(null, "", url.href);
    }, [selectedItem, expanded, graphShown]);
    // 태블릿 전시용 전체화면. 이 화면에는 눈에 보이는 버튼을 둔다(운영자가 직접 켠다).
    // 나머지 화면은 layout 의 FullscreenToggle 이 좌하단 3연속 탭으로 처리한다.
    const { isFullscreen, supported, toggle } = useFullscreen();

    // 초기 엔딩 데이터는 HTTP GET 으로 받는다 (WS 연결 성공 여부와 무관하게 마운트 시 즉시).
    useEffect(() => {
        if (!editions) return;
        const query = `editions=${encodeURIComponent(editions.join(","))}`;
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/ending-reflection/count?${query}`);
                if (res.ok) {
                    const { total } = await res.json();
                    if (typeof total === 'number') setTotal(total);
                }
            } catch (error) {
                console.error('Failed to fetch total:', error);
            }
        })();
        (async () => {
            try {
                const response = await fetch(`${API_BASE}/ending-reflection/?${query}&limit=${LIST_LIMIT}`, {
                    method: 'GET',
                });
                if (response.ok) {
                    const data = await response.json();
                    console.log('Initial data:', data);

                    // API 응답 형태가 환경마다 다를 수 있어 방어적으로 처리
                    const list = Array.isArray(data) ? data : [];
                    dataRef.current = list;
                    setWsData(list);
                }
            } catch (error) {
                console.error('Failed to fetch initial data:', error);
            } finally {
                setListLoaded(true);
            }
        })();
    }, [editions]);

    // 목록 앞쪽 최신 몇 건을 다시 받아, 아직 없는 일기만 앞에 끼운다(놓친 알림 보충).
    // WS 가 끊겨 있던 사이에 생긴 일기도 이 경로로 들어온다 — 새로 들어온 게 있으면 강조한다.
    const catchUp = async (eds: string[]) => {
        try {
            const res = await fetch(`${API_BASE}/ending-reflection/?editions=${encodeURIComponent(eds.join(","))}&limit=${CATCH_UP_LIMIT}`);
            if (!res.ok) return;
            const data = await res.json();
            if (!Array.isArray(data) || dataRef.current.length === 0) return; // 첫 목록이 아직이면 그쪽이 채운다
            receive({ mode: "append", data }, eds);
        } catch (error) {
            console.error('Failed to catch up reflections:', error);
        }
    };

    const receive = (message: { mode?: string; data: Reflection[] }, eds: string[]) => {
        const { list, added } = applyReflectionUpdate(dataRef.current, message, eds);
        dataRef.current = list;
        setWsData(list);
        if (added > 0) {
            setTotal((t) => (t === null ? t : t + added));
            spotlight(list[0]); // 새로 온 것은 맨 앞에 붙는다
        }
    };

    // WS 는 이후 실시간 갱신(reflection_update)만 담당한다.
    // 신버전 서버는 새 일기 1건만 mode:"append" 로, 구버전은 전체 목록을 보낸다(applyReflectionUpdate).
    // 출구 화면은 몇 시간씩 켜 두므로 끊기면 스스로 다시 붙는다 — 예전엔 재연결이 없어서 한 번 끊기면
    // 새로고침 전까지 새 일기가 안 떴다(2026-10-09 운영: 15:36 끊김 → 15:40·15:42 일기 미표시).
    useEffect(() => {
        if (!editions) return;
        let closed = false;
        let retry: ReturnType<typeof setTimeout> | undefined;
        let attempt = 0;
        let everOpened = false;

        const connect = () => {
            const ws = new WebSocket(`${WS_BASE}/ws/ending-reflection`);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('WebSocket connected');
                attempt = 0;
                if (everOpened) catchUp(editions); // 재연결 — 끊긴 사이 일기 보충
                everOpened = true;
            };

            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                if (message.type === 'reflection_update' && Array.isArray(message.data)) {
                    console.log('Received:', event.data);
                    receive(message, editions);
                }
            };

            ws.onclose = (event) => {
                console.log('WebSocket closed:', event.code);
                if (wsRef.current === ws) wsRef.current = null;
                if (closed) return;
                const delay = Math.min(RECONNECT_MAX_MS, 1000 * 2 ** attempt);
                attempt += 1;
                retry = setTimeout(connect, delay);
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        };
        connect();

        // 소켓이 열린 척 죽어 있는 경우(중간 장비가 조용히 끊음)에 대비한 두 겹 안전망:
        // 주기적으로 핑을 보내 유휴 끊김을 막고, 최신 몇 건을 다시 받아 놓친 일기를 채운다.
        const heartbeat = setInterval(() => {
            const ws = wsRef.current;
            if (ws && ws.readyState === WebSocket.OPEN) ws.send("ping");
        }, HEARTBEAT_MS);
        const poll = setInterval(() => catchUp(editions), POLL_MS);
        // 화면이 꺼졌다 켜지면(태블릿 절전) 바로 보충한다.
        const onVisible = () => {
            if (document.visibilityState === "visible") catchUp(editions);
        };
        document.addEventListener("visibilitychange", onVisible);

        return () => {
            closed = true;
            if (retry) clearTimeout(retry);
            clearInterval(heartbeat);
            clearInterval(poll);
            document.removeEventListener("visibilitychange", onVisible);
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [editions]);

    // 예전엔 120개(20페이지)로 잘랐지만, 작년 일기만 260건이라 받은 만큼 다 보여준다(상한은 LIST_LIMIT).
    const safeWsData = Array.isArray(wsData) ? wsData : [];
    console.log('Data length:', safeWsData.length, 'total:', total);

    return (
        // h-screen(100vh) 은 모바일 브라우저에서 주소창 높이까지 포함해 스크롤이 생긴다.
        // 100dvh 는 지원 브라우저에서만 적용되고, 미지원 브라우저는 인라인 스타일이
        // 무시되며 h-screen 으로 폴백된다(tailwind 3.3 이라 h-dvh 클래스가 없다).
        <div className="w-full h-screen flex items-stretch" style={{ height: "100dvh" }}>
            <DetailArea selectedItem={selectedItem} expanded={expanded} onToggleExpand={toggleExpand} />
            <ListArea data={safeWsData} total={total ?? safeWsData.length} onItemClick={selectByHand} selectedItem={selectedItem} scrollTopSignal={listTopSignal} columns={expanded && graphShown ? 1 : 3} focus={focus} />

            <div ref={loadingRef} style={{ display: "none" }} className="fixed inset-0 z-[60] items-center justify-center bg-black/25" aria-live="polite">
                <div className="flex flex-col items-center gap-[14px] rounded-[20px] bg-white/90 px-[36px] py-[28px] shadow-lg">
                    <div className="w-[56px] h-[56px] rounded-full border-[6px] border-[#d9d9d9] border-t-[#444] animate-spin" />
                    <p className="text-[20px] text-[#444]">펼치는 중…</p>
                </div>
            </div>

            {/* 전체화면 진입 버튼. 전체화면이 되면 사라져 전시 화면을 가리지 않는다.
                Fullscreen API 는 사용자 제스처 안에서만 허용되므로 자동 진입은 불가능하다. */}
            {supported && !isFullscreen && (
                <button
                    type="button"
                    onClick={toggle}
                    aria-label="전체화면"
                    className="fixed bottom-4 right-4 z-50 rounded-full bg-black/40 px-4 py-2 text-xs text-white/70 backdrop-blur transition hover:bg-black/60 hover:text-white"
                >
                    전체화면
                </button>
            )}
        </div>
    );
}