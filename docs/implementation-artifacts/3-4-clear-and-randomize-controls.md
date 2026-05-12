# Story 3.4: Clear and Randomize controls

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Casey,
I want one-click Clear and Randomize buttons,
so that I can reset to empty or jump to an interesting random starting state without painting cell-by-cell.

## Acceptance Criteria

1. **Given** any grid state and either running or paused, **when** the user activates Clear, **then** every cell is dead, the gen counter resets to 0, and if the simulation was running it is now paused.
2. **Given** any grid state and either running or paused, **when** the user activates Randomize, **then** `randomizeGrid` from `libs/sim` is called with the default density (0.3), the gen counter resets to 0, and if the simulation was running it is now paused.
3. **Given** the controls are rendered, **when** the page is at any supported viewport, **then** both buttons are reachable and operable via mouse, touch, or keyboard (Tab + Enter/Space).

## Tasks / Subtasks

- [x] Implement the `'randomize'` reducer action in `page.tsx` (AC: 2)
  - [x] Import `randomizeGrid` from `@conways-game-of-life/sim`
  - [x] Add `case 'randomize'` to `simReducer`: call `randomizeGrid(state.grid)` with default density 0.3, set `running: false`, set `genCount: 0`
  - [x] The `'clear'` case already exists and is correct — verified it sets `running: false` and `genCount: 0`
- [x] Replace placeholder Clear button with functional control (AC: 1, 3)
  - [x] Replace the disabled Clear placeholder button in the Controls section
  - [x] On click: dispatch `{ type: 'clear' }`
  - [x] The button is always enabled (works in both running and paused states)
  - [x] Add `data-testid="clear-btn"` for E2E targeting
  - [x] Add `aria-label="Clear grid"`
  - [x] Use Lucide React `Trash2` icon for visual consistency with existing Play/Pause/Step buttons
  - [x] Style: `bg-neutral-800 hover:bg-neutral-700` with `focus-visible:ring-2 focus-visible:ring-cyan-400`
- [x] Replace placeholder Random button with functional Randomize control (AC: 2, 3)
  - [x] Replace the disabled Random placeholder button in the Controls section
  - [x] On click: dispatch `{ type: 'randomize' }`
  - [x] The button is always enabled (works in both running and paused states)
  - [x] Add `data-testid="randomize-btn"` for E2E targeting
  - [x] Add `aria-label="Randomize grid"`
  - [x] Use Lucide React `Shuffle` icon for visual consistency
  - [x] Style: same as Clear — `bg-neutral-800 hover:bg-neutral-700` with focus ring
- [x] Verify build, lint, and test suite
  - [x] `pnpm exec nx run-many -t lint typecheck` — 0 errors
  - [x] `pnpm exec nx run-many -t test` — all existing tests pass (no regressions)

## Dev Notes

- **This is a small, focused story.** Two buttons, one new reducer case, one new import. The `'clear'` case already exists in the reducer from Story 3.1 — it calls `createGrid(state.grid.width, state.grid.height)` and resets `running: false` + `genCount: 0`. Only `'randomize'` needs to be added.
- **`randomizeGrid` is already exported from `@conways-game-of-life/sim`.** Signature: `randomizeGrid(grid: Grid, density?: number, rng?: () => number): Grid`. Default density is 0.3. Default RNG is `Math.random`. Call it as `randomizeGrid(state.grid)` in the reducer — no need to pass density or rng explicitly (defaults are correct per PRD FR4).
- **`clearGrid` from `libs/sim` exists** but is NOT needed — the existing `'clear'` reducer case already uses `createGrid(width, height)` which produces an all-zero grid. This is functionally identical. Do not change the existing `'clear'` case.
- **Both buttons work in ANY state (running or paused).** Per FR3/FR4: "Clear/Randomize is available whether the simulation is running or paused; if running, the simulation pauses." Both reducer cases must set `running: false`.
- **Lucide React is already installed** (`apps/package.json` has `lucide-react`). Use `Trash2` for Clear and `Shuffle` for Randomize to match the existing Play/Pause/Step icon pattern. Import alongside existing `Play`, `Pause`, `SkipForward` icons.
- **`SimAction` already includes `{ type: 'randomize' }` in the union type** — it was defined in the Story 3.1 scaffolding. It currently falls through to `default: return state` in the switch statement. This story adds the actual implementation.

### Existing State in `page.tsx` (from Stories 3.1 + 3.2 + 3.3)

- `SimAction` type union already includes `| { type: 'clear' }` and `| { type: 'randomize' }`
- `simReducer` already handles `'clear'` — calls `createGrid(width, height)`, sets `running: false`, `genCount: 0`
- `simReducer` does NOT yet handle `'randomize'` — falls through to `default: return state`
- Imports from `@conways-game-of-life/sim`: `createGrid`, `toggleCell`, `getCell`, `step`
- Imports from `lucide-react`: `Play`, `Pause`, `SkipForward`
- Two disabled placeholder buttons for Clear and Random already exist in the Controls section

