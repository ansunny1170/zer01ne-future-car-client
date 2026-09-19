"use client";

// 관리자 페이지 공통 셸 — 좌측 사이드바 + 상단 헤더 (TailAdmin 레이아웃 차용).
// 전역(globals.css)이 키오스크용 overflow:hidden 이라 콘텐츠 영역이 자체 스크롤을 가진다.
// 인증 없음(전시 LAN 전제 — 기존 /prompt-admin·디버그 도구와 동일 정책).

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BASE_API_LINK } from "@/constants";

const API = BASE_API_LINK.replace(/\/+$/, "");

const MENU = [
    { href: "/admin", label: "대시보드", icon: "🏠" },
    { href: "/admin/prompts", label: "프롬프트 관리", icon: "📝" },
    { href: "/admin/llm", label: "LLM 설정", icon: "🤖" },
    { href: "/admin/logs", label: "서버 로그", icon: "📋" },
    { href: "/admin/sessions", label: "세션 관리", icon: "🚗" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const [liveTitle, setLiveTitle] = useState<string>("");
    // 사이드바 접기 — 이 브라우저의 localStorage 에 유지(운영 태블릿·모니터별 취향)
    const [collapsed, setCollapsed] = useState(false);
    useEffect(() => {
        try {
            setCollapsed(localStorage.getItem("ftcar_admin_sidebar") === "collapsed");
        } catch { /* noop */ }
    }, []);
    const toggleSidebar = () =>
        setCollapsed((prev) => {
            const next = !prev;
            try {
                localStorage.setItem("ftcar_admin_sidebar", next ? "collapsed" : "open");
            } catch { /* noop */ }
            return next;
        });

    // 헤더에 현재 라이브 프롬프트 제목 상시 표시 — 어떤 화면에서도 "지금 뭐가 적용 중인지" 보이게
    useEffect(() => {
        fetch(`${API}/prompt/latest`)
            .then((r) => (r.ok ? r.json() : null))
            .then((p) => setLiveTitle(p?.title || p?.filename || ""))
            .catch(() => {});
    }, [pathname]);

    return (
        <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-800">
            {/* 사이드바 — 접으면 아이콘 레일만 남는다 */}
            <aside
                className={`flex shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-200 ${
                    collapsed ? "w-16" : "w-60"
                }`}
            >
                <div className={`relative border-b border-slate-100 py-5 ${collapsed ? "px-2" : "px-5"}`}>
                    <button
                        type="button"
                        onClick={toggleSidebar}
                        aria-label={collapsed ? "메뉴 펼치기" : "메뉴 접기"}
                        title={collapsed ? "메뉴 펼치기" : "메뉴 접기"}
                        className={`rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700 ${
                            collapsed ? "mx-auto block" : "absolute right-3 top-4"
                        }`}
                    >
                        {collapsed ? "»" : "«"}
                    </button>
                    {!collapsed && (
                        <>
                            <div className="text-lg font-bold tracking-tight text-slate-800">FutureCar</div>
                            <div className="text-xs text-slate-400">전시 운영 관리</div>
                        </>
                    )}
                    <Link
                        href="/ambient"
                        title="전시 화면으로"
                        className={`mt-3 flex items-center gap-1.5 rounded-lg border border-slate-200 text-xs text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 ${
                            collapsed ? "mx-auto w-fit px-2 py-1" : "w-fit px-2.5 py-1"
                        }`}
                    >
                        {collapsed ? "🖥️" : "← 전시 화면으로"}
                    </Link>
                </div>
                <nav className={`flex-1 space-y-1 overflow-y-auto py-4 ${collapsed ? "px-2" : "px-3"}`}>
                    {MENU.map((m) => {
                        const active = pathname === m.href || (m.href !== "/admin" && pathname.startsWith(m.href));
                        return (
                            <Link
                                key={m.href}
                                href={m.href}
                                title={m.label}
                                className={`flex items-center rounded-xl text-sm font-medium transition-colors ${
                                    collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3.5 py-2.5"
                                } ${
                                    active
                                        ? "bg-sky-50 text-sky-700"
                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                                }`}
                            >
                                <span aria-hidden className="text-base">{m.icon}</span>
                                {!collapsed && m.label}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* 본문 */}
            <div className="flex min-w-0 flex-1 flex-col">
                <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-6">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Live Prompt
                    </span>
                    <span className="truncate text-sm font-medium text-slate-700">
                        {liveTitle || "불러오는 중…"}
                    </span>
                    <span className="ml-auto text-xs text-slate-400">
                        저장·적용은 다음 여정부터 반영됩니다
                    </span>
                </header>
                <main className="min-h-0 flex-1 overflow-y-auto px-8 py-7">{children}</main>
            </div>
        </div>
    );
}
