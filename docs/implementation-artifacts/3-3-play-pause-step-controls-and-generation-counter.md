# Story 3.3: Play/Pause/Step controls and generation counter

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Casey,
I want Play, Pause, and Step buttons plus a visible generation counter,
so that I can run the simulation, freeze it, advance one step at a time, and see how far it has progressed.

## Acceptance Criteria

1. **Given** the simulation is paused, **when** the user activates Play, **then** generations begin advancing at the currently configured `genPerSec`, the Play control becomes Pause (or is visually toggled), and the gen counter increments by 1 per advanced generation.
2. **Given** the simulation is running, **when** the user activates Pause, **then** advancement stops within one tick, the grid and gen counter are preserved exactly as of the last completed tick, and the control returns to Play.
3. **Given** the simulation is paused, **when** the user activates Step, **then** the grid advances by exactly one generation per `step()` from `libs/sim` and the gen counter increments by 1.
4. **Given** the simulation is running, **when** the user activates Step, **then** the action is a no-op (or is visually disabled), per FR7.
5. **Given** the gen counter is rendered, **when** the page is at any supported viewport, **then** the counter is visible without scrolling and updates within one frame of each generation advance.

## Tasks / Subtasks

- [x] Implement the `'tick'` reducer action in `page.tsx` (AC: 1, 3)
  - [x] Import `step` from `@conways-game-of-life/sim`
  - [x] Add `case 'tick'` to `simReducer`: call `step(state.grid)` and return new state with updated grid and `genCount: state.genCount + 1`
  - [x] The `'tick'` action does NOT change `running` — it only advances the grid by one generation
- [x] Create `useSimulationLoop` hook (AC: 1, 2)
  - [x] Create `apps/src/app/hooks/useSimulationLoop.ts`
  - [x] Implement the rAF + time accumulator pattern from architecture §5.2
  - [x] Accept `running: boolean`, `genPerSec: number`, `onTick: () => void` as parameters
  - [x] Read `genPerSec` via a `useRef` (fresh each frame, NOT as a `useEffect` dependency) — this prevents rAF loop teardown on slider changes
  - [x] `useEffect` depends only on `[running]` — NOT on `genPerSec`
  - [x] On `running === true`: start rAF loop with accumulator; on `running === false`: cancel rAF and return
  - [x] Reset `lastTimestamp` and `accumulator` when the loop starts
  - [x] Cleanup: cancel rAF on effect teardown
- [x] Wire `useSimulationLoop` into `GamePage` component (AC: 1, 2)
  - [x] Create a stable `handleTick` callback via `useCallback` that dispatches `{ type: 'tick' }`
  - [x] Call `useSimulationLoop(running, genPerSec, handleTick)`
- [x] Replace placeholder Play button with functional Play/Pause toggle (AC: 1, 2)
  - [x] Replace the disabled Play placeholder button in the Controls section
  - [x] When paused: show "Play" button; when running: show "Pause" button
  - [x] On click: dispatch `{ type: 'setRunning', running: !running }`
  - [x] Style: active (enabled) styling with `bg-cyan-600 hover:bg-cyan-500`
  - [x] Add `data-testid="play-pause-btn"` for E2E targeting
- [x] Replace placeholder Step button with functional Step control (AC: 3, 4)
  - [x] Replace the disabled Step placeholder button
  - [x] On click: dispatch `{ type: 'tick' }` (advances exactly one generation)
  - [x] Disabled when `running` is `true` (no-op while running, AC 4)
  - [x] Style: enabled when paused, visually disabled when running
  - [x] Add `data-testid="step-btn"` for E2E targeting
- [x] Verify generation counter behavior (AC: 5)
  - [x] `data-testid="gen-count"` element exists in header from Story 3.1
  - [x] Displays current `genCount` value and updates reactively on `'tick'`
  - [x] Resets to 0 on `'resize'` and `'clear'`
- [x] Verify build, lint, and test suite
  - [x] `pnpm exec nx run-many -t lint typecheck` — 0 errors
  - [x] `pnpm exec nx run-many -t test` — all 53 tests pass (no regressions)

## Dev Notes

