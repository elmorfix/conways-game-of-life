# Story 1.5: CI workflow — Playwright E2E on every PR

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the candidate,
I want Playwright browser binaries installed and the Nx E2E target executed in GitHub Actions on every PR into `main`,
so that end-to-end regressions cannot merge and NFR7’s fourth CI gate is satisfied before branch protection (Story 1.6).

## Acceptance Criteria

1. **Given** `.github/workflows/ci.yml` includes an `e2e` job, **when** a PR is opened or updated against `main`, **then** the job uses the same baseline setup as other CI jobs (checkout `fetch-depth: 0`, pnpm 9, Node 22 with pnpm cache, `pnpm install --frozen-lockfile`), runs **`pnpm exec playwright install --with-deps`** (or the current Playwright-recommended equivalent for CI), then runs the Playwright E2E suite via Nx and registers a check whose **job name** is `e2e`.
2. **Given** the E2E project is affected (typical when `apps` or `apps-e2e` change), **when** CI runs, **then** Playwright output (pass/fail, traces, screenshots on failure policy) is visible in the Actions log and/or attached artifacts.
3. **Given** epics call for diagnosis aids, **when** the `e2e` job fails, **then** upload **Playwright HTML report** and/or **trace** artifacts (e.g. `actions/upload-artifact`) so failures are debuggable without reproducing locally first.
4. **Given** a green Playwright spec locally, **when** CI runs the same flow, **then** the `e2e` check completes within a reasonable wall-clock budget (epics: under ~5 minutes for the MVP spec once specs exist — allow headroom if the suite grows).

## Tasks / Subtasks

- [x] Add `e2e` job to `.github/workflows/ci.yml` (AC: 1, 2, 4)
  - [x] Mirror checkout / pnpm / Node / install steps from `lint`, `typecheck`, `test` (Story 1.3–1.4)
  - [x] Install browsers: `pnpm exec playwright install --with-deps`
  - [x] Run E2E through Nx — **prefer** `pnpm exec nx affected -t e2e --base=origin/main` so only affected Playwright projects run and naming matches this repo (`apps-e2e`, not `web-e2e`)
  - [x] If `nx affected -t e2e` is empty/skipped in edge cases, document behavior (e.g. Nx “No projects affected” exit 0 vs failure) and align with Story 1.6 required check expectations
  - [x] Set job `name:` to **`e2e`** for stable branch-protection / auto-approve wiring
- [x] Failure artifacts (AC: 3)
  - [x] On `failure()`, upload `playwright-report/` and/or trace zip from default output paths (confirm paths from `apps-e2e` Playwright config)
  - [x] Use `if: failure()` (or `always()` with conditional steps) so uploads run only when useful
- [x] Permissions (AC: 3)
  - [x] If using `actions/upload-artifact@v4`, ensure workflow `permissions` allow `contents: read` (artifacts use default `actions: write` for workflow token — add explicit `permissions` block entries only if GitHub defaults are insufficient; many repos need `permissions: { contents: read, actions: write }` or rely on default GITHUB_TOKEN for same-repo PRs — **verify** against current org/repo policy)
- [x] Local parity (AC: 2, 4)
  - [x] `pnpm exec playwright install` (or `--with-deps` on Linux) then `pnpm exec nx e2e apps-e2e` (or affected equivalent)

## Dev Notes

- **Project names:** This workspace uses **`apps`** (Next.js) and **`apps-e2e`** (Playwright), per generator output and `apps-e2e/project.json` (`implicitDependencies: ["apps"]`). Epics.md and architecture still say `web` / `web-e2e` in places — **treat those as conceptual names**; commands must target **`apps-e2e`** unless the repo is renamed later.
- **Nx Playwright target:** `@nx/playwright/plugin` in `nx.json` sets `targetName: "e2e"`. `apps-e2e` has `targets: {}` (inferred from plugin).
- **Affected vs always-run:** Architecture §7.2 suggests E2E “only when web or web-e2e affected”; **`nx affected -t e2e --base=origin/main`** encodes that. If branch protection always requires `e2e`, ensure PRs that skip affected still get a green check (Nx may no-op successfully — **validate** with `nx show projects --affected` on a docs-only PR).
- **Path resolution:** Use **`pnpm exec`** for `playwright` and `nx` in CI, consistent with Stories 1.3–1.4 (`pnpm exec nx …`).
- **Do not** implement `auto-approve.yml` or branch-protection screenshots here — that is **Story 1.6**.

### Previous Story Intelligence (1.4)

