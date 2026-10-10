"use client";

import { BASE_API_LINK } from "@/constants";
import { Reflection } from "@/type";
import { DIARY_CSS, diaryBodyHtml, diaryDocument } from "@/utils/diary-html";
import { useEffect, useState } from "react";

// 관람객 휴대폰용 '내 일기' (2026-10-10) — /review 상세의 QR 로 연다. /diary?id=123
// 외부(Tailscale 밖) 휴대폰은 OCI 프록시 jscouple.site:8080/car2 로 들어오고, 그 빌드의 API 주소는 /car1 이다.
// 전역 body 는 키오스크용 overflow:hidden 이라 이 화면은 자체 스크롤 영역을 쓴다.
const API_BASE = BASE_API_LINK.replace(/\/+$/, "");

type State = { kind: "loading" } | { kind: "ok"; item: Reflection } | { kind: "missing" } | { kind: "error" };

export default function DiaryPage() {
    const [state, setState] = useState<State>({ kind: "loading" });

    useEffect(() => {
        const id = new URLSearchParams(window.location.search).get("id");
        if (!id || !/^\d+$/.test(id)) {
            setState({ kind: "missing" });
            return;
        }
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/ending-reflection/${id}`);
                if (res.status === 404) return setState({ kind: "missing" });
                if (!res.ok) return setState({ kind: "error" });
                const item: Reflection = await res.json();
                setState({ kind: "ok", item });
                document.title = item.event_title || "오늘의 일기";
            } catch {
                setState({ kind: "error" });
            }
        })();
    }, []);

    // 한 파일짜리 HTML 로 저장 — 인터넷 없이도 그대로 열린다. iOS 사파리는 다운로드 대신 새 탭으로 열 수 있다.
    const save = () => {
        if (state.kind !== "ok") return;
        const blob = new Blob([diaryDocument(state.item)], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `zer01ne-diary-${state.item.id}.html`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
    };

    return (
        <div className="fixed inset-0 overflow-y-auto bg-[#f4f3f1]" style={{ WebkitOverflowScrolling: "touch" }}>
            <style>{DIARY_CSS}</style>
            {state.kind === "ok" ? (
                <>
                    <div dangerouslySetInnerHTML={{ __html: diaryBodyHtml(state.item) }} />
                    <div className="sticky bottom-0 px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 bg-gradient-to-t from-[#f4f3f1] via-[#f4f3f1] to-transparent">
                        <button
                            type="button"
                            onClick={save}
                            className="block w-full max-w-[440px] mx-auto rounded-2xl bg-[#1d1d1f] text-white text-[16px] font-semibold py-4 active:opacity-80"
                        >
                            내 일기 저장하기
                        </button>
                    </div>
                </>
            ) : (
                <div className="min-h-full flex items-center justify-center px-8 text-center text-[#5e5e5e] text-[15px] leading-relaxed">
                    {state.kind === "loading" && "일기를 불러오는 중이에요…"}
                    {state.kind === "missing" && "일기를 찾을 수 없어요. QR 을 다시 스캔해 주세요."}
                    {state.kind === "error" && "연결이 원활하지 않아요. 잠시 후 다시 열어 주세요."}
                </div>
            )}
        </div>
    );
}
