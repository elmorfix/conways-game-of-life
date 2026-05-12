# Conway's Game of Life

A high-performance, accessible implementation of [Conway's Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life) as a single-page web application. Built as a take-home engineering assessment demonstrating disciplined execution against pre-defined architecture and planning artifacts.

## Quick Start

```bash
# Prerequisites: Node.js 20+, pnpm 9+
pnpm install
pnpm exec nx dev apps          # http://localhost:3000
pnpm exec nx run-many -t test  # Jest (49 sim + 5 other suites)
pnpm exec nx e2e apps-e2e      # Playwright happy-path
```

## Architecture

### Nx Monorepo with Enforced Module Boundaries

The project uses an **Nx monorepo** with strict tag-based module boundaries that fail CI lint on violation — not aspirational, actually enforced.

```
apps/               # Next.js 14+ App Router        tag: scope:app
apps-e2e/           # Playwright E2E specs           tag: scope:e2e
apps/api/           # NestJS REST (stretch)          tag: scope:server
libs/
  sim/              # Pure rules engine              tag: scope:sim
  types/            # Shared TS interfaces           tag: scope:types
  ui/               # Presentational components      tag: scope:ui
  api-client/       # Typed fetch wrappers           tag: scope:api-client
```

**Dependency direction is one-way and enforced:**

- `scope:app` → `scope:sim`, `scope:ui`, `scope:api-client`, `scope:types`
- `scope:sim` → `scope:types` **only** (no React, no DOM, no framework imports)
- `scope:types` → nothing (leaf node)

A deliberate boundary violation was committed and documented in Epic 1 to prove the rule fires in CI. Cross-boundary imports produce lint errors, not warnings.

### Hexagonal Separation

The simulation engine (`libs/sim`) is a **pure-function library** with zero framework dependencies. All Conway logic — `step()`, `createGrid()`, `toggleCell()`, `randomizeGrid()` — lives here as functions that accept and return immutable `Grid` structures. The Next.js app consumes these through a `useReducer` that dispatches actions; React's render cycle never leaks into the simulation.

This separation means the rules engine can be:
- Unit-tested with Jest without a DOM or React renderer
- Moved to a Web Worker without API changes (stretch upgrade path)
- Consumed by any frontend framework, not just React

### State Management

**`useReducer` only — no external stores.** The page-level state surface is small (`grid`, `running`, `genCount`, `genPerSec`) and entirely page-scoped. Adding Zustand/Redux for one component's state would be over-engineering. The reducer ensures atomic `grid + genCount` transitions per tick.

## Performance

### Grid: Flat `Uint8Array`

The grid is `{ width, height, cells: Uint8Array }` where `cells[y * width + x]` is `0` (dead) or `1` (alive). This is:

- **Cache-friendly** — contiguous memory, predictable access pattern
- **Zero per-cell allocation** — no `boolean[][]` or `Set<string>` overhead
- **Transfer-friendly** — can be sent to a Web Worker via `transferList` without serialization
- **Compact** — 10,000 cells (100×100) = 10KB

### Render: HTML Canvas + `requestAnimationFrame`

The grid renders to a single `<canvas>` via `fillRect` per alive cell — no DOM-per-cell rendering. The simulation loop uses a **`requestAnimationFrame` + time accumulator** pattern:

- `genPerSec` is read via a `useRef` — fresh every frame, never a `useEffect` dependency
- Slider changes take effect mid-run without restarting the loop
- No `setInterval` (which captures the rate in a closure and can't react to slider changes)

This architecture cleanly supports the stretch upgrade: move `step()` into a Web Worker with `OffscreenCanvas` rendering.

## Stack

| Concern | Choice |
|---------|--------|
| Framework | **Next.js 14+** (App Router, single `'use client'` page) |
| Language | **TypeScript** (`strict: true`, `noUncheckedIndexedAccess: true`) |
| UI | **React 19** + **Tailwind CSS v4** (Glassmorphism panels, dark theme) |
| Icons | **Lucide React** (Play, Pause, SkipForward, Trash2, Shuffle, Gauge) |
| Monorepo | **Nx 22** with enforced `@nx/enforce-module-boundaries` |
| Unit tests | **Jest** (49 sim tests covering all Conway rules + edge cases) |
| E2E tests | **Playwright** (happy-path: toggle cells, play/pause, speed, resize) |
| CI | **GitHub Actions** — lint, typecheck, Jest, Playwright on every PR |
| Package manager | **pnpm** |

## Features

- **Canvas grid** with configurable size (5×5 to 100×100), click/tap to toggle cells
- **Play/Pause/Step** controls with generation counter
- **Speed slider** (1–60 gen/s) with mid-run adjustment via rAF accumulator
- **Clear & Randomize** (density ~0.3) with automatic pause
- **Responsive layout** — desktop sidebar + mobile stacked, no horizontal scroll at 375px
- **Glassmorphism UI** — frosted glass panels with `backdrop-blur`, semi-transparent borders
- **Accessible** — semantic buttons, `aria-label` on all controls, `focus-visible` rings, canvas `role="img"`

## How to Run

```bash
# Install dependencies
pnpm install

# Development server (http://localhost:3000)
pnpm exec nx dev apps

# Run all checks (what CI runs)
pnpm exec nx run-many -t lint typecheck test
pnpm exec nx e2e apps-e2e

# Run a specific project's tests
pnpm exec nx test sim          # 49 Conway rules tests
pnpm exec nx test apps         # App-level tests
pnpm exec nx lint apps         # ESLint + module boundary check
```

## Trade-offs & Deliberate Decisions

1. **Canvas over DOM cells.** Memoized `<div>`-per-cell survives 50×50 but collapses at 100×100. Canvas scales linearly with zero DOM overhead and has a clean Worker upgrade path.

2. **`Uint8Array` over `boolean[][]`.** Less ergonomic, but contiguous memory is required for `transferList` to Workers and eliminates per-row allocation in `step()`.

3. **`useReducer` over Zustand.** The state surface is one component. An external store for `{grid, running, genCount, genPerSec}` would be over-engineering. If cross-cutting state grows (save/load, patterns), a Context + reducer is the next step.

4. **No `setInterval`.** The rAF accumulator reads `genPerSec` fresh each frame via `useRef`. `setInterval` captures the rate in a closure — changing the slider mid-run would require teardown and restart, producing visual stutter.

5. **No unit tests for UI components.** The reducer logic is pure and could be tested, but the 6-8h budget was better spent on exhaustive sim tests (49 tests covering all four Conway rules, canonical patterns, edge cases, determinism) and a comprehensive Playwright E2E spec. UI tests would be the next investment.

6. **Glassmorphism for visual polish.** `backdrop-blur` + semi-transparent borders on a dark theme gives a premium feel with minimal CSS. Trade-off: slightly higher GPU compositing cost, negligible at this scale.

## AI Usage

This project was built with AI assistance (Claude via Cursor) following the BMAD methodology. AI artifacts are committed in `.claude/`, `.cursor/`, `.opencode/`, and `_bmad/`.

**Where AI helped most:**
- Generating the initial story files with precise acceptance criteria, architecture references, and cross-story dependency analysis
- Scaffolding the rAF accumulator loop following the architecture §5.2 pseudocode precisely
- Systematic code review catching issues like missing `ResizeObserver` and unbounded catch-up ticks

**Where I pushed back on AI:**
- AI initially suggested `setInterval` for simplicity — rejected per architecture §5.2 and PRD R7
- AI proposed extracting Canvas into a separate component early — deferred to keep the reducer dispatch accessible without prop-drilling
- AI wanted to add Zustand for "future-proofing" — rejected as over-engineering for the current state surface

## What's Next (With Another 8 Hours)

1. **Web Worker for simulation** — Move `step()` off the main thread with `transferList` for the `Uint8Array` buffer. The pure-function sim and flat array make this a clean lift.
2. **Pattern library** — Preset patterns (Glider, Gosper Gun, Pulsar) as typed exports in `libs/sim` with a selector UI.
3. **`ResizeObserver`** — Currently `cellSize` is computed during render and goes stale on viewport resize. Adding an observer would make the canvas truly responsive.
4. **Tick cap in the accumulator** — After tab backgrounding, the `while` loop catches up unboundedly. Capping at ~4 ticks per frame prevents freeze on refocus.
5. **Pattern persistence** — NestJS REST API (`GET/POST /patterns`) with SQLite via Prisma behind a `PatternRepository` interface.

## What I'm Not Happy With

- **No `ResizeObserver`** — the canvas sizing relies on render-time measurement, which drifts when the viewport changes without a state update
- **No reducer unit tests** — the `simReducer` is pure and testable, but time went to sim library tests instead
- **The `computeCellSize` function** lives in `page.tsx` rather than being extracted as a utility — it's doing too much in one component
