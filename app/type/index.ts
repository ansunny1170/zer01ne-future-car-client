export interface QuestionContent {
    main_text: string;
    sub_text: string;
}

export interface Question {
    title: string;
    subtitle: string | null;
    content: QuestionContent[];
}

export interface StepInfo {
    ui: string | null;
    bgm: string | null;
    sfx: string | null;
    video: string | null;
    text?: string;
    question: Question | null;
}
