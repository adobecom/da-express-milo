# PR Checklist — configuration and defaults (MWPW-187642)

Single reference for **all variables** and **default configuration**. The workflow uses these defaults when a variable is not set in GitHub.

**Where to set (optional):** Repo → **Settings** → **Secrets and variables** → **Actions** → **Variables** tab.

---

## Default configuration (no Variables set)

If you set **no** variables, the workflow behaves as follows:

| Variable | Default | Effect |
|----------|----------|--------|
| `PR_CHECKLIST_TARGET_BRANCH` | `color` | Bot and status check run only for PRs **targeting `color`**. |
| `PR_CHECKLIST_STRICT_COLOR` | `true` | Enforcement enabled for the target branch. |
| `PR_CHECKLIST_COMMENT_ONLY` | `true` | Status check **passes** even when checklist has unchecked items (reminder only; no blocking). |
| `PR_CHECKLIST_BOT_ENABLED` | `true` | Bot posts/updates comments. |
| `PR_CHECKLIST_BOT_COMMENT_WHEN_UNCHECKED` | `true` | Bot posts or updates the "items still unchecked" comment. |
| `PR_CHECKLIST_BOT_UPDATE_WHEN_ALL_CHECKED` | `true` | Bot updates comment to "All complete" when all items are checked. |

**Result:** PRs into **color** get reminder comments when the Pre-merge checklist has unchecked items; the **checklist-status** check stays green. Draft PRs are skipped. No branch protection required.

---

## All variables (reference)

Use **`true`** or **`false`** (case-insensitive) for boolean variables.

| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `PR_CHECKLIST_TARGET_BRANCH` | string | `color` | Branch that gets enforcement. Set to `stage` or `main` to enforce there instead. |
| `PR_CHECKLIST_STRICT_COLOR` | bool | `true` | **Emergency kill switch:** if `false`, workflow skips entirely (no bot, no check). Set to `false` to disable all PR checklist behavior. |
| `PR_CHECKLIST_COMMENT_ONLY` | bool | `true` | If `true`, status check passes when checklist incomplete. If `false`, check fails → use with branch protection to block merge. |
| `PR_CHECKLIST_BOT_ENABLED` | bool | `true` | Master switch for the comment bot. |
| `PR_CHECKLIST_BOT_COMMENT_WHEN_UNCHECKED` | bool | `true` | Post/update reminder when items are unchecked. |
| `PR_CHECKLIST_BOT_UPDATE_WHEN_ALL_CHECKED` | bool | `true` | Update bot comment to "All complete" when all items checked. |

---

## Optional: set Variables in GitHub to match defaults

You can explicitly set these in GitHub Variables so the configured behavior is visible in the repo settings. Values below match the defaults the workflow uses when unset.

| Variable | Value |
|----------|--------|
| `PR_CHECKLIST_TARGET_BRANCH` | `color` |
| `PR_CHECKLIST_STRICT_COLOR` | `true` |
| `PR_CHECKLIST_COMMENT_ONLY` | `true` |
| `PR_CHECKLIST_BOT_ENABLED` | `true` |
| `PR_CHECKLIST_BOT_COMMENT_WHEN_UNCHECKED` | `true` |
| `PR_CHECKLIST_BOT_UPDATE_WHEN_ALL_CHECKED` | `true` |

Only add Variables you want to **override**. Unset Variables use the defaults in the workflow.

---

## Emergency: disable everything

Set **one** variable to turn off all PR checklist behavior (bot + status check):

| Variable | Value |
|----------|--------|
| `PR_CHECKLIST_STRICT_COLOR` | `false` |

No code or workflow change; no need to touch other variables. Set back to `true` to re-enable.

---

## See also

- **Rollout and phases:** [PR_CHECKLIST_ENFORCEMENT_OPTIONS.md](PR_CHECKLIST_ENFORCEMENT_OPTIONS.md)
- **Flags and architecture/DORA:** [PR_CHECKLIST_ANALYSIS_AND_FLAGS.md](PR_CHECKLIST_ANALYSIS_AND_FLAGS.md)