- `.github/workflows/ci.yml` already has parallel **`lint`**, **`typecheck`**, **`test`** jobs with identical install scaffolding.
- **`pnpm exec nx affected -t test --base=origin/main --parallel=3`** is the proven pattern for Nx on Actions.
- **`nx`** must remain in root `devDependencies`; Playwright is already a dev dependency (`@playwright/test`).

### Technical Requirements

- **Primary file:** `.github/workflows/ci.yml`
- **Playwright install:** `pnpm exec playwright install --with-deps` installs OS deps on Ubuntu (needed for headed deps in CI).
- **Run command (recommended):**  
  `pnpm exec nx affected -t e2e --base=origin/main`  
  **Narrow run (when debugging):** `pnpm exec nx e2e apps-e2e`
- **Timeout:** Match other jobs (`timeout-minutes: 30`) unless Playwright consistently needs more; epics suggest keeping MVP E2E under ~5 minutes runtime where possible.

### Architecture Compliance

- [Source: docs/planning-artifacts/architecture.md §7.2] — Job 4 `e2e`: `pnpm exec playwright install --with-deps` → Nx e2e; fourth required check alongside lint, typecheck, test.
- [Source: docs/planning-artifacts/architecture.md §7.1 E2E] — Prefer `expect.poll` / generation `>= 1` patterns when specs land (Epic 4); this story is **CI wiring** only — specs may still be minimal or placeholder until Epic 4.1; **do not** invent a large E2E suite here unless the repo already has a runnable spec to gate on.

### Library / Framework Requirements

- **@playwright/test** (existing), **Nx Playwright plugin** (existing).
- **GitHub Actions:** `actions/checkout@v4`, `actions/upload-artifact@v4` (or current v3/v4 per repo consistency).

### File Structure Requirements

- Edit **`.github/workflows/ci.yml`** only for this story’s scope.
- Optional: small note under `docs/implementation-artifacts/` if CI behavior for “no affected e2e” needs documentation for 1.6 — only if non-obvious.

### Testing Requirements

- Locally: after install, run `pnpm exec nx e2e apps-e2e` (or affected) and confirm exit code 0.
- Simulate failure: force a failing assertion in an e2e spec on a throwaway branch and confirm CI would fail and artifact step runs.

### Git Intelligence Summary

- CI evolved incrementally: `pnpm exec nx`, `nx` in devDependencies, parallel jobs — keep the same style for `e2e`.

### Latest Tech Information

- Playwright’s **`install --with-deps`** remains the standard approach on Linux CI runners to pull system libraries for Chromium/WebKit/Firefox.
- Nx **22.7.x** `affected` graph respects `implicitDependencies` from `apps-e2e` → `apps`, so changes to `apps` should mark `apps-e2e` affected for `e2e` target.

### Project Context Reference

- [Source: docs/project-context.md — CI four checks, Playwright, timing assertions]
- [Source: docs/planning-artifacts/epics.md — Epic 1, Story 1.5]

### References

- [Source: docs/planning-artifacts/epics.md — Story 1.5 acceptance criteria]
- [Source: docs/planning-artifacts/architecture.md §4.10, §7.1–7.2]
- [Source: docs/implementation-artifacts/1-4-ci-workflow-jest-unit-tests-on-every-pr.md]
- [Source: docs/implementation-artifacts/1-3-ci-workflow-lint-and-type-check-on-every-pr.md]
- [Source: apps-e2e/project.json]
- [Source: nx.json — `@nx/playwright/plugin`]
- [Source: docs/implementation-artifacts/sprint-status.yaml]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (dev-story implementation)

### Debug Log References

- Inspected `apps-e2e/playwright.config.ts` for report paths and webServer config.
- Confirmed `nxE2EPreset` outputs reports to `playwright-report/` within project dir.
- Verified `permissions: contents: read` is sufficient for `actions/upload-artifact@v4`.

### Completion Notes List

- Added `e2e` job to `.github/workflows/ci.yml` as fourth parallel CI job.
- Job mirrors the setup pattern from lint/typecheck/test (checkout fetch-depth 0, pnpm 9, Node 22, pnpm cache, frozen-lockfile install).
- Playwright browser install via `pnpm exec playwright install --with-deps`.
- E2E runs via `pnpm exec nx affected -t e2e --base=origin/main`.
- On failure, uploads `apps-e2e/playwright-report/` as artifact with 14-day retention.
- `nx affected` exits 0 when no projects are affected, so the job passes cleanly on docs-only PRs.

### File List

- .github/workflows/ci.yml (modified — added `e2e` job)
- docs/implementation-artifacts/1-5-ci-workflow-playwright-e2e-tests-on-every-pr.md (modified — status + task checkboxes + dev record)
- docs/implementation-artifacts/sprint-status.yaml (modified — 1-5 status)
