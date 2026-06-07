---
description: Trace how a given assets_timeline asset type is processed through the codebase
allowed-tools: Read, Grep, Glob
---

`$ARGUMENTS`에 지정된 `AssetsType` (예: `CLONE_TALKS`, `HUD_POPUP`, `FUNCTION_POPUP`)이 어떻게 처리되는지 추적하세요.

조사 순서:
1. `app/type/index.ts`에서 해당 타입의 인터페이스 정의 확인
2. `app/components/steps/step-repeat.tsx`에서 처리 분기 (어떤 useEffect, 어떤 우선순위)
3. `app/components/steps/step-complete.tsx`에서의 차이점
4. 렌더링되는 컴포넌트 (`CloneTalkSplit`, `CommonPopupUI`, `HudLayer`, `UspPopupWrapper` 등)
5. 진행 트리거 (`onComplete` 콜백, 타이머, `setCurrentIdx` 호출 위치)

다음 형식으로 보고:

```
타입: CLONE_TALKS
정의: app/type/index.ts:71-74
StepRepeat 처리: step-repeat.tsx:323 (renderContent의 CloneTalk 분기)
  → 우선순위: Visual (Audio보다 먼저)
  → 컴포넌트: CloneTalkSplit
  → 다음 진행: onComplete 후 CLONE_TALK_DELAY(1000ms)
StepComplete 차이: 동일 처리 (단, CloneTalk 사용)
잠재 위험: ...
```

타임라인 처리는 race condition이 발생하기 쉬우니 useEffect의 의존성 배열과 cleanup도 함께 봅니다.
