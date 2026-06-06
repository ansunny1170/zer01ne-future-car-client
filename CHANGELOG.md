# Changelog

이 프로젝트의 주요 변경·배포 이력. 형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/),
버전은 [SemVer](https://semver.org/lang/ko/)를 따릅니다.

## [1.0.0] - 2026-06-06

첫 운영 배포 — **https://ftcar.org**

### 배포 (Deployed)
- **Vercel** 배포 + 커스텀 도메인 `ftcar.org`, `www.ftcar.org` 연결 (Route53, 자동 SSL)
- 운영 환경변수: `NEXT_PUBLIC_API_URL=https://api.ftcar.org`, `NEXT_PUBLIC_IS_PRD=true`

### Changed
- **Next.js `15.3.3` → `15.5.19`** — 보안 패치 (CVE-2025-66478). Vercel이 취약 버전 배포를 차단하여 업그레이드.
- yarn 4(Corepack) 빌드 호환: Vercel env `ENABLE_EXPERIMENTAL_COREPACK=1`, `COREPACK_ENABLE_DOWNLOAD_PROMPT=0`
- `yarn.lock`을 yarn 4로 재생성 (CI `--immutable` 설치 호환, YN0028 해결)

### Added
- 프로젝트 가이드 [CLAUDE.md](CLAUDE.md)
- 변경 이력 문서 (이 파일) 및 README 정비

[1.0.0]: https://github.com/ansunny1170/zer01ne-future-car-client/releases/tag/v1.0.0
