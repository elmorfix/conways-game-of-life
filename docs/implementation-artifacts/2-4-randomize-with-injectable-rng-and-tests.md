# Story 2.4: Randomize with injectable RNG and tests

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer of the simulation core,
I want `randomizeGrid(grid, density?, rng?)` that accepts a seedable RNG,
so that production uses `Math.random` while tests use a deterministic seed for reproducibility.

## Acceptance Criteria

1. **Given** the function signature `randomizeGrid(grid, density = 0.3, rng = Math.random): Grid`, **when** called without arguments beyond `grid`, **then** each cell is independently alive with probability ~0.3 (verified statistically with a fixed seed in tests, not asserted on a single draw).
2. **Given** a deterministic seeded RNG (e.g., a tiny `mulberry32`), **when** `randomizeGrid` is called twice with the same seed and same dimensions, **then** the two output grids are byte-identical.
3. **Given** `density = 0` or `density = 1`, **when** `randomizeGrid` is called, **then** the grid is all-dead or all-alive respectively (boundary cases of the density parameter).
4. **Given** the spec lives at `libs/sim/src/lib/grid.spec.ts`, **when** `pnpm exec nx test sim` runs, **then** all randomize-related assertions pass.

## Tasks / Subtasks

- [x] Implement `randomizeGrid` in `libs/sim/src/lib/grid.ts` (AC: 1–3)
  - [x] Signature: `randomizeGrid(grid: Grid, density = 0.3, rng: () => number = Math.random): Grid`
  - [x] Each cell independently set to 1 if `rng() < density`, else 0
  - [x] Returns new `Grid` — does not mutate input
  - [x] Allocates exactly one new `Uint8Array`
- [x] Update barrel exports
  - [x] Export `randomizeGrid` from `libs/sim/src/index.ts`
- [x] Write co-located Jest tests in `libs/sim/src/lib/grid.spec.ts` (AC: 1–4)
  - [x] Create a `mulberry32` seeded RNG helper at the top of the test file (or inline)
  - [x] **Determinism:** same seed + same grid dimensions → byte-identical output across 2 calls
  - [x] **Statistical density:** with seeded RNG and density=0.3 on a large grid (e.g., 100×100), assert live cell ratio is within 0.25–0.35 (loose tolerance for statistical variance)
  - [x] **Density 0 boundary:** `density = 0` → all cells dead
  - [x] **Density 1 boundary:** `density = 1` → all cells alive
  - [x] **Immutability:** original grid not mutated
  - [x] **Default density:** called without density arg, verify grid has some alive and some dead cells (with seeded RNG for reproducibility)
- [x] Verify lint and module boundaries
  - [x] Run `pnpm exec nx lint sim` — no errors
- [x] Run full test suite
  - [x] `pnpm exec nx test sim` passes with all new + existing tests green
  - [x] Suite completes in under 10 seconds

## Dev Notes

- **This is the last story in Epic 2.** After this, the pure simulation core in `libs/sim` is complete for MVP.
- **`randomizeGrid` lives in `grid.ts`** alongside the other grid helpers, NOT in a new file. It is a grid primitive, not a rule.
- **Injectable RNG is a hard requirement** per project-context.md rule #11. The default is `Math.random` for production; tests must pass a seeded RNG for reproducibility.
- **`mulberry32` is the recommended seeded RNG** for tests. It's a tiny (4-line) function that produces a `() => number` from a seed:

