# Story 3.5: Speed slider with rAF accumulator mid-run change without restart

Status: done

## Story

As Casey,
I want a speed slider that adjusts the simulation rate from 1 to 60 generations per second,
so that I can slow down to study patterns or speed up to see long-term behavior — even while the simulation is running.

## Acceptance Criteria

1. **Given** the speed slider, **when** the user drags it to a new value while the simulation is running, **then** the generation rate changes immediately without restarting or pausing the simulation.
2. **Given** the speed slider, **when** the user sets a value, **then** the displayed value label updates to reflect the current gen/sec setting.
3. **Given** the slider range, **when** the page loads, **then** the slider defaults to 10 gen/sec with a range of [1, 60].
4. **Given** the slider, **when** inspected for accessibility, **then** it has `aria-label`, `aria-valuemin`, `aria-valuemax`, and `aria-valuenow` attributes.

## Tasks / Subtasks

- [x] Replace the disabled speed slider placeholder with a functional control
  - [x] Bind `value={genPerSec}` to the slider
  - [x] On change: dispatch `{ type: 'setGenPerSec', genPerSec: Number(e.target.value) }`
  - [x] Range: `min={1}` `max={60}` (per project-context §3 Rule 17)
  - [x] Add `data-testid="speed-slider"` for E2E targeting
  - [x] Add full ARIA attributes: `aria-label`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`
  - [x] Display current value as a label (e.g., "10 gen/s")
- [x] Apply Glassmorphism styling to all sidebar control sections
  - [x] Use `backdrop-blur`, semi-transparent backgrounds, subtle borders
  - [x] Apply consistently to Grid Size, Controls, and Speed sections
- [x] Verify mid-run speed change works without loop restart
  - [x] The `useSimulationLoop` hook reads `genPerSec` via `useRef` — no `useEffect` teardown on slider change
  - [x] Changing the slider while running should NOT cause a pause/restart
- [x] Verify build, lint, and test suite
  - [x] `pnpm exec nx run-many -t lint typecheck` — 0 errors
  - [x] `pnpm exec nx run-many -t test` — all existing tests pass (no regressions)

## Dev Notes

- **The `'setGenPerSec'` reducer case already exists** from Story 3.1 scaffolding. It simply sets `state.genPerSec` to the new value. No new reducer logic needed.
- **The rAF loop already supports mid-run rate changes.** The `useSimulationLoop` hook stores `genPerSec` in a `useRef` and the rAF loop reads it fresh each frame. The `useEffect` depends only on `[running]`, NOT on `genPerSec`. This means slider changes take effect on the very next frame without tearing down the loop.
- **Glassmorphism styling:** Apply frosted-glass effect to sidebar sections using `backdrop-blur-lg`, `bg-white/5`, `border border-white/10`, and `rounded-xl`. This gives a premium feel while maintaining readability on the dark theme.
- **Speed range [1, 60] and default 10** are locked values per project-context §3 Rule 17.

### References

- [Source: docs/planning-artifacts/architecture.md §5.2 — rAF accumulator, genPerSec via useRef]
- [Source: docs/planning-artifacts/prd.md — FR8: speed slider 1–60, mid-run change]
- [Source: docs/project-context.md §3 Rule 6 — rAF + accumulator with ref-fresh genPerSec]
- [Source: docs/project-context.md §3 Rule 17 — speed range 1–60, default 10]

---

## Dev Agent Record

### Completion Notes

All tasks completed in a single pass with no blockers:

1. **Speed slider:** Replaced the disabled `<input type="range">` placeholder with a fully functional slider bound to `genPerSec` state. Dispatches `'setGenPerSec'` on change. Includes `data-testid="speed-slider"`, full ARIA attributes (`aria-label`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`), and a live value label showing `{genPerSec} gen/s`. Added `Gauge` icon from Lucide React.
2. **Mid-run speed change:** Verified that `useSimulationLoop` reads `genPerSec` via `useRef` (updated in a sync effect), and the rAF `useEffect` depends only on `[running]`. Slider changes propagate to the loop on the next frame without teardown/restart.
3. **Glassmorphism styling:** Applied frosted-glass design to all sidebar sections and header:
   - Sections: `rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-lg`
   - Buttons: `rounded-lg border border-white/10 bg-white/10 backdrop-blur-sm hover:bg-white/15`
   - Play/Pause: `border-cyan-500/20 bg-cyan-600/80 hover:bg-cyan-500/80`
   - Header: `border-b border-white/10 bg-white/5 backdrop-blur-lg`
4. **Verification:** lint (0 errors), typecheck (0 errors), test (all pass, 0 regressions).

### Change Log

| File | Change |
|------|--------|
| `apps/src/app/page.tsx` | Added `Gauge` import from Lucide; replaced disabled slider with functional control; applied Glassmorphism to header, all sidebar sections, and all buttons |

### File List

- `apps/src/app/page.tsx` (modified)
- `docs/implementation-artifacts/3-5-speed-slider-with-raf-accumulator-mid-run-change-without-restart.md` (new)
- `docs/implementation-artifacts/sprint-status.yaml` (modified)
