# PR process comparison and flag-based enforcement (MWPW-187642)

This document compares a **reference PR process** (branch-specific expectations, comment-only vs enforced, feature flags) with **what we have** in da-express-milo and proposes a **flag-based enforcement model** so we can turn behavior on and dial enforcement up without code changes.

---

## Our branch model

We have three branches (no release branches):

- **`color`** — feature branch
- **`stage`** — staging
- **`main`** — production

**We leave the default PR template as is:** one template for all PRs; we do nothing special for stage or main. **We have no enforcement scope for stage or main right now** — the bot and status check run only for the branch set in `PR_CHECKLIST_TARGET_BRANCH` (default: **color**). The flag exists so we could point enforcement at stage or main later if we want; for now we simply don’t.

---

## Reference process vs our setup

| Aspect | Reference process | da-express-milo (current / PR 121) |
|--------|--------------------|-------------------------------------|
| **Branch scope** | Two targets (e.g. main + release branches) | **Configurable target branch** (default `color`); stage and main can be enabled via variable |
| **Templates** | Different template per target branch | **Default template as is**; one template for all; enforcement only for configured target (default color). No scope for stage/main right now. |
| **Enforcement modes** | **Comment-only** (remind, don’t block) vs **Enforced** (checks fail, merge blocked) | Phase 1 = comment only; Phase 2 = optional check; Phase 3 = required check = blocking |
| **Feature flags** | strictMainPRs, hardenedReleases, commentOnlyMode, requireTestEvidence, requireRollbackPlan | Bot vars only today; we add **strict color** + **comment-only vs enforced** |
| **Rollout** | Start comment-only; then disable comment-only to enforce | Same: Phase 1 → 2 → 3; one flag flip to enforce |
| **Emergency** | Relax via flags, no code change | `PR_CHECKLIST_STRICT_COLOR=false` or `PR_CHECKLIST_COMMENT_ONLY=true` |

---

## What we can leverage

1. **Single “comment-only vs enforced” flag**  
   One flag that controls whether the **status check** passes when the checklist is incomplete. When “comment-only” is on: bot still comments, but the check always passes (or we don’t run a failing check). When off: check fails when items are unchecked → merge blocked if the check is required. This matches “flags on and up for enforcement.”

2. **Configurable target branch**  
   The branch that gets enforcement is set by **`PR_CHECKLIST_TARGET_BRANCH`** (default: `color`). We have no scope for stage or main right now — we leave the default template as is and don’t run the bot/check for them. The flag exists so we could point enforcement at stage or main later; for now we only use it for color. A master switch (`PR_CHECKLIST_STRICT_COLOR`) turns enforcement off entirely.

3. **Optional section requirements**  
   We could add flags like “require test evidence” or “require rollback plan” later if we validate specific sections (not only checkboxes). For now we can document the pattern and keep checklist = Pre-merge checkboxes.

4. **Single source of truth doc**  
   One doc (this + `PR_CHECKLIST_ENFORCEMENT_OPTIONS.md`) that defines: which branches get enforcement, which flags exist, comment-only vs enforced, and how to relax in emergencies.

---

## Proposed flag model for da-express-milo

Flags are **GitHub repository Variables** (Settings → Secrets and variables → Actions → Variables). All default to `true` unless noted. **Full list and defaults:** [PR_CHECKLIST_CONFIG.md](PR_CHECKLIST_CONFIG.md).

### Branch and master switch

| Flag | Purpose | Default | Notes |
|------|---------|--------|--------|
| `PR_CHECKLIST_TARGET_BRANCH` | **Branch that gets enforcement** (PRs into this branch run the bot/check) | `color` | We have no scope for stage/main right now; the flag could be set to `stage` or `main` later if we want. No code change. |
| `PR_CHECKLIST_STRICT_COLOR` | Master switch: enable checklist enforcement for the configured target branch | `true` | If `false`, workflow skips; no comments, no check. Emergency “turn off everything.” |

### Enforcement level (comment-only vs enforced)

| Flag | Purpose | Default | Notes |
|------|---------|--------|--------|
| `PR_CHECKLIST_COMMENT_ONLY` | When `true`: bot comments on missing items; **status check always passes** (or no failing check). When `false`: status check **fails** when checklist incomplete → merge blocked if check is required. | `true` | Start with `true` (comment-only); flip to `false` when we want to enforce. “Flags on and up for enforcement.” |

