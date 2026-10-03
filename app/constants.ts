// 미디어(bgv/bgm/sfx) 기준 주소.
//   로컬: 로컬 S3 호환 저장소 → .env.local 의 NEXT_PUBLIC_S3_BASE (예: http://localhost:9100/ftcar)
//   미설정 시 예전 AWS S3 주소(2026-10 AWS 철수 후에는 동작 안 함)
// ⚠️ NEXT_PUBLIC_* 는 빌드 시점에 번들로 박제된다.
export const BASE_S3_LINK =
    process.env.NEXT_PUBLIC_S3_BASE || "https://ftcar.s3.ap-northeast-2.amazonaws.com"
export const BASE_API_LINK = `${process.env.NEXT_PUBLIC_API_URL}`
export const IS_PRD = process.env.NEXT_PUBLIC_IS_PRD === "true"

// 키보드 없이 STT 결과를 서버로 보내기 위한 window 커스텀 이벤트.
// Speech 컴포넌트가 듣고, 개발자 패널 버튼이 쏜다.
// S 길게 누르기를 흉내 내는 방식은 전송 뒤 남는 keyup 이 녹음을 재시작시켜 못 쓴다.
export const SPEECH_SUBMIT_EVENT = "ftcar:speech-submit"