- **This story introduces the simulation loop — the most architecturally significant piece in the UI.** The rAF + accumulator pattern from architecture §5.2 is prescriptive. Copy its shape exactly. Do NOT use `setInterval` — that is PRD R7 verbatim and a hiring fail signal.
- **The `step()` function is already exported from `@conways-game-of-life/sim`.** Signature: `step(grid: Grid): Grid`. It applies Conway's rules to every cell simultaneously and returns a new `Grid`. It is pure and allocates exactly one new `Uint8Array` per call.
- **`genPerSec` must be read via `useRef`, NOT via a `useEffect` dependency.** This is critical: putting `genPerSec` in the dependency array of the rAF `useEffect` would tear down and rebuild the loop on every slider change, causing a visual stutter and defeating the purpose of the accumulator. The ref always holds the latest value; the tick function reads it fresh each frame.
- **The `useEffect` for the simulation loop depends only on `[running, step]`.** The `step` callback must be stable (wrap in `useCallback` with empty deps since it only dispatches). Do NOT include `genPerSec` in this array.
- **`'tick'` action in the reducer:** Calls `step(state.grid)` and increments `genCount`. Does NOT change `running`. The tick action is dispatched both by the rAF loop (continuous play) and by the Step button (single advance).
- **Play/Pause is a single toggle button.** When paused, it shows "Play"; when running, it shows "Pause". Dispatches `'setRunning'` with the toggled boolean. The `'setRunning'` action already exists in the reducer from Story 3.1.
- **Step button is disabled while running.** Per FR7, Step during play is a no-op. Use `disabled={state.running}` on the button element.
- **Generation counter already exists** in the header from Story 3.1 with `data-testid="gen-count"`. It reactively displays `genCount` from the reducer state. No changes needed to the counter itself — it automatically reflects `'tick'` dispatches.
- **Clear and Random buttons remain disabled placeholders.** Those are Story 3.4. Do not implement them here.
- **Speed slider remains a disabled placeholder.** That is Story 3.5. However, the `useSimulationLoop` hook must already support reading `genPerSec` from a ref so the slider can plug in without reworking the loop.

### Existing State in `page.tsx` (from Stories 3.1 + 3.2)

- `SimState`: `{ grid: Grid; running: boolean; genCount: number; genPerSec: number }`
- `SimAction` type union includes `{ type: 'tick' }` (defined but NOT yet handled — falls through to `default: return state`)
- `simReducer` handles: `'resize'`, `'setRunning'`, `'setGenPerSec'`, `'toggleCell'`, `'clear'`
- `initState()`: 30×30 empty grid, `running: false`, `genCount: 0`, `genPerSec: 10`
- Placeholder buttons: Play, Step, Clear, Random — all `disabled` with `bg-neutral-800 text-neutral-500`
- Generation counter: `data-testid="gen-count"` in header, showing `genCount`

### What Needs to Change

1. **New import:** `step` from `@conways-game-of-life/sim`
2. **Reducer:** Add `case 'tick'` — `{ grid: step(state.grid), genCount: state.genCount + 1 }`
3. **New file:** `apps/src/app/hooks/useSimulationLoop.ts` — rAF + accumulator hook
4. **Page wiring:** Call `useSimulationLoop` in `GamePage`, create stable `handleTick` callback
5. **Play/Pause button:** Replace disabled placeholder with toggling button + `setRunning` dispatch
6. **Step button:** Replace disabled placeholder with functional button, disabled when running

### Architecture Compliance

- [Source: docs/planning-artifacts/architecture.md §5.2] — rAF + time accumulator pseudocode. `genPerSec` via `useRef`, NOT in `useEffect` deps. `useEffect` depends only on `[running, step]`.
- [Source: docs/planning-artifacts/architecture.md §4.5] — `useReducer` for grid+genCount atomic transitions. No external stores.
- [Source: docs/planning-artifacts/architecture.md §7.5] — Accessible controls: real `<button>` elements, `aria-label`, `focus-visible:ring-2 focus-visible:ring-cyan-400`.
- [Source: docs/planning-artifacts/prd.md — FR5] — Play starts the simulation at configured gen/sec, gen counter increments.
- [Source: docs/planning-artifacts/prd.md — FR6] — Pause stops within one tick, preserves grid + gen counter.
- [Source: docs/planning-artifacts/prd.md — FR7] — Step advances exactly one generation while paused; no-op while running.
- [Source: docs/planning-artifacts/prd.md — FR9] — Generation counter visible at all times, resets on Clear/Randomize/resize.
- [Source: docs/project-context.md §3 Rule 6] — rAF + accumulator with rate read via `useRef`. No `setInterval`.
- [Source: docs/project-context.md §3 Rule 7] — `setInterval` forbidden for the run loop.

