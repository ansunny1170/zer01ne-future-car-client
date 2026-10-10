import { EmotionKey, Reflection } from "@/type";
import { companionOf, emotionPlacesOf, formatReflectionDate, formatSessionTime, hasEmotionData } from "@/utils/reflection";

// 관람객 휴대폰용 '내 일기' (2026-10-10) — QR 로 여는 /diary 화면과 '내 일기 저장'으로 받는 HTML 파일이
// 같은 마크업·CSS 를 쓰게 한 곳에서 만든다. 받은 파일은 외부 파일·스크립트 없이 혼자 열린다.

const EMOTION: Record<EmotionKey, { label: string; color: string }> = {
    joy: { label: "기쁨", color: "#a4b6ff" },
    surprise: { label: "놀람", color: "#bde956" },
    neutral: { label: "평온", color: "#fdea43" },
    anger: { label: "화남", color: "#ff7575" },
};
const ORDER: EmotionKey[] = ["joy", "surprise", "neutral", "anger"];

function esc(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export const DIARY_CSS = `
.zd{max-width:480px;margin:0 auto;padding:28px 20px 40px;color:#1d1d1f;font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif;line-height:1.6;word-break:keep-all}
.zd-brand{font-size:12px;letter-spacing:.08em;color:#8a8a8e;text-transform:uppercase}
.zd-title{font-size:28px;font-weight:700;line-height:1.3;margin:10px 0 14px}
.zd-meta{font-size:14px;color:#5e5e5e;margin:2px 0}
.zd-meta b{color:#1d1d1f;font-weight:600}
.zd-card{background:#fff;border-radius:16px;padding:16px;margin:22px 0;box-shadow:0 1px 3px rgba(0,0,0,.06)}
.zd-card h2{font-size:16px;font-weight:700;margin:0 0 4px}
.zd-sub{font-size:12px;color:#8a8a8e;margin:0 0 12px}
.zd-legend{display:flex;flex-wrap:wrap;gap:6px 12px;font-size:12px;color:#5e5e5e;margin-bottom:12px}
.zd-legend i,.zd-dom i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:4px;vertical-align:-1px}
.zd-row{padding:10px 0;border-top:1px solid #f0f0f0}
.zd-row:first-of-type{border-top:0}
.zd-row-head{display:flex;justify-content:space-between;align-items:baseline;font-size:15px}
.zd-place{font-weight:600}
.zd-dom{font-size:13px;color:#5e5e5e}
.zd-bar{display:flex;height:10px;border-radius:5px;overflow:hidden;background:#eee;margin:8px 0 6px}
.zd-tasks{font-size:12px;color:#8a8a8e}
.zd-body{font-size:16px;white-space:pre-wrap;margin-top:22px}
.zd-foot{margin-top:32px;font-size:12px;color:#8a8a8e;text-align:center}
`;

// <body> 안쪽 마크업. 모든 값은 이스케이프한다(일기는 LLM 이 쓴 글이라 그대로 넣지 않는다).
export function diaryBodyHtml(item: Reflection): string {
    const date = formatReflectionDate(item.created_at);
    const companion = companionOf(item);
    const places = emotionPlacesOf(item);
    let emotions = "";
    if (hasEmotionData(places)) {
        const legend = ORDER.map((k) => `<span><i style="background:${EMOTION[k].color}"></i>${EMOTION[k].label}</span>`).join("");
        const rows = places.map((p) => {
            const secs = p.seconds || {};
            const total = ORDER.reduce((a, k) => a + (secs[k] || 0), 0);
            const bar = total > 0
                ? ORDER.filter((k) => (secs[k] || 0) > 0)
                    .map((k) => `<span style="width:${(((secs[k] || 0) / total) * 100).toFixed(1)}%;background:${EMOTION[k].color}"></span>`).join("")
                : "";
            const dom = p.dominant ? `<span class="zd-dom"><i style="background:${EMOTION[p.dominant].color}"></i>${EMOTION[p.dominant].label}</span>` : `<span class="zd-dom">기록 없음</span>`;
            const tasks = (p.tasks || []).length ? `<div class="zd-tasks">한 일 · ${(p.tasks || []).map(esc).join(" · ")}</div>` : "";
            return `<div class="zd-row"><div class="zd-row-head"><span class="zd-place">${esc(p.name)}</span>${dom}</div><div class="zd-bar">${bar}</div>${tasks}</div>`;
        }).join("");
        emotions = `<section class="zd-card"><h2>오늘의 감정 여정</h2><p class="zd-sub">카메라로 본 장소마다의 표정 · 막대는 머문 시간 비율</p><div class="zd-legend">${legend}</div>${rows}</section>`;
    }
    return [
        `<main class="zd">`,
        `<div class="zd-brand">ZER01NE · Future Car Diary</div>`,
        `<h1 class="zd-title">${esc(item.event_title || "오늘의 일기")}</h1>`,
        item.nick_name ? `<p class="zd-meta"><b>${esc(item.nick_name)}</b></p>` : "",
        date ? `<p class="zd-meta">${esc(date)}</p>` : "",
        formatSessionTime(item) ? `<p class="zd-meta">체험 시간: ${esc(formatSessionTime(item))}</p>` : "",
        companion ? `<p class="zd-meta">내가 만난 AI 동행자: ${esc(companion)}</p>` : "",
        emotions,
        `<div class="zd-body">${esc(item.reflection_text || "")}</div>`,
        `<p class="zd-foot">제로원 미래차 체험 · AI 동행자가 쓴 오늘의 일기</p>`,
        `</main>`,
    ].join("");
}

// '내 일기 저장'으로 받는 완결된 HTML 문서.
export function diaryDocument(item: Reflection): string {
    const title = esc(item.event_title || "오늘의 일기");
    return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{margin:0;background:#f4f3f1}${DIARY_CSS}</style></head><body>${diaryBodyHtml(item)}</body></html>`;
}
