// export interface PopUI {
//     key_name: string;
// }

// export interface Asset {
//     bg: string;
//     bgm: string;
//     sfx: string;
//     pop_ui: PopUI[];
// }

// export interface Choice {
//     id: string;
//     text: string;
//     asset: Asset;
// }

// export interface AssetItem {
//     id: string;
//     text: string;
//     asset: Asset;
// }

// export interface StepInfo {
//     narrative: string;
//     question_id: string;
//     assets: AssetItem[];
//     question: string;
//     choices: Choice[];
//     현재_단계?: string | null;
//     현재단계?: string | null;
//     epilogue: string | null;
// }

//-----------------------------

export enum AssetsType {
    VIDEO = 'VIDEO',
    MUSIC = 'MUSIC',
    CLONE_TALKS = 'CLONE_TALKS',
    DEFAULT_POPUP = 'DEFAULT_POPUP',
    TRIGGER_POPUP = 'TRIGGER_POPUP',
    FUNCTION_POPUP = 'FUNCTION_POPUP',
    HUD_POPUP = 'HUD_POPUP',
    COMPANION_VOICE = 'COMPANION_VOICE',
    VEHICLE_SOUND_EFFECT = 'VEHICLE_SOUND_EFFECT',
    BRIEFING_POPUP = 'BRIEFING_POPUP', // step3 끝 '다음 일정 브리핑' (2026-10-05, 서버가 끼움)
}
export enum CompanionType {
    CHILD_GIRL = 'CHILD_GIRL', 
    CHILD_BOY = 'CHILD_BOY', 
    TEEN_GIRL = 'TEEN_GIRL', 
    ADULT_WOMAN = 'ADULT_WOMAN', 
    ADULT_MAN = 'ADULT_MAN',
}  
export interface PassengerState {
    user: number,
    companion1: number,
    companion2: number,
    total: number,
}
export interface BackgroundVideo {
    type: AssetsType.VIDEO,
    description: string,
    file_name: string,
}
export interface BackgroundMusic {
    type: AssetsType.MUSIC,
    title: string, // 곡 제목. 뮤직플레이어 표시 + 커버 이미지 파일명으로 쓰인다 (서버가 title 로 내려줌)
    file_name: string,
}
export interface CloneTalks {
    type: AssetsType.CLONE_TALKS,
    text: string,
}
// 서버가 팝업마다 붙이는 표시 정보(2026-10-05, 관리자 '팝업 설정'): 모양·표시 시간·이미지 팝업 그림·고정 제목
export interface PopupDisplay {
    style: "icon" | "image" | "auto", // auto = 그림이 있을 때만 이미지 팝업
    seconds: number,
    image: string | null, // 이미지 팝업 그림 — 없으면 아이콘을 크게
    title: string | null, // 이미지 팝업 카탈로그의 고정 제목 — 없으면 description
}
export interface DefaultPopup {
    type: AssetsType.DEFAULT_POPUP,
    description: string,
    subtext_popup: string,
    id: number,
    display?: PopupDisplay,
}
export interface TriggerPopup {
    type: AssetsType.TRIGGER_POPUP,
    description: string,
    subtext_popup: string,
    id: number,
    display?: PopupDisplay,
}
export interface FunctionPopup {
    type: AssetsType.FUNCTION_POPUP,
    description: string,
}
export interface HudPopup {
    type: AssetsType.HUD_POPUP,
    description: string,
    id: string,
}
export interface VehicleSoundEffect {
    type: AssetsType.VEHICLE_SOUND_EFFECT,
    description: string,
    file_name: string,
}
export interface CompanionVoice {
    type: AssetsType.COMPANION_VOICE,
    companion_type: CompanionType,
    description: string,
    file_name: string,
}
// '다음 일정 브리핑' 카드 1장 — 다음 장소(마트·공원)에서 할 태스크 1개를 LLM 이 일정처럼 꾸민 것
export interface BriefingItem {
    tag: string,        // 예: "예약 필요" (비면 칩 없음)
    title: string,
    line1: string,      // "<위치> | <주차 상황>"
    line2: string,      // "이동 2.1km / 9분 예상 / 정체 보통"
    time_label: string, // "출발 예상 시각"
    time: string,       // "12:00"
    status: string,     // "정시 도착 가능"
    image: string | null, // 관리자 화면에서 태스크별로 올린 사진 URL
}
export interface BriefingPopup {
    type: AssetsType.BRIEFING_POPUP,
    title: string,
    subtitle: string,
    section_title: string,
    items: BriefingItem[],
}
export type Assets = CloneTalks 
  | DefaultPopup 
  | TriggerPopup
  | FunctionPopup
  | HudPopup
  | VehicleSoundEffect 
  | CompanionVoice
  | BriefingPopup
