# Story 3.1: Page shell, canvas size form, and responsive layout

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Casey,
I want to land on a page with a sensible-default empty grid and a width × height form to resize it,
so that I can start interacting within seconds on either desktop or my 375px portrait phone.

## Acceptance Criteria

1. **Given** the deployed (or locally running) page is loaded, **when** the user opens it on a desktop ≥1280px viewport, **then** the canvas and all primary controls are visible together with no scrolling.
2. **Given** the page is loaded on a 375px portrait viewport, **when** the page renders, **then** controls reflow vertically, the canvas scales to fit width, and there is no horizontal scrollbar.
3. **Given** the canvas size form, **when** the user enters a valid width and height within `[5, 100]`, **then** the grid renders at the new dimensions and the generation counter resets to 0.
4. **Given** the canvas size form, **when** the user enters a value outside `[5, 100]` (zero, negative, >100, non-numeric), **then** the input is rejected with a visible message and the previous size is retained.
5. **Given** the simulation is running, **when** the user submits a new canvas size, **then** the simulation pauses and the grid resets (pause + clear, per architecture §10 Open Question 1).

## Tasks / Subtasks

- [x] Set up Tailwind CSS for the Next.js app (prerequisite for all UI work)
  - [x] Install Tailwind CSS, PostCSS, and autoprefixer as dev dependencies
  - [x] Create `postcss.config.js` at project root with `@tailwindcss/postcss` + autoprefixer (Tailwind v4 — CSS-first config, no `tailwind.config.ts` needed)
  - [x] Replace `apps/src/app/global.css` with Tailwind v4 import (`@import "tailwindcss";`)
  - [x] Verify the build still works: `pnpm exec nx build apps`
- [x] Set up page-level state management with `useReducer` (AC: 1, 3, 5)
  - [x] Mark `page.tsx` as `'use client'`
  - [x] Define the simulation state type: `{ grid: Grid; running: boolean; genCount: number; genPerSec: number }`
  - [x] Define reducer actions: `'resize'` (takes `{ width, height }`, resets grid + pauses + resets genCount), `'tick'`, `'toggleCell'`, `'clear'`, `'randomize'`, `'setRunning'`, `'setGenPerSec'`
  - [x] Initialize default state: 30×30 empty grid, `running: false`, `genCount: 0`, `genPerSec: 10`
  - [x] Import `createGrid` from `@conways-game-of-life/sim`
- [x] Create `GridSizeForm` component (AC: 3, 4, 5)
  - [x] Create `apps/src/app/components/GridSizeForm.tsx`
  - [x] Two `<input type="number">` fields for width and height, with `min={5}`, `max={100}`, `aria-label`
  - [x] A submit button labeled "Resize"
  - [x] Local form state for pending width/height values (separate from committed grid dimensions)
  - [x] Validation on submit: reject values outside `[5, 100]`, non-integer, or non-numeric with a visible error message below the form
  - [x] On valid submit: dispatch `'resize'` action to the reducer (which pauses simulation + clears grid + resets gen counter)
  - [x] Form fields pre-populated with the current grid dimensions
  - [x] `data-testid="grid-size-form"`, `data-testid="width-input"`, `data-testid="height-input"`, `data-testid="resize-btn"` for E2E targeting
- [x] Create the canvas placeholder element (AC: 1, 2)
  - [x] Add a `<canvas>` element to the page with `data-testid="grid-canvas"`
  - [x] Canvas element dimensions: `width={grid.width * cellSize}`, `height={grid.height * cellSize}` where `cellSize` is computed to fit the container
  - [x] Wrap canvas in a responsive container that constrains the canvas to the available viewport width on mobile
  - [x] Render the empty grid background (`#0a0a0a` fill) on initial mount via a `useEffect` with faint grid lines
  - [x] Note: full cell rendering and click-to-toggle are Story 3.2 — this story only needs the canvas element present and sized correctly
