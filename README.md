# zer01ne-future-car-client

FutureCar UX 시나리오 데모의 **프론트엔드**. 차량 내 UX 시나리오를 단계별로 재생하고,
음성/WebSocket으로 백엔드(FastAPI)와 상호작용하는 Next.js 앱.

- 운영: **https://ftcar.org**
- 백엔드: [zer01ne-future-car-server](https://github.com/ansunny1170/zer01ne-future-car-server) (`https://api.ftcar.org`)

## 스택

- **Next.js 15.5.x** (App Router) · **React 19** · **TypeScript**
- 패키지 매니저: **yarn 4** (Corepack) — ⚠️ npm 사용 금지
- @tanstack/react-query · axios · framer-motion · lottie-react · Tailwind CSS

## 로컬 개발

```bash
corepack enable      # 최초 1회 (yarn 4 활성화)
yarn install
yarn dev             # http://localhost:3000
```

빌드 확인:
```bash
yarn build && yarn start
```

## 환경변수

`.env.local` (운영은 Vercel 환경변수):

| 변수 | 의미 |
|---|---|
| `NEXT_PUBLIC_API_URL` | 백엔드 REST 베이스 URL (운영: `https://api.ftcar.org`) |
| `NEXT_PUBLIC_IS_PRD` | `"true"`면 운영 모드 (wss/fetch가 api.ftcar.org로 분기) |

> `NEXT_PUBLIC_*`는 **빌드 시점에 코드에 박힙니다.** 값 변경 시 재배포 필요.

## 주요 라우트

- `/` 메인 · `/left`·`/right` 차량 시나리오 · `/review` 엔딩 리플렉션

## 사용법 (시나리오 실행)

메인 페이지(`/`)에서 **키보드**로 조작합니다.

| 키 | 동작 |
|---|---|
| `S` | **시작 / 다음 단계 진행** (음성 "시작하자" 입력을 대체하는 트리거) |
| `1` ~ `4` | 질문 **선택지 선택** (선택지가 다 표시된 뒤) |
| `S` (완료 화면) | 처음으로 **재시작** |

1. **https://ftcar.org** 접속 (메인 = 시나리오 화면)
2. **`S` 키**로 시작 → 백엔드가 프롬프트(DB→S3)를 불러와 진행
3. 질문이 뜨면 **`1`~`4`** 로 응답
4. 엔딩은 **`/review`** 에서 확인

> - `S` 키가 마이크 음성 대신 기본 코멘트로 트리거하므로 마이크 없이 테스트 가능.
> - 좌측 상단 디버그 UI: **현재 step 버튼**(누르면 이전 step), **"step info 디버깅"**(현재 단계 JSON).
> - 동작하려면 **백엔드(api.ftcar.org)가 살아 있어야** 합니다.

## 문서

- 프로젝트 컨텍스트/함정: [CLAUDE.md](CLAUDE.md)
- 변경·배포 이력: [CHANGELOG.md](CHANGELOG.md)

---

## 개발자 배포 가이드 (로컬 → 운영)

호스팅은 **Vercel**이며 GitHub `main` 브랜치에 **push하면 자동 배포**됩니다.

1. **작업 브랜치에서 개발** 후 커밋
   ```bash
   git switch -c feature/my-work
   # ...작업...
   git commit -m "feat: ..."
   ```
2. **`main`에 병합** 후 push → Vercel이 자동으로 빌드·배포
   ```bash
   git switch main && git merge feature/my-work
   git push origin main
   ```
3. **Vercel 대시보드**에서 배포 상태가 **Ready(초록)** 인지 확인
4. **롤백**이 필요하면 Vercel → Deployments → 이전 배포 → Redeploy

### 배포 전 체크리스트
- [ ] `yarn.lock`을 **yarn 4**로 생성·커밋했는가 (CI `--immutable` 통과용)
- [ ] `next` 버전이 **보안 패치 버전**인가 (Vercel은 취약 버전 배포를 차단함)
- [ ] 로컬에서 `yarn build`가 성공하는가

### Vercel 환경변수 (운영 프로젝트)
| Key | Value |
|---|---|
| `ENABLE_EXPERIMENTAL_COREPACK` | `1` (yarn 4 사용) |
| `COREPACK_ENABLE_DOWNLOAD_PROMPT` | `0` (CI 비대화형 다운로드) |
| `NEXT_PUBLIC_API_URL` | `https://api.ftcar.org` |
| `NEXT_PUBLIC_IS_PRD` | `true` |

> Git push 인증은 `ansunny1170` 계정 자격증명을 사용합니다.
