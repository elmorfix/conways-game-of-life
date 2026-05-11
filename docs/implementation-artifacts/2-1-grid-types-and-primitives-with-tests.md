# Story 2.1: Grid types and primitives with tests

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer of the simulation core,
I want a `Grid` type backed by a flat `Uint8Array` plus pure helpers (`createGrid`, `cloneGrid`, `getCell`, `setCell`, `toggleCell`, `clearGrid`),
so that the rules engine has a stable, allocation-controlled, framework-free data model to operate on.

## Acceptance Criteria

1. **Given** the `Grid` interface is defined as `{ readonly width: number; readonly height: number; readonly cells: Uint8Array }` in `libs/types` and re-exported from `libs/sim`, **when** any helper is called, **then** it returns a new `Grid` rather than mutating the input (immutability invariant).
2. **Given** `getCell(g, x, y)` is called with out-of-bounds `(x, y)`, **then** it returns `0` (off-grid is dead, per FR10 — no toroidal wrap).
3. **Given** Jest specs co-located with the source, **when** `pnpm exec nx test sim` runs, **then** specs assert: `createGrid(w, h)` produces `cells.length === w*h` all-zero; `setCell` flips exactly the indexed cell; `toggleCell` is its own inverse; `clearGrid` zeroes every cell; `cloneGrid` returns a deep-equal but reference-distinct grid.
4. **Given** the boundary rule from Story 1.2 is active, **when** any source file in `libs/sim` imports React, `next/*`, `@nestjs/*`, or `fetch`, **then** lint fails (already enforced via `no-restricted-imports` in `libs/sim/eslint.config.mjs`).

## Tasks / Subtasks

- [x] Define `Grid` interface in `libs/types` (AC: 1)
  - [x] Replace placeholder `types()` function in `libs/types/src/lib/types.ts` with the `Grid` interface: `{ readonly width: number; readonly height: number; readonly cells: Uint8Array }`
  - [x] Export `Grid` from `libs/types/src/index.ts`
- [x] Implement grid helpers in `libs/sim` (AC: 1, 2)
  - [x] Create `libs/sim/src/lib/grid.ts` with pure functions: `createGrid`, `cloneGrid`, `getCell`, `setCell`, `toggleCell`, `clearGrid`
  - [x] Import `Grid` from `types` package (the workspace resolves `import { Grid } from 'types'` via pnpm workspace + Nx TypeScript project references)
  - [x] `createGrid(width, height)` — returns `Grid` with `new Uint8Array(width * height)` (all-zero)
  - [x] `cloneGrid(grid)` — returns new `Grid` with `new Uint8Array(grid.cells)` (copy, not reference)
  - [x] `getCell(grid, x, y)` — returns `0 | 1`; out-of-bounds returns `0` (not throw)
  - [x] `setCell(grid, x, y, alive: 0 | 1)` — returns new `Grid` with the single cell changed
  - [x] `toggleCell(grid, x, y)` — returns new `Grid` with cell flipped (0→1, 1→0)
  - [x] `clearGrid(grid)` — returns new `Grid` with all cells zeroed (same dimensions)
  - [x] All functions are pure — no mutation of input, no I/O, no framework imports
  - [x] Add input validation: throw `RangeError` for negative dimensions or `cells.length !== width * height` (programmer errors, not user input)
- [x] Update barrel exports in `libs/sim` (AC: 1)
  - [x] Replace placeholder `sim()` function in `libs/sim/src/lib/sim.ts` or remove it
  - [x] Export all grid helpers and re-export `Grid` from `libs/sim/src/index.ts`
- [x] Write co-located Jest tests (AC: 3)
  - [x] Create `libs/sim/src/lib/grid.spec.ts` with tests for every helper
  - [x] `createGrid`: produces correct `cells.length`, all cells are 0
  - [x] `setCell`: flips exactly the indexed cell, does not mutate original
  - [x] `toggleCell`: is its own inverse (toggle twice = original), does not mutate original
  - [x] `clearGrid`: zeroes every cell, preserves dimensions, does not mutate original
  - [x] `cloneGrid`: returns deep-equal but reference-distinct grid
  - [x] `getCell`: returns correct value for valid coords, returns 0 for out-of-bounds (negative, beyond width/height)
  - [x] Input validation: `createGrid` with negative dims throws `RangeError`