- [x] Build the page shell layout (AC: 1, 2)
  - [x] Replace the entire Nx scaffold placeholder in `apps/src/app/page.tsx` with the simulation page
  - [x] Layout structure: header (title + gen counter), main area (canvas), controls sidebar/footer (grid size form + placeholder for future controls)
  - [x] Desktop (≥1280px / `lg:` breakpoint): two-column layout where canvas and controls are visible together without scrolling
  - [x] Mobile (375px): controls stack vertically below the canvas, canvas scales to fit container width, no horizontal scrollbar
  - [x] Use Tailwind responsive utilities (`flex`, `lg:`) — no CSS Modules or `<style>` tags
  - [x] Display generation counter with `data-testid="gen-count"` showing current `genCount` value (always visible)
  - [x] Dark theme: `bg-neutral-950 text-neutral-100` on body/page (per architecture §7.5 color scheme)
- [x] Update `apps/src/app/layout.tsx` metadata
  - [x] Change `title` to "Conway's Game of Life"
  - [x] Change `description` to a meaningful description
- [x] Delete `apps/src/app/page.module.css` (no longer needed — using Tailwind)
- [x] Verify responsive layout (AC: 1, 2)
  - [x] Desktop layout: flexbox with `lg:flex-row`, canvas fills available space, sidebar fixed at `lg:w-64`
  - [x] Mobile layout: `flex-col` stacks canvas above controls, canvas uses `max-width: 100%; height: auto` CSS to fit
- [x] Verify module boundaries (AC: prerequisite)
  - [x] Run `pnpm exec nx lint apps` — passes with 0 errors (only pre-existing warnings)
- [x] Run full build to verify no breakage
  - [x] `pnpm exec nx build apps` succeeds
  - [x] `pnpm exec nx lint apps` passes
  - [x] `pnpm exec nx test sim` — 43 tests pass, no regressions
  - [x] `pnpm exec nx test types` — 1 test passes, no regressions

## Dev Notes

- **This is the first UI story.** It replaces the raw Nx scaffold page with the simulation shell. All subsequent Epic 3 stories build on this foundation.
- **Tailwind setup is a prerequisite.** The architecture standardizes on Tailwind CSS (§4.6). This must be set up before any styled UI work. Do not use CSS Modules or `<style>` tags.
- **The Next.js app project is named `apps`** (not `web` as the architecture suggests). The source lives at `apps/src/app/`, not `apps/web/app/`. Adjust all file paths accordingly.
- **`'use client'` is required on `page.tsx`.** The simulation page uses `useState`/`useReducer`, `useEffect`, `useRef` — all client-only hooks. The page must be marked as a client component.
- **State shape per architecture §4.5:** `useReducer` manages `grid + genCount` as an atomic pair. `running` and `genPerSec` can be separate `useState` calls or part of the reducer — pick one approach and stick with it.
- **Default grid is 30×30** per PRD assumptions. Default `genPerSec` is 10. Default `running` is `false`.
- **Canvas-resize-mid-run behavior:** pause + clear (architecture §10 Open Question 1). The `'resize'` reducer action sets `running: false`, creates a new empty grid at the new dimensions, and resets `genCount` to 0.
- **Canvas rendering:** This story only needs the canvas element placed and sized. Fill it with the dead-cell background color (`#0a0a0a`) on mount. Full cell rendering (alive/dead pixel painting) and click-to-toggle are Story 3.2.
- **Cell size calculation:** Compute `cellSize` to fit the canvas within its container. A simple approach: `Math.floor(containerWidth / grid.width)` clamped to a reasonable range (e.g., 4–20px). On desktop the canvas can be larger; on mobile it must scale down to fit 375px without overflow.
- **Color scheme (architecture §7.5):** Dark background `neutral-950` (`#0a0a0a`), alive cells `cyan-400` (`#22d3ee`) — but cell painting is Story 3.2. This story just sets up the dark page background and canvas background.
- **Generation counter:** Display `genCount` prominently. Use `data-testid="gen-count"` for E2E targeting. The counter shows 0 on initial load and after resize.
- **Do NOT implement** play/pause/step controls, speed slider, clear/randomize buttons, cell toggle, or the simulation loop in this story. Those are Stories 3.2–3.5. The reducer can define the full action set for forward compatibility, but only `'resize'` needs to work in this story.
- **Import convention:** Use `@conways-game-of-life/sim` and `@conways-game-of-life/types` for cross-lib imports (scoped package names via pnpm workspace).