### Bot behavior (existing, keep naming or align)

| Flag | Purpose | Default |
|------|---------|--------|
| `PR_CHECKLIST_BOT_ENABLED` | Master switch for the **comment** bot | `true` |
| `PR_CHECKLIST_BOT_COMMENT_WHEN_UNCHECKED` | Post/update comment when items unchecked | `true` |
| `PR_CHECKLIST_BOT_UPDATE_WHEN_ALL_CHECKED` | Update comment to “All complete” when done | `true` |

### Optional future (section requirements)

| Flag | Purpose | Default |
|------|---------|--------|
| `PR_CHECKLIST_REQUIRE_TEST_EVIDENCE` | Require Verification Steps / testing section | `true` (when we add section checks) |
| `PR_CHECKLIST_REQUIRE_ROLLBACK` | Require rollback / regressions thinking for color PRs | `false` or `true` later |

We can keep our current bot variable names and add the new ones above so we don’t break existing config.

---

## How this maps to our phases

| Phase | `PR_CHECKLIST_STRICT_COLOR` | `PR_CHECKLIST_COMMENT_ONLY` | Status check | Branch protection |
|-------|-----------------------------|-----------------------------|-------------|-------------------|
| **1 – Bot only** | `true` | `true` | Run and **always pass** (reminder only) | Not required |
| **2 – Optional red signal** | `true` | `false` | Run; **fails** when incomplete (red check); merge still allowed | Not required |
| **3 – Blocking** | `true` | `false` | Run; fail when incomplete | Required on target branch |

So:

- **Comment-only** = “remind but don’t block”: either no status check, or status check always passes when `PR_CHECKLIST_COMMENT_ONLY=true`.
- **Enforced** = status check fails when incomplete and is required on `color`; `PR_CHECKLIST_COMMENT_ONLY=false`.

Implementation: the checklist-status job reads `PR_CHECKLIST_COMMENT_ONLY`. If checklist has unchecked items and `commentOnly` is true → job succeeds. If `commentOnly` is false → job fails.

---

## Recommended default and rollout

**All features are implemented in this PR** (bot + status check job with `PR_CHECKLIST_COMMENT_ONLY` logic). Rollout is **progressive via flags and branch protection** — no further code changes.

- **Phase 1 (ship with this PR):**  
  - `PR_CHECKLIST_STRICT_COLOR=true`, `PR_CHECKLIST_COMMENT_ONLY=true`.  
  - Bot on; status check job runs and **passes** when checklist incomplete (comment-only).  
  - Do **not** add the checklist status check to branch protection.  
  - Result: reminder comments only; check is green.

- **Phase 2 (optional red signal):**  
  - Set `PR_CHECKLIST_COMMENT_ONLY=false`.  
  - Still do **not** require the check in branch protection.  
  - Result: bot + status check that goes **red** when incomplete; merge still allowed. Use for 1–2 sprints so the team sees the signal.

- **Phase 3 (blocking):**  
  - Keep `PR_CHECKLIST_COMMENT_ONLY=false`.  
  - In **Settings → Branches** for the target branch, require the **checklist-status**  (job name from this workflow) as required.  
  - Result: merge blocked until checklist complete. One branch-protection change; no code or variable change.

---

## Emergency and fast-path

- **Stop all enforcement for color:** Set `PR_CHECKLIST_STRICT_COLOR=false`. Workflow can no-op; no comments, no check.
- **Keep reminders but stop blocking:** Set `PR_CHECKLIST_COMMENT_ONLY=true`. Status check will pass even when checklist incomplete (if we implement the “pass when comment-only” behavior in the job).
- **No code or workflow change**; only repo Variables.

---

## Connection to architecture, DORA, CI, and dev ownership

This process exists to improve **outcomes** (quality, speed, ownership), not to add bureaucracy. Below is how it ties to our architecture, DORA, CI, development efficiency, and dev empowerment.

### Architecture

