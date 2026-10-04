"use client";

// '다음 일정 브리핑' 카드 사진 관리 (2026-10-05).
// step3 끝(도착 직전)에 뜨는 브리핑 팝업은 다음 장소(마트·공원)의 태스크마다 카드 1장을 그리고,
// 카드 사진은 여기서 태스크별로 올린 것을 쓴다. 매칭 순서: 기획 ID(PARK-07 등) → 태스크 제목 → 장소 기본 사진.
// 목록은 서버가 최근 dashboard 에서 본 '차 다음 장소' 태스크 + 장소 기본 칸 + 이미 올린 사진이다.

import { useCallback, useEffect, useRef, useState } from "react";
import { BASE_API_LINK } from "@/constants";

import { Badge, Card, EmptyState, PageHeader, btn, fmtDateTime, input } from "../admin-ui";
import { normalizeImage } from "../image-normalize";

const API = BASE_API_LINK.replace(/\/+$/, "");

// 차 화면 카드 사진 칸 = 140×100px(가로:세로 7:5). 선명하게 3배로 저장한다.
const SLOT_W = 140;
const SLOT_H = 100;
const OUT_W = SLOT_W * 3;
const OUT_H = SLOT_H * 3;

type Row = {
    key: string;
    title: string | null;
    place: string | null;
    kind: "place" | "task";
    seen: boolean;
    image_url: string | null;
    updated_at: string | null;
};

function ImageRow({ row, onChanged }: { row: Row; onChanged: () => void }) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const upload = async (file: File) => {
        setBusy(true);
        setError(null);
        const form = new FormData();
        form.append("file", await normalizeImage(file, OUT_W, OUT_H, "smart"));
        if (row.title) form.append("label", row.title);
        if (row.place) form.append("place", row.place);
        try {
            const r = await fetch(`${API}/briefing-images/${encodeURIComponent(row.key)}`, { method: "POST", body: form });
            if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.detail || `업로드 실패 ${r.status}`);
            onChanged();
        } catch (e) {
            setError(e instanceof Error ? e.message : "업로드 실패");
        } finally {
            setBusy(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    const remove = async () => {
        setBusy(true);
        setError(null);
        try {
            const r = await fetch(`${API}/briefing-images/${encodeURIComponent(row.key)}`, { method: "DELETE" });
            if (!r.ok) throw new Error(`삭제 실패 ${r.status}`);
            onChanged();
        } catch (e) {
            setError(e instanceof Error ? e.message : "삭제 실패");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="flex items-center gap-4 border-b border-slate-100 py-3 last:border-b-0">
            {/* 카드와 같은 비율(140×100) 미리보기 */}
            <div className="h-[70px] w-[98px] shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {row.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">사진 없음</div>
                )}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-800">{row.title || row.key}</span>
                    {row.place && <Badge tone="sky">{row.place}</Badge>}
                    {!row.seen && <Badge tone="amber">최근 여정에 안 보임</Badge>}
                </div>
                <div className="mt-0.5 font-mono text-xs text-slate-400">{row.key}</div>
                {row.updated_at && <div className="text-xs text-slate-400">변경 · {fmtDateTime(row.updated_at)}</div>}
                {error && <div className="text-xs text-rose-600">{error}</div>}
            </div>
            <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) upload(f);
                }}
            />
            <button type="button" className={btn.secondary} disabled={busy} onClick={() => fileRef.current?.click()}>
                {busy ? "처리 중…" : row.image_url ? "사진 바꾸기" : "사진 올리기"}
            </button>
            {row.image_url && (
                <button type="button" className={btn.danger} disabled={busy} onClick={remove}>
                    지우기
                </button>
            )}
        </div>
    );
}