### Existing Project Structure

- `apps/` — Next.js app, project name `apps`, tag `scope:app`
- `apps/src/app/page.tsx` — current Nx scaffold placeholder (to be fully replaced)
- `apps/src/app/layout.tsx` — root layout with `<html>` and `<body>` tags
- `apps/src/app/global.css` — raw Nx scaffold CSS (to be replaced with Tailwind directives)
- `apps/src/app/page.module.css` — scaffold CSS module (to be deleted)
- `apps/project.json` — `{ "name": "apps", "tags": ["scope:app"] }`
- No `tailwind.config.*` or `postcss.config.*` exists yet

### Architecture Compliance

- [Source: docs/planning-artifacts/architecture.md §4.5] — `useReducer` for grid+genCount atomic state management. No external stores.
- [Source: docs/planning-artifacts/architecture.md §4.6] — Tailwind CSS, no CSS Modules or styled-components.
- [Source: docs/planning-artifacts/architecture.md §5.3] — Canvas render strategy, `fillRect`-based, dark background.
- [Source: docs/planning-artifacts/architecture.md §5.8] — Canvas-resize input validation at the form layer; invalid inputs rejected with visible message.
- [Source: docs/planning-artifacts/architecture.md §6] — Component tree: `page.tsx` → `Canvas.tsx`, `GridSizeForm.tsx`, `Controls.tsx`, `SpeedSlider.tsx`.
- [Source: docs/planning-artifacts/architecture.md §7.5] — Accessibility: real `<button>` elements, `aria-label`, visible focus rings (`focus-visible:ring-2 focus-visible:ring-cyan-400`), `cyan-400` on `neutral-950`.
- [Source: docs/planning-artifacts/architecture.md §10] — Canvas-resize mid-run: pause + clear.
- [Source: docs/planning-artifacts/prd.md — FR1] — Canvas size bounds 5×5–100×100, validation, visible error on reject.
- [Source: docs/planning-artifacts/prd.md — FR11] — Responsive layout, 375px portrait, no horizontal scroll.
- [Source: docs/planning-artifacts/prd.md — NFR1] — Responsive desktop + mobile, touch-friendly.
- [Source: docs/planning-artifacts/prd.md — Assumptions] — Default 30×30, default 10 gen/sec.

### Testing Requirements

- No unit tests are required for this story (UI components will get integration tests in later stories via React Testing Library).
- The responsive layout will be verified by Playwright in Story 4.3.
- Validate visually that desktop and 375px layouts match acceptance criteria.
- Ensure `data-testid` attributes are in place for E2E targeting.

### Epic 2 Retrospective Learnings

- Use `pnpm exec nx` for all Nx commands.
- Use `@conways-game-of-life/sim` and `@conways-game-of-life/types` for cross-lib imports (scoped package names).
- Run `pnpm exec nx sync` if TypeScript project references fall out of sync.
- Use `pnpm exec nx reset` and `--skip-nx-cache` if cached results are stale.

### References

- [Source: docs/planning-artifacts/epics.md — Epic 3, Story 3.1 ACs]
- [Source: docs/planning-artifacts/architecture.md §4.5 — useReducer state management]
- [Source: docs/planning-artifacts/architecture.md §4.6 — Tailwind CSS]
- [Source: docs/planning-artifacts/architecture.md §5.3 — Canvas render strategy]
- [Source: docs/planning-artifacts/architecture.md §6 — File tree: components, hooks]
- [Source: docs/planning-artifacts/architecture.md §7.5 — Accessibility, color scheme]
- [Source: docs/planning-artifacts/architecture.md §10 — Open Question 1: resize = pause + clear]
- [Source: docs/planning-artifacts/prd.md — FR1, FR11, NFR1]
- [Source: apps/project.json — tag scope:app]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (BMAD dev-story workflow)

