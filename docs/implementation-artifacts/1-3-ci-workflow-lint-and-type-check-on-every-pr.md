# Story 1.3: CI workflow - lint and type-check on every PR

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the candidate,
I want a GitHub Actions workflow that runs lint and type-check on every PR into `main`,
so that style and TypeScript regressions cannot merge.

## Acceptance Criteria

1. **Given** `.github/workflows/ci.yml` is configured to trigger on `pull_request` into `main`, **when** a PR is opened or updated, **then** the `lint` job runs `pnpm install --frozen-lockfile` followed by `pnpm nx affected -t lint --base=origin/main` and reports a check status.
2. **Given** `.github/workflows/ci.yml` is configured, **when** a PR is opened or updated, **then** the `typecheck` job runs `pnpm nx affected -t typecheck --base=origin/main` (or per-project `tsc --noEmit`) and reports a check status.
3. **Given** a PR introduces a TypeScript error or lint violation, **when** CI runs, **then** the corresponding check fails and the failure is visible in the PR checks tab.

## Tasks / Subtasks

- [ ] Create `ci.yml` workflow skeleton for PR validation (AC: 1, 2)
  - [ ] Add trigger for `pull_request` on `main`
  - [ ] Add top-level `permissions` with least privilege (`contents: read`)
  - [ ] Add concurrency group to cancel superseded runs on the same PR branch
- [ ] Add shared setup steps for pnpm + Node (AC: 1, 2)
  - [ ] Use `pnpm/action-setup` before `actions/setup-node`
  - [ ] Configure `actions/setup-node` with Node LTS and `cache: 'pnpm'`
  - [ ] Run `pnpm install --frozen-lockfile`
- [ ] Implement `lint` job (AC: 1, 3)
  - [ ] Run `pnpm nx affected -t lint --base=origin/main`
  - [ ] Ensure job fails on non-zero exit and surfaces logs in Actions UI
- [ ] Implement `typecheck` job (AC: 2, 3)
  - [ ] Prefer `pnpm nx affected -t typecheck --base=origin/main`
  - [ ] If `typecheck` is missing in some projects, add a safe fallback strategy documented in workflow comments
  - [ ] Ensure job fails on type errors and surfaces logs in Actions UI
- [ ] Confirm local parity for CI commands (AC: 1, 2, 3)
  - [ ] Run lint/typecheck commands locally against the current branch
  - [ ] Document any `affected` edge-case handling needed for first PRs where `origin/main` is unavailable

## Dev Notes

- This story intentionally scopes to lint + typecheck only. Jest and Playwright are separate stories (`1.4`, `1.5`).
- Use pnpm throughout CI because project context and architecture lock package manager choice to pnpm.
- Keep CI job names stable (`lint`, `typecheck`) because later branch protection and auto-approve story expects fixed required check names.

### Previous Story Intelligence

- Story `1.2` completed boundary enforcement and proof capture:
  - root `eslint.config.mjs` already includes strict `@nx/enforce-module-boundaries` constraints.
  - `libs/sim` contains `no-restricted-imports` guardrails.
  - proof artifact exists at `docs/implementation-artifacts/1-2-module-boundary-violation-proof.md`.
- Practical implication for this story: CI lint job is now load-bearing and must remain strict (`error` semantics, no soft-fail).

### Technical Requirements

- Use GitHub Actions YAML at `/.github/workflows/ci.yml`.
- Commands should match architecture guidance:
  - `pnpm nx affected -t lint --base=origin/main`
  - `pnpm nx affected -t typecheck --base=origin/main`
- Install dependencies with `pnpm install --frozen-lockfile`.
- Ensure workflow is PR-scoped (`pull_request` targeting `main`), not push-only.

### Architecture Compliance

- Align to architecture section on CI gates (lint, typecheck, test, e2e) while only implementing the lint+typecheck subset here.
- Preserve module-boundary enforcement by running lint in CI exactly as configured locally.
- Do not dilute boundaries or change tags in this story.

### Library / Framework Requirements

- GitHub Actions:
  - `pnpm/action-setup` (install pnpm toolchain)
  - `actions/setup-node` with pnpm cache
- Nx:
  - `affected` targets for scalable CI as monorepo grows
- Avoid introducing alternate CI providers or package managers.

### File Structure Requirements

- Primary file to create:
  - `.github/workflows/ci.yml`
- Optional supporting docs artifact if needed for troubleshooting decisions:
  - `docs/implementation-artifacts/1-3-ci-notes.md`
- No app/lib source code changes are required unless typecheck target support gaps are discovered.

### Testing Requirements

- Validate workflow logic by running local equivalents before push:
  - `pnpm nx affected -t lint --base=origin/main`
  - `pnpm nx affected -t typecheck --base=origin/main`
- Verify failing behavior:
  - Introduce temporary lint or TS error locally (not committed) and confirm command exits non-zero.
- Verify CI observability:
  - job output clearly shows failing file/project when checks break.

### Git Intelligence Summary

- Recent commits indicate Story 1.2 landed via focused PR and merge:
  - `chore: configure nx module boundaries and capture lint proof`
  - merge commit for `story/1-2-configure-nx-tags`
- Pattern to follow: narrow commit scope, explicit artifact capture, no unrelated drive-by edits.

### Latest Tech Information

- Current GitHub Actions best practice remains:
  - run `pnpm/action-setup` before `actions/setup-node`.
  - enable pnpm store caching via `actions/setup-node` (`cache: pnpm`, `cache-dependency-path: pnpm-lock.yaml`).
- This reduces install time and keeps CI deterministic with lockfile pinning.

### Project Structure Notes

- Current generated app names are `apps` and `apps-e2e` in this workspace (not `web` / `web-e2e` yet), so CI commands should be target-based (`affected`) rather than hardcoding project names.
- Repository currently has no `/.github/workflows` directory; this story should create it cleanly.
- AI artifact directories must remain untouched (`.claude/`, `.cursor/`, `.opencode/`, `_bmad/`).

### References

- [Source: docs/planning-artifacts/epics.md (Epic 1, Story 1.3)]
- [Source: docs/planning-artifacts/architecture.md (CI workflow outline and job commands)]
- [Source: docs/planning-artifacts/prd.md (NFR7 CI gate requirements)]
- [Source: docs/project-context.md (critical implementation and CI conventions)]
- [Source: docs/implementation-artifacts/1-2-configure-nx-tags-and-prove-module-boundaries-fire.md]
- [Source: docs/implementation-artifacts/sprint-status.yaml]

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Debug Log References

- Recent commits sampled via `git log --oneline -5`.
- External check for up-to-date pnpm caching order in GitHub Actions.

### Completion Notes List

- Story context created for CI lint/typecheck implementation on PRs to `main`.
- Includes explicit guardrails for pnpm/Nx affected usage and stable check naming.
- Story file generated as implementation-ready context artifact.

### File List

- docs/implementation-artifacts/1-3-ci-workflow-lint-and-type-check-on-every-pr.md
