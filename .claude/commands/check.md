---
description: Run typecheck + lint + build sanity check (full code health pass)
allowed-tools: Bash(npx tsc:*), Bash(yarn lint:*), Bash(yarn build), Read
---

전체 코드 헬스 체크를 다음 순서로 수행하세요. 각 단계에서 실패하면 즉시 멈추고 사용자에게 보고합니다.

1. **Type check**: `npx tsc --noEmit`
2. **Lint**: `yarn lint`
3. **Build sanity**: `yarn build` (`$ARGUMENTS`에 `--skip-build`가 들어 있으면 이 단계는 건너뛰기)

각 단계의 결과를 다음 형식으로 보고:

```
✓ tsc        — pass
✓ lint       — 3 warnings (no errors)
✗ build      — failed at: <첫 번째 에러>
```

빌드는 시간이 오래 걸리므로 (~30-60s) 사용자가 짧은 검사만 원하면 `/check --skip-build`를 사용하도록 안내.
