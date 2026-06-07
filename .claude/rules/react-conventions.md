---
paths:
  - "app/**/*.tsx"
  - "app/**/*.ts"
---

# React / TypeScript conventions

## `'use client'`

- This is a fully client-rendered kiosk app. Add `'use client'` at the top of any page or component that uses hooks, context, or browser APIs.
- Don't write `async` server components. The codebase has none, and adding one would break the existing client-only `SceneProvider` tree.

## Imports

- Use the `@/` path alias for everything under `app/`. `import x from "@/context/scene-context"`, never `"../../context/scene-context"`.
- The alias is configured both in `tsconfig.json:paths` and `next.config.ts:webpack.resolve.alias`. Both must match if you ever change it.
- `@/utils` is the project's barrel for general helpers (`random`, `getFormattedTime`, `getArtistName`). New small utilities go there as named exports.
- `@/utils/cn` is separate (the Tailwind `clsx + tailwind-merge` wrapper) — do not move it into the barrel; existing import sites use `import { cn } from "@/utils/cn"` directly.
- `@/utils/constants` holds the BGM/BGV dictionaries and persona list — keep static data there, not in `@/utils`.

## TypeScript

- **No new `any`.** Legacy `any` exists (e.g., `currentUspPool: any[]` in `step-repeat.tsx`); match locally when extending that code, but new code uses precise types from `app/type/index.ts`.
- Use the `Assets` discriminated union from `@/type` for anything that processes timeline assets — narrow with `asset.type === "..."` checks; TypeScript will refine the type.
- Don't add type assertions (`as Foo`) without a comment explaining why. The codebase uses `as unknown as StepInfo` in API call sites because the response wrapper is loose — that's a known pattern, but don't proliferate it.
- `tsconfig.json` has `"strict": true`. Don't disable individual strict flags.

## Comments

- Single-line `// ...` style only. Don't add multi-line `/* ... */` block comments.
- Korean comments are normal in this codebase — preserve existing ones, and write new comments in Korean when matching surrounding code style.
- Comments often encode product intent (e.g. `❌사용하지 않습니다`, `✅ 사용하는 데이터입니다`). When a field is documented as unused, treat that as a hard signal — don't start using it without checking.

## State and effects

- Prefer functional `setState` updates (`setX(prev => ...)`) when the new value depends on the previous one. The `currentIdx` advancement pattern in step components has been bitten by stale-closure bugs.
- Effects that schedule timers MUST return a cleanup that clears them. No exceptions. See `.claude/rules/timeline.md` for the full rationale.

## Animations

- Page-level transitions use Framer Motion `motion.div` with the shared `fadeVariants` (`opacity` only). Don't replace with CSS animations — the orchestration via `AnimatePresence` in `page.tsx` depends on Framer.
- Keyframe animations defined in `tailwind.config.ts` (`fade-in`, `wave`, `popup`, `marquee`) are used inside popup bodies. Use these utility classes instead of inlining `@keyframes`.

## Styling

- Tailwind utility classes only. No CSS modules, no styled-components. Custom utilities go in `tailwind.config.ts:plugins` (see the `mask-image-linear` example).
- Class merging uses `cn` from `@/utils/cn` (a `clsx` + `tailwind-merge` wrapper). Use `cn(...)` whenever conditionally combining classes.
- Hyundai font is `--font-hyundai` (already wired into `font-sans`). Don't add new font loaders.

## Constants

- All shared constants live in `app/constants.ts` (`BASE_S3_LINK`, `BASE_API_LINK`, `IS_PRD`) or `app/utils/constants.ts` (BGM/BGV dictionaries, persona list). Import from those — don't duplicate values.
- Media filenames resolve against `BASE_S3_LINK`. Never hardcode the bucket URL.
