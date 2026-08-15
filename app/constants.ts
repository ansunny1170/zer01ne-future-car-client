export const BASE_S3_LINK = "https://ftcar.s3.ap-northeast-2.amazonaws.com"
export const BASE_API_LINK = `${process.env.NEXT_PUBLIC_API_URL}`
export const IS_PRD = process.env.NEXT_PUBLIC_IS_PRD === "true"

// 키보드 없이 STT 결과를 서버로 보내기 위한 window 커스텀 이벤트.
// Speech 컴포넌트가 듣고, 개발자 패널 버튼이 쏜다.
// S 길게 누르기를 흉내 내는 방식은 전송 뒤 남는 keyup 이 녹음을 재시작시켜 못 쓴다.
export const SPEECH_SUBMIT_EVENT = "ftcar:speech-submit"