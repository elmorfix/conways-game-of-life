# Story 2.2: Conway rules engine `step()` with rule-by-rule tests

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer of the simulation core,
I want a pure `step(grid: Grid): Grid` that applies Conway's four rules with off-grid neighbors treated as dead,
so that FR10 has a single canonical implementation that both the web app and (stretch) the API can reuse.

## Acceptance Criteria

1. **Given** a 3×3 grid with a single live cell, **when** `step()` is applied, **then** the resulting grid has zero live cells (rule 1: underpopulation — fewer than 2 neighbors).
2. **Given** a 3×3 grid with a 2×2 block of live cells, **when** `step()` is applied repeatedly across five generations, **then** the grid is unchanged each generation (rule 2: survival — 2–3 neighbors survive; canonical still life).
3. **Given** a 5×5 grid with a horizontal blinker (three live cells in a row), **when** `step()` is applied, **then** the next generation has a vertical blinker, and the generation after returns to horizontal (rule 4: reproduction + rule 1 underpopulation; period-2 oscillator).
4. **Given** a 5×5 grid where a live cell has 4+ live neighbors, **when** `step()` is applied, **then** that cell is dead in the next generation (rule 3: overpopulation).
5. **Given** a grid configured per the canonical glider pattern on a sufficiently large grid, **when** `step()` is applied four times, **then** the live-cell positions translate by `(1, 1)` relative to the start (canonical spaceship).
6. **Given** the same input grid, **when** `step()` is called 100 times in a loop on independent copies, **then** all 100 outputs are byte-identical (determinism).
7. **Given** all the above tests are co-located in `libs/sim/src/lib/rules/conway.spec.ts`, **when** `pnpm exec nx test sim` runs, **then** all tests pass and the suite completes in under 10 seconds.

## Tasks / Subtasks

- [x] Add `RuleSet` interface to `libs/types` (prerequisite for architecture compliance)
  - [x] Add `RuleSet` interface to `libs/types/src/lib/types.ts`: `{ readonly id: string; readonly name: string; step(grid: Grid): Grid; }`
  - [x] Export `RuleSet` from `libs/types/src/index.ts`
- [x] Implement `countNeighbors` helper (internal, not exported from barrel)
  - [x] Create `libs/sim/src/lib/rules/conway.ts`
  - [x] Implement `countNeighbors(grid: Grid, x: number, y: number): number` — counts the 8 surrounding cells using `getCell` (which already handles off-grid as 0)
- [x] Implement `step(grid: Grid): Grid` (AC: 1–6)
  - [x] Apply Conway's four rules simultaneously to all cells:
    - Rule 1 (underpopulation): live cell with < 2 neighbors dies
    - Rule 2 (survival): live cell with 2–3 neighbors survives
    - Rule 3 (overpopulation): live cell with > 3 neighbors dies
    - Rule 4 (reproduction): dead cell with exactly 3 neighbors becomes alive
  - [x] Allocate exactly one new `Uint8Array` per `step()` call — no intermediate grid allocations
  - [x] Use `getCell` for neighbor reads (leverages off-grid → 0 already)
  - [x] Never mutate the input grid
- [x] Implement `conwayRules: RuleSet` object
  - [x] Create `conwayRules` constant satisfying `RuleSet` interface: `{ id: 'conway', name: "Conway's Game of Life", step }`
  - [x] Export both `step` and `conwayRules` from the module
- [x] Update barrel exports in `libs/sim`
  - [x] Export `step` and `conwayRules` from `libs/sim/src/index.ts`
  - [x] Re-export `RuleSet` type from `libs/sim/src/index.ts`
- [x] Write co-located Jest tests (AC: 1–7)
  - [x] Create `libs/sim/src/lib/rules/conway.spec.ts`
  - [x] **Rule 1 (underpopulation):** 3×3 grid, single live cell at center → dies (0 neighbors < 2)
  - [x] **Rule 1 (underpopulation):** live cell with exactly 1 neighbor → dies
  - [x] **Rule 2 (survival):** live cell with exactly 2 neighbors → survives
  - [x] **Rule 2 (survival):** live cell with exactly 3 neighbors → survives
  - [x] **Rule 3 (overpopulation):** live cell with 4+ neighbors → dies
  - [x] **Rule 4 (reproduction):** dead cell with exactly 3 live neighbors → becomes alive
  - [x] **Block still life:** 2×2 block on 4×4 grid, stable across 5 generations
  - [x] **Blinker oscillator:** horizontal 3-cell line on 5×5 → vertical → horizontal (period-2, test 4 generations)
  - [x] **Glider spaceship:** canonical glider on 10×10 grid, translates by (1,1) after 4 steps
  - [x] **Determinism:** same input → `step()` 100 times on independent copies → all outputs byte-identical
  - [x] **Immutability:** `step()` does not mutate the input grid's `cells` array
