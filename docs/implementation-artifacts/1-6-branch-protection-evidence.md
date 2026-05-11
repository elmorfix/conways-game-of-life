# Branch Protection Configuration — `main`

## Required Settings (GitHub → Settings → Branches → Branch protection rules)

**Rule pattern:** `main`

### Protect matching branches

| Setting | Value | Rationale |
|---------|-------|-----------|
| Require a pull request before merging | **Enabled** | AR2 — no direct pushes |
| Required approving reviews | **1** | Auto-approve workflow provides this on green |
| Dismiss stale pull request approvals when new commits are pushed | **Enabled** (recommended) | Re-triggers auto-approve on force-push |
| Require status checks to pass before merging | **Enabled** | NFR7 — CI gates block merge on failure |
| **Required status checks** | `lint`, `typecheck`, `test`, `e2e` | Four CI jobs from `.github/workflows/ci.yml` |
| Require branches to be up to date before merging | **Optional** (recommended off for solo dev) | Avoids rebasing churn on a single-contributor repo |
| Do not allow bypassing the above settings | **Enabled** | Even admins must go through PRs |

### Additional settings

| Setting | Value |
|---------|-------|
| Restrict who can push to matching branches | Not required (PRs are the gate) |
| Allow force pushes | **Disabled** |
| Allow deletions | **Disabled** |

## How it works together

1. Developer opens a PR targeting `main`.
2. **CI workflow** (`ci.yml`) triggers and runs `lint`, `typecheck`, `test`, `e2e` in parallel.
3. **Auto-approve workflow** (`auto-approve.yml`) triggers and immediately posts an approving review from `github-actions[bot]`.
4. Branch protection requires **all four checks green + 1 approving review** before the merge button is enabled.
5. If any check fails, the PR cannot merge despite having the auto-approve review — checks are the quality gate, the review is the process gate.

## Verification

- **Direct push test:** `git push origin main` should be rejected with "protected branch" error.
- **Failing check test:** A PR with a lint error should show the auto-approve review but remain un-mergeable.
- **Green PR test:** A PR with all checks passing should show both the auto-approve review and a green merge button.
