// 프롬프트 관리 화면 공용 타입·상수·헬퍼.
// 섹션 정본 순서는 서버 app/models/prompt.py 의 SECTION_ORDER 와 반드시 일치해야 한다
// (조립 = 이 순서로 \n\n 이어붙임 — 서버가 최종 조립하고 화면 전체보기는 동일 규칙으로 미리 보여줌).

export type PromptKind = "scenario" | "ending" | "greeting";

export const KIND_LABELS: Record<PromptKind, string> = {
    scenario: "시나리오",
    ending: "일기 (엔딩)",
    greeting: "탑승 인사",
};

export type PromptMeta = {
    id: number;
    kind: PromptKind;
    filename: string;
    file_url: string | null;
    memo: string;
    starred: boolean;
    active: boolean;
    created_at: string | null;
};

export type PromptSection = { key: string; content: string };

export type PromptContent = {
    id: number;
    filename: string;
    content: string;
    sections: PromptSection[];
};

export const SECTION_ORDER = ["rules", "place_stops", "usp", "popup", "assets"] as const;
export type SectionKey = (typeof SECTION_ORDER)[number];

export const SECTION_LABELS: Record<SectionKey, string> = {
    rules: "규칙",
    place_stops: "place_stops",
    usp: "USP",
    popup: "popup",
    assets: "assets",
};

/** 전체보기 칩의 가상 키 — 섹션이 아니라 조립본 읽기 전용 뷰. */
export const FULL_KEY = "__full__";

export type SectionBuffers = Record<SectionKey, string>;

export function emptyBuffers(): SectionBuffers {
    return { rules: "", place_stops: "", usp: "", popup: "", assets: "" };
}

/** 서버 조립 규칙과 동일: 정본 순서, 빈 섹션 제외, \n\n 이어붙임. */
export function assembleBuffers(buffers: SectionBuffers): string {
    return SECTION_ORDER.map((k) => buffers[k])
        .filter((c) => c.trim() !== "")
        .join("\n\n");
}

// "ambient_step4_v3.md" → { base: "ambient_step4", ver: 3 } (버전 표기 없으면 null)
export function parseVersion(filename: string): { base: string; ver: number } | null {
    const m = filename.match(/^(.*)_v(\d+)\.md$/i);
    return m ? { base: m[1], ver: parseInt(m[2], 10) } : null;
}

// 같은 base 의 최대 버전 +1 로 다음 파일명을 제안한다. 버전 표기가 없으면 _v2 부터.
export function nextFilename(from: string, all: PromptMeta[]): string {
    const parsed = parseVersion(from);
    const base = parsed ? parsed.base : from.replace(/\.md$/i, "");
    let maxVer = parsed ? parsed.ver : 1;
    for (const p of all) {
        const v = parseVersion(p.filename);
        if (v && v.base === base && v.ver > maxVer) maxVer = v.ver;
    }
    return `${base}_v${maxVer + 1}.md`;
}

export function fmtDate(iso: string | null): string {
    if (!iso) return "-";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleString("ko-KR", { hour12: false });
}

/** 글자 수·줄 수 — 패널 헤더 카운터. */
export function countOf(text: string): { chars: number; lines: number } {
    return { chars: text.length, lines: text === "" ? 0 : text.split("\n").length };
}
