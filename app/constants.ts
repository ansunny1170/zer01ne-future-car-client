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
// ★ 바꾸려면 아래 파일명만 고치고 커밋·푸시 (CD 가 배포). 미디어 저장소(MinIO) 의 파일명 또는 절대 URL.
// ─────────────────────────────────────────────────────────────────────────
export const STANDBY_VIDEO = "en6.mp4"
export const STANDBY_VIDEO_URL = /^https?:\/\//.test(STANDBY_VIDEO) ? STANDBY_VIDEO : `${BASE_S3_LINK}/${STANDBY_VIDEO}`
