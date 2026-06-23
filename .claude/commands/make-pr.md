Create a pull request for the current branch using the project PR template at `.claude/pr-template.mdc`.

## Steps

1. **Gather branch info:**
   - Run `git branch --show-current` to get the current branch name.
   - Run `git log --oneline origin/stage..HEAD` to see commits on this branch.
   - Run `git diff origin/stage...HEAD --stat` to summarize changed files.

2. **Lint CSS changes** — run `/lint-css` to check any CSS files changed on this branch. If issues are found, show them and ask the user whether to fix before proceeding. If they say yes, apply fixes (`npm run lint:css-vars:pr:fix`) and wait for them to re-stage. If they say no, note the issues in Additional Notes.
   > **Note:** `width` and `height` (and `min-`/`max-`/logical variants) must **not** use `var(--spacing-*)` tokens — these violations have no auto-fix and must be corrected manually.

3. **Auto-build URLs** using the branch name:
   - After URL: `https://<branch>--da-express-milo--adobecom.aem.page/express/?martech=off`
   - Before URL (default): `https://main--da-express-milo--adobecom.aem.page/express/`

3. **Prompt the user** for the following — ask all questions together in a single message, don't proceed until you have answers:
   - **Jira ticket number** (e.g. `MWPW-12345`, or "none")
   - **Test "Before" URL** — confirm the default or let them provide a custom one
   - **Test "After" URL** — confirm the auto-generated one or let them override
   - **Regression URLs** — one or more URLs for existing pages that should be checked for regressions (e.g. other Express pages that use the same component). Ask them to list URLs, or type "none".
   - **Additional notes** — any extra context, related PRs, or known issues (or "none")

4. **Draft the PR** using this exact template structure from `.claude/pr-template.mdc`:

```
## Summary

<brief description of features or fixes>

---

## Jira Ticket

Resolves: [MWPW-NUMBER](https://jira.corp.adobe.com/browse/MWPW-NUMBER)

---

## Test URLs

| Env | URL |
|-------------|-----|
| **Before**  | <before URL> |
| **After**   | <after URL> |

---

## Verification Steps

- <steps to reproduce the issue or view the new feature>
- What to expect **before** and **after** the change.

---

## Potential Regressions

<regression URLs, one per bullet>

---

## Additional Notes

<additional context or "N/A">
```

5. **Create the PR** — derive a concise title (under 70 chars) from the commits and summary, then run:
   ```
   gh pr create --title "<title>" --body "$(cat <<'EOF'
   <filled-in template body>
   EOF
   )"
   ```

6. Return the PR URL when done.
