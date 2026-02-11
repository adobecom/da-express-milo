# Guard dev blocks – required status check

So PRs cannot be merged when a production block or shared code imports from a dev block, the guard workflow must be a **required status check** on the branches we merge into.

## Optional: run guard on demand (for testing devs)

- **`run-guard`** – Add to a PR to re-run the guard workflow without pushing. The check passes or fails based on the current code.
- **`test-guard-fail`** – Add to a PR to **force the guard to fail** (no code change). Use to verify that merge is blocked when the check fails. **Remove** the label to trigger another run (guard runs without the label and passes, so the PR goes green).

Create both labels in the repo (Repo → **Labels** → New label): `run-guard`, `test-guard-fail`.

## Branches to protect

Add branch protection that **requires status checks before merging** on:

- **color** (feature branch)
- **stage**
- **main**

## Steps (repo admin)

For each branch above:

1. **Settings** → **Branches** → **Branch protection rules**
2. Add or edit the rule for that branch (e.g. branch name pattern: `color`, `stage`, `main`).
3. Enable **Require status checks to pass before merging**.
4. Under **Status checks that are required**, add:
   - **prevent-dev-block-imports** (the job from `.github/workflows/guard-dev-blocks.yml`)
5. Save.

After this, the "Merge pull request" button is disabled when **Guard dev blocks / prevent-dev-block-imports** fails.

## Check name

The workflow job name is `prevent-dev-block-imports`. In GitHub's "Add status checks" list it may appear as that name or under "Guard dev blocks".

## Verification steps

- **Local guard:** Run `npm run test:guard` and `node scripts/guard-dev-blocks.js` — both should pass on a clean repo.
- **CI:** Open a PR that touches `express/code/**` — Guard dev blocks workflow runs; merge is blocked if it fails (when required by ruleset).
- **Re-run on demand:** Add the **run-guard** label to the PR — workflow runs again. Remove the label — workflow runs again (add or remove triggers a run).
- **Test failure path:** Add the **test-guard-fail** label — workflow runs and fails (merge blocked). Remove the label — workflow runs again and passes (PR goes green). No code change needed.