- [x] Verify lint and module boundaries
  - [x] Run `pnpm exec nx lint sim` — no errors
- [x] Run full test suite
  - [x] `pnpm exec nx test sim` passes with all new + existing tests green
  - [x] Suite completes in under 10 seconds

## Dev Notes

- **This story implements the core Game of Life algorithm.** It is the load-bearing logic of the entire application. Every function must be pure — no I/O, no DOM, no framework imports.
- **Conway's four rules** (applied simultaneously to all cells each generation):
  1. **Underpopulation:** Any live cell with < 2 live neighbors dies.
  2. **Survival:** Any live cell with 2 or 3 live neighbors survives.
  3. **Overpopulation:** Any live cell with > 3 live neighbors dies.
  4. **Reproduction:** Any dead cell with exactly 3 live neighbors becomes alive.
- **"Simultaneously" means:** Read all cells from the current grid, write all cells to a new grid. Do NOT update cells in-place during iteration — that would make earlier cells' new states affect later cells' neighbor counts.
- **Off-grid neighbors are dead (return 0).** No toroidal wrap. `getCell` from Story 2.1 already handles this — use it for neighbor counting.
- **`step` allocates exactly one new `Uint8Array` per call.** Build the output cells array directly using indexed writes `cells[y * width + x] = ...`. Do NOT use `setCell` inside the inner loop (it allocates a new `Uint8Array` per call — that would be width×height allocations instead of 1).
- **`RuleSet` interface** is defined in the architecture for stretch goal extensibility (e.g., HighLife in Epic 8). The `conwayRules` object conforms to this interface. Export both `step` (bare function alias) and `conwayRules` (the `RuleSet` object).
- **Do NOT implement edge-case tests** (empty grid, all-alive 3×3, corner cells) in this story. Those are Story 2.3. This story focuses on the four rules + canonical patterns + determinism.
- **Do NOT implement `randomizeGrid`** — that is Story 2.4.
- **Do NOT implement patterns (`blinker`, `block`, `glider` as `NamedPattern` objects)** — those are Story 5.1. For tests in this story, construct the patterns manually using `createGrid` + `setCell`.

### File Locations (per architecture §5.1)

- `libs/sim/src/lib/rules/conway.ts` — `step()`, `countNeighbors()`, `conwayRules`
- `libs/sim/src/lib/rules/conway.spec.ts` — co-located tests
- `libs/types/src/lib/types.ts` — `RuleSet` interface (add alongside existing `Grid`)

### Existing Code to Build On (from Story 2.1)

- `libs/sim/src/lib/grid.ts` — `createGrid`, `cloneGrid`, `getCell`, `setCell`, `toggleCell`, `clearGrid`
- `libs/types/src/lib/types.ts` — `Grid` interface: `{ readonly width: number; readonly height: number; readonly cells: Uint8Array }`
- Import convention: `import type { Grid } from '@conways-game-of-life/types'`
- Import grid helpers: `import { getCell, createGrid, setCell } from '../grid.js'`

### Cell Indexing Reminder

`cells[y * width + x]` — row-major order. `x` is the column (0-indexed from left), `y` is the row (0-indexed from top). The 8 neighbors of `(x, y)` are: `(x-1,y-1)`, `(x,y-1)`, `(x+1,y-1)`, `(x-1,y)`, `(x+1,y)`, `(x-1,y+1)`, `(x,y+1)`, `(x+1,y+1)`.

### Canonical Pattern Coordinates (for manual test setup)

- **Block (still life):** Live cells at `(1,1)`, `(2,1)`, `(1,2)`, `(2,2)` on a 4×4 grid.
- **Blinker (period-2 oscillator):** Horizontal: `(1,2)`, `(2,2)`, `(3,2)` on a 5×5 grid. After `step()`: vertical at `(2,1)`, `(2,2)`, `(2,3)`.
- **Glider (spaceship):** On a 10×10 grid, start at `(1,0)`, `(2,1)`, `(0,2)`, `(1,2)`, `(2,2)`. After 4 steps, same shape at `(2,1)`, `(3,2)`, `(1,3)`, `(2,3)`, `(3,3)` — translated by `(+1, +1)`.

### Performance Constraint