### Debug Log References

- Tailwind v4 installed (not v3) — used `@import "tailwindcss"` CSS-first config instead of `@tailwind` directives. Created `postcss.config.js` with `@tailwindcss/postcss` plugin instead of a `tailwind.config.ts`.
- Build initially failed: `@conways-game-of-life/sim` not resolvable from Next.js Turbopack build. Root cause: `apps/package.json` did not declare workspace dependencies on `@conways-game-of-life/sim` and `@conways-game-of-life/types`. Fixed by adding `"workspace:*"` dependencies and running `pnpm install`.
- Added `transpilePackages` to `next.config.js` to ensure Turbopack resolves workspace packages via the `conways-game-of-life` custom condition in `exports` maps.
- Ran `pnpm exec nx sync` to resolve TS project reference sync warning.
- Reducer defines the full action type union for forward compatibility (tick, toggleCell, clear, randomize, setRunning, setGenPerSec), but only `resize`, `clear`, `setRunning`, and `setGenPerSec` are implemented in this story. Remaining actions are stubs returning current state — they will be fleshed out in Stories 3.2–3.5.

### Completion Notes List

- Installed Tailwind CSS v4 with `@tailwindcss/postcss`, `postcss`, `autoprefixer`.
- Created `postcss.config.js` at workspace root.
- Replaced scaffold `global.css` with `@import "tailwindcss"`.
- Deleted `page.module.css` (scaffold artifact, replaced by Tailwind).
- Updated `layout.tsx`: title "Conway's Game of Life", dark theme body classes.
- Rewrote `page.tsx` as a `'use client'` component with `useReducer`-based state management.
- `SimState` holds `grid`, `running`, `genCount`, `genPerSec`. Default: 30×30, stopped, gen 0, 10 gen/sec.
- `resize` action creates a new empty grid, pauses simulation, resets gen counter (AC 3, 5).
- Created `GridSizeForm` component with validation: [5, 100] range, integer-only, visible error messages via `role="alert"`, `data-testid` attributes for E2E.
- Canvas element placed with computed `cellSize` (clamped 4–20px), draws dark background + faint grid lines via `useEffect([grid])`.
- Responsive layout: `lg:flex-row` for desktop (canvas + 264px sidebar), `flex-col` for mobile. Canvas uses `max-width: 100%; height: auto` for mobile scaling.
- Placeholder controls (Play, Step, Clear, Random buttons + speed slider) rendered as disabled — implementation in Stories 3.3–3.5.
- Added `@conways-game-of-life/sim` and `@conways-game-of-life/types` as workspace dependencies in `apps/package.json`.
- Added `transpilePackages` to `next.config.js`.
- Build passes. Lint passes (0 errors). All 44 existing tests pass (43 sim + 1 types).

### Change Log

- 2026-05-11: Implemented page shell, canvas size form, and responsive layout (Story 3.1)

### File List

- docs/implementation-artifacts/3-1-page-shell-canvas-size-form-and-responsive-layout.md (modified — status + tasks + dev record)
- docs/implementation-artifacts/sprint-status.yaml (modified — story status)
- apps/src/app/page.tsx (modified — full rewrite: simulation page shell with useReducer)
- apps/src/app/layout.tsx (modified — title, description, dark theme body classes)
- apps/src/app/global.css (modified — replaced scaffold CSS with Tailwind v4 import)
- apps/src/app/page.module.css (deleted — scaffold artifact)
- apps/src/app/components/GridSizeForm.tsx (new — grid size form with validation)
- apps/package.json (modified — added workspace deps for sim + types)
- apps/next.config.js (modified — added transpilePackages)
- postcss.config.js (new — Tailwind v4 + autoprefixer)
- package.json (modified — added tailwindcss, @tailwindcss/postcss, postcss, autoprefixer devDeps)