export default function BriefingImagesPage() {
    const [rows, setRows] = useState<Row[] | null>(null);
    const [loadError, setLoadError] = useState(false);
    const [manualKey, setManualKey] = useState("");

    const load = useCallback(() => {
        fetch(`${API}/briefing-images`, { cache: "no-store" })
            .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
            .then((d) => {
                setRows(d?.rows ?? []);
                setLoadError(false);
            })
            .catch(() => setLoadError(true));
    }, []);
    useEffect(load, [load]);

    const places = (rows ?? []).filter((r) => r.kind === "place");
    const tasks = (rows ?? []).filter((r) => r.kind === "task");
    const byPlace = tasks.reduce<Record<string, Row[]>>((acc, r) => {
        (acc[r.place || "장소 미상"] ||= []).push(r);
        return acc;
    }, {});
    // 직접 추가 — 아직 여정에 안 나온 태스크도 미리 올릴 수 있게. 기획 ID(PARK-07) 또는 제목.
    const key = manualKey.trim();
    const manualRow: Row | null = key
        ? {
              key: /^[A-Z]+-\d+$/.test(key) || key.startsWith("title:") ? key : `title:${key}`,
              title: key.startsWith("title:") ? key.slice(6) : key,
              place: null, kind: "task", seen: false, image_url: null, updated_at: null,
          }
        : null;

    return (
        <div className="mx-auto max-w-5xl">
            <PageHeader
                title="브리핑 사진"
                desc="step3 끝에 뜨는 '다음 일정 브리핑' 카드의 사진을 태스크마다 정합니다. 기획 ID → 태스크 제목 → 장소 기본 사진 순으로 찾습니다."
                right={<button type="button" className={btn.secondary} onClick={load}>새로고침</button>}
            />
            {loadError && <EmptyState>서버에서 목록을 받지 못했습니다.</EmptyState>}

            <div className="mb-5 rounded-xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm leading-relaxed text-sky-900">
                <div className="font-semibold">차량 화면에서 사진이 보이는 크기</div>
                <ul className="mt-1 list-disc pl-5">
                    <li>
                        카드 사진 칸은 <b>{SLOT_W}×{SLOT_H}px</b> (가로:세로 = 7:5), 모서리 둥글게 10px 입니다. 브리핑 팝업은
                        폭 600px, 카드는 최대 3장입니다.
                    </li>
                    <li>
                        올리면 자동으로 <b>{OUT_W}×{OUT_H}px</b>(3배, 선명도용)로 맞춰 저장합니다. 원본 크기·비율은 상관없습니다.
                    </li>
                    <li>배경이 투명한 일러스트·누끼 이미지는 투명 여백을 걷어낸 뒤 잘리지 않게 칸 안에 맞추고 둘레에 여백을 둡니다.</li>
                    <li>배경이 꽉 찬 사진은 칸을 채우도록 가운데를 기준으로 잘립니다 — 중요한 부분이 가운데 오게 해 주세요.</li>
                    <li>jpg·png·webp 가능. 원본은 {OUT_W}×{OUT_H}px 이상을 권장합니다.</li>
                </ul>
            </div>

            <div className="space-y-5">
                <Card title="장소 기본 사진 (매칭이 없을 때)">
                    {places.map((r) => <ImageRow key={r.key} row={r} onChanged={load} />)}
                </Card>

                {Object.keys(byPlace).length === 0 && rows && (
                    <EmptyState>최근 여정에서 본 다음 장소 태스크가 없습니다. 아래에서 직접 추가할 수 있습니다.</EmptyState>
                )}
                {Object.entries(byPlace).map(([place, list]) => (
                    <Card key={place} title={`${place} 태스크 (${list.length})`}>
                        {list.map((r) => <ImageRow key={r.key} row={r} onChanged={load} />)}
                    </Card>
                ))}

                <Card title="직접 추가">
                    <p className="mb-3 text-sm text-slate-500">
                        여정에 아직 안 나온 태스크도 미리 올릴 수 있습니다. 기획 ID(예: PARK-07)나 태스크 제목을 그대로 적으세요.
                    </p>
                    <input
                        className={`${input} w-full`}
                        placeholder="PARK-07 또는 체조하기"
                        value={manualKey}
                        onChange={(e) => setManualKey(e.target.value)}
                    />
                    {manualRow && (
                        <div className="mt-2">
                            <ImageRow
                                row={manualRow}
                                onChanged={() => {
                                    setManualKey("");
                                    load();
                                }}
                            />
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
