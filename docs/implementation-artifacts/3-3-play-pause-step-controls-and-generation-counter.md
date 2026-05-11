# Story 3.3: Play/Pause/Step controls and generation counter

Status: ready-for-dev

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

- [ ] Implement the `'tick'` reducer action in `page.tsx` (AC: 1, 3)
  - [ ] Import `step` from `@conways-game-of-life/sim`
  - [ ] Add `case 'tick'` to `simReducer`: call `step(state.grid)` and return new state with updated grid and `genCount: state.genCount + 1`
  - [ ] The `'tick'` action does NOT change `running` — it only advances the grid by one generation
- [ ] Create `useSimulationLoop` hook (AC: 1, 2)
  - [ ] Create `apps/src/app/hooks/useSimulationLoop.ts`
  - [ ] Implement the rAF + time accumulator pattern from architecture §5.2
  - [ ] Accept `{ running: boolean; genPerSec: number; step: () => void }` as parameters
  - [ ] Read `genPerSec` via a `useRef` (fresh each frame, NOT as a `useEffect` dependency) — this prevents rAF loop teardown on slider changes
  - [ ] `useEffect` depends only on `[running, step]` — NOT on `genPerSec`
  - [ ] On `running === true`: start rAF loop with accumulator; on `running === false`: cancel rAF and return
  - [ ] Reset `lastTimeRef` and `accumulatorRef` when the loop starts
  - [ ] Cleanup: cancel rAF on effect teardown
- [ ] Wire `useSimulationLoop` into `GamePage` component (AC: 1, 2)
  - [ ] Create a stable `handleTick` callback via `useCallback` that dispatches `{ type: 'tick' }`
  - [ ] Call `useSimulationLoop({ running: state.running, genPerSec: state.genPerSec, step: handleTick })`
- [ ] Replace placeholder Play button with functional Play/Pause toggle (AC: 1, 2)
  - [ ] Replace the disabled Play placeholder button in the Controls section
  - [ ] When paused: show "Play" button; when running: show "Pause" button
  - [ ] On click: dispatch `{ type: 'setRunning', running: !state.running }`
  - [ ] Style: active (enabled) styling with `bg-cyan-600 hover:bg-cyan-500` when actionable
  - [ ] Add `data-testid="play-pause-btn"` for E2E targeting
  - [ ] Add `aria-label` that reflects current state ("Play simulation" / "Pause simulation")
- [ ] Replace placeholder Step button with functional Step control (AC: 3, 4)
  - [ ] Replace the disabled Step placeholder button
  - [ ] On click: dispatch `{ type: 'tick' }` (advances exactly one generation)
  - [ ] Disabled when `state.running` is `true` (no-op while running, AC 4)
  - [ ] Style: enabled when paused, visually disabled when running
  - [ ] Add `data-testid="step-btn"` for E2E targeting
  - [ ] Add `aria-label="Step one generation"`
- [ ] Verify generation counter behavior (AC: 5)
  - [ ] The `data-testid="gen-count"` element already exists in the header from Story 3.1
  - [ ] Confirm it displays the current `genCount` value and updates reactively when the reducer dispatches `'tick'`
  - [ ] Confirm it resets to 0 on `'resize'` and `'clear'`
- [ ] Verify build, lint, and test suite
  - [ ] `pnpm exec nx build apps` succeeds
  - [ ] `pnpm exec nx lint apps` passes with 0 errors
  - [ ] `pnpm exec nx test sim` — all existing tests pass (no regressions)
  - [ ] `pnpm exec nx test types` — all existing tests pass

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