- **Charter and contracts:** The [Engineering Dev Charter](dev/architecture/01-engineering-dev-charter.md) and [Contracts as boundaries](dev/architecture/03-contracts-as-boundaries.md) define how we build (shared blocks, renderers, no page hacks, rollback paths). The PR checklist makes that **visible at review time**: Summary/Why/How, Verification steps, and “Potential regressions” align with **Definition of Done** (covered by tests, observable, documented) and **anti-patterns** (e.g. shipping without rollback). Reviewers can reference the charter in PRs; the checklist ensures the right context is in the description.
- **Shared blocks principles:** [02-shared-blocks-principles.md](dev/architecture/02-shared-blocks-principles.md) (multiple consumers, stability over flexibility, no preemptive generalization). The checklist’s “PR Review Checklist” (imports audit, contract & scope, shared vs page) keeps PRs that touch shared code aligned with those rules **before** merge, reducing drift and rework.
- **Async and remote:** The charter points to [ASYNC_AND_REMOTE_COLLABORATION](dev/06-guides/ASYNC_AND_REMOTE_COLLABORATION.md), which already calls out a PR checklist. This workflow is that artifact: it makes async review effective by ensuring intent, test evidence, and rollback are documented in the PR body so reviewers don’t have to ask repeatedly.

### DORA (DevOps Research and Assessment)

- **Lead time (idea → production):** Fewer review rounds and less “please add X” back-and-forth shorten the time from “PR opened” to “merged.” The checklist prompts authors to include Summary, Verification steps, and regressions up front, so reviewers can approve with confidence instead of blocking on missing context.
- **Change failure rate:** Catching missing test evidence, rollback thinking, or scope creep at PR time (comment-only or enforced) reduces the chance that we merge PRs that later cause incidents or hotfixes. That directly supports **lower change failure rate**.
- **Deployment frequency / recovery:** When the bar is clear and consistently applied (especially once we move to Phase 3 on the target branch), teams can ship more often with **confidence** that the checklist has already forced consideration of verification and regressions — supporting both deployment frequency and “recovery over heroics” (charter).

### CI (Continuous Integration)

- The **checklist-status** job is a **CI quality gate**: it runs on every push to a PR targeting the configured branch and passes or fails based on checklist completion. It does not replace tests or lint; it ensures **human intent and process** (what changed, how it was verified, where it could regress) is captured before merge. That makes CI a gate for both **code** and **intent**.

### Development efficiency and time saved

- **Less back-and-forth:** When Summary, Jira ticket, Test URLs, Verification steps, and Potential regressions are required (or strongly reminded), reviewers spend less time asking “what does this do?” or “how was it tested?” — and authors spend less time replying in comments. Time saved compounds across many PRs.
- **Faster, more consistent reviews:** Reviewers can focus on **architecture and logic** instead of policing missing sections. The checklist shifts “did you fill the template?” from reviewer nagging to a bot or status check, so review cycles are shorter and more predictable.
- **Async-friendly:** Strong PR descriptions and checklists make it possible to review and approve **asynchronously** without hopping on a call. That supports focus time and remote collaboration (charter, ASYNC_AND_REMOTE_COLLABORATION).

### Dev ownership empowerment

- **Authors own the bar:** The checklist is **author-facing**. Developers know exactly what “done” looks like before they request review; they’re empowered to meet the bar themselves instead of depending on a reviewer to catch missing pieces. That reinforces **individual page ownership** and **collective stewardship** of shared blocks (charter).
- **Clear, consistent bar:** Same template and (when enforced) same check for everyone. No “this reviewer cares about X, that one doesn’t” — the bar is explicit and in the repo, so ownership is clear and fair.
- **Guidance first, enforcement second:** We roll out with **comment-only** (Phase 1–2) so the checklist is guidance and signal before it becomes a hard gate. That builds ownership and habit without surprise; when we switch to blocking (Phase 3), developers already know the expectations. The intent is **guidance first, enforcement second**.

---

## Summary: alignment with reference

- **Our context:** Branches are **color** (feature), **stage** (staging), **main** (production). We leave the default template as is; we have **no enforcement scope for stage or main right now**. The **target branch** is configurable via `PR_CHECKLIST_TARGET_BRANCH` (default: `color`); the flag could be used for stage/main later if we want.
- **Flags:** `PR_CHECKLIST_TARGET_BRANCH`, `PR_CHECKLIST_STRICT_COLOR`, `PR_CHECKLIST_COMMENT_ONLY`, plus existing bot variables.

The workflow includes both the comment job and the **checklist-status** job; rollout is controlled by `PR_CHECKLIST_COMMENT_ONLY` and branch protection only.
