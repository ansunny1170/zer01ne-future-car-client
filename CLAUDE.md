# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn dev      # start dev server (localhost:3000)
yarn build    # production build (ESLint errors ignored — see next.config.ts)
yarn lint     # run ESLint
```

There are no tests. The package manager is **Yarn 4** (`yarn@4.4.1`); do not use npm or pnpm.

## Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL (e.g. `https://dev.ftcar.org` or `https://api.ftcar.org`) |
| `NEXT_PUBLIC_IS_PRD` | `"true"` for production; controls API/WebSocket hosts and debug UI |

## Path Alias

`@` resolves to the `app/` directory (configured in `next.config.ts` via webpack alias). Use `@/components/...`, `@/context/...`, etc.

## Architecture Overview

This is a **Next.js 15 / React 19** kiosk experience for Hyundai Motor Group ("Zero-One"), built as a linear multi-step interactive scenario driven by a conversational AI backend.

### Two Routes

- `/` — the main interactive experience
- `/review` — a real-time reflection display (WebSocket + REST from `ftcar.org`)

### Central State: `SceneContext` (`app/context/scene-context.tsx`)

`SceneProvider` wraps the entire app and is the single source of truth for:

- `stepNumber` / `stepInfo` — current step index and full scenario data from the API
- `videoPath`, `bgmPath`, `sfxPath` — active media paths
- `sessionId` — groups API calls per session
- `preloadedAudio` — `Map<string, HTMLAudioElement>` shared between StepRepeat and the audio player
- `BroadcastChannel("my-channel")` — syncs state across browser tabs

### Step Flow

```
stepNumber=0  → Step0      (intro; fires first API call, then goNextStep)
stepNumber=1  → Step1      (speech UI for trip input)
stepNumber=2-5 → StepRepeat (generic step; driven by stepInfo from API)
stepNumber=6  → StepRepeat (outro speech)
stepNumber=7  → StepComplete (end screen; S/ㄴ key restarts)
```

`renderStep()` in `app/page.tsx` switches on `stepInfo?.step`, not `stepNumber`.

### API Layer (`app/api/speech/index.ts`)

Single endpoint: `POST /scenario`

```ts
{ session_id: string, user_message: string, is_new_session: boolean }
→ SpeechResponse { success, message, data: StepInfo }   // type
```

`useSpeechProcessing` (`app/hooks/useSpeechProcessing.ts`) wraps this with TanStack Query and a global mutex flag to prevent concurrent submissions.

> ⚠️ The TS type and the runtime usage diverge: call sites do `setStepInfo(response as unknown as StepInfo)` (i.e. cast the whole response, not `response.data`). When adding new call sites, match the existing pattern. Details: `.claude/rules/api.md`.

### `StepInfo` Type (`app/type/index.ts`)

The API response `data` field is typed as `StepInfo`. Key fields:

- `step` (1–7) — which step UI to render
- `bgv` / `bgm` / `sfx` — media file names served from S3
- `assets_timeline[]` — ordered list of UI/audio events to play sequentially
- `question` + `choices[]` — shown after the timeline completes
- `path_state` — routing state (not directly rendered)

### Timeline System (`StepRepeat`, `StepComplete`)

`assets_timeline` is processed sequentially by index (`currentIdx`). Each item's `assets` is a single discriminated-union object typed by `AssetsType`:

| Type | Rendered as |
|---|---|
| `CLONE_TALKS` | `CloneTalkSplit` — typewriter text; advances on `onComplete` |
| `DEFAULT_POPUP` / `TRIGGER_POPUP` | `CommonPopupUI` — image popup; advances on `onComplete` |
| `HUD_POPUP` | `HudLayer` — HUD overlay |
| `FUNCTION_POPUP` | `UspPopupWrapper` — USP feature cards, timed |
| `VEHICLE_SOUND_EFFECT` / `COMPANION_VOICE` | Audio only; audio element loaded from preload map |

After the timeline finishes, `questionFlag` becomes `true` and `QuestionArea` / `QuestionButtons` appear. The user speaks (Web Speech API, Korean `ko-KR`) via the `Speech` component.

### Media

- **Background video**: `StepVideoPlayer` plays `videoPath` (a filename served from S3 `future-car` bucket: `BASE_S3_LINK`).
- **BGM**: `StepAudioPlayer` plays `bgmPath` in a loop at 0.5 volume; volume drops to 0.22 while mic is active.
- **SFX**: also via `StepAudioPlayer`; file names come from `sfxPath` in context. Audio files are preloaded in `StepRepeat.preloadAudioAssets()` at step start.

### Keyboard Controls (demo kiosk)

`S` key (also maps to Korean `ㄴ`):
- First press → starts mic recording
- Subsequent short press → restarts recording
- Long press (≥1200 ms) → submits recorded text
- `Space` → submits `defaultComment` (hardcoded demo phrase) without mic

### Fonts

`HyundaiSansUI_JP_KR_Latin` is the primary font (loaded as `--font-hyundai` CSS variable). Tailwind's `font-sans` defaults to it.

### `reactStrictMode: false`

Strict mode is intentionally disabled. Many timeline effects rely on single-fire `useEffect` semantics and would double-trigger under strict mode.

## Project-Wide Invariants

These apply everywhere in this repo. Topic-specific rules live in `.claude/rules/` and load only when Claude reads matching files.

- **No tests.** Don't add test runners, test configs, or `*.test.*` files. The kiosk is validated by hand.
- **`reactStrictMode: false`** is intentional (see above). Don't flip it.
- **Don't `git commit` to `main`/`master`.** The PreToolUse hook in `.claude/settings.json` blocks it.
- **Don't restructure `app/components/steps/`.** The `Step0 / Step1 / StepRepeat / StepComplete` split is the contract with `app/page.tsx:renderStep()`.
- **Korean comments are intentional.** Don't translate or strip existing Korean comments — they encode product intent (e.g. the `❌사용하지 않습니다` markers in `StepInfo`).
- **Don't bulk-remove `console.log`s.** They are demo/QA instrumentation. New code can omit them.

## Where to find more rules

- `.claude/rules/timeline.md` — when editing `step-repeat.tsx`, `step-complete.tsx`, or `scene-context.tsx`
- `.claude/rules/api.md` — when editing `app/api/**` or `app/hooks/use*.ts`
- `.claude/rules/popup-ui.md` — when editing `app/components/ui/popup_ui/**`
- `.claude/rules/react-conventions.md` — for any `.tsx` / `.ts` file under `app/`

Skills (loaded on demand by Claude when relevant):
- `add-assets-type` — adding a new `AssetsType` enum value
- `add-popup-keyname` — registering a new popup keyName
- `step-debug` — diagnosing timeline / audio / playback bugs
- `scenario-mock` — driving the UI without the backend
