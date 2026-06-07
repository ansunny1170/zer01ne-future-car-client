---
paths:
  - "app/api/**/*.ts"
  - "app/hooks/use*.ts"
  - "app/providers.tsx"
---

# API & data layer rules

This codebase has exactly **one** backend endpoint (`POST /scenario`). Treat that as a constraint, not an oversight.

## Single endpoint contract

- The backend is `${NEXT_PUBLIC_API_URL}/scenario`. Don't hardcode hosts — always use `BASE_API_LINK` from `@/constants`.
- Request body is exactly `{ session_id: string, user_message: string, is_new_session: boolean }`. Don't add fields without backend coordination.
- The TypeScript shape is `SpeechResponse { success, message, data: StepInfo }`, but the established frontend pattern is `setStepInfo(response as unknown as StepInfo)` — i.e. cast the whole response object to `StepInfo`, not `response.data`. Both `Step0` (`step0.tsx:22`) and `QuestionArea` (`question-area.tsx:48`) do this. Match the pattern when you add new call sites; don't refactor to unwrap `data` without verifying the backend's actual shape across all step responses (the type and the runtime contract diverge).

## Concurrency control

- `useSpeechProcessing` has a **module-level `isGlobalPending` flag** that prevents concurrent submissions across the whole app. Don't bypass it by calling `mutation.mutate` directly — always go through `safeMutate` / `safeMutateAsync`.
- The `processingRef` in `QuestionArea` is a second guard layer for render-time double-fires. Both layers exist intentionally; keep both.
- Don't add a second mutation hook that calls `/scenario`. Use `useSpeechProcessing` everywhere.

## Axios configuration

- The shared axios instance has `withCredentials: true`. Cookies/session are server-managed. Don't strip credentials or create a new axios instance without them.
- Don't add response interceptors that retry — see TanStack Query rule below.
- Don't log request bodies — `user_message` is user voice transcript and could contain personal data.

## TanStack Query

- Global config has `retry: false` and `refetchOnWindowFocus: false` (`app/providers.tsx`). Handle errors at the call site; there is no automatic retry layer.
- Don't change these defaults — kiosk runs in always-focused fullscreen mode and silent retries would mask real backend failures during demos.
- Don't add `useQuery` for the scenario endpoint. It's a mutation (state change driven by user voice), not a query.

## Session lifecycle

- `session_id` is generated as `Date.now().toString()` in `Step0` when the user first speaks. `is_new_session: true` only on that first call; subsequent calls in the same session pass the same `session_id` with `is_new_session: false`.
- `reStart()` (in `SceneContext`) clears `sessionId`. Any new API call after `reStart` must generate a fresh `session_id`.

## WebSocket (review page only)

- The `/review` page uses a separate WebSocket (`wss://api.ftcar.org/ws/ending-reflection` or dev variant). It is **not** routed through axios or TanStack Query.
- Don't merge WebSocket logic into `useSpeechProcessing`. The two paths are intentionally separate.
- WebSocket payloads come as `{ type: 'reflection_update', data: Reflection[] }`. Validate `Array.isArray(message.data)` before setting state — the schema has changed before.

## Error handling

- API failures should `console.error` and let the user retry via the speech UI. Don't show alert dialogs (kiosk has no keyboard for dismissal).
- Don't add Sentry, Datadog, or any external error reporter without checking — the kiosk runs offline-tolerant and can't depend on telemetry endpoints being reachable.
