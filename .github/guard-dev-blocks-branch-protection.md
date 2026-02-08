# Guard dev blocks – required status check

So PRs cannot be merged when a production block or shared code imports from a dev block, the guard workflow must be a **required status check** on the branches we merge into.

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

The workflow job name is `prevent-dev-block-imports`. In GitHub’s “Add status checks” list it may appear as that name or under “Guard dev blocks”.
