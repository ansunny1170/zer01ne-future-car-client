---
name: add-assets-type
description: Use when adding a new AssetsType enum value to the assets_timeline system (e.g., a new "WEATHER_POPUP" or "AMBIENT_VOICE" asset). Walks through every file that must be updated so the new type is correctly typed, rendered, and progressed through the step. Trigger on phrases like "새 asset type", "add asset type", "AssetsType 추가", "새 팝업 종류", "새로운 타임라인 에셋".
---

# Adding a new `AssetsType`

Adding an asset type is **not** a single-file change. The discriminated union is consumed in 4+ places and missing one creates silent runtime bugs (the timeline gets stuck or skips the asset).

## Steps in order

### 1. Define the type in `app/type/index.ts`

a. Add the enum member to `AssetsType`:
   ```ts
   export enum AssetsType {
     // ...existing...
     NEW_THING = 'NEW_THING',
   }
   ```

b. Add an interface that matches the backend payload:
   ```ts
   export interface NewThing {
     type: AssetsType.NEW_THING,
     description: string,
     // ...other fields the backend sends...
   }
   ```

c. Add it to the `Assets` union:
   ```ts
   export type Assets = CloneTalks
     | DefaultPopup
     // ...
     | NewThing
   ```

### 2. Classify the type as Visual, USP-Pool, or Audio

In **both** `app/components/steps/step-repeat.tsx` and `app/components/steps/step-complete.tsx`, locate the boolean classification near the top of the timeline `useEffect`:

```ts
const isAudioAsset  = asset?.type === "VEHICLE_SOUND_EFFECT" || asset?.type === "COMPANION_VOICE";
const isVisualAsset = asset?.type === "CLONE_TALKS" || asset?.type === "DEFAULT_POPUP" || ...;
const isUspPoolAsset = asset?.type === "FUNCTION_POPUP";
```

Add the new type to the right group. **Both files must be updated** — they diverge but the classification rule is shared.

### 3. Render the asset in `renderContent()`

In `step-repeat.tsx` (and `step-complete.tsx` if shown there), add a branch in `renderContent()`:

```ts
if (asset?.type === "NEW_THING") {
  return (
    <YourNewComponent
      key={currentIdx}
      data={asset.description}
      onComplete={() => {
        setTimeout(() => setCurrentIdx(idx => idx + 1), POPUP_COMPLETE_DELAY);
      }}
    />
  );
}
```

Rules for the new component:
- It MUST call `onComplete` exactly once (or rely on a timer in `step-repeat.tsx`).
- It MUST NOT call `setCurrentIdx` directly — only via `onComplete`.

### 4. (If audio) Preload it

If the new type carries a `file_name` for audio playback, extend `preloadAudioAssets()` in `step-repeat.tsx`:

```ts
if ((asset?.type === "VEHICLE_SOUND_EFFECT"
  || asset?.type === "COMPANION_VOICE"
  || asset?.type === "NEW_THING") && asset.file_name) {
  audioFiles.add(asset.file_name);
}
```

Also extend `getConsecutiveAudioItems()` similarly.

### 5. Verify with `/typecheck`

The discriminated union will surface most missing branches as type errors. Run `/typecheck` and fix until clean.

### 6. Smoke-test

- Inject a mock `stepInfo` containing the new asset (see `/scenario-mock` skill).
- Verify the timeline advances past the new asset.
- Verify `currentIdx` doesn't get stuck (most common failure mode).

## Common mistakes to avoid

- ❌ Adding to `step-repeat.tsx` only — `step-complete.tsx` will hang on the new asset at step 7.
- ❌ Forgetting to add to the `Assets` union — the type narrows to `never` silently.
- ❌ Calling `onComplete` inside a `useEffect` without checking it exists — older callers may pass `undefined`.
- ❌ Using `setCurrentIdx(currentIdx + 1)` instead of the functional form — see CLAUDE.md rule #1.