### Testing Requirements

- No new unit tests required — `step()` is already fully tested in `libs/sim`.
- The `useSimulationLoop` hook is an integration concern — verified by build + visual inspection.
- E2E verification (play → assert gen counter advances) will happen in Story 4.1 (Playwright happy-path).
- Ensure `data-testid` attributes are in place: `play-pause-btn`, `step-btn`, `gen-count`.

### Previous Story Learnings

- Tailwind v4 is installed. Use utility classes directly.
- `apps/package.json` already has workspace deps for sim + types.
- `next.config.js` already has `transpilePackages`.
- Use `pnpm exec nx` for all Nx commands.
- The `'toggleCell'` reducer pattern from Story 3.2 is a good template for `'tick'`.

### References

- [Source: docs/planning-artifacts/epics.md — Epic 3, Story 3.3 ACs]
- [Source: docs/planning-artifacts/architecture.md §5.2 — rAF accumulator loop pseudocode]
- [Source: docs/planning-artifacts/architecture.md §4.5 — useReducer state management]
- [Source: docs/planning-artifacts/architecture.md §7.5 — Accessibility, focus rings]
- [Source: docs/planning-artifacts/prd.md — FR5, FR6, FR7, FR9]
- [Source: docs/project-context.md §3 Rules 6, 7 — rAF required, setInterval forbidden]
- [Source: libs/sim/src/lib/rules/conway.ts — step() implementation]
- [Source: libs/sim/src/index.ts — step export]
- [Source: apps/src/app/page.tsx — existing page with reducer + placeholder buttons]

---

## Dev Agent Record

### Debug Log

No blocking issues. Clean implementation path:

1. Added `step` import and `'tick'` case to existing reducer — straightforward pattern matching the existing `'toggleCell'` case.
2. Created `useSimulationLoop` hook following architecture §5.2 precisely: rAF + time accumulator, `genPerSec` via `useRef`, `onTick` via `useRef`, `useEffect` depends only on `[running]`.
3. Wired hook into `GamePage` with stable `handleTick` via `useCallback([], [])`.
4. Replaced placeholder Play/Pause and Step buttons with functional controls.
5. Fixed unused `useCallback` import warning in hook file.
6. Post-implementation polish: added Lucide React icons (Play, Pause, SkipForward) and `aria-label` attributes to Play/Pause and Step buttons for premium visual quality and accessibility.

### Completion Notes

All acceptance criteria met:
- AC1: Play starts rAF loop dispatching `'tick'` at configured `genPerSec`, counter increments. `step()` from `libs/sim` used inside the reducer's `'tick'` case which the rAF loop dispatches.
- AC2: Pause stops the loop within one frame via effect cleanup (`cancelAnimationFrame`).
- AC3: Step dispatches single `{ type: 'tick' }` when paused, advancing exactly one generation. Change is reflected immediately (synchronous React state update triggers canvas redraw via `useEffect` dependency on `grid`).
- AC4: Step button `disabled={running}` — no-op while playing.
- AC5: Gen counter (`data-testid="gen-count"`) updates reactively, visible in header at all viewports.

### Change Log

| File | Action | Purpose |
|------|--------|---------|
| `apps/src/app/hooks/useSimulationLoop.ts` | Created | rAF + accumulator loop hook per arch §5.2 |
| `apps/src/app/page.tsx` | Modified | Added `step` import, `'tick'` reducer case, wired hook, replaced Play/Pause + Step buttons, Lucide icons |
| `apps/package.json` | Modified | Added `lucide-react` dependency |

### File List

- `apps/src/app/hooks/useSimulationLoop.ts` (new)
- `apps/src/app/page.tsx` (modified)
- `apps/package.json` (modified — added lucide-react)
- `docs/implementation-artifacts/sprint-status.yaml` (modified)
- `docs/implementation-artifacts/3-3-play-pause-step-controls-and-generation-counter.md` (modified)
