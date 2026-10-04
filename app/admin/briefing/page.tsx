"use client";

// '다음 일정 브리핑' 카드 사진 관리 (2026-10-05).
// step3 끝(도착 직전)에 뜨는 브리핑 팝업은 다음 장소(마트·공원)의 태스크마다 카드 1장을 그리고,
// 카드 사진은 여기서 태스크별로 올린 것을 쓴다. 매칭 순서: 기획 ID(PARK-07 등) → 태스크 제목 → 장소 기본 사진.
// 목록은 서버가 최근 dashboard 에서 본 '차 다음 장소' 태스크 + 장소 기본 칸 + 이미 올린 사진이다.

import { useCallback, useEffect, useRef, useState } from "react";
import { BASE_API_LINK } from "@/constants";

import { Badge, Card, EmptyState, PageHeader, btn, fmtDateTime, input } from "../admin-ui";

const API = BASE_API_LINK.replace(/\/+$/, "");

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
        form.append("file", file);
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
