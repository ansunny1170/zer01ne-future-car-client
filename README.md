# zer01ne-future-car-client

FutureCar UX 시나리오 데모의 **프론트엔드**. 차량 내 UX 시나리오를 단계별로 재생하고,
음성/WebSocket으로 백엔드(FastAPI)와 상호작용하는 Next.js 앱.

> ⚠️ **2026-10-03 운영 종료.** Vercel(`ftcar.org`)·EC2(`api.ftcar.org`)·AWS S3 를 내리기로 했고(2026-10-03 결정),
> 지금은 **로컬에서 필요할 때 켜는** 방식이다.

- 백엔드: [zer01ne-future-car-server](https://github.com/ansunny1170/zer01ne-future-car-server) — 로컬 실행·데이터 복원은 서버 레포 `docs/LOCAL-RUN.md`

## 스택

- **Next.js 15.5.x** (App Router) · **React 19** · **TypeScript**
- 패키지 매니저: **yarn 4** (Corepack) — ⚠️ npm 사용 금지
- @tanstack/react-query · axios · framer-motion · lottie-react · Tailwind CSS

## 로컬 실행 (main)

로컬 포트는 라인별로 고정이다 — **main = 서버 4100 · 클라 4101**, main-2026 = 4000 · 4001.
서버(:4100)와 로컬 S3(:9100)가 먼저 떠 있어야 한다 → 서버 레포 README 참고.

### 워크스페이스 스크립트로 (권장)

`futurecar-workspace` 루트에서:

```bash
./run-server.sh main      # 서버 :4100 (+ MySQL·로컬 S3 자동 기동)
./run-client.sh main      # 클라 http://localhost:4101
```

### 레포만으로

```bash
corepack enable      # 최초 1회 (yarn 4 활성화)
yarn install
yarn dev --port 4101 # http://localhost:4101
```

빌드 확인:
```bash
yarn build && yarn start --port 4101
```

## 환경변수

`.env.local` (로컬 main 기준 값):

| 변수 | 의미 |
|---|---|
| `NEXT_PUBLIC_API_URL` | 백엔드 REST/WS 베이스 URL — `http://localhost:4100/` |
| `NEXT_PUBLIC_IS_PRD` | `"true"`면 운영 모드 |
| `NEXT_PUBLIC_S3_BASE` | 미디어(bgv/bgm/sfx) 기준 주소 — `http://localhost:9100/ftcar` (미설정 시 예전 AWS S3, 지금은 동작 안 함) |

> `NEXT_PUBLIC_*`는 **빌드 시점에 코드에 박힙니다.** 값을 바꾸면 dev 서버 재시작(빌드본은 재빌드) 필요.

## 주요 라우트

- `/` 메인 · `/left`·`/right` 차량 시나리오 · `/review` 엔딩 리플렉션 (좌: 상세, 우: 목록 — 좌하단 `total` 은 DB 전체 건수)

## 사용법 (시나리오 실행)

메인 페이지(`/`)에서 **키보드**로 조작합니다.

| 키 | 동작 |
|---|---|
| `S` | **시작 / 다음 단계 진행** (음성 "시작하자" 입력을 대체하는 트리거) |
| `1` ~ `4` | 질문 **선택지 선택** (선택지가 다 표시된 뒤) |
| `S` (완료 화면) | 처음으로 **재시작** |

1. **http://localhost:4101** 접속 (메인 = 시나리오 화면)
2. **`S` 키**로 시작 → 백엔드가 프롬프트(DB→S3)를 불러와 진행
3. 질문이 뜨면 **`1`~`4`** 로 응답
4. 엔딩은 **`/review`** 에서 확인

> - `S` 키가 마이크 음성 대신 기본 코멘트로 트리거하므로 마이크 없이 테스트 가능.
> - 좌측 상단 디버그 UI: **현재 step 버튼**(누르면 이전 step), **"step info 디버깅"**(현재 단계 JSON).
> - 동작하려면 **로컬 백엔드(:4100)와 로컬 S3(:9100)가 떠 있어야** 합니다.

## 문서

- 프로젝트 컨텍스트/함정: [CLAUDE.md](CLAUDE.md)
- 변경·배포 이력: [CHANGELOG.md](CHANGELOG.md)

---

## (종료) 개발자 배포 가이드 (로컬 → 운영)

> 2026-10-03 Vercel 을 내리는 중이므로 아래 절차는 **기록용**이다. 다시 공개 운영할 때 참고.

호스팅은 **Vercel**이었고 GitHub `main` 브랜치에 **push하면 자동 배포**됐습니다.

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
