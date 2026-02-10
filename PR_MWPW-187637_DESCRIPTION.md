# PR Description — MWPW-187637

Copy the content below into the GitHub PR description.

---

## Summary

Sandbox blocks now use **dev-** prefixed variants of the existing page entry-point blocks instead of a separate `dev-palettes` block. Each color page has a corresponding dev block that delegates to the real block (e.g. `dev-color-blindness` → `color-blindness`). The `blocks/dev-palettes/` path has been removed.

**Added:** `dev-color-blindness`, `dev-color-explore`, `dev-color-extract`, `dev-color-wheel`, `dev-contrast-checker` (thin wrappers; set `data-dev="true"` for optional styling).

**Removed:** `express/code/blocks/dev-palettes/` (both JS and CSS).

---

## Jira Ticket

Resolves: [MWPW-187637](https://jira.corp.adobe.com/browse/MWPW-187637)

---

## Test URLs

| Env | URL |
|-----|-----|
| **Before** | https://main--da-express-milo--adobecom.aem.page/express/ |
| **After** | https://MWPW-187637--da-express-milo--adobecom.aem.page/express/?martech=off |

---

## Verification Steps

- **Guard:** Existing guard (e.g. `guard-dev-blocks`) should still treat `dev-*` blocks as dev-only; no production sheet should reference them.
- **Sandbox pages:** Wire a dev/sandbox sheet to use block names `dev-color-blindness`, `dev-color-explore`, `dev-color-extract`, `dev-color-wheel`, or `dev-contrast-checker`. Load the page and confirm the real block content renders (with optional dashed outline from `data-dev="true"`).
- **Before:** Old sandbox may have used `dev-palettes`; that block is removed.
- **After:** Use the dev- prefixed block that matches the target page (e.g. `dev-color-blindness` for the color-blindness page).

---

## Potential Regressions

- https://MWPW-187637--da-express-milo--adobecom.aem.live/express/?martech=off
- Any sheet or doc that still references `dev-palettes` will 404 for that block; update to the appropriate `dev-color-*` or `dev-contrast-checker` block name.

---

## Additional Notes

- Decision and rationale: `dev/jira/MWPW-187637_SANDBOX_BLOCKS_DECISION.md` (repo-local; dev/ is gitignored).
- Dev blocks are for sandboxing only; do not use in production.
