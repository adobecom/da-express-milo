# CSS Variable Linter

Lint CSS files for variable usage compliance against the rules in `scripts/lint-css-vars.js`.

## Rules enforced

1. **Color variables** — hardcoded color values (`#hex`, `rgb()`, etc.) must use `var(--color-*)` from `styles.css` when an exact match exists
2. **Font sizes** — use `px`, not `rem`; if a CSS variable matches the rem value, suggest that variable instead
3. **Spacing variables** — use `var(--spacing-*)` for `margin`, `padding`, and `gap` properties **only**. `width` and `height` (and their `min-`/`max-` and logical equivalents) must **not** use spacing tokens — flag any instance where they do, with no auto-fix (the developer must choose the correct fixed value)

## Steps

1. **Determine which files to check:**
   - Run `git diff origin/stage...HEAD --name-only --diff-filter=ACM | grep '\.css$'` to see what CSS files changed on this branch
   - If no CSS files changed, report "No CSS changes to lint ✅" and stop

2. **Run the linter:**
   ```
   npm run lint:css-vars:pr
   ```
   Or to check specific files: `node scripts/lint-css-vars.js path/to/file.css`

3. **Report the output** — show all issues with file, line, and fix suggestion

4. **Offer to auto-fix:** Ask the user if they want to run `npm run lint:css-vars:pr:fix` to apply fixes automatically. Remind them to re-stage files after fixing.

## When called from make-pr

Run this check after gathering branch info, before prompting the user for PR details. If issues are found:
- Show the issues
- Ask: "Fix these before creating the PR?" 
- If yes: run `npm run lint:css-vars:pr:fix`, then ask the user to stage the fixed files
- If no: continue to PR creation and mention the lint issues in Additional Notes
