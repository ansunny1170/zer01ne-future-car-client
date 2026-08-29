// 미디어(bgv/bgm/sfx) 기준 주소. 환경별로 저장소가 다르다.
//   main(classic)  : AWS S3 (env 미설정 시 이 기본값)
//   main-2026(전시) : Mac Studio MinIO → NEXT_PUBLIC_S3_BASE 로 주입
// ⚠️ NEXT_PUBLIC_* 는 빌드 시점에 번들로 박제된다. 컨테이너 런타임 env 로는
//    반영되지 않으니 Dockerfile ARG + CI --build-arg 로 넣어야 한다.
export const BASE_S3_LINK =
    process.env.NEXT_PUBLIC_S3_BASE || "https://ftcar.s3.ap-northeast-2.amazonaws.com"
export const BASE_API_LINK = `${process.env.NEXT_PUBLIC_API_URL}`
export const IS_PRD = process.env.NEXT_PUBLIC_IS_PRD === "true"

// /ambient 대기(standby: exit ~ 다음 enter, plan 만 온 idle, 세션 없음) 화면에서 무한 반복할 영상.
// 미디어 저장소의 파일명(예: "en6.mp4") 또는 절대 URL. 빌드 시점에 박제되므로 바꾸려면 재빌드.
// 빌드 시 기본값. 실제 전시 값은 컨테이너 런타임 env STANDBY_VIDEO 를 /api/ambient-config 가 돌려준다.
export const STANDBY_VIDEO = process.env.NEXT_PUBLIC_STANDBY_VIDEO || "en6.mp4"
export function resolveMediaUrl(nameOrUrl: string): string {
    return /^https?:\/\//.test(nameOrUrl) ? nameOrUrl : `${BASE_S3_LINK}/${nameOrUrl}`
}
export const STANDBY_VIDEO_URL = resolveMediaUrl(STANDBY_VIDEO)
