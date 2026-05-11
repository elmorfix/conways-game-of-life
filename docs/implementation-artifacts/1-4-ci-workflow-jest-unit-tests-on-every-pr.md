# Story 1.4: CI workflow — Jest unit tests on every PR

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the candidate,
I want the same GitHub Actions workflow to run Jest across affected Nx projects on every PR into `main`,
so that unit-test regressions cannot merge and simulation correctness stays gated in CI (NFR7, NFR3).

## Acceptance Criteria

1. **Given** `.github/workflows/ci.yml` includes a `test` job, **when** a PR is opened or updated against `main`, **then** the job runs `pnpm nx affected -t test --base=origin/main --parallel=3` (or equivalent using `pnpm exec nx` if that is the repo’s working pattern) and registers a distinct check status whose **job name** is `test`.
2. **Given** the job runs, **when** it completes successfully, **then** Jest pass/fail output (project names, test counts, failure stacks) is visible in the GitHub Actions log for that job.
3. **Given** a PR introduces a failing Jest assertion in any **affected** project, **when** CI runs, **then** the `test` check fails with a non-zero exit and blocks merge.

## Tasks / Subtasks

- [ ] Extend `.github/workflows/ci.yml` with a `test` job (AC: 1–3)
  - [ ] Reuse the same PR trigger, permissions, concurrency group, checkout (`fetch-depth: 0`), pnpm + Node setup, and `pnpm install --frozen-lockfile` pattern as `lint` / `typecheck` from Story 1.3
  - [ ] Run affected Jest: `pnpm exec nx affected -t test --base=origin/main --parallel=3` (recommended for parity with Story 1.3’s `pnpm exec nx` usage; epics text uses `pnpm nx` — either works if `nx` is on PATH via pnpm)
  - [ ] Set job `name:` to `test` so branch protection / auto-approve can key off a stable check name
- [ ] Local verification before push (AC: 2–3)
  - [ ] Run the same command locally on a branch with commits not on `origin/main`
  - [ ] Confirm a deliberate failing `it()` exits non-zero
- [ ] Do **not** add Playwright or E2E in this story — that is Story 1.5

## Dev Notes

- This story **extends** the existing CI file from Story 1.3; keep `lint` and `typecheck` jobs unchanged unless a minimal shared refactor is unavoidable (prefer copy-paste job blocks for clarity).
- Stable check names matter: `lint`, `typecheck`, `test`, later `e2e` — Story 1.6 (branch protection + auto-approve) assumes predictable GitHub check names.

### Previous Story Intelligence (1.3)

- `.github/workflows/ci.yml` already exists with parallel `lint` and `typecheck` jobs.
- **Checkout must use `fetch-depth: 0`** so `origin/main` exists for `nx affected --base=origin/main`.
- **Toolchain order:** `pnpm/action-setup` → `actions/setup-node` with `cache: pnpm` and `cache-dependency-path: pnpm-lock.yaml`.
- **`nx` must be resolvable:** Story 1.3 landed with `nx` in root `devDependencies` and commands using `pnpm exec nx …`. Do not remove `nx` from `devDependencies`.
- App names in this workspace may be **`apps` / `apps-e2e`** (generator output), not `web` / `web-e2e`; **`nx affected`** avoids hardcoding project names.

### Technical Requirements

- **File:** `.github/workflows/ci.yml` only (unless you discover a missing `test` target — Nx Jest plugin already registers `test` per `nx.json`).
- **Command shape (from epics + architecture):**  
  `pnpm exec nx affected -t test --base=origin/main --parallel=3`  
  Epics.md shows `pnpm nx affected …`; use **`pnpm exec nx`** for consistency with the merged 1.3 workflow unless you verify `pnpm nx` works identically in Actions.
- **`nx.json`** already maps Jest via `@nx/jest/plugin` with `"targetName": "test"` and `targetDefaults.test.dependsOn: ["^build"]` — affected test runs may build dependencies first; ensure sufficient `timeout-minutes` (same 30 as other jobs is fine unless builds time out).

### Architecture Compliance

- [Source: docs/planning-artifacts/architecture.md §7.2 CI Workflow Outline] — Job 3 `test`: `pnpm nx affected -t test --base=origin/main --parallel=3`; four-job pipeline will be completed in Story 1.5 (`e2e`) + 1.6 (protection/approve).
- Aligns with **NFR7** (CI gates) and **NFR3** (Jest for unit tests; sim stays pure — tests live beside code per architecture §7.1).

### Library / Framework Requirements

- **Jest** via Nx — already in stack; no Vitest or alternate runners.
- **GitHub Actions** — ubuntu-latest, existing action versions from 1.3.

### File Structure Requirements

- **Primary edit:** `.github/workflows/ci.yml` — add `test` job alongside `lint` and `typecheck`.
- **No** new workflow file unless splitting is explicitly requested later.

### Testing Requirements

- Mirror CI locally:  
  `pnpm exec nx affected -t test --base=origin/main --parallel=3`
- Confirm failure surfaces: break a test temporarily, observe non-zero exit and readable Jest output.

### Git Intelligence Summary

- Story 1.3 merged via PR with iterative CI fixes (`nx` in `devDependencies`, `pnpm exec nx`).
- Keep commits small and scoped to CI + any strictly necessary config.

### Latest Tech Information

- Nx **22.7.x** in repo — `affected` with `--parallel=3` is a standard pattern for CI throughput on multi-project workspaces.
- `actions/checkout@v4` with full history remains required for `--base=origin/main`.

### Project Context Reference

- [Source: docs/project-context.md §2 (Jest, CI four checks), §5 (CI command shape)]
- [Source: README.md / take-home brief — CI on every PR, Jest required]

### References

- [Source: docs/planning-artifacts/epics.md — Epic 1, Story 1.4]
- [Source: docs/planning-artifacts/architecture.md §4.10, §7.1–7.2]
- [Source: docs/implementation-artifacts/1-3-ci-workflow-lint-and-type-check-on-every-pr.md]
- [Source: docs/implementation-artifacts/sprint-status.yaml]
- [Source: nx.json — Jest plugin `targetName: test`]

## Dev Agent Record

### Agent Model Used

GPT-5.2 (BMAD Master — create-story workflow)

### Debug Log References

### Completion Notes List

- Ultimate context story created for adding Jest (`test`) job to existing PR CI workflow.
- Preserves 1.3 learnings: full checkout, pnpm cache, `pnpm exec nx`, stable job name `test`.

### File List

- docs/implementation-artifacts/1-4-ci-workflow-jest-unit-tests-on-every-pr.md
