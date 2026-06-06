# CLAUDE.md — zer01ne-future-car-client

FutureCar UX 시나리오 데모의 프론트엔드. 차량 내 UX 시나리오를 단계별로 재생하고,
음성/WebSocket으로 백엔드(FastAPI)와 상호작용하는 Next.js 앱.

## 스택

- **Next.js 15.3.3** (App Router) + **React 19** + **TypeScript**
- 패키지 매니저: **yarn 4.4.1** (Corepack). npm 쓰지 말 것
- 상태/데이터: `@tanstack/react-query`, `axios`
- 애니메이션: `framer-motion`, `lottie-react`
- 스타일: Tailwind CSS 3.3

## 명령

```bash
yarn install      # 의존성 설치 (yarn 4)
yarn dev          # 개발 서버 (localhost:3000)
yarn build        # 프로덕션 빌드
yarn start        # 빌드 결과 실행
yarn lint         # ESLint (단, 빌드는 lint 무시하도록 설정됨)
```

## 환경변수

`.env.local` (로컬) / Vercel 환경변수에 설정:

| 변수 | 의미 |
|---|---|
| `NEXT_PUBLIC_API_URL` | 백엔드 REST 베이스 URL (예: `https://api.ftcar.org`) |
| `NEXT_PUBLIC_IS_PRD` | `"true"`면 운영 모드 (아래 함정 참고) |

## 디렉터리

- `app/` — App Router 루트. webpack alias `@` → `app/` ([next.config.ts](next.config.ts))
  - `components/` — 화면 구성요소 (scenes, steps, review, speech, video-player, ui 등)
  - `context/`, `hooks/`, `utils/`, `type/` — 공통 로직/타입
  - `api/speech/` — 음성 관련 API 클라이언트 (axios, baseURL = `BASE_API_LINK`)
  - `left/`, `right/`, `review/` — 주요 페이지
- `constants.ts` — 전역 상수 (S3 주소, API 주소, IS_PRD)

## ⚠️ 함정 / 주의

- **백엔드 주소가 코드에 하드코딩됨**: [app/review/page.tsx](app/review/page.tsx)에서
  WebSocket/fetch 주소가 `IS_PRD` 값으로 분기됨:
  - 운영(`IS_PRD=true`): `wss://api.ftcar.org/ws/...`, `https://api.ftcar.org/...`
  - 개발(`IS_PRD=false`): `wss://dev.ftcar.org/...`, `https://dev.ftcar.org/...`
  → 백엔드 도메인이 바뀌면 **`constants.ts`의 env뿐 아니라 이 하드코딩도 함께 확인**할 것.
- **S3 주소 고정**: `BASE_S3_LINK = https://future-car.s3.ap-northeast-2.amazonaws.com`
  ([constants.ts](app/constants.ts)). 버킷/리전 변경 시 수정 필요.
- `reactStrictMode: false`, 빌드 시 ESLint 무시(`ignoreDuringBuilds: true`) 설정돼 있음.

## 배포 (Vercel)

- 호스팅: **Vercel** (GitHub `ansunny1170/zer01ne-future-car-client` 연동)
- 도메인: `ftcar.org`, `www.ftcar.org`
- 운영 배포 시 env: `NEXT_PUBLIC_API_URL=https://api.ftcar.org`, `NEXT_PUBLIC_IS_PRD=true`
- 백엔드(FastAPI)는 Vercel이 아닌 별도 호스팅(Railway 예정). WebSocket이 상시 연결이라 서버리스 부적합.

## Git / 인증

- origin: `https://github.com/ansunny1170/zer01ne-future-car-client.git`
- 로컬 credential helper가 `ansunny1170` 계정으로 인증하도록 설정돼 있음
  (전역 gh 활성 계정과 무관하게 동작).
