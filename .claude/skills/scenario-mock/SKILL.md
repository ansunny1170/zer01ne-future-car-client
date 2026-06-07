---
name: scenario-mock
description: Use when developing a UI/timeline change without the backend, or when reproducing a reported bug from a captured /scenario response. Shows how to inject a StepInfo directly into SceneContext to bypass the API. Trigger on phrases like "백엔드 없이", "mock scenario", "stepInfo 주입", "API 없이 테스트", "타임라인 직접 테스트", "reproduce bug with payload".
---

# Bypassing the `/scenario` API for local development

The kiosk's UI is fully driven by a single `StepInfo` object stored in `SceneContext`. Any UI flow can be reproduced by pushing a hand-crafted `StepInfo` into the context — no backend required.

## Method 1: Temporary mock in `Step0`

The fastest way. `app/components/steps/step0.tsx` already has the entry point — replace the API call with a literal:

```tsx
// step0.tsx
const handleSpeechTrigger = async (ttsText: string) => {
  const session_id = new Date().getTime().toString();
  setSessionId(session_id);

  // 👇 Replace processSpeech() with a literal StepInfo for local testing
  const mock: StepInfo = {
    step: 2,
    name: "test",
    requires_location_change: false,
    bgv: { type: AssetsType.VIDEO, description: "", file_name: "bg9.mp4" },
    bgm: { type: AssetsType.MUSIC, description: "", file_name: "kpop_witu.mp3" },
    assets_timeline: [
      { parallel: false, assets: { type: AssetsType.CLONE_TALKS, text: "안녕하세요." } },
      { parallel: false, assets: { type: AssetsType.DEFAULT_POPUP, description: "테스트 팝업", subtext_popup: "서브", id: 1 } },
    ],
    question: "다음으로 무엇을 할까요?",
    choices: [
      { usp: "A", description: "선택 A" },
      { usp: "B", description: "선택 B" },
      { usp: "C", description: "선택 C" },
    ],
  };

  setStepInfo(mock);
  goNextStep();
};
```

**Important**: `choices.length` is always 3 in production. Match that.

## Method 2: DevTools console injection

If you don't want to edit code, expose `setStepInfo` to the global window during development. Add to `scene-context.tsx` inside `SceneProvider`:

```ts
useEffect(() => {
  if (typeof window !== "undefined" && !IS_PRD) {
    (window as any).__setStepInfo = setStepInfo;
    (window as any).__getStepInfo = () => stepInfo;
  }
}, [stepInfo]);
```

Then in DevTools:
```js
__setStepInfo({ step: 3, ...yourPayload });
```

⚠️ **Remove this before merging** — it's a debug-only escape hatch. Wrap it in `if (!IS_PRD)` and consider gating with `process.env.NODE_ENV === "development"` for extra safety.

## Method 3: Capture a real response and replay

To reproduce a reported bug from a real `/scenario` response:

1. Open the network tab during a real session and copy the JSON payload from `/scenario`.
2. Save it to a temp file (e.g., `.local/captured-step3.json`, gitignored).
3. Either inline it via Method 1, or build a tiny replay button:

```tsx
// somewhere in Step0 or a debug-only component:
import captured from "../../.local/captured-step3.json";

<button onClick={() => { setStepInfo(captured as StepInfo); goNextStep(); }}>
  Replay step 3
</button>
```

## Validating the mock

A valid `StepInfo` mock for testing should:
- ✓ Have `step` set (1–7) — the page.tsx switch uses this
- ✓ Have `requires_location_change: false` (always — backend never sets true)
- ✓ Use `AssetsType.*` enum values, not raw strings, so TypeScript catches typos
- ✓ Match the discriminated `Assets` union exactly — extra fields are ignored, missing required fields cause renderContent() to silently no-op
- ✓ Provide `bgm.file_name` and `bgv.file_name` from `app/utils/constants.ts:bgmDict` / `bgvDict` if you want media to play (otherwise context picks a random fallback)

## What NOT to do

- ❌ Don't mock by editing `app/api/speech/index.ts` — other developers will pull broken API code.
- ❌ Don't commit `.local/*.json` capture files (add `.local/` to `.gitignore` if not present).
- ❌ Don't bypass `useSpeechProcessing` and call `axios` directly — the global mutex matters even in dev.
- ❌ Don't mock `step: 7` if you also want to test `reStart()` — step 7 triggers it from `QuestionArea` automatically.
