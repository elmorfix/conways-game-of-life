# Story 1.2: Configure Nx tags and prove module boundaries fire

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the candidate,
I want the Nx tag taxonomy plus `@nx/enforce-module-boundaries` configured and demonstrably failing on a deliberate violation,
so that NFR8 is a real, evaluated deliverable rather than a hand-wave.

## Acceptance Criteria

1. **Given** the Nx workspace exists with `apps/web`, `apps/web-e2e`, `libs/sim`, `libs/types`, `libs/ui`, `libs/api-client` (and stretch `apps/api`), **when** each project's `tags` is configured in `project.json` per architecture taxonomy (`scope:app`, `scope:e2e`, `scope:server`, `scope:sim`, `scope:ui`, `scope:api-client`, `scope:types`), **then** the root ESLint config enforces `@nx/enforce-module-boundaries` depConstraints and `pnpm nx lint` passes.
2. **Given** boundary rules are configured, **when** a deliberate violating import is added in `libs/sim/src/index.ts` (`import * as React from 'react'`) on a throwaway branch, **then** `pnpm nx lint sim` fails with boundary-related lint output proving policy enforcement.
3. **Given** the failure demo is captured, **when** the violating import is reverted, **then** `pnpm nx lint sim` passes and no violating import remains in merged history.
4. The failure proof artifact (log or screenshot) is committed under `docs/implementation-artifacts/` and later referenced from `README.md` in the module-boundaries section.

## Tasks / Subtasks

- [ ] Tag all projects with the locked taxonomy (AC: 1)
  - [ ] Update `apps/web/project.json` with `tags: ["scope:app"]`
  - [ ] Update `apps/web-e2e/project.json` with `tags: ["scope:e2e"]`
  - [ ] Update `libs/sim/project.json` with `tags: ["scope:sim"]`
  - [ ] Update `libs/types/project.json` with `tags: ["scope:types"]`
  - [ ] Update `libs/ui/project.json` with `tags: ["scope:ui"]`
  - [ ] Update `libs/api-client/project.json` with `tags: ["scope:api-client"]`
  - [ ] If `apps/api` exists, set `tags: ["scope:server"]`
- [ ] Configure root boundary rule in ESLint flat config (AC: 1)
  - [ ] Add/verify `@nx/enforce-module-boundaries` in root `eslint.config.*`
  - [ ] Encode depConstraints exactly as architecture matrix:
    - `scope:app` -> `scope:sim`, `scope:ui`, `scope:api-client`, `scope:types`
    - `scope:server` -> `scope:sim`, `scope:types`
    - `scope:api-client` -> `scope:types`
    - `scope:ui` -> `scope:types`
    - `scope:sim` -> `scope:types`
    - `scope:types` -> none
    - `scope:e2e` -> `scope:app`, `scope:types`
  - [ ] Run `pnpm nx lint` and ensure baseline passes
- [ ] Add external-import guardrail for `libs/sim` (AC: 2)
  - [ ] Add `no-restricted-imports` in `libs/sim` lint config to ban `react`, `next/*`, `@nestjs/*`, and direct network/browser platform imports where applicable
  - [ ] Confirm `libs/sim` remains pure-function only and depends only on `scope:types`
- [ ] Produce proof that boundaries fire (AC: 2, 4)
  - [ ] On a throwaway branch/commit, add violating import in `libs/sim/src/index.ts`
  - [ ] Run `pnpm nx lint sim` and capture failing output
  - [ ] Save proof as `docs/implementation-artifacts/1-2-module-boundary-violation-proof.md` (log paste) or screenshot
- [ ] Revert violation and re-verify clean state (AC: 3)
  - [ ] Remove violating import
  - [ ] Run `pnpm nx lint sim` and confirm pass
  - [ ] Ensure proof artifact documents both fail and post-revert pass states

## Dev Notes

- This story is architecture-governance work, not product UI work. Keep scope tight: tags, dep constraints, proof artifact, and clean reversion.
- Do not weaken constraints for convenience. The assignment explicitly evaluates whether boundaries actually fail in CI.
- Keep the proof demonstration out of merged runtime code: only artifact evidence should persist.

### Previous Story Intelligence

- Story 1.1 (`initial nx scaffolding`) is complete in sprint status but no implementation artifact file is present.
- Current repository already contains planning docs and AI artifacts; preserve them untouched.
- Recent commit history emphasizes planning and README evolution, so this story should establish the first concrete architecture guardrail in implementation artifacts.

### Technical Requirements

- Use Nx project's `tags` in each `project.json` as source of truth.
- Use `@nx/enforce-module-boundaries` in root ESLint config with explicit `depConstraints`.
- Keep rule severity at `error`; warnings do not satisfy NFR8.
- Ensure commands align with workspace package manager (`pnpm`).

### Architecture Compliance

- Enforce the canonical dependency directions from architecture section on module boundaries.
- `libs/sim` must remain framework-free pure logic and only depend on `libs/types`.
- `apps/web` must never import from `apps/api`; it should go through `libs/api-client` only (future-proofed even if API is stretch).

### Library / Framework Requirements

- Nx + `@nx/eslint-plugin` boundary rule usage should follow current flat-config format.
- Preserve existing Next.js/Nx generated structure; do not reorganize project layout in this story.
- No additional framework introductions (Vitest, Cypress, Turborepo, etc.) are allowed.

### File Structure Requirements

- Expected files touched:
  - root `eslint.config.*`
  - each app/lib `project.json` requiring tags
  - optional `libs/sim` lint override config for restricted imports
  - proof artifact under `docs/implementation-artifacts/`
  - later README reference (can be separate story/PR if sequencing requires)
- Keep changes isolated to boundary enforcement concerns only.

### Testing Requirements

- Required checks for this story:
  - `pnpm nx lint` passes after tagging + constraints
  - `pnpm nx lint sim` fails with deliberate violation
  - `pnpm nx lint sim` passes after reversion
- Include exact failing lint excerpt in the artifact so reviewers can audit without rerunning locally.

### Latest Technical Information

- Nx current guidance continues to support `@nx/enforce-module-boundaries` in ESLint flat config with rule-level `depConstraints`.
- `bannedExternalImports` exists as an additional option; this story can keep external bans in `libs/sim` via `no-restricted-imports` if already aligned with repo conventions.

### Project Structure Notes

- This repo includes planning and AI-process directories as graded deliverables; never remove `.claude/`, `.cursor/`, `.opencode/`, or `_bmad/`.
- The README must eventually include a concise "boundary rule fired" demonstration reference for NFR8.

### References

- [Source: docs/planning-artifacts/epics.md (Epic 1, Story 1.2)]
- [Source: docs/planning-artifacts/architecture.md (module boundaries taxonomy and depConstraints)]
- [Source: docs/planning-artifacts/prd.md (NFR8, CI discipline)]
- [Source: docs/project-context.md (critical implementation rules and gotchas)]
- [Source: docs/implementation-artifacts/sprint-status.yaml (story state)]

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Debug Log References

- Git history sampled (`git log --oneline -5`) for recent implementation patterns.
- Nx docs checked for current boundary rule usage patterns.

### Completion Notes List

- Story context generated with architecture-aligned tag matrix and explicit failure-proof workflow.
- Story status set to `ready-for-dev`.

### File List

- docs/implementation-artifacts/1-2-configure-nx-tags-and-prove-module-boundaries-fire.md
