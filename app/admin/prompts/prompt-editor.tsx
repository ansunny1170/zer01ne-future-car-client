"use client";

// 인라인 프롬프트 편집기 — 목록 행 바로 아래에 펼쳐진다(어떤 버전 기반인지 행 맥락으로 명확).
// 칩 다중 선택 → 선택 개수만큼 가로 패널 나열(전체 폭·패널 최소 420px·초과분 가로 스크롤).
// 저장 = 섹션 세트 통째 새 버전(_vN+1) 생성·즉시 적용 — 덮어쓰기 없음.

import { useMemo, useState } from "react";

import { EditorPane } from "./editor-pane";
import { PreviewModal } from "./md-preview";
import {
    FULL_KEY,
    SECTION_LABELS,
    SECTION_ORDER,
    assembleBuffers,
    countOf,
    emptyBuffers,
    nextFilename,
    type PromptContent,
    type PromptMeta,
    type SectionBuffers,
    type SectionKey,
} from "./sections";

type ChipKey = typeof FULL_KEY | SectionKey;

interface PromptEditorProps {
    /** 기반 버전의 본문 — null 이면 빈 새 프롬프트 */
    initial: PromptContent | null;
    items: PromptMeta[]; // 파일명 vN+1 계산·중복 검사용
    busy: boolean;
    onSave: (payload: {
        filename: string;
        memo: string;
        content?: string;
        sections?: { key: string; content: string }[];
    }) => void;
    onClose: () => void;
}

