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
}
export interface BackgroundVideo {
    type: AssetsType.VIDEO,
    description: string,
    file_name: string,
}
export interface BackgroundMusic {
    type: AssetsType.MUSIC,
    description: string,
    file_name: string,
}
export interface CloneTalks {
    type: AssetsType.CLONE_TALKS,
    text: string,
}
export interface DefaultPopup {
    type: AssetsType.DEFAULT_POPUP,
    description: string,
    subtext_popup: string,
    id: number,
}
export interface TriggerPopup {
    type: AssetsType.TRIGGER_POPUP,
    description: string,
    subtext_popup: string,
    id: number,
}
export interface FunctionPopup {
    type: AssetsType.FUNCTION_POPUP,
    description: string,
}
export interface HudPopup {
    type: AssetsType.HUD_POPUP,
    description: string,
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
export type Assets = CloneTalks 
  | DefaultPopup 
  | TriggerPopup
  | FunctionPopup
  | HudPopup
  | VehicleSoundEffect 
  | CompanionVoice
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
    passenger_state?: PassengerState, // ❌사용하지 않습니다. 참고만 해주세요.
    bgv?: BackgroundVideo, // ✅ 사용하는 데이터입니다. 배경 영상입니다.
    bgm?: BackgroundMusic, // ✅ 사용하는 데이터입니다. 배경 음악입니다.
    sfx?: VehicleSoundEffect, // ✅ 사용하는 데이터입니다. 효과음입니다.
    assets_timeline?: AssetsTimeline[], // 화면 출력용 UI정보입니다. 0번째 부터 순서대로 출력합니다.
    requires_location_change: boolean, // ❌사용하지 않습니다. 위치 상태 값입니다.
    question?: string, // ✅ 사용하는 데이터입니다. 선택지의 질문입니다.
    choices?: Choice[], // ✅ 사용하는 데이터입니다. 선택지입니다. choices의 배열길이는 항상 3입니다.
    path_state?: PathState, // ✅ 사용하는 데이터입니다. 경로 상태입니다.
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
}