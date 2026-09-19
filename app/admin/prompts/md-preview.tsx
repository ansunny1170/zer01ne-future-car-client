"use client";

// Markdown 미리보기 — react-markdown + GFM(표·체크리스트) + 펜스 코드블럭 하이라이팅.
// ```json / ```python 처럼 펜스 우측 언어 표기를 rehype-highlight(highlight.js)가 인식한다.
// 스타일은 전역 CSS 대신 컴포넌트 매핑으로 입힌다(페이지 밖으로 새지 않게).

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

export function MdPreview({ text }: { text: string }) {
    return (
        <div className="text-sm leading-relaxed text-slate-700">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                    h1: (p) => <h1 className="mt-5 mb-3 border-b border-slate-300 pb-1 text-xl font-bold" {...p} />,
                    h2: (p) => <h2 className="mt-4 mb-2 text-lg font-bold" {...p} />,
                    h3: (p) => <h3 className="mt-3 mb-1.5 text-base font-semibold" {...p} />,
                    h4: (p) => <h4 className="mt-2 mb-1 text-sm font-semibold" {...p} />,
                    p: (p) => <p className="my-2" {...p} />,
                    ul: (p) => <ul className="my-2 list-disc pl-5" {...p} />,
                    ol: (p) => <ol className="my-2 list-decimal pl-5" {...p} />,
                    li: (p) => <li className="my-0.5" {...p} />,
                    blockquote: (p) => (
                        <blockquote className="my-2 border-l-2 border-slate-300 pl-3 text-slate-500" {...p} />
                    ),
                    hr: () => <hr className="my-4 border-slate-300" />,
                    a: (p) => <a className="text-blue-400 underline" {...p} />,
                    table: (p) => <table className="my-3 border-collapse text-xs" {...p} />,
                    th: (p) => <th className="border border-slate-300 bg-slate-100 px-2 py-1 text-left" {...p} />,
                    td: (p) => <td className="border border-slate-300 px-2 py-1 align-top" {...p} />,
                    // 인라인 코드 vs 펜스 블록: 블록은 <pre> 매핑이 감싼다
                    code: (p) => {
                        const { className, children, ...rest } = p;
                        const isBlock = /language-/.test(className ?? "") || String(children).includes("\n");
                        return isBlock ? (
                            <code className={className} {...rest}>
                                {children}
                            </code>
                        ) : (
                            <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.85em] text-rose-500" {...rest}>
                                {children}
                            </code>
                        );
                    },
                    pre: (p) => (
                        <pre
                            className="my-3 overflow-x-auto rounded-lg border border-slate-300 bg-[#0d1117] p-3 font-mono text-xs leading-relaxed"
                            {...p}
                        />
                    ),
                }}
            >
                {text}
            </ReactMarkdown>
        </div>
    );
}

/** 전체 미리보기 모달 — 조립 전문을 md 렌더로 크게 본다. */
export function PreviewModal({
    title,
    text,
    onClose,
}: {
    title: string;
    text: string;
    onClose: () => void;
}) {
    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-6"
            onClick={onClose}
        >
            <div
                className="flex h-full w-full max-w-5xl flex-col rounded-xl border border-slate-300 bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                    <span className="font-mono text-sm text-slate-600">{title} — 미리보기</span>
                    <button
                        onClick={onClose}
                        className="rounded-md px-3 py-1 text-sm text-slate-500 hover:bg-slate-100"
                    >
                        닫기 ✕
                    </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                    <MdPreview text={text} />
                </div>
            </div>
        </div>
    );
}
