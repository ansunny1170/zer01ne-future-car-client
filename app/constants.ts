// 미디어(bgv/bgm/sfx) 기준 주소. 환경별로 저장소가 다르다.
//   main(classic)  : AWS S3 (env 미설정 시 이 기본값)
//   main-2026(전시) : Mac Studio MinIO → NEXT_PUBLIC_S3_BASE 로 주입
// ⚠️ NEXT_PUBLIC_* 는 빌드 시점에 번들로 박제된다. 컨테이너 런타임 env 로는
//    반영되지 않으니 Dockerfile ARG + CI --build-arg 로 넣어야 한다.
export const BASE_S3_LINK =
    process.env.NEXT_PUBLIC_S3_BASE || "https://ftcar.s3.ap-northeast-2.amazonaws.com"
export const BASE_API_LINK = `${process.env.NEXT_PUBLIC_API_URL}`
export const IS_PRD = process.env.NEXT_PUBLIC_IS_PRD === "true"