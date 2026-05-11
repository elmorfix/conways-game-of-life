# Story 2.3: Edge-case and boundary tests for `step()`

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer of the simulation core,
I want explicit Jest coverage of edge cases the four rules don't visibly exercise,
so that the test suite constrains real behavior, not just the happy path.

## Acceptance Criteria

1. **Given** an empty grid (all cells dead), **when** `step()` is applied, **then** the result is still empty (no spontaneous life).
2. **Given** a 3×3 grid with all cells alive, **when** `step()` is applied, **then** the output matches the hand-computed reference cell-by-cell (see Dev Notes for expected result).
3. **Given** a live cell at the corner `(0, 0)` of a 5×5 grid with no other live cells, **when** `step()` is applied, **then** the cell dies (off-grid neighbors are treated as dead, so neighbor count is 0, rule 1).
4. **Given** a 1×1 grid with a single live cell, **when** `step()` is applied, **then** the cell dies (rule 1, no neighbors).

## Tasks / Subtasks

- [x] Add edge-case tests to `libs/sim/src/lib/rules/conway.spec.ts` (AC: 1–4)
  - [x] **Empty grid:** `step()` on all-dead grid returns all-dead grid (no spontaneous life)
  - [x] **All-alive 3×3:** verify cell-by-cell against hand-computed reference (corners survive, edges and center die)
  - [x] **Corner cell (0,0):** single live cell at (0,0) on 5×5 grid → dies (0 off-grid neighbors)
  - [x] **Corner cell (width-1, height-1):** single live cell at far corner → dies (symmetry check)
  - [x] **1×1 grid:** single live cell dies (no neighbors exist)
  - [x] **1×1 grid (dead):** single dead cell stays dead
- [x] Run full test suite
  - [x] `pnpm exec nx test sim` passes with all new + existing tests green
  - [x] Suite completes in under 10 seconds
- [x] Verify lint
  - [x] Run `pnpm exec nx lint sim` — no errors

## Dev Notes

- **This is a test-only story.** No new production code. Only new test cases added to the existing `conway.spec.ts` file.
- **Tests go into the existing file** `libs/sim/src/lib/rules/conway.spec.ts` — add a new `describe('Edge cases')` block at the end, after the existing tests.
- **Do NOT create a new test file.** All `step()` tests live together in `conway.spec.ts`.

### Hand-Computed Reference: 3×3 All-Alive

Input (all 9 cells alive):
```
1 1 1
1 1 1
1 1 1
```

Neighbor counts:
- `(0,0)`: 3 neighbors → survives (rule 2)
- `(1,0)`: 5 neighbors → dies (rule 3: overpopulation)
- `(2,0)`: 3 neighbors → survives (rule 2)
- `(0,1)`: 5 neighbors → dies (rule 3)
- `(1,1)`: 8 neighbors → dies (rule 3)
- `(2,1)`: 5 neighbors → dies (rule 3)
- `(0,2)`: 3 neighbors → survives (rule 2)
- `(1,2)`: 5 neighbors → dies (rule 3)
- `(2,2)`: 3 neighbors → survives (rule 2)

Expected output (only corners survive):
```
1 0 1
0 0 0
1 0 1
```

**Note:** The epics file says "the four corner cells die" but this is incorrect — corners each have exactly 3 neighbors, so they **survive** (rule 2: 2–3 neighbors survive). The edge and center cells die due to overpopulation. The story file uses the correct hand-computed reference.

### Existing Test Coverage (from Story 2.2)

Already in `conway.spec.ts` (13 tests):
- Rule 1 (underpopulation): 0 neighbors, 1 neighbor
- Rule 2 (survival): 2 neighbors, 3 neighbors
- Rule 3 (overpopulation): 4 neighbors
- Rule 4 (reproduction): 3 neighbors on dead cell
- Block still life (5 gen), Blinker oscillator (4 gen), Glider spaceship (+1,+1)
- Determinism (100 runs), Immutability, conwayRules conformance

What this story adds (not yet covered):
- Empty grid stays empty
- All-alive 3×3 full cell-by-cell verification
- Corner cells with off-grid neighbors
- 1×1 grid boundary case

### Utility Function

The existing `liveCells(g)` helper in `conway.spec.ts` can be reused for assertions. For cell-by-cell verification, use `getCell(result, x, y)` directly.

### Import Convention

Same as existing tests: `import { createGrid, setCell, getCell } from '../grid.js'` and `import { step } from './conway.js'`.

### Previous Story Intelligence (Story 2.2)

- 37 total tests currently pass (24 grid + 13 conway) in ~2.1s.
- `liveCells()` helper already defined at top of conway.spec.ts.
- Jest 30 uses `--testPathPatterns` (plural), not `--testPathPattern`.
- Use `pnpm exec nx test sim` to run.

### References

- [Source: docs/planning-artifacts/epics.md — Epic 2, Story 2.3 ACs]
- [Source: docs/planning-artifacts/architecture.md §5.1 — Edge case test requirements: empty, single cell, all-alive, corners]
- [Source: docs/project-context.md §3 Rule 10 — Tests land with code, edge cases required]
- [Source: libs/sim/src/lib/rules/conway.spec.ts — Existing tests to extend]
- [Source: libs/sim/src/lib/rules/conway.ts — step() implementation]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (BMAD dev-story workflow)

### Debug Log References

- Loaded existing conway.spec.ts (13 tests) and added 6 edge-case tests in a new `describe('Edge cases')` block.
- All 6 tests passed on first run (no RED-phase needed — `step()` already works correctly for these cases; the tests just constrain the behavior).
- Had to `nx reset` to bust Nx cache that was hiding the new test count.
- Full suite: 43 tests (24 grid + 19 conway including edge cases), ~2.5s.

### Completion Notes List

- Added 6 edge-case tests to `conway.spec.ts` in a new `describe('Edge cases')` block:
  1. Empty grid stays empty (no spontaneous life)
  2. All-alive 3×3: cell-by-cell verification — corners survive (3 neighbors), edges die (5 neighbors), center dies (8 neighbors)
  3. Corner cell (0,0) on 5×5 with no neighbors → dies
  4. Far corner cell (4,4) on 5×5 with no neighbors → dies (symmetry check)
  5. 1×1 grid: live cell dies (no neighbors)
  6. 1×1 grid: dead cell stays dead
- No production code changes — test-only story.
- All 43 tests pass in ~2.5s (threshold: 10s).
- Lint passes with 0 errors.

### Change Log

- 2026-05-11: Added edge-case and boundary tests for step() (Story 2.3)

### File List

- docs/implementation-artifacts/2-3-edge-case-and-boundary-tests-for-step.md
- docs/implementation-artifacts/sprint-status.yaml
- libs/sim/src/lib/rules/conway.spec.ts (modified — added 6 edge-case tests)