`step()` on a 100×100 grid should be fast. The single-allocation pattern (one `new Uint8Array(w*h)` per call) ensures this. Do not create intermediate grids or use functional patterns that allocate per-cell.

### Architecture Compliance

- [Source: docs/planning-artifacts/architecture.md §5.1] — `step` signature, `RuleSet` interface, `conwayRules` object, single-allocation invariant, off-grid-is-dead.
- [Source: docs/project-context.md §3 Rules 4, 9, 10] — sim purity, `step` is pure with one `Uint8Array` allocation, tests land with code.
- [Source: docs/project-context.md §6] — No toroidal wrap. Off-grid is dead.

### Previous Story Intelligence (Story 2.1)

- Grid helpers are working and tested (24 tests pass in ~1.1s).
- `getCell` returns 0 for out-of-bounds — this is the foundation for neighbor counting.
- Import convention: `@conways-game-of-life/types` for types, relative `./grid.js` for internal sim imports.
- `nx sync` may be needed after adding new files or dependencies.
- Use `pnpm exec nx` for all Nx commands.
- Lint and tests both pass cleanly on the `sim` project.

### References

- [Source: docs/planning-artifacts/epics.md — Epic 2, Story 2.2 ACs]
- [Source: docs/planning-artifacts/architecture.md §5.1 — step(), RuleSet, conwayRules, invariants]
- [Source: docs/project-context.md §3 Rules 4, 9, 10 — sim purity, step allocation, test colocation]
- [Source: docs/project-context.md §6 — No toroidal wrap gotcha]
- [Source: libs/sim/src/lib/grid.ts — Grid helper implementations from Story 2.1]
- [Source: libs/sim/src/lib/grid.spec.ts — Test patterns from Story 2.1]
- [Source: https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life — Canonical four rules]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (BMAD dev-story workflow)

### Debug Log References

- Loaded Story 2.1 completed file for previous story intelligence.
- Confirmed import convention is `@conways-game-of-life/types` (scoped package names on this branch).
- Verified `RuleSet` interface does not yet exist in `libs/types` — added it.
- Created `libs/sim/src/lib/rules/` directory for Conway rules module.
- RED phase: conway.spec.ts failed as expected (conway.ts did not exist yet).
- GREEN phase: all 37 tests pass (24 grid + 13 conway) in ~2.1s.
- Lint passes for both `sim` and `types` with 0 errors.
- Jest 30 uses `--testPathPatterns` (plural) not `--testPathPattern`.

### Completion Notes List

- Added `RuleSet` interface (`{ id, name, step }`) to `libs/types/src/lib/types.ts` alongside `Grid`.
- Exported `RuleSet` from `libs/types/src/index.ts`.
- Implemented `countNeighbors(grid, x, y)` — sums 8 surrounding cells via `getCell` (off-grid → 0).
- Implemented `step(grid: Grid): Grid` — applies all four Conway rules simultaneously, allocates exactly one `Uint8Array`.
- Implemented `conwayRules: RuleSet` object with `id: 'conway'`.
- Updated `libs/sim/src/index.ts` barrel to export `step`, `conwayRules`, and `RuleSet` type.
- 13 behavioral tests in `conway.spec.ts`:
  - Rule 1 (underpopulation): 2 tests (0 neighbors, 1 neighbor)
  - Rule 2 (survival): 2 tests (2 neighbors, 3 neighbors)
  - Rule 3 (overpopulation): 1 test (4 neighbors)
  - Rule 4 (reproduction): 1 test (dead cell + 3 neighbors)
  - Block still life: stable across 5 generations
  - Blinker oscillator: period-2 across 4 generations
  - Glider spaceship: translates by (1,1) after 4 steps
  - Determinism: 100 runs produce byte-identical output
  - Immutability: input grid unchanged after step()
  - conwayRules RuleSet: correct id/name + matches standalone step()
- Full suite: 37 tests, 2 suites, ~2.1s (threshold: 10s).

### Change Log

- 2026-05-11: Implemented Conway rules engine step() with rule-by-rule tests (Story 2.2)

### File List

- docs/implementation-artifacts/2-2-conway-rules-engine-step-with-rule-by-rule-tests.md
- docs/implementation-artifacts/sprint-status.yaml
- libs/types/src/lib/types.ts (modified — added RuleSet interface)
- libs/types/src/index.ts (modified — exports RuleSet type)
- libs/sim/src/lib/rules/conway.ts (new — step(), countNeighbors(), conwayRules)
- libs/sim/src/lib/rules/conway.spec.ts (new — 13 behavioral tests)
- libs/sim/src/index.ts (modified — exports step, conwayRules, RuleSet)
