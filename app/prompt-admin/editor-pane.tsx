"use client";

// 섹션 패널 하나 — CodeMirror 편집(⌘F 패널 범위 검색·md 문법·펜스 코드블럭 언어 하이라이팅).
// "미리보기"를 켜면 화면이 바뀌는 게 아니라 패널 안이 좌(편집)/우(렌더) 분할되고,
// 좌측 타이핑이 실시간으로 우측에 반영된다(대용량 입력 버벅임 방지로 deferred 렌더).

import { useDeferredValue, useRef, useState } from "react";
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
    const [preview, setPreview] = useState(false); // true = 좌(편집)/우(미리보기) 분할
    const cmRef = useRef<ReactCodeMirrorRef>(null);
    const { chars, lines } = countOf(value);
    // 타이핑 키입력을 막지 않도록 미리보기는 한 박자 늦은 값으로 렌더한다(실시간 체감 유지)
    const previewValue = useDeferredValue(value);

    const openSearch = () => {
        const view = cmRef.current?.view;
        if (view) openSearchPanel(view);
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
                            onClick={() => setPreview(false)}
                            className={`px-2 py-0.5 ${!preview ? "bg-neutral-700 text-white" : "text-neutral-400 hover:bg-neutral-800"}`}
                        >
                            원문
                        </button>
                        <button
                            onClick={() => setPreview(true)}
                            title="좌(편집)/우(미리보기) 분할 — 수정이 실시간 반영"
                            className={`px-2 py-0.5 ${preview ? "bg-neutral-700 text-white" : "text-neutral-400 hover:bg-neutral-800"}`}
                        >
                            미리보기
                        </button>
                    </span>
                </span>
            </div>

            <div className={preview ? "grid grid-cols-2" : ""}>
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
                    className="min-w-0 text-xs"
                />
                {preview && (
                    <div
                        className="min-w-0 overflow-y-auto border-l border-neutral-800 px-4 py-2"
                        style={{ height: "max(26rem, calc(100vh - 21rem))" }}
                    >
                        <MdPreview text={previewValue} />
                    </div>
                )}
            </div>
        </div>
    );
}
