"use client";

import DetailArea from "@/components/review/detail-area";
import ListArea from "@/components/review/list-area";
import { Reflection } from "@/type";
import { useEffect, useRef, useState } from "react";
import { BASE_API_LINK } from "@/constants";
import { useFullscreen } from "@/hooks/useFullscreen";

// .env(NEXT_PUBLIC_API_URL) 기반으로 REST/WS 주소 생성
// 예: "https://api.ftcar.org/" → API_BASE="https://api.ftcar.org", WS_BASE="wss://api.ftcar.org"
const API_BASE = BASE_API_LINK.replace(/\/+$/, "");
const WS_BASE = API_BASE.replace(/^http/, "ws"); // http→ws, https→wss

export default function Review() {
    const wsRef = useRef<WebSocket | null>(null);
    const [wsData, setWsData] = useState<Reflection[]>([]);
    const [selectedItem, setSelectedItem] = useState<Reflection | null>(null);
    // 태블릿 전시용 전체화면. 이 화면에는 눈에 보이는 버튼을 둔다(운영자가 직접 켠다).
    // 나머지 화면은 layout 의 FullscreenToggle 이 좌하단 3연속 탭으로 처리한다.
    const { isFullscreen, supported, toggle } = useFullscreen();

    useEffect(() => {
        // 웹소켓 연결 시도 (현재 서버에서 즉시 끊어짐)
        const ws = new WebSocket(`${WS_BASE}/ws/ending-reflection`);
        wsRef.current = ws;

        ws.onopen = async () => {
            console.log('WebSocket connected');

            // 초기 데이터 요청
            try {
                const response = await fetch(`${API_BASE}/ending-reflection/`, {
                    method: 'GET',
                });
                if (response.ok) {
                    const data = await response.json();
                    console.log('Initial data:', data);

                    // API 응답 형태가 환경마다 다를 수 있어 방어적으로 처리
                    setWsData(Array.isArray(data) ? data : []);
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

        ws.onmessage = (event) => {
            console.log('Received:', event.data);
            const message = JSON.parse(event.data);
            if (message.type === 'reflection_update' && Array.isArray(message.data)) {
                setWsData(message.data);
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

    // 최대 120개(20페이지 x 6개)로 데이터 제한
    const safeWsData = Array.isArray(wsData) ? wsData : [];
    const limitedWsData = safeWsData.slice(0, 120);
    console.log('Original data length:', wsData.length, 'Limited data length:', limitedWsData.length);

    return (
        // h-screen(100vh) 은 모바일 브라우저에서 주소창 높이까지 포함해 스크롤이 생긴다.
        // 100dvh 는 지원 브라우저에서만 적용되고, 미지원 브라우저는 인라인 스타일이
        // 무시되며 h-screen 으로 폴백된다(tailwind 3.3 이라 h-dvh 클래스가 없다).
        <div className="w-full h-screen flex items-stretch" style={{ height: "100dvh" }}>
            <DetailArea selectedItem={selectedItem} />
            <ListArea data={limitedWsData} onItemClick={setSelectedItem} selectedItem={selectedItem} />

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