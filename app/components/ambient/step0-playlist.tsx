"use client";

import { useEffect, useRef, useState } from "react";

// 탑승 대기(step0) 영상 목록을 순서대로 반복 재생한다 — 마지막 다음엔 처음으로(2026-10-10).
// 영상 사이 검은 화면이 끼지 않게 <video> 두 개를 번갈아 쓴다: 앞 슬롯이 재생되는 동안 뒤 슬롯이 다음 영상을
// 미리 받아 두고, 앞이 끝나는 순간 뒤를 보이며 재생한다. 배경 영상은 항상 무음.
export default function Step0Playlist({ files, base }: { files: string[]; base: string }) {
    const n = files.length;
    const refs = [useRef<HTMLVideoElement>(null), useRef<HTMLVideoElement>(null)];
    // 각 슬롯이 맡은 목록 위치, 지금 보이는 슬롯
    const [slots, setSlots] = useState<[number, number]>([0, n > 1 ? 1 : 0]);
    const [front, setFront] = useState(0);

    useEffect(() => {
        const v = refs[front].current;
        if (!v) return;
        v.muted = true;
        v.currentTime = 0;
        v.play().catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [front]);

    const onEnded = (slot: number) => {
        if (slot !== front || n < 2) return;
        const back = 1 - slot;
        setFront(back);
        // 방금 끝난 슬롯은 '그다음' 영상을 미리 받아 둔다
        setSlots((s) => {
            const next: [number, number] = [s[0], s[1]];
            next[slot] = (s[back] + 1) % n;
            return next;
        });
    };

    if (n === 0) return null;
    return (
        <>
            {[0, 1].map((i) => (
                <video
                    key={i}
                    ref={(el) => {
                        refs[i].current = el;
                        if (el) el.muted = true; // JSX muted 만으로는 React 버그로 소리가 샐 때가 있다
                    }}
                    src={`${base}/${files[slots[i]]}`}
                    muted
                    playsInline
                    preload="auto"
                    autoPlay={i === 0}
                    loop={n === 1}
                    onEnded={() => onEnded(i)}
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{ opacity: i === front ? 1 : 0 }}
                    data-step0-slot={i}
                />
            ))}
        </>
    );
}
