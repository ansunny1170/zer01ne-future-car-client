---
paths:
  - "app/components/steps/**/*.tsx"
  - "app/context/scene-context.tsx"
---

# Timeline / SceneContext rules

These files coordinate audio, video, popup, and step progression. They are the most fragile part of the codebase and have specific conventions:

## State updates

- **Always use the functional form when advancing `currentIdx`.** `setCurrentIdx(idx => idx + 1)` is correct; `setCurrentIdx(currentIdx + 1)` is a bug because timer callbacks capture stale `currentIdx`.
- **Don't merge the multiple `useEffect`s in `step-repeat.tsx` / `step-complete.tsx`.** The handlers are split by responsibility (audio, visual, FUNCTION_POPUP, empty-item, timeline-finished, audio-preload). Combining them re-introduces the race conditions the split fixed.
- **Reset side effects in `reStart()`.** Any new field on `SceneContext` must be cleared in `reStart()`; otherwise stale state leaks into the next session.

## Timers and cleanup

- **Every `setTimeout` inside a `useEffect` needs a matching `clearTimeout` in the cleanup return.** No exceptions. Overlapping audio playback when stepInfo changes mid-step is the historical bite.
- **`audioTimersRef.current.playTimer` and `progressTimer` MUST both be cleared** in any new audio handler, not just one.
- **Reset `setOnSfxComplete(undefined)` when transitioning between asset types.** A previous step's pending callback can fire after stepInfo changes if you forget.

## Asset type discrimination

- `assets_timeline[i].assets` is a **single object**, not an array. Don't index `assets[0]`.
- New `AssetsType` cases must be added in **both** `step-repeat.tsx` AND `step-complete.tsx`. They diverge in which types they handle (StepRepeat handles `HUD_POPUP` and audio preloading; StepComplete does not), but the classification rule is shared.
- Use `asset?.type === "..."` for narrowing, not truthy property checks.

## Audio preloading

- All audio files used by an `assets_timeline` are preloaded in `StepRepeat.preloadAudioAssets()` at step start. New audio asset types must be added there AND in `getConsecutiveAudioItems()`.
- The `preloadedAudio` ref is shared via `SceneContext.setPreloadedAudio` so the audio player can resolve cached `HTMLAudioElement` instances by `file_name`.
- When stepInfo changes, the previous Map must be paused and cleared (`audio.pause(); audio.src = ''`). Skipping this leaks audio elements.
- Audio playback waits for `audio.duration > 0` via `waitForDurationAndPlay()` retry loop. Don't assume duration is immediately available.

## StepInfo contract

- `StepInfo` is the contract with the backend (`POST /scenario` response). Most fields are optional — handle the absent case.
- Never widen `StepInfo` for frontend convenience. If the backend doesn't send a field, derive it locally instead.
- `path_state` exists in the type but is not rendered today. Don't add UI that depends on it without checking with the backend team.

## BroadcastChannel

- `SceneContext` posts `{ senderId, sceneNumber, category, categoryNumber, stepNumber }` to the `"my-channel"` BroadcastChannel on every state change. This is for cross-tab sync (kiosk has multiple display tabs).
- Don't add new fields to the channel payload without coordinating with subscribers.

## Anti-patterns specific to this file group

- ❌ Never call `setCurrentIdx` from inside a render function — only from effects or event handlers.
- ❌ Never put `setStepInfo` inside an effect that depends on `stepInfo` — infinite loop.
- ❌ Don't call `useScene()` outside the `SceneProvider` tree.
- ❌ Don't add a parallel state store (Zustand, Redux, etc.). `SceneContext` is the single source of truth.
