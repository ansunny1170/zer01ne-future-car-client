---
name: step-debug
description: Use when diagnosing kiosk step-flow bugs — timeline gets stuck, audio overlaps or cuts out, BGM doesn't change, video keeps playing wrong file, currentIdx skips items, or the question UI never appears. Provides a structured triage checklist mapped to specific files. Trigger on phrases like "타임라인 멈춤", "오디오 안 들림", "step 안 넘어감", "currentIdx stuck", "audio overlap", "BGM 안 바뀜", "playback issue", "step transition broken".
---

# Step / Timeline / Playback Triage

Don't guess. Walk through this checklist and identify the failing layer first.

## Step 1: Identify the symptom

| Symptom | Most likely layer |
|---|---|
| `currentIdx` doesn't advance | Timeline processor in `step-repeat.tsx` |
| Same audio plays twice / overlaps | `audioTimersRef` cleanup missed, or stepInfo changed mid-step |
| Audio file silent (404 / load failure) | `preloadedAudio` Map; check `error` event in console |
| BGM doesn't change between steps | `scene-context.tsx` BGM `useEffect` (line ~74) |
| Video keeps playing previous step's clip | `videoPath` in `scene-context.tsx`; bgv fallback logic |
| Question UI never appears | `isTimelineFinished` / `questionFlag` race |
| Step 2 specifically is broken | Step 2 has special longer delay (see `step-repeat.tsx:113`) |
| Mic button does nothing on first press | `pressCount` state in `app/components/speech/index.tsx` |
| App restarts on `S` press in middle of step | `step-complete.tsx` global `S` keydown listener — only firing during step 7 |

## Step 2: Inspect the relevant ref/state

```ts
// In step-repeat.tsx:
currentIdx           // index into assets_timeline
isTimelineFinished   // memoized: currentIdx >= assets_timeline.length
questionFlag         // gates QuestionArea rendering
preloadedAudio.current  // Map<string, HTMLAudioElement>
audioTimersRef.current  // { playTimer, progressTimer }
```

```ts
// In scene-context.tsx:
stepInfo, sfxPath, bgmPath, videoPath
preloadedAudio (shared Map)
```

Add a console.log near the suspected line. The codebase already has many `console.log`s in step-repeat.tsx — use them as anchors.

## Step 3: Common root causes

### A. Stale closure on `currentIdx`

```ts
// 🐛 wrong — captures currentIdx at the time setTimeout was scheduled
setTimeout(() => setCurrentIdx(currentIdx + 1), 1000);

// ✅ right
setTimeout(() => setCurrentIdx(idx => idx + 1), 1000);
```

### B. Missing cleanup, overlapping audio

Search `step-repeat.tsx` for `setTimeout` and verify each one returns a `clearTimeout` in the `useEffect` cleanup. The audio handler at lines ~234–300 is the most fragile.

### C. `setOnSfxComplete` callback fires for the wrong step

When `stepInfo` changes, the previous step's pending `onSfxComplete` may still fire. The fix:
```ts
// Reset BEFORE doing new work
setOnSfxComplete(undefined);
```
The pattern is already in place at the top of the asset-classification effect — verify your change didn't remove it.

### D. `assets_timeline` is `undefined` vs `[]`

`isTimelineFinished` returns `true` for `undefined`, advancing to the question UI. If your test scenario has `assets_timeline: []`, check `currentIdx >= 0` always trips it. If your scenario has no `assets_timeline` field at all, ensure the question still appears (look at the `useEffect` at line ~95).

### E. Audio `duration` is 0 or NaN

`step-repeat.tsx` retries every 50ms via `waitForDurationAndPlay()` until `audio.duration > 0`. If the audio file is missing/404, this loops forever.

Check console for `❌ 오디오 preload 실패: <filename>` messages from `preloadAudioAssets`.

### F. `reactStrictMode` got accidentally enabled

`next.config.ts:5` must say `reactStrictMode: false`. If someone flipped it, every effect runs twice and the timeline progresses 2× per asset.

## Step 4: Reproduce in isolation

Use the `/scenario-mock` skill to inject a minimal `stepInfo` that contains only the failing asset, and confirm the bug reproduces with no backend in the loop. This separates "frontend timeline bug" from "weird API response" — most reported bugs turn out to be the latter.

## Step 5: After fixing

Run `timeline-reviewer` (the subagent in `.claude/agents/timeline-reviewer.md`) on the diff to verify you didn't reintroduce a known regression. The agent has a 6-item checklist tuned for this codebase.
