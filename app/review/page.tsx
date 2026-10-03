"use client";

import DetailArea from "@/components/review/detail-area";
import ListArea from "@/components/review/list-area";
import { Reflection } from "@/type";
import { useEffect, useRef, useState } from "react";
import { BASE_API_LINK } from "@/constants";
import { useFullscreen } from "@/hooks/useFullscreen";
import { applyReflectionUpdate, parseEditions } from "@/utils/reflection";

// .env(NEXT_PUBLIC_API_URL) 기반으로 REST/WS 주소 생성
// 예: "https://api.ftcar.org/" → API_BASE="https://api.ftcar.org", WS_BASE="wss://api.ftcar.org"
const DEFAULT_API_BASE = BASE_API_LINK.replace(/\/+$/, "");
// 한 번에 받는 최대 건수(main-2026 서버 상한 2000). main 서버는 limit·editions 를 무시하고 최근 120건을 준다.
const LIST_LIMIT = 2000;

// 기본은 자기 서버(차량 전용 일기). URL ?api=<main-2026 서버 주소>&editions=2025-car,2026-ambient 를 붙이면
// 그 서버의 단일 테이블에서 고른 버전을 본다(설계: 서버 레포 docs/superpowers/specs/2026-10-03-ending-reflection-2026-design.md §8).
function readSource(): { apiBase: string; editions: string[] | null } {
    const params = new URLSearchParams(window.location.search);
    const api = params.get("api")?.trim();
    const raw = params.get("editions");
    return {
        apiBase: api ? api.replace(/\/+$/, "") : DEFAULT_API_BASE,
        // 자기 서버는 editions 를 모르니 보낼 필요가 없다. 다른 서버를 보거나 직접 지정했을 때만 쓴다.
        editions: api || raw ? parseEditions(raw) : null,
    };
}

export default function Review() {
    const wsRef = useRef<WebSocket | null>(null);
    const [wsData, setWsData] = useState<Reflection[]>([]);
    // WS 핸들러는 마운트 시점 클로저라 최신 목록을 ref 로 본다.
    const dataRef = useRef<Reflection[]>([]);
    useEffect(() => {
        dataRef.current = wsData;
    }, [wsData]);
    const [selectedItem, setSelectedItem] = useState<Reflection | null>(null);
    // 리스트는 최근 일부만 받으므로 DB 전체 건수는 따로 조회한다(실패 시 받은 건수로 대체).
    const [total, setTotal] = useState<number | null>(null);
    // 태블릿 전시용 전체화면. 이 화면에는 눈에 보이는 버튼을 둔다(운영자가 직접 켠다).
    // 나머지 화면은 layout 의 FullscreenToggle 이 좌하단 3연속 탭으로 처리한다.
    const { isFullscreen, supported, toggle } = useFullscreen();

    useEffect(() => {
        // useSearchParams 는 정적 빌드에서 Suspense 경계를 요구해서, 마운트 후 location 에서 한 번 읽는다.
        const { apiBase, editions } = readSource();
        const wsBase = apiBase.replace(/^http/, "ws"); // http→ws, https→wss
        const query = editions ? `editions=${encodeURIComponent(editions.join(","))}` : "";

        const fetchTotal = async () => {
            try {
                const res = await fetch(`${apiBase}/ending-reflection/count${query ? `?${query}` : ""}`);
                if (res.ok) {
                    const { total } = await res.json();
                    if (typeof total === 'number') setTotal(total);
                }
            } catch (error) {
                console.error('Failed to fetch total:', error);
            }
        };
        fetchTotal();

        // 웹소켓 연결 시도 (현재 서버에서 즉시 끊어짐)
        const ws = new WebSocket(`${wsBase}/ws/ending-reflection`);
        wsRef.current = ws;

        ws.onopen = async () => {
            console.log('WebSocket connected');

            // 초기 데이터 요청
            try {
                const response = await fetch(`${apiBase}/ending-reflection/?${query ? `${query}&` : ""}limit=${LIST_LIMIT}`, {
                    method: 'GET',
                });
                if (response.ok) {
                    const data = await response.json();
                    console.log('Initial data:', data);

                    // API 응답 형태가 환경마다 다를 수 있어 방어적으로 처리
                    const list = Array.isArray(data) ? data : [];
                    dataRef.current = list;
                    setWsData(list);
                    // if (IS_PRD) {
                    // } else {
                    //     const extracted = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
                    //     setWsData(extracted);
                    // }
                }
            } catch (error) {
                console.error('Failed to fetch initial data:', error);
            }
        };

        // main 서버는 전체 목록을, main-2026 서버는 새 일기 1건만 mode:"append" 로 보낸다 — 둘 다 처리.
        ws.onmessage = (event) => {
            console.log('Received:', event.data);
            const message = JSON.parse(event.data);
            if (message.type === 'reflection_update' && Array.isArray(message.data)) {
                const { list, added } = applyReflectionUpdate(dataRef.current, message, editions ?? []);
                dataRef.current = list;
                setWsData(list);
                if (message.mode === 'append') {
                    if (added > 0) setTotal((t) => (t === null ? t : t + added));
                } else {
                    fetchTotal();
                }
            }
        };

        ws.onclose = (event) => {
            console.log('WebSocket closed:', event.code);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    const safeWsData = Array.isArray(wsData) ? wsData : [];
    console.log('Data length:', safeWsData.length, 'total:', total);

    return (
        // h-screen(100vh) 은 모바일 브라우저에서 주소창 높이까지 포함해 스크롤이 생긴다.
        // 100dvh 는 지원 브라우저에서만 적용되고, 미지원 브라우저는 인라인 스타일이
        // 무시되며 h-screen 으로 폴백된다(tailwind 3.3 이라 h-dvh 클래스가 없다).
        <div className="w-full h-screen flex items-stretch" style={{ height: "100dvh" }}>
            <DetailArea selectedItem={selectedItem} />
            <ListArea data={safeWsData} total={total ?? safeWsData.length} onItemClick={setSelectedItem} selectedItem={selectedItem} />

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