- [x] Verify module boundary enforcement (AC: 4)
  - [x] Run `pnpm exec nx lint sim` and confirm it passes with no framework imports
- [x] Run full test suite (AC: 3)
  - [x] `pnpm exec nx test sim` passes with all new tests green
  - [x] Suite completes in under 10 seconds

## Dev Notes

- **This is the first story that adds application logic.** All prior stories were scaffolding/CI. This story establishes the foundational data model for the entire simulation core.
- **Immutability is a hard invariant.** Every function returns a new `Grid`. Never mutate `grid.cells` in place. The `readonly` modifier on the `Grid` interface enforces this at the type level.
- **`Uint8Array` is required** — do not use `boolean[][]`, `Set<string>`, or other representations. The flat array is required for cache-friendliness, zero per-cell allocation, `transferList`-friendly Worker upgrade (Epic 6), and clean serialization. Cells are `0` (dead) or `1` (alive).
- **Cell indexing:** `cells[y * width + x]` — row-major order. This is the canonical layout used throughout the architecture.
- **Off-grid returns 0, does not throw.** `getCell` with out-of-bounds coordinates returns `0`. This makes the rules engine simpler (no boundary checks when counting neighbors). Only programmer errors (negative dimensions, length mismatch) throw `RangeError`.
- **Do NOT implement `step()`, `randomizeGrid()`, or patterns** in this story. Those are Stories 2.2–2.4 and 5.1 respectively.
- **Remove or replace the placeholder** `sim()` function in `libs/sim/src/lib/sim.ts` and the placeholder `types()` function in `libs/types/src/lib/types.ts`. They are generator stubs.

### Existing Project Structure

- `libs/sim/` — project `sim`, tag `scope:sim`, Jest configured via `jest.config.cts` with SWC transform, `testEnvironment: 'node'`
- `libs/types/` — project `types`, tag `scope:types`, leaf dependency (no imports allowed)
- `libs/sim/eslint.config.mjs` — already has `no-restricted-imports` blocking React, Next, NestJS imports
- `libs/sim/src/lib/sim.ts` — placeholder `sim()` function (to be replaced)
- `libs/sim/src/lib/sim.spec.ts` — placeholder test (to be replaced or removed)
- `libs/types/src/lib/types.ts` — placeholder `types()` function (to be replaced with `Grid` interface)

### Import Path Convention

This Nx 22 workspace uses **pnpm workspace resolution + TypeScript project references** (not `tsconfig.base.json` path aliases). Package names are bare: `sim` and `types` (not `@conways-game-of-life/sim`).

- To import `Grid` in `libs/sim`: `import type { Grid } from 'types';`
- The `customConditions: ["conways-game-of-life"]` in `tsconfig.base.json` combined with the `"conways-game-of-life": "./src/index.ts"` export map in each lib's `package.json` resolves to source in development.

### TypeScript Configuration

- `tsconfig.base.json` has `"strict": true` and `target: "es2022"`.
- **Note:** `"noUncheckedIndexedAccess"` is not currently set in `tsconfig.base.json` but is recommended by `project-context.md`. If adding it, it would force explicit undefined checks on `grid.cells[i]` — use the non-null assertion `!` operator or guard when you know the index is in bounds, or add it in a separate commit.

### Architecture Compliance

- [Source: docs/planning-artifacts/architecture.md §5.1] — `Grid` type definition, function signatures, immutability invariants, off-grid-is-dead rule.
- [Source: docs/project-context.md §3 Rules 4, 8, 9] — `libs/sim` is pure, `Uint8Array` is required, no mutation of input.
- [Source: docs/project-context.md §5] — Test colocation: `foo.spec.ts` sits next to `foo.ts`.

