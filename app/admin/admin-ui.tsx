"use client";

// 관리자 페이지 공용 UI 조각 — TailAdmin(오픈소스 Tailwind 어드민 템플릿)의 디자인 언어를
// 우리 Tailwind 로 옮긴 것: 화이트 카드 + 얇은 slate 보더 + 부드러운 타이포(Hyundai Sans).
// 추가 의존성 없이 이 파일의 조각만으로 페이지 톤을 통일한다.

import { ReactNode } from "react";

export function PageHeader({ title, desc, right }: { title: string; desc?: string; right?: ReactNode }) {
    return (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
                {desc && <p className="mt-1 text-sm text-slate-500">{desc}</p>}
            </div>
            {right}
        </div>
    );
}

export function Card({ title, right, children, className = "" }: {
    title?: string; right?: ReactNode; children: ReactNode; className?: string;
}) {
    return (
        <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
            {(title || right) && (
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                    {title && <h2 className="text-sm font-semibold text-slate-700">{title}</h2>}
                    {right}
                </div>
            )}
            <div className="px-5 py-4">{children}</div>
        </section>
    );
}

const BADGE_TONES = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    rose: "bg-rose-50 text-rose-700 ring-rose-200",
    sky: "bg-sky-50 text-sky-700 ring-sky-200",
    slate: "bg-slate-100 text-slate-600 ring-slate-200",
} as const;

export function Badge({ tone = "slate", children }: { tone?: keyof typeof BADGE_TONES; children: ReactNode }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${BADGE_TONES[tone]}`}>
            {children}
        </span>
    );
}

// 버튼 클래스 프리셋 — 페이지들이 cn 없이 그대로 붙여 쓴다
export const btn = {
    primary: "rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 disabled:opacity-40",
    secondary: "rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40",
    danger: "rounded-lg border border-rose-200 bg-white px-3.5 py-2 text-sm text-rose-600 hover:bg-rose-50 disabled:opacity-40",
    ghost: "rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-40",
};

export const input =
    "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100";

export function EmptyState({ children }: { children: ReactNode }) {
    return (
        <div className="rounded-xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-400">
            {children}
        </div>
    );
}

export function fmtDateTime(iso?: string | null): string {
    if (!iso) return "-";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleString("ko-KR", { hour12: false });
}
