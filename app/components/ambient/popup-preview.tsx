"use client";

// 디버그 '이미지 팝업 미리보기'(2026-10-05) — 스텝 진행과 무관하게 이미지 팝업을 이 화면에 띄워 본다.
// 서버에서 이미지 팝업 목록(/popups/images)을 받아 하나 또는 전체를 순서대로 표시 시간만큼 보여준다.
// 서버·태블릿에는 아무것도 보내지 않는다(조회만). 설명 자리에는 실제 LLM 문구 대신 그 팝업의 사용 상황을 보여준다.
import { useEffect, useRef, useState } from "react";
import ImagePopup from "@/components/ui/popup_ui/image-popup";

export type PreviewItem = { id: string; title: string; usage: string; image_url: string | null };

export default function PopupPreview({ items, seconds, onDone }: {
    items: PreviewItem[];
    seconds: number;
    onDone: () => void;
}) {
    const [idx, setIdx] = useState(0);
    // 부모(차 화면)는 WS 메시지마다 다시 그려진다 — onDone 이 바뀔 때마다 타이머가 리셋되지 않게 ref 로 든다.
    const onDoneRef = useRef(onDone);
    onDoneRef.current = onDone;

    useEffect(() => {
        const timer = setTimeout(() => {
            if (idx + 1 < items.length) setIdx((i) => i + 1);
            else onDoneRef.current();
        }, seconds * 1000);
        return () => clearTimeout(timer);
    }, [idx, items.length, seconds]);

    const item = items[idx];
    if (!item) return null;
    return (
        <div className="pointer-events-none fixed inset-0 z-[900] flex flex-col items-center justify-center gap-3">
            <ImagePopup key={item.id} title={item.title} image={item.image_url} subtext={item.usage} />
            {items.length > 1 && (
                <div className="rounded-full bg-black/60 px-3 py-1 text-xs text-white/80">
                    미리보기 {idx + 1}/{items.length} · {item.id}
                </div>
            )}
        </div>
    );
}
