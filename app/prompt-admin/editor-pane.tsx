"use client";

// 섹션 패널 하나 — CodeMirror 편집(⌘F 패널 범위 검색·md 문법·펜스 코드블럭 언어 하이라이팅)
// 또는 md 미리보기. 헤더에 글자 수·줄 수 실시간 표시.

import { useRef, useState } from "react";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { search, openSearchPanel } from "@codemirror/search";
import { EditorView } from "@codemirror/view";

import { MdPreview } from "./md-preview";
import { countOf } from "./sections";

// md 문법 + ```json/```python 등 펜스 언어 인식(@codemirror/language-data 로 지연 로드),
// 긴 프롬프트라 줄바꿈, 검색 패널은 패널 상단 고정. 검색은 기본이 대소문자 무시다.
const extensions = [
    markdown({ base: markdownLanguage, codeLanguages: languages }),
    search({ top: true }),
    EditorView.lineWrapping,
];

interface EditorPaneProps {
    label: string;
    value: string;
    onChange?: (next: string) => void; // 없으면 읽기 전용 (전체보기)
    readOnly?: boolean;
}

export function EditorPane({ label, value, onChange, readOnly = false }: EditorPaneProps) {
    const [mode, setMode] = useState<"edit" | "preview">("edit");
    const cmRef = useRef<ReactCodeMirrorRef>(null);
    const { chars, lines } = countOf(value);

    const openSearch = () => {
        const view = cmRef.current?.view;
        if (view) {
            setMode("edit"); // 검색은 편집 뷰에서만 동작
            openSearchPanel(view);
        }
    };

    return (
        <div className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-neutral-700 bg-neutral-950">
            <div className="flex items-center gap-2 border-b border-neutral-800 bg-neutral-900 px-3 py-1.5">
                <span className={`text-xs font-semibold ${readOnly ? "text-emerald-400" : "text-neutral-300"}`}>
                    {label}
                    {readOnly && <span className="ml-1 font-normal text-neutral-500">(읽기 전용)</span>}
                </span>
                <span className="text-[11px] text-neutral-500">
                    {chars.toLocaleString()}자 · {lines.toLocaleString()}줄
                </span>
                <span className="ml-auto flex items-center gap-1">
                    <button
                        onClick={openSearch}
                        title="이 패널 안에서 검색 (⌘F) — 영어 대소문자 구분 없음"
                        className="rounded px-2 py-0.5 text-[11px] text-neutral-400 hover:bg-neutral-800"
                    >
                        🔍 검색
                    </button>
                    <span className="overflow-hidden rounded-md border border-neutral-700 text-[11px]">
                        <button
                            onClick={() => setMode("edit")}
                            className={`px-2 py-0.5 ${mode === "edit" ? "bg-neutral-700 text-white" : "text-neutral-400 hover:bg-neutral-800"}`}
                        >
                            원문
                        </button>
                        <button
                            onClick={() => setMode("preview")}
                            className={`px-2 py-0.5 ${mode === "preview" ? "bg-neutral-700 text-white" : "text-neutral-400 hover:bg-neutral-800"}`}
                        >
                            미리보기
                        </button>
                    </span>
                </span>
            </div>

            {mode === "edit" ? (
                <CodeMirror
                    ref={cmRef}
                    value={value}
                    onChange={onChange}
                    readOnly={readOnly || !onChange}
                    editable={!readOnly && !!onChange}
                    theme="dark"
                    height="max(26rem, calc(100vh - 21rem))"
                    extensions={extensions}
                    basicSetup={{ foldGutter: false, highlightActiveLine: true }}
                    className="text-xs"
                />
            ) : (
                <div className="overflow-y-auto px-4 py-2" style={{ height: "max(26rem, calc(100vh - 21rem))" }}>
                    <MdPreview text={value} />
                </div>
            )}
        </div>
    );
}
