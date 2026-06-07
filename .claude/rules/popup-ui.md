---
paths:
  - "app/components/ui/popup_ui/**/*.tsx"
  - "app/components/ui/usp-popup-*.tsx"
  - "app/components/ui/clone-talk*.tsx"
---

# Popup UI rules

## Registry pattern

- Popups are registered in dictionaries keyed by uppercased `keyName`:
  - **DEFAULT_POPUP / TRIGGER_POPUP** → `popupDict` in `app/components/ui/popup_ui/common.tsx`
  - **HUD_POPUP** → dict in `app/components/ui/popup_ui/hud-popup.tsx`
- The `keyName` comes from `asset.id?.toString().toUpperCase()`. If `asset.id` is missing, the fallback is `asset.type` (`DEFAULT_POPUP` itself, etc.). Always uppercase entries — lowercase keys silently fail to match.
- Match against `popupDict[keyName]?.icon`. Optional chaining is required because backend can send unknown ids; the popup falls back to `<Icons.alert />`.

## popupDict entry shapes (two registries, two shapes)

The two `popupDict`s have **different field shapes** — don't try to unify them.

### `common.tsx` (DEFAULT_POPUP / TRIGGER_POPUP)

```ts
KEY_NAME: {
  icon: <Icons.something />,  // from app/components/ui/icons.tsx — don't inline SVG
  type: "warm" | "cold",       // "warm" = warning/red gradient, "cold" = info/blue gradient
  defaultText: string,         // shown when backend's `description` is empty; Korean by convention
  className: string,           // usually ""; "min-w-auto" for compact one-line popups (CAR_OPEN style)
}
```

### `hud-popup.tsx` (HUD_POPUP)

```ts
KEY_NAME: {
  name: string,    // internal label (often equals title)
  title: string,   // shown in the HUD header (Korean)
  image: string,   // path under /public/assets/images/, e.g. "/assets/images/hud_PET.png"
}
```

HUD popups render twice in mirrored 3D-skewed positions via `HudLayer` (`bottom-[24%] left-[12%]` and `bottom-[15%] right-[16%]`, each with a different `transform: scaleX scaleY rotateY`). New HUD entries need a corresponding image asset committed under `public/assets/images/hud_<KEYNAME>.png`.

## Icon library

- All icons come from `Icons` exported in `app/components/ui/icons.tsx`. If a needed icon isn't there, add it to that file as a named export — don't inline SVG into popup components.
- Icons render inside a fixed `66×66` container; design new icons to that bounding box.

## Auto-dismissal timer

- `CommonPopupUI` auto-dismisses after **3000ms** via a `setTimeout` keyed on `keyName`.
- `HudLayer` is different: 2500ms fade-out start + 4000ms `onComplete` (see `hud-layer.tsx`). The 1500ms fade-out window is intentional — don't shorten without checking with the design team.
- Both timers must clear in the cleanup return (already done; preserve when editing).

## Special-case popups

- `BRAKE_PAD` does NOT use `BasicPopupBox` — it routes to `BreakPadPopup`. To add another special case, branch in `CommonPopupUI` before the `BasicPopupBox` fallback. Don't add a registry entry for it; the dict lookup would be ignored.

## Animation

- The popup body uses Tailwind keyframes `animate-popup` (defined in `tailwind.config.ts`). It animates from `translateY(50px) opacity-0` to `translateY(0) opacity-100` over 1s. Keep this — replacing with a Framer Motion variant changes the timing relative to the 3000ms dismiss timer.
- HUD popups use Framer Motion (`AnimatePresence` + 0.5s fade). Keep separate from the keyframe-based common popup.

## CloneTalk

- `CloneTalkSplit` (`clone-talk-split.tsx`) splits Korean text into characters and animates each. Don't pass non-Korean text without testing — character-level animation looks odd for English.
- `CloneTalk` (`clone-talk.tsx`) is the older non-split version, used in `StepComplete`. They are not interchangeable.

## Don'ts

- ❌ Don't add registry entries for icons that don't exist in `Icons` — TypeScript won't catch the mistake; the popup just renders the fallback alert icon.
- ❌ Don't change `keyName` casing — uppercase is the contract.
- ❌ Don't wrap popups in additional motion containers; the existing animation classes assume direct mounting.