### Testing Requirements

- Co-located tests in `libs/sim/src/lib/grid.spec.ts`.
- Run via `pnpm exec nx test sim`.
- Must complete in under 10 seconds.
- Tests should be behavioral, not just coverage-chasing. Each helper gets its own `describe` block.

### Epic 1 Retrospective Learnings

- Use `pnpm exec nx` for all Nx commands (not `pnpm nx` or `npx nx`).
- Verify CLI tools are explicit `devDependencies` before writing CI/scripts.

### References

- [Source: docs/planning-artifacts/epics.md — Epic 2, Story 2.1 ACs]
- [Source: docs/planning-artifacts/architecture.md §5.1 — Grid type, helpers, invariants]
- [Source: docs/project-context.md §3 Rules 4, 8, 9, 10 — sim purity, Uint8Array, immutability, co-located tests]
- [Source: libs/sim/project.json — tag scope:sim]
- [Source: libs/sim/eslint.config.mjs — no-restricted-imports]
- [Source: libs/sim/jest.config.cts — SWC transform, node environment]
- [Source: libs/types/package.json — bare package name `types`]
- [Source: docs/retrospectives/epic-1.md — pnpm exec nx pattern]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (BMAD dev-story workflow)

### Debug Log References

- Inspected `libs/sim/` and `libs/types/` file structure, placeholder code, ESLint config, Jest config.
- Confirmed import convention: bare `types` package name via pnpm workspace, not path aliases.
- Noted `tsconfig.base.json` lacks `noUncheckedIndexedAccess`.
- RED phase: tests failed as expected (grid.ts did not exist yet).
- GREEN phase: all 24 tests pass after implementation.
- Ran `nx sync` to resolve TypeScript project reference sync warning before first test run.
- Lint passes for both `sim` and `types` with 0 errors.

### Completion Notes List

- Replaced placeholder `types()` function with `Grid` interface in `libs/types/src/lib/types.ts`.
- Updated `libs/types/src/lib/types.spec.ts` to validate Grid structural assignability.
- Implemented 6 pure grid helpers in `libs/sim/src/lib/grid.ts`: `createGrid`, `cloneGrid`, `getCell`, `setCell`, `toggleCell`, `clearGrid`.
- All functions return new `Grid` instances — immutability invariant upheld, no input mutation.
- `getCell` returns 0 for all out-of-bounds coordinates (off-grid is dead).
- `createGrid` throws `RangeError` for non-positive dimensions.
- Replaced placeholder `sim()` with re-exports in `libs/sim/src/lib/sim.ts`.
- Updated barrel `libs/sim/src/index.ts` with all grid helpers + re-exported `Grid` type.
- Deleted placeholder `libs/sim/src/lib/sim.spec.ts`.
- 24 behavioral tests in `grid.spec.ts` covering all 6 helpers + edge cases + validation.
- 1 type-structural test in `types.spec.ts`.
- Suite completes in ~1.1 seconds (threshold: 10s).
- Lint passes with 0 errors on both `sim` and `types`.

### Change Log

- 2026-05-11: Implemented Grid type and primitives with co-located tests (Story 2.1)

### File List

- docs/implementation-artifacts/2-1-grid-types-and-primitives-with-tests.md
- docs/implementation-artifacts/sprint-status.yaml
- libs/types/src/lib/types.ts (modified — Grid interface replaces placeholder)
- libs/types/src/lib/types.spec.ts (modified — structural test replaces placeholder)
- libs/types/src/index.ts (modified — exports Grid type)
- libs/sim/src/lib/grid.ts (new — 6 pure grid helpers)
- libs/sim/src/lib/grid.spec.ts (new — 24 behavioral tests)
- libs/sim/src/lib/sim.ts (modified — re-exports grid helpers + Grid type)
- libs/sim/src/lib/sim.spec.ts (deleted — placeholder removed)
- libs/sim/src/index.ts (modified — barrel exports grid helpers + Grid type)
