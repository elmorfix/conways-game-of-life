# Story 3.2: Canvas render and click/tap-to-toggle cells

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Casey,
I want to click (or tap) a cell on the canvas to toggle it alive/dead before pressing play,
so that I can paint a starting state I'm interested in.

## Acceptance Criteria

1. **Given** the simulation is paused and the canvas has rendered the current grid, **when** the user clicks a dead cell (mouse) or taps it (touch), **then** the cell becomes alive, is visibly distinguishable from dead cells (cyan-on-near-black per architecture §7.5), and the visible state change occurs within 50ms of the input event.
2. **Given** the simulation is paused, **when** the user clicks an alive cell, **then** the cell becomes dead.
3. **Given** the simulation is running, **when** the user clicks the canvas, **then** the toggle is a no-op (controls disabled while running, per FR2 default).
4. **Given** the rendering implementation, **when** the grid state changes, **then** a `useEffect([grid])` triggers a Canvas redraw using `fillRect` per architecture §5.3 (no DOM-per-cell rendering).
5. **Given** the click→grid-coordinate conversion, **when** the canvas is scaled by CSS to fit its container, **then** `getBoundingClientRect()` is used so coordinates remain accurate at any rendered size.

## Tasks / Subtasks

- [x] Implement the `toggleCell` reducer action in `page.tsx` (AC: 1, 2)
  - [x] Import `toggleCell` from `@conways-game-of-life/sim`
  - [x] Add `'toggleCell'` case to `simReducer`: call `toggleCell(state.grid, action.x, action.y)` and return new state with the updated grid (no genCount change, no running change)
  - [x] Verify immutability: `toggleCell` from `libs/sim` already returns a new `Grid` instance
- [x] Upgrade the canvas rendering `useEffect` to paint alive cells (AC: 4)
  - [x] Modify the existing `useEffect([grid, ...])` in `page.tsx` to iterate over all cells and paint alive cells with `#22d3ee` (Tailwind `cyan-400`) using `fillRect`
  - [x] Keep the dead-cell background fill (`#0a0a0a`) as the base layer
  - [x] Retain the faint grid lines (`#1a1a1a`, 0.5px stroke) on top of cells for visual clarity
  - [x] Rendering approach per architecture §5.3: clear entire canvas with dead color, then paint alive cells on top — no per-cell DOM rendering
  - [x] Import `getCell` from `@conways-game-of-life/sim` for reading cell state during rendering
- [x] Add click/tap-to-toggle handler on the canvas (AC: 1, 2, 3, 5)
  - [x] Add an `onPointerDown` handler to the `<canvas>` element (covers both mouse and touch)
  - [x] Guard: if `state.running` is `true`, return early (no-op while running, AC 3)
  - [x] Use `canvas.getBoundingClientRect()` to translate `clientX`/`clientY` to canvas-relative coordinates (AC 5)
  - [x] Account for CSS scaling: compute `scaleX = canvas.width / rect.width` and `scaleY = canvas.height / rect.height`, then `canvasX = (event.clientX - rect.left) * scaleX`, `canvasY = (event.clientY - rect.top) * scaleY`
  - [x] Convert canvas pixel coordinates to grid cell: `x = Math.floor(canvasX / cellSize)`, `y = Math.floor(canvasY / cellSize)`
  - [x] Bounds-check: if `x < 0 || x >= grid.width || y < 0 || y >= grid.height`, return (ignore clicks outside the grid)
  - [x] Dispatch `{ type: 'toggleCell', x, y }` to the reducer
  - [x] `data-testid="grid-canvas"` is already present from Story 3.1
- [x] Ensure canvas cursor indicates interactivity when paused (AC: 1)
  - [x] Add `cursor-pointer` class to `<canvas>` when `!state.running`
  - [x] Add `cursor-not-allowed` class when `state.running` (visual feedback that clicking is disabled)
- [x] Verify build and lint pass
  - [x] `pnpm exec nx build apps` succeeds
  - [x] `pnpm exec nx lint apps` passes with 0 errors (5 pre-existing warnings)
- [x] Run full test suite for regressions
  - [x] `pnpm exec nx test sim` — 43 tests pass, no regressions
  - [x] `pnpm exec nx test types` — 1 test passes, no regressions

## Dev Notes

