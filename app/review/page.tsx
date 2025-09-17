"use client";

import DetailArea from "@/components/review/detail-area";
import ListArea from "@/components/review/list-area";
import { Reflection } from "@/type";
import { useEffect, useRef, useState } from "react";
import { IS_PRD } from "@/constants";

export default function Review() {
    const wsRef = useRef<WebSocket | null>(null);
    const [wsData, setWsData] = useState<Reflection[]>([]);
    const [selectedItem, setSelectedItem] = useState<Reflection | null>(null);
    
    useEffect(() => {
        // 웹소켓 연결 시도 (현재 서버에서 즉시 끊어짐)
        const ws = new WebSocket(IS_PRD ? 'wss://api.ftcar.org/ws/ending-reflection' : 'wss://dev.ftcar.org/ws/ending-reflection');
        wsRef.current = ws;

        ws.onopen = async () => {
            console.log('WebSocket connected');
            
            // 초기 데이터 요청
            try {
                const response = await fetch(IS_PRD ? 'https://api.ftcar.org/ending-reflection/' : 'https://dev.ftcar.org/ending-reflection/', {
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
        <div className="w-full h-screen flex items-stretch">
            <DetailArea selectedItem={selectedItem} />
            <ListArea data={limitedWsData} onItemClick={setSelectedItem} selectedItem={selectedItem} />
        </div>
    );
}