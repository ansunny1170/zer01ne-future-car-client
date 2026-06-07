---
name: add-popup-keyname
description: Use when adding a new popup keyName entry (e.g., "WEATHER_ALERT", "FUEL_LOW") to the popupDict registry so the backend can trigger it via DEFAULT_POPUP / TRIGGER_POPUP / HUD_POPUP. Trigger on phrases like "팝업 추가", "popup 추가", "keyName 등록", "새 팝업 아이콘", "add popup", "새 popup type".
---

# Adding a new popup `keyName`

Backend sends `DEFAULT_POPUP` / `TRIGGER_POPUP` / `HUD_POPUP` assets with an `id` field. The frontend uppercases that `id` and looks it up in a dictionary to render the right icon, color, and default text. New popups need to be registered there.

## For DEFAULT_POPUP / TRIGGER_POPUP

Edit `app/components/ui/popup_ui/common.tsx`. Add an entry to `popupDict`:

```ts
const popupDict: { [key: string]: { ... } } = {
  // ...existing...
  WEATHER_ALERT: {
    icon: <Icons.alert />,        // pick from app/components/ui/icons.tsx
    type: "warm",                  // "warm" = warning/red, "cold" = info/blue
    defaultText: "기상 경보입니다.", // shown when backend doesn't override
    className: "",                 // rare; set "min-w-auto" for narrow popups
  },
};
```

**Field rules**:
- `icon`: Reference an existing icon from `Icons` (`app/components/ui/icons.tsx`). If none fits, add a new icon there first — don't inline SVG.
- `type`: `"warm"` for warnings/alerts, `"cold"` for informational/status. Drives the popup's gradient.
- `defaultText`: Korean is the default UI language. Used only when the backend payload's `description` is empty.
- `className`: Usually `""`. Use `"min-w-auto"` for compact single-line popups (CAR_OPEN, CAR_CLOSE).

**The `keyName` matching logic** (already in place, don't change):
```ts
const keyName = asset.id ? asset.id.toString().toUpperCase() : asset.type;
```
So if backend sends `id: "weather_alert"`, register `WEATHER_ALERT` (uppercase, underscored).

## For HUD_POPUP

Edit `app/components/ui/popup_ui/hud-popup.tsx`. The dict there has a **different shape** from `common.tsx`:

```ts
KEY_NAME: {
  name: "이 장소의 추억_1",       // internal label
  title: "이 장소의 추억...",     // shown in HUD header (Korean)
  image: "/assets/images/hud_KEY_NAME.png",  // path under /public/assets/images/
}
```

You also need to commit the corresponding image asset at `public/assets/images/hud_<KEYNAME>.png`. HUD popups render twice in mirrored 3D-skewed positions via `HudLayer` — design assets should look correct under `scaleX/scaleY/rotateY` transforms, not flat.

## For special-case popups

If the popup needs custom layout (e.g., `BRAKE_PAD` uses `BreakPadPopup` instead of `BasicPopupBox`):

1. Create a dedicated component in `app/components/ui/popup_ui/<name>-popup.tsx`.
2. Add a branch in `CommonPopupUI`:
   ```tsx
   keyName === 'YOUR_KEY' ? <YourPopup /> : <BasicPopupBox>...</BasicPopupBox>
   ```
3. Don't extend `popupDict` for this case — the entry would be ignored.

## Smoke test

Inject a stepInfo with the new popup:

```ts
{
  step: 3,
  assets_timeline: [{
    parallel: false,
    assets: { type: "DEFAULT_POPUP", description: "Test", subtext_popup: "sub", id: "weather_alert" }
  }]
}
```

Verify:
- ✓ Icon renders (not the fallback `<Icons.alert />`)
- ✓ Color matches `type` (warm/cold)
- ✓ Popup auto-dismisses after 3000ms (the timer in `CommonPopupUI`)
- ✓ Timeline advances to next item

## Common mistakes

- ❌ Lowercasing the keyName — it must match the uppercased `id`.
- ❌ Adding to `popupDict` for HUD_POPUP — those use a different dict in `hud-popup.tsx`.
- ❌ Forgetting the icon import — TypeScript won't catch it because `Icons.foo` returns `undefined` and the popup just shows the fallback.