export function PromptEditor({ initial, items, busy, onSave, onClose }: PromptEditorProps) {
    const hasSections = (initial?.sections.length ?? 0) > 0;

    // sectioned = 섹션 분할 편집 / plain = 전문 한 덩어리 (구 레코드·새 프롬프트 초기 상태)
    const [sectioned, setSectioned] = useState(hasSections);
    const [buffers, setBuffers] = useState<SectionBuffers>(() => {
        const b = emptyBuffers();
        for (const s of initial?.sections ?? []) b[s.key as SectionKey] = s.content;
        return b;
    });
    const [plainText, setPlainText] = useState(hasSections ? "" : (initial?.content ?? ""));
    const [selected, setSelected] = useState<ChipKey[]>(() => {
        if (!hasSections) return [];
        const first = SECTION_ORDER.find((k) => (initial?.sections ?? []).some((s) => s.key === k));
        return [first ?? "rules"];
    });
    const [filename, setFilename] = useState(() =>
        initial ? nextFilename(initial.filename, items) : "",
    );
    const [memo, setMemo] = useState("");
    const [previewOpen, setPreviewOpen] = useState(false);

    const assembled = useMemo(
        () => (sectioned ? assembleBuffers(buffers) : plainText),
        [sectioned, buffers, plainText],
    );
    const total = countOf(assembled);

    const toggleChip = (key: ChipKey) =>
        setSelected((prev) => {
            const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
            // 표시 순서는 선택 순서가 아니라 정본 순서(전체보기 맨 앞)로 고정한다.
            const order: ChipKey[] = [FULL_KEY, ...SECTION_ORDER];
            return order.filter((k) => next.includes(k));
        });

    const splitToSections = () => {
        // 전문 → 섹션 시작: 전부 '규칙'에 넣고 담당자가 잘라 붙인다(자동 분할은 경계를 알 수 없음).
        setBuffers({ ...emptyBuffers(), rules: plainText });
        setSectioned(true);
        setSelected(["rules"]);
    };

    const save = () => {
        if (!filename.trim()) return alert("파일명을 입력해주세요");
        if (!assembled.trim()) return alert("본문이 비어 있습니다");
        if (items.some((i) => i.filename === filename.trim()))
            return alert(`같은 파일명이 이미 있습니다: ${filename} — 버전을 올려주세요`);
        if (!confirm(`"${filename.trim()}" 로 저장하면 즉시 라이브로 적용됩니다. 진행할까요?`)) return;
        onSave(
            sectioned
                ? {
                      filename: filename.trim(),
                      memo,
                      sections: SECTION_ORDER.map((key) => ({ key, content: buffers[key] })),
                  }
                : { filename: filename.trim(), memo, content: plainText },
        );
    };

    const chipClass = (on: boolean) =>
        `rounded-full border px-3 py-1 text-xs transition-colors ${
            on
                ? "border-sky-500 bg-sky-50 text-sky-700"
                : "border-slate-300 text-slate-500 hover:border-slate-400"
        }`;

    return (
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-4">
            {/* 저장 바 */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-slate-600">
                    {initial ? `#${initial.id} ${initial.filename} 기반 새 버전` : "새 프롬프트"}
                </span>
                <input
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    placeholder="ambient_step4_v5.md"
                    className="w-80 rounded-md border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm outline-none focus:border-sky-400"
                />
                <input
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="메모 (이 버전의 특징)"
                    className="min-w-64 flex-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-sky-400"
                />
                <span className="text-[11px] text-slate-400">
                    전체 {total.chars.toLocaleString()}자 · {total.lines.toLocaleString()}줄
                </span>
                <button
                    onClick={() => setPreviewOpen(true)}
                    disabled={!assembled.trim()}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                    전체 미리보기
                </button>
                <button
                    onClick={onClose}
                    disabled={busy}
                    className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
                >
                    닫기
                </button>
                <button
                    onClick={save}
                    disabled={busy}
                    className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-40"
                >
                    저장하고 적용
                </button>
            </div>

            {sectioned ? (
                <>
                    {/* 칩 바 — 다중 선택 = 가로 패널 나열 */}
                    <div className="mb-3 flex flex-wrap items-center gap-1.5">
                        <button onClick={() => toggleChip(FULL_KEY)} className={chipClass(selected.includes(FULL_KEY))}>
                            전체보기
                        </button>
                        {SECTION_ORDER.map((key) => (
                            <button key={key} onClick={() => toggleChip(key)} className={chipClass(selected.includes(key))}>
                                {SECTION_LABELS[key]}
                                {buffers[key].trim() === "" && <span className="ml-1 opacity-50">·비어있음</span>}
                            </button>
                        ))}
                        <span className="ml-2 text-[11px] text-slate-400">
                            칩을 여러 개 켜면 옆으로 나란히 보며 동시에 수정할 수 있어요
                        </span>
                    </div>

                    {selected.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-400">
                            위에서 섹션 칩을 선택하세요
                        </div>
                    ) : (
                        <div className="overflow-x-auto pb-1">
                            <div
                                className="grid gap-3"
                                style={{ gridTemplateColumns: `repeat(${selected.length}, minmax(26rem, 1fr))` }}
                            >
                                {selected.map((key) =>
                                    key === FULL_KEY ? (
                                        <EditorPane key={key} label="전체보기 (조립 전문)" value={assembled} readOnly />
                                    ) : (
                                        <EditorPane
                                            key={key}
                                            label={SECTION_LABELS[key]}
                                            value={buffers[key]}
                                            onChange={(next) => setBuffers((b) => ({ ...b, [key]: next }))}
                                        />
                                    ),
                                )}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <>
                    <div className="mb-3 flex items-center gap-2">
                        <span className="text-xs text-slate-400">
                            이 버전은 섹션 분할 전(전문 한 덩어리)입니다.
                        </span>
                        <button
                            onClick={splitToSections}
                            className="rounded-full border border-amber-400 px-3 py-1 text-xs text-amber-600 hover:bg-amber-50"
                        >
                            섹션으로 나누기 시작 → 전문이 &lsquo;규칙&rsquo;에 담긴 채 열립니다
                        </button>
                    </div>
                    <EditorPane label="전문" value={plainText} onChange={setPlainText} />
                </>
            )}

            {previewOpen && (
                <PreviewModal
                    title={filename || initial?.filename || "새 프롬프트"}
                    text={assembled}
                    onClose={() => setPreviewOpen(false)}
                />
            )}
        </div>
    );
}