interface AssetsTimeline {
    parallel: boolean,
    assets: Assets,
}
export interface Choice {
    usp: string,
    description: string,
}

export interface PathState {
    destination: string,
    detour1: string,
    detour2: string,
    detour3: string,
    event: string,
    choirs: string,
}
export interface StepInfo {
    step: 1 | 2 | 3 | 4 | 5 | 6 | 7, // ✅ 각 스텝 번호입니다. 필요시 사용하세요.
    name: string, // 각 스텝의 시나리오 이름. ❌믿지마세요! 신뢰도가 낮으니 참고만 해주세요.
    passenger_state?: PassengerState | "auto" | "onboard", // main-2026: 서버가 문자열(auto=무인 구간/onboard=탑승)로 보냄 — 좌상단 탑뷰 아이콘이 사용. 레거시(main)는 객체({total: 인원수}).
    bgv?: BackgroundVideo, // ✅ 사용하는 데이터입니다. 배경 영상입니다.
    bgm?: BackgroundMusic, // ✅ 사용하는 데이터입니다. 배경 음악입니다.
    sfx?: VehicleSoundEffect, // ✅ 사용하는 데이터입니다. 효과음입니다.
    assets_timeline?: AssetsTimeline[], // 화면 출력용 UI정보입니다. 0번째 부터 순서대로 출력합니다.
    requires_location_change: boolean, // ❌사용하지 않습니다. 위치 상태 값입니다.
    question?: string, // ✅ 사용하는 데이터입니다. 선택지의 질문입니다.
    choices?: Choice[], // ✅ 사용하는 데이터입니다. 선택지입니다. choices의 배열길이는 항상 3입니다.
    path_state?: PathState, // ✅ 사용하는 데이터입니다. 경로 상태입니다.
    flatAssetsParsed?: boolean, // 🔧 GPT가 assets 래퍼를 빼먹은(flat) 항목을 서버가 보정 파싱했을 때 true (디버깅 표시용)
    aiResponseTime?: number, // ⏱️ AI 요청→응답 소요 시간(초). 서버가 측정해서 내려줌 (디버깅 표시용)
    aiModel?: string, // 🤖 사용된 OpenAI 모델 (디버깅 표시용)
    aiReasoningEffort?: string, // 🧠 사용된 reasoning_effort (없으면 undefined)
    aiVerbosity?: string, // 🗣️ 사용된 verbosity (없으면 undefined)
    aiPromptName?: string, // 📝 이 세션이 사용 중인 시스템 프롬프트 파일명 (디버깅 표시용)
}

// export enum AssetsType {
//     VIDEO = 'VIDEO', // 배경 영상
//     MUSIC = 'MUSIC', // 배경 음악
//     CLONE_TALKS = 'CLONE_TALKS', // clone-21g 대사
//     DEFAULT_POPUP = 'DEFAULT_POPUP', // 아마도 화면 중앙에 출력될 UI
//     TRIGGER_POPUP = 'TRIGGER_POPUP', // 돌발상황용 UI
//     FUNCTION_USP_POOL = 'FUNCTION_USP_POOL', // 화면의 좌상단 UI
//     COMPANION_VOICE = 'COMPANION_VOICE', // 동승자 목소리
//     VEHICLE_SOUND_EFFECT = 'VEHICLE_SOUND_EFFECT', // 차량음
// }

export interface Reflection {
    created_at: string;
    event_title: string;
    failed_response: string;
    id: number;
    nick_name: string;
    reflection_text: string;
    session_id: string;
    // 작년 차량 전용 전시 '2025-car' / 올해 확장 전시 '2026-ambient' (구버전 서버 응답에는 없음)
    edition?: string;
    status?: string;
    payload?: unknown;
}

// 2026 엔딩 일기 payload.emotion_places — 카메라가 본 실제 방문 순서대로 표정별 머문 초 + 그 장소에서 한 일 (2026-10-09)
export type EmotionKey = "joy" | "surprise" | "neutral" | "anger";
export interface EmotionPlace {
    location_id: string;
    name: string;
    seconds: Partial<Record<EmotionKey, number>>;
    dominant: EmotionKey | "";
    tasks: string[];
}