### What Needs to Change

1. **New import:** `randomizeGrid` from `@conways-game-of-life/sim`
2. **New import:** `Trash2`, `Shuffle` from `lucide-react`
3. **Reducer:** Add `case 'randomize'` — `{ grid: randomizeGrid(state.grid), running: false, genCount: 0 }`
4. **Clear button:** Replace disabled placeholder with functional button + `data-testid="clear-btn"` + Lucide icon
5. **Randomize button:** Replace disabled placeholder with functional button + `data-testid="randomize-btn"` + Lucide icon

### Architecture Compliance

- [Source: docs/planning-artifacts/architecture.md §5.1] — `randomizeGrid(grid, density?, rng?)` is part of the sim public API. Default density 0.3, default RNG is `Math.random`.
- [Source: docs/planning-artifacts/architecture.md §4.5] — `useReducer` for grid+genCount atomic transitions. Both `'clear'` and `'randomize'` set `running: false` + `genCount: 0` atomically.
- [Source: docs/planning-artifacts/architecture.md §7.5] — Accessible controls: real `<button>` elements, `aria-label`, `focus-visible:ring-2 focus-visible:ring-cyan-400`.
- [Source: docs/planning-artifacts/prd.md — FR3] — Clear: all cells dead, gen counter to 0, pauses if running.
- [Source: docs/planning-artifacts/prd.md — FR4] — Randomize: pseudo-random fill at ~0.3 density, gen counter to 0, pauses if running.
- [Source: docs/planning-artifacts/prd.md — FR9] — Generation counter resets on Clear/Randomize.
- [Source: docs/project-context.md §3 Rule 11] — `randomizeGrid` accepts injectable RNG. Production uses `Math.random` (default).

### Testing Requirements

- No new unit tests required — `randomizeGrid` and `createGrid` are already fully tested in `libs/sim`.
- Reducer behavior is straightforward (one function call + state reset) — covered by build verification and existing E2E infrastructure.
- E2E verification (clear/randomize behavior) will happen in Story 4.1 (Playwright happy-path).
- Ensure `data-testid` attributes are in place: `clear-btn`, `randomize-btn`.

### Previous Story Learnings

- Tailwind v4 is installed. Use utility classes directly.
- `apps/package.json` already has workspace deps for `@conways-game-of-life/sim` and `@conways-game-of-life/types`.
- `next.config.js` already has `transpilePackages`.
- Use `pnpm exec nx` for all Nx commands. Set `CI=true` to avoid TTY prompts in sandbox.
- Lucide React is already installed — import alongside existing icons.
- The `'toggleCell'` and `'tick'` reducer patterns from Stories 3.2/3.3 are good templates.
- The `'clear'` case already works correctly — just needs a button to dispatch it.

### References

- [Source: docs/planning-artifacts/epics.md — Epic 3, Story 3.4 ACs]
- [Source: docs/planning-artifacts/architecture.md §5.1 — randomizeGrid signature and invariants]
- [Source: docs/planning-artifacts/architecture.md §4.5 — useReducer state management]
- [Source: docs/planning-artifacts/architecture.md §7.5 — Accessibility, focus rings]
- [Source: docs/planning-artifacts/prd.md — FR3, FR4, FR9]
- [Source: docs/project-context.md §3 Rule 11 — Injectable RNG, default Math.random]
- [Source: libs/sim/src/lib/grid.ts — randomizeGrid, clearGrid implementations]
- [Source: libs/sim/src/index.ts — randomizeGrid export]
- [Source: apps/src/app/page.tsx — existing page with reducer + placeholder buttons]

---

## Dev Agent Record

### Completion Notes

All four tasks completed cleanly in a single pass with no blockers:

1. **Reducer:** Added `case 'randomize'` that calls `randomizeGrid(state.grid)` (default density 0.3), sets `running: false` and `genCount: 0`. Verified existing `'clear'` case already produces correct behavior.
2. **Clear button:** Replaced disabled placeholder with a functional `<button>` dispatching `{ type: 'clear' }`. Always enabled. Includes `data-testid="clear-btn"`, `aria-label="Clear grid"`, and Lucide `Trash2` icon.
3. **Randomize button:** Replaced disabled placeholder with a functional `<button>` dispatching `{ type: 'randomize' }`. Always enabled. Includes `data-testid="randomize-btn"`, `aria-label="Randomize grid"`, and Lucide `Shuffle` icon.
4. **Verification:** `lint`, `typecheck`, and `test` all pass — 0 errors, 0 regressions. 49 sim tests + all other suites green.

### Change Log

| File | Change |
|------|--------|
| `apps/src/app/page.tsx` | Added `randomizeGrid` import from `@conways-game-of-life/sim`; added `Trash2`, `Shuffle` imports from `lucide-react`; added `case 'randomize'` to `simReducer`; replaced two disabled placeholder buttons with functional Clear and Randomize controls |

### File List

- `apps/src/app/page.tsx` (modified)
