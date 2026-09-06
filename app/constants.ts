// 미디어(bgv/bgm/sfx) 기준 주소. 환경별로 저장소가 다르다.
//   main(classic)  : AWS S3 (env 미설정 시 이 기본값)
//   main-2026(전시) : Mac Studio MinIO → NEXT_PUBLIC_S3_BASE 로 주입
// ⚠️ NEXT_PUBLIC_* 는 빌드 시점에 번들로 박제된다. 컨테이너 런타임 env 로는
//    반영되지 않으니 Dockerfile ARG + CI --build-arg 로 넣어야 한다.
export const BASE_S3_LINK =
    process.env.NEXT_PUBLIC_S3_BASE || "https://ftcar.s3.ap-northeast-2.amazonaws.com"
export const BASE_API_LINK = `${process.env.NEXT_PUBLIC_API_URL}`
export const IS_PRD = process.env.NEXT_PUBLIC_IS_PRD === "true"

// ─────────────────────────────────────────────────────────────────────────
// /ambient 대기(standby) 화면 — exit ~ 다음 enter, plan 만 온 idle, 세션 없음 — 에서 무한 반복할 영상.
// 기본값은 여기(코드). 현장에서는 /ambient dev 패널(⌘+Shift+D)의 "대기 영상" 에서 바꾸면 그 브라우저의
// localStorage(STANDBY_VIDEO_STORAGE_KEY)에 저장돼 즉시 반영되고 재부팅 뒤에도 유지된다. 비우면 기본값.
// 미디어 저장소(MinIO) 의 파일명 또는 절대 URL.
// ─────────────────────────────────────────────────────────────────────────
export const STANDBY_VIDEO = "en6.mp4"
export const STANDBY_VIDEO_STORAGE_KEY = "ftcar_standby_video"

// /ambient 발화 전송 딜레이(ms) 현장 설정 — dev 패널에서 바꾸면 이 키로 localStorage 에 저장된다.
// 값이 없으면 useCarListener 의 기본(SEND_DELAY_MS, 2초)을 쓴다.
export const SEND_DELAY_STORAGE_KEY = "ftcar_send_delay_ms"
export function resolveMediaUrl(nameOrUrl: string): string {
    return /^https?:\/\//.test(nameOrUrl) ? nameOrUrl : `${BASE_S3_LINK}/${nameOrUrl}`
}
