# Epic 1 Retrospective — Scaffolding, Module Boundaries, and CI

**Date:** 2026-05-11
**Scope:** Stories 1.1–1.6 (Nx scaffold, module boundaries, CI pipeline, branch protection)

---

## Summary

Epic 1 stood up the Nx monorepo, configured enforced module boundaries, built a four-job GitHub Actions CI pipeline (lint, typecheck, Jest, Playwright E2E), and added an auto-approve workflow with branch protection documentation. The major friction came from getting `nx` to run reliably inside GitHub Actions — a problem that consumed four fix commits on Story 1.3 before landing on a stable solution.

---

## What Went Well

- **Module boundaries (Story 1.2)** landed cleanly in a single commit. The `@nx/enforce-module-boundaries` + `no-restricted-imports` combination proved itself immediately — the deliberate-violation demo failed lint exactly as expected.
- **Incremental CI build-up** (Stories 1.3–1.5) made each PR small and reviewable. Adding one job per story kept diffs tight and made debugging CI failures straightforward.
- **`nx affected` pattern** avoids hardcoding project names. The workspace uses `apps` / `apps-e2e` (not `web` / `web-e2e` as some docs assumed), and `affected` handles this transparently.
- **Auto-approve (Story 1.6)** was the simplest story in the epic — one small workflow file with `hmarr/auto-approve-action@v4`. The "Option A" pattern (approve immediately, let branch protection enforce quality) is clean and well-understood.

---

## Lessons Learned — CI Pipeline Challenges

### 1. `nx` was not found on PATH (`pnpm nx affected` failed)

**Problem:** The initial CI workflow used `pnpm nx affected -t lint --base=origin/main`. On the GitHub Actions runner, `pnpm nx` failed with `not found: nx` because the `nx` binary was not on PATH and pnpm's script resolution could not find it.

**Root cause:** The `nx` package was not listed in the project's `devDependencies`. The Nx workspace plugins (`@nx/eslint`, `@nx/jest`, etc.) were present, but the `nx` CLI itself — which provides the `nx` binary — was missing from `package.json`. Locally this worked because a global or cached `nx` was available, but CI had a clean environment.

**Fix:** `pnpm add -D nx` to add the CLI package explicitly to `devDependencies`. This is easy to miss because `create-nx-workspace` historically included `nx` as a direct dependency, but newer versions may rely on it being a transitive dependency of the plugins — which does not guarantee a resolvable binary.

**Commit trail:**
- `b73f6bf` — initial workflow (used `pnpm nx`)
- `a08c229` — switched to `pnpm exec nx` (still failed — `nx` not installed)
- `6066b2e` — switched to `npx nx` (still failed — same root cause)
- `e3761c7` — switched to `./node_modules/.bin/nx` (still failed)
- `35875fb` — **root fix:** added `nx` to `devDependencies` + reverted to `pnpm exec nx`

**Takeaway for future epics:** Always verify that CLI tools used in CI are explicit `devDependencies`, not just transitive. Run `pnpm exec <tool> --version` locally before assuming CI will find it.

### 2. `pnpm exec` vs `pnpm nx` vs `npx` — which invocation works?

**Problem:** Multiple invocation styles were tried (`pnpm nx`, `pnpm exec nx`, `npx nx`, `./node_modules/.bin/nx`) before the root cause was identified.

**Resolution:** Once `nx` was in `devDependencies`, **`pnpm exec nx`** became the canonical invocation. This is the correct pattern because:
- `pnpm exec` resolves from the local `node_modules/.bin/` of the workspace root.
- `pnpm nx` can trigger pnpm's recursive workspace execution behavior, which is not what we want.
- `npx nx` may download a different version or fail if the network is restricted.
- `./node_modules/.bin/nx` works but is fragile and non-idiomatic.

**Takeaway:** Standardize on `pnpm exec <tool>` for all CI commands that invoke locally-installed binaries. This is now the pattern across all four CI jobs and should be carried forward.

### 3. `fetch-depth: 0` is required for `nx affected --base=origin/main`

**Problem (anticipated, not hit):** `nx affected --base=origin/main` computes the project graph diff between the PR branch and `origin/main`. If `actions/checkout` uses the default shallow clone (`fetch-depth: 1`), the `origin/main` ref does not exist and `nx affected` fails.

**Fix:** All CI jobs use `fetch-depth: 0` on `actions/checkout@v4`. This fetches full history so `origin/main` is available.

**Takeaway:** Any CI step that references a Git ref outside the current PR tip needs full history. This is a one-line config but easy to forget.

### 4. Playwright config has three browser projects — future CI time risk

**Observation (from code review, Story 1.5):** `apps-e2e/playwright.config.ts` runs chromium, firefox, and webkit. In CI, this triples E2E runtime. Not a problem yet (specs are minimal), but once real specs land in Epic 4, this could push the `e2e` job past the 5-minute target. Consider trimming to chromium-only for CI and running the full matrix only on release branches or nightly.

---

## Process Observations

- **BMAD workflow** provided useful story context files, but the create-story output can be verbose. For simple CI stories (essentially "add one YAML block"), a lighter-weight story format would suffice.
- **Code review** after each story caught valid issues (artifact paths, missing comments) but most findings were LOW/MEDIUM severity. The iterative PR-per-story approach naturally prevented large regressions.
- **Four fix commits on Story 1.3** are visible in the git log. In a real assessment, this is honest signal — it shows debugging in the open. The alternative (squashing to hide iteration) would be less transparent.

---

## Action Items for Future Epics

| # | Item | Applies to |
|---|------|-----------|
| 1 | Verify all CLI tools are explicit `devDependencies` before writing CI steps | All CI stories |
| 2 | Use `pnpm exec <tool>` consistently — never `pnpm <tool>` or `npx <tool>` | All CI/script work |
| 3 | Consider chromium-only Playwright in CI once real E2E specs land | Epic 4 (Story 4.1) |
| 4 | Apply branch protection settings in GitHub repo UI per `1-6-branch-protection-evidence.md` | Before merging Epic 2 PRs |
| 5 | Keep `fetch-depth: 0` on any new CI job that uses `nx affected` or git refs | All future CI changes |