- **This story builds on Story 3.1's page shell.** The canvas element, `useReducer`, `SimState`, `SimAction`, and the rendering `useEffect` already exist in `apps/src/app/page.tsx`. This story upgrades the rendering to paint alive cells and adds the click-to-toggle interaction.
- **The Next.js app project is named `apps`** (not `web` as the architecture tree suggests). Source lives at `apps/src/app/`. Adjust file paths accordingly.
- **`toggleCell` already exists in `libs/sim`.** It is exported from `@conways-game-of-life/sim` as `toggleCell(grid: Grid, x: number, y: number): Grid`. It returns a new `Grid` with the targeted cell flipped. It does NOT mutate the input grid. Use it directly in the reducer — do not re-implement toggle logic.
- **`getCell` already exists in `libs/sim`.** Exported as `getCell(grid: Grid, x: number, y: number): 0 | 1`. Returns `0` for out-of-bounds coordinates. Use it in the render loop to check each cell's state.
- **Rendering per architecture §5.3:** The `renderGrid` function clears the entire canvas with the dead background color, then iterates all cells and paints alive cells with `fillRect`. Do NOT render each cell as a separate DOM node. The existing `useEffect([grid, cellSize, canvasWidth, canvasHeight])` in `page.tsx` should be upgraded to include alive-cell painting.
- **Color scheme (architecture §7.5):** Dead cell background: `#0a0a0a` (Tailwind `neutral-950`). Alive cell: `#22d3ee` (Tailwind `cyan-400`). Contrast ratio ≥ 4.5:1 is already satisfied.
- **Click→grid-coordinate conversion per architecture §5.3:** Use `onPointerDown` (not `onClick`) for lower latency. Use `getBoundingClientRect()` to handle CSS scaling — the canvas may be CSS-scaled (via `max-width: 100%; height: auto`) on mobile. The formula: `scaleX = canvas.width / rect.width`, then `canvasX = (clientX - rect.left) * scaleX`, `cellX = Math.floor(canvasX / cellSize)`.
- **No-op while running (AC 3, FR2):** The click handler must check `state.running` and early-return. The cursor should change to `cursor-not-allowed` to provide visual feedback.
- **Performance (NFR4):** The 50ms perceived latency budget (FR2) is easily met because the toggle dispatches to the reducer which triggers a React re-render, which triggers the `useEffect([grid])` canvas redraw. For a 30×30 grid this is sub-millisecond.
- **Do NOT extract `Canvas.tsx` as a separate component yet.** Keep the canvas element and its rendering logic inline in `page.tsx` for now. Extracting to a component is fine as a refactor if it improves readability, but the reducer dispatch must remain accessible. If extracting, pass `grid`, `cellSize`, `running`, and an `onToggle` callback as props.
- **Do NOT implement** play/pause/step controls, the simulation loop, clear/randomize buttons, or the speed slider. Those are Stories 3.3–3.5.

### Existing State in `page.tsx` (from Story 3.1)

The current `page.tsx` already has:
- `SimState` interface: `{ grid: Grid; running: boolean; genCount: number; genPerSec: number }`
- `SimAction` type union including `{ type: 'toggleCell'; x: number; y: number }` (defined but NOT yet handled in the reducer — falls through to `default: return state`)
- `useReducer(simReducer, undefined, initState)` with default 30×30 empty grid
- `canvasRef`, `containerRef`, `cellSize` computation (clamped 4–20px)
- `useEffect` that fills dead background + faint grid lines
- `<canvas>` element with `data-testid="grid-canvas"`, `width={canvasWidth}`, `height={canvasHeight}`, `style={{ maxWidth: '100%', height: 'auto' }}`

### What Needs to Change

1. **Reducer:** Add `case 'toggleCell'` to `simReducer` (currently falls through to `default`)
2. **`useEffect` rendering:** Add alive-cell painting loop after the background fill
3. **New handler:** Add `onPointerDown` to `<canvas>` with coordinate translation + dispatch
4. **New import:** `toggleCell` and `getCell` from `@conways-game-of-life/sim`
5. **Cursor styling:** Conditional `cursor-pointer` / `cursor-not-allowed` on canvas

### Import Convention

Use `@conways-game-of-life/sim` and `@conways-game-of-life/types` (scoped package names). The workspace deps were already added to `apps/package.json` in Story 3.1.

### Architecture Compliance

