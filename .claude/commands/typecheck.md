---
description: Run TypeScript strict type-check (no emit) and report errors
allowed-tools: Bash(npx tsc:*), Bash(yarn tsc:*), Read
---

이 프로젝트에는 테스트 슈트가 없으므로 `tsc --noEmit`이 가장 중요한 코드 헬스 체크입니다.

다음 단계로 진행하세요:

1. `npx tsc --noEmit` 실행
2. 에러가 있으면:
   - 각 에러를 `file:line:col` 형식으로 요약
   - `app/` 디렉토리 외부의 에러는 무시 (Next.js 생성 파일)
   - `any` 타입을 도입하지 말고 정확한 타입으로 수정 제안
3. 에러가 없으면 한 줄로 "타입 체크 통과"라고 보고

**주의사항**:
- `eslint.ignoreDuringBuilds`가 `next.config.ts`에 켜져 있으므로 빌드는 타입 에러를 잡지 못합니다 — 이 명령이 1차 방어선입니다
- `@/` alias는 `app/` 디렉토리로 매핑됩니다 (`tsconfig.json:paths`)
- `app/type/index.ts`의 `StepInfo`/`AssetsType`이 변경되면 `StepRepeat`/`StepComplete`/`scene-context`에 폭넓은 영향이 있습니다
