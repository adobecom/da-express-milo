# PR Checklist — scope and gradual enforcement (MWPW-187642)

## Branch model

- **`color`** — feature branch  
- **`stage`** — staging  
- **`main`** — production  

We **leave the default PR template as is**: one template for all PRs; we do nothing for stage or main. **We have no enforcement scope for stage or main right now** — we simply don’t run the bot or checklist check for them. The flag `PR_CHECKLIST_TARGET_BRANCH` could be set to stage or main later if we want enforcement there; for now we only use it for **color** (default).

## Scope: configurable target branch

The PR checklist **bot** and **checklist-status** check run only for PRs that **target the branch in `PR_CHECKLIST_TARGET_BRANCH`** (default: **color**). PRs into **stage** or **main** do not trigger the bot or the check.

- **Workflow:** `.github/workflows/pr-checklist-comment.yml` runs on `pull_request` for `color`, `stage`, and `main`; it runs the bot and check only when the PR’s **base branch** matches `PR_CHECKLIST_TARGET_BRANCH`.
- **Config:** Set **`PR_CHECKLIST_TARGET_BRANCH`** to `color`, `stage`, or `main` (Settings → Secrets and variables → Actions → Variables) if you want to move enforcement to another branch. No workflow edit needed.
- **Template:** Same template for everyone; only the **configured target branch** gets enforcement (comments and checks).

---

## Gradual enforcement options

**All behavior is implemented in this PR** (comment job + `checklist-status` job). Rollout is **progressive via Variables and branch protection** — no further code changes.

### Phase 1 — Bot only (reminder)

**Ship with this PR.** No merge blocking.

- Set `PR_CHECKLIST_COMMENT_ONLY=true` (default). The **checklist-status** job runs but **passes** even when items are unchecked (comment-only).
- Bot comments when Pre-merge checklist items are unchecked; updates to “All complete" when done.
- Do **not** add the checklist check to branch protection. Result: reminder comments only; status check stays green.

**Config:** See [PR_CHECKLIST_CONFIG.md](PR_CHECKLIST_CONFIG.md) for all variables and defaults; [PR_CHECKLIST_ANALYSIS_AND_FLAGS.md](PR_CHECKLIST_ANALYSIS_AND_FLAGS.md) for flags and rollout.

---

### Phase 2 — Optional status check (red signal, no block)

**One variable change.** Status check goes red when checklist incomplete; merge still allowed.

- Set **`PR_CHECKLIST_COMMENT_ONLY=false`**. The **checklist-status** job will **fail** when items are unchecked.
- Still do **not** require the check in branch protection. Result: PRs show a red "checklist-status" when incomplete; merge button stays enabled. Use for 1–2 sprints to get the team used to the signal.


---

### Phase 3 — Blocking (required status check)

**One branch-protection change.** Merge blocked until checklist complete.

- Keep `PR_CHECKLIST_COMMENT_ONLY=false`.
- In **Settings** → **Branches** → **Branch protection rules** for the **target branch** (e.g. `color`): enable "Require status checks to pass before merging" and add **checklist-status** (the job name from the workflow) to the required list.
- PRs into that branch can then only merge when the checklist is complete.

---

## Summary

| Phase | What runs on target-branch PRs | Merge blocked? |
|-------|-------------------------------|----------------|
| **1 – Bot only** | Comment when unchecked / update when all checked | No |
| **2 – Optional check** | Same as 1 + status check (pass/fail) | No (check not required) |
| **3 – Blocking** | Same as 2 + check is required on target branch | Yes, until checklist complete |

All of the above apply **only to PRs targeting the branch in `PR_CHECKLIST_TARGET_BRANCH`** (default: `color`). PRs into other branches are unaffected.

---

## Feature flags and emergency relaxation

For a **flag-based** model (configurable target branch, comment-only vs enforced, emergency relaxation without code changes), see **`.github/PR_CHECKLIST_ANALYSIS_AND_FLAGS.md`**. That doc defines variables such as `PR_CHECKLIST_TARGET_BRANCH`, `PR_CHECKLIST_STRICT_COLOR`, and `PR_CHECKLIST_COMMENT_ONLY` so the target branch and enforcement level can be changed via repo Variables only.