```typescript
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

Place this as a local helper in the test file — do NOT add it to production code. The architecture says "tests pass a seeded `mulberry32` for reproducibility."

- **Statistical testing approach:** Do NOT assert exact cell values for density=0.3 — that would be fragile. Instead, on a large grid (100×100 = 10,000 cells), count the live cells and assert the ratio is within a tolerance band (e.g., 0.25–0.35 for density=0.3).
- **`randomizeGrid` allocates one `Uint8Array`** — iterate cells and write directly. Do NOT use `setCell` (which allocates per call).
- **Do NOT add `mulberry32` to production exports.** It is test-only infrastructure.

### Architecture Compliance

- [Source: docs/planning-artifacts/architecture.md §5.1] — `randomizeGrid(grid, density?, rng?)` signature, injectable RNG, density default 0.3.
- [Source: docs/project-context.md §3 Rule 11] — `randomizeGrid` accepts injectable RNG. Tests use seeded `mulberry32`. Production uses `Math.random`.
- [Source: docs/project-context.md §3 Rule 4] — `libs/sim` is pure. `Math.random` is acceptable as a default parameter (not called at module level).
- [Source: docs/project-context.md §5] — Test colocation: tests in `grid.spec.ts` next to `grid.ts`.

### Existing Code to Extend

- `libs/sim/src/lib/grid.ts` — add `randomizeGrid` here alongside `createGrid`, `cloneGrid`, etc.
- `libs/sim/src/lib/grid.spec.ts` — add `describe('randomizeGrid')` block at the end
- `libs/sim/src/index.ts` — add `randomizeGrid` to the barrel export list
- Import convention: `import type { Grid } from '@conways-game-of-life/types'`

### Previous Story Intelligence (Stories 2.1–2.3)

- 43 total tests currently pass (24 grid + 19 conway) in ~2.5s.
- Grid helpers follow pure-function pattern: return new `Grid`, never mutate input.
- Use `pnpm exec nx` for all Nx commands.
- May need `nx reset` if cache hides new tests.
- Lint passes with 0 errors on `sim`.

### References

- [Source: docs/planning-artifacts/epics.md — Epic 2, Story 2.4 ACs]
- [Source: docs/planning-artifacts/architecture.md §5.1 — randomizeGrid signature]
- [Source: docs/project-context.md §3 Rule 11 — injectable RNG requirement]
- [Source: libs/sim/src/lib/grid.ts — existing grid helpers]
- [Source: libs/sim/src/lib/grid.spec.ts — existing grid tests to extend]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (BMAD dev-story workflow)

### Debug Log References

- RED phase: tests failed as expected (`randomizeGrid` not yet exported from `grid.ts`).
- GREEN phase: all 49 tests pass after implementation.
- `mulberry32` seeded RNG placed as test-only helper at top of `grid.spec.ts`.
- Statistical density test on 100×100 grid passes within 0.25–0.35 tolerance band.
- Lint passes with 0 errors.

### Completion Notes List

- Implemented `randomizeGrid(grid, density=0.3, rng=Math.random): Grid` in `libs/sim/src/lib/grid.ts`.
- Single `Uint8Array` allocation, iterates cells directly with `rng() < density` threshold.
- Added `mulberry32` seeded RNG helper to test file (test-only, not exported).
- 6 new tests in `describe('randomizeGrid')` block:
  1. Determinism: same seed → byte-identical output
  2. Statistical density: ~30% live cells on 100×100 grid (tolerance 0.25–0.35)
  3. Density 0 → all dead
  4. Density 1 → all alive
  5. Immutability: original grid not mutated
  6. Default density: mix of alive and dead cells
- Exported `randomizeGrid` from `libs/sim/src/index.ts`.
- Full suite: 49 tests (30 grid + 19 conway), ~2.1s (threshold: 10s).
- This completes Epic 2 — the pure simulation core in `libs/sim`.

### Change Log

- 2026-05-11: Implemented randomizeGrid with injectable RNG and tests (Story 2.4)

### File List

- docs/implementation-artifacts/2-4-randomize-with-injectable-rng-and-tests.md
- docs/implementation-artifacts/sprint-status.yaml
- libs/sim/src/lib/grid.ts (modified — added randomizeGrid)
- libs/sim/src/lib/grid.spec.ts (modified — added mulberry32 helper + 6 randomize tests)
- libs/sim/src/index.ts (modified — exports randomizeGrid)
