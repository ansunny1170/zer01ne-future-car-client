export interface PopUI {
    key_name: string;
}

export interface Asset {
    bg: string;
    bgm: string;
    sfx: string;
    pop_ui: PopUI[];
}

export interface Choice {
    id: string;
    text: string;
    asset: Asset;
}

export interface AssetItem {
    id: string;
    text: string;
    asset: Asset;
}

export interface StepInfo {
    narrative: string;
    question_id: string;
    assets: AssetItem[];
    question: string;
    choices: Choice[];
    현재_단계: string | null;
    epilogue: string | null;
}
