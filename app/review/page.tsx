"use client";

import DetailArea from "@/components/review/detail-area";
import ListArea from "@/components/review/list-area";
import { Reflection } from "@/type";
import { useEffect, useRef, useState } from "react";


export default function Review() {
    const wsRef = useRef<WebSocket | null>(null);
    const [wsData, setWsData] = useState<Reflection[]>([]);
    const [selectedItem, setSelectedItem] = useState<Reflection | null>(null);
    
    useEffect(() => {
        // 웹소켓 연결 시도 (현재 서버에서 즉시 끊어짐)
        const ws = new WebSocket('wss://dev.ftcar.org/ws/ending-reflection');
        wsRef.current = ws;

        ws.onopen = async () => {
            console.log('WebSocket connected');
            
            // 초기 데이터 요청
            try {
                const response = await fetch('https://dev.ftcar.org/ending-reflection/trigger-from-history/710', {
                    method: 'POST',
                });
                if (response.ok) {
                    const data = await response.json();
                    console.log('Initial data:', data);
                    if (data.data) {
                        setWsData(data.data);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch initial data:', error);
            }
        };

        ws.onmessage = (event) => {
            console.log('Received:', event.data);
            const message = JSON.parse(event.data);
            if (message.type === 'reflection_update' && message.data) {
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

    return (
        <div className="w-full h-screen flex items-stretch">
            <DetailArea selectedItem={selectedItem} />
            <ListArea data={wsData} onItemClick={setSelectedItem} selectedItem={selectedItem} />
        </div>
    );
}