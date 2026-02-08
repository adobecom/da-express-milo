# PR Checklist Bot — config via GitHub Variables

Config is via **GitHub repository variables**, not a file in the repo.

**Where to set:** Repo → **Settings** → **Secrets and variables** → **Actions** → **Variables** tab.

---

## Variables

| Variable | Meaning | Default if unset |
|----------|---------|-------------------|
| `PR_CHECKLIST_BOT_ENABLED` | Master switch | `true` |
| `PR_CHECKLIST_BOT_COMMENT_WHEN_UNCHECKED` | Post/update reminder when items are unchecked | `true` |
| `PR_CHECKLIST_BOT_UPDATE_WHEN_ALL_CHECKED` | Update bot comment to "All complete" when everything is checked | `true` |

Use value **`true`** or **`false`** (case-insensitive).

---

## How to turn the bot off

- **Disable completely:** Add variable `PR_CHECKLIST_BOT_ENABLED` = `false`.
- **No reminder comment, keep success message:** `PR_CHECKLIST_BOT_COMMENT_WHEN_UNCHECKED` = `false`.
- **No "all complete" update:** `PR_CHECKLIST_BOT_UPDATE_WHEN_ALL_CHECKED` = `false`.

No code or config file changes; only repo (or org) variables.