- [Source: docs/planning-artifacts/architecture.md §5.3] — Canvas render: `fillRect`-based, `useEffect([grid])` triggers redraw, no DOM-per-cell
- [Source: docs/planning-artifacts/architecture.md §5.3] — Cell toggle: `onPointerDown` → `getBoundingClientRect()` → grid coords → dispatch `toggleCell`
- [Source: docs/planning-artifacts/architecture.md §7.5] — Color: dead `#0a0a0a`, alive `#22d3ee`, contrast ≥ 4.5:1
- [Source: docs/planning-artifacts/prd.md — FR2] — Toggle cells while paused, <50ms latency, no toggle while running
- [Source: docs/planning-artifacts/prd.md — NFR4] — MVP perf: 50×50 ≥ 30 gen/sec, <50ms input
- [Source: docs/project-context.md §3 Rule 8] — Grid is `{ width, height, cells: Uint8Array }`, `cells[y*width + x]`
- [Source: docs/project-context.md §5] — Cell-toggle hit-testing uses `getBoundingClientRect()`

### Testing Requirements

- No new unit tests required for this story (the `toggleCell` function in `libs/sim` is already fully tested in `grid.spec.ts`)
- The canvas rendering is a visual concern — verified by build + visual inspection
- E2E verification of cell toggle will happen in Story 4.1 (Playwright happy-path spec)
- Ensure `data-testid="grid-canvas"` remains in place for E2E targeting

### Story 3.1 Learnings

- Tailwind v4 is installed (CSS-first config with `@import "tailwindcss"`). Use Tailwind utility classes directly.
- `apps/package.json` already has `@conways-game-of-life/sim` and `@conways-game-of-life/types` as `"workspace:*"` dependencies. No additional dependency wiring needed.
- `next.config.js` already has `transpilePackages` for sim and types.
- Use `pnpm exec nx` for all Nx commands. Run `pnpm exec nx sync` if TS project references fall out of sync.

### References

- [Source: docs/planning-artifacts/epics.md — Epic 3, Story 3.2 ACs]
- [Source: docs/planning-artifacts/architecture.md §5.3 — Canvas render strategy, cell toggle]
- [Source: docs/planning-artifacts/architecture.md §7.5 — Color scheme, a11y contrast]
- [Source: docs/planning-artifacts/prd.md — FR2, NFR4]
- [Source: docs/project-context.md §3 Rule 8 — Uint8Array grid, cells[y*width+x]]
- [Source: docs/project-context.md §5 — getBoundingClientRect for hit-testing]
- [Source: libs/sim/src/lib/grid.ts — toggleCell, getCell implementations]
- [Source: libs/sim/src/index.ts — public API barrel exports]
- [Source: apps/src/app/page.tsx — existing page shell from Story 3.1]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (BMAD dev-story workflow)

### Debug Log References

- Added `toggleCell` and `getCell` imports from `@conways-game-of-life/sim` to `page.tsx`.
- Wired `'toggleCell'` case into the existing `simReducer` switch statement — delegates to `toggleCell(state.grid, action.x, action.y)`.
- Upgraded `useEffect` rendering: added alive-cell painting loop between background fill and grid lines. Uses `getCell` to read each cell, paints alive cells with `#22d3ee` via `fillRect`.
- Added `handleCanvasPointerDown` callback with `getBoundingClientRect()` coordinate translation, CSS-scale compensation (`scaleX`/`scaleY`), bounds-checking, and `state.running` guard.
- Added dynamic cursor classes: `cursor-pointer` when paused, `cursor-not-allowed` when running.
- All changes confined to `apps/src/app/page.tsx` — no new files created, no dependency changes needed.

### Completion Notes List

- Imported `toggleCell` and `getCell` from `@conways-game-of-life/sim`.
- Added `'toggleCell'` reducer case returning new state with toggled grid (immutability preserved by sim lib).
- Canvas rendering now paints alive cells in `#22d3ee` (cyan-400) on `#0a0a0a` (neutral-950) background.
- Rendering order: dead background fill → alive cell `fillRect` loop → faint grid lines on top.
- `onPointerDown` handler uses `getBoundingClientRect()` with CSS-scale compensation for accurate hit-testing at any canvas render size.
- Running guard: toggle is a no-op when `state.running` is `true` (AC 3).
- Cursor feedback: `cursor-pointer` when paused, `cursor-not-allowed` when running.
- Extracted color constants: `DEAD_COLOR`, `ALIVE_COLOR`, `GRID_LINE_COLOR`.
- Build passes. Lint passes (0 errors). All 44 existing tests pass (43 sim + 1 types), no regressions.

### Change Log

- 2026-05-11: Implemented canvas rendering and click/tap-to-toggle cells (Story 3.2)

### File List

- docs/implementation-artifacts/3-2-canvas-render-and-click-tap-to-toggle-cells.md (modified — status + tasks + dev record)
- docs/implementation-artifacts/sprint-status.yaml (modified — story status)
- apps/src/app/page.tsx (modified — toggleCell reducer case, alive-cell rendering, onPointerDown handler, cursor classes)
