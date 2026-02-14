# Modal shell — prod readiness

Checklist for shipping the color-shared modal (MWPW-185800): lint, test, code review.

---

## 1. Lint

### Scope

- **Modal (prod path):** `createModalManager.js`, `logModalDimensions.js` — **pass** (as of last run).
- **Repo-wide:** `npm run lint` runs ESLint + Stylelint. The repo has pre-existing errors elsewhere (e.g. dev prototypes, other blocks). For this PR, only modal JS is required to be clean.

### Commands

```bash
# Lint modal JS only
npx eslint express/code/scripts/color-shared/modal/createModalManager.js express/code/scripts/color-shared/modal/logModalDimensions.js

# Full repo (optional; will report other files)
npm run lint
```

### Modal lint status

| File | Status | Notes |
|------|--------|--------|
| createModalManager.js | ✅ Pass | no-use-before-define disabled for callback pattern; max-len satisfied |
| logModalDimensions.js | ✅ Pass | Named export kept; consistent-return (return undefined / return out) |
| createPaletteModal.js, createGradientModal.js | Phase 2 | Not in critical path for modal shell ship |

---

## 2. Tests

### Scope

- **Modal:** `test/scripts/color-shared/modal/createModalManager.test.js`
- **Dev block:** `test/blocks/dev-color-shareui/dev-color-shareui.test.js`

### Command

```bash
npm test
```

Runs all tests (wtr). For modal-only during dev:

```bash
npx wtr "test/scripts/color-shared/modal/createModalManager.test.js" "test/blocks/dev-color-shareui/dev-color-shareui.test.js" --node-resolve --port=2001
```

### Test status

- Full suite: run `npm test` and confirm no failures in the above files.
- Capture: _Last run: [date] — X passed, Y failed._ (Update when you run.)

---

## 3. Code review checklist

### Modal shell (createModalManager.js, modal-styles.css)

- [ ] **No console.** No `console.log` / `console.warn` / `console.error` in modal manager or in prod code path.
- [ ] **No dev-only in prod path.** `logModalDimensions` is not called from createModalManager (removed for prod).
- [ ] **A11y.** role=dialog, aria-modal, focus trap, Escape, backdrop, aria-live announcer (inlined).
- [ ] **Breakpoints.** 1024px inclusive for desktop (modal), exclusive for tablet (drawer); 768px for tablet layout.
- [ ] **Resize.** switchMode() swaps drawer ↔ modal; transitions disabled during swap; min-height pinned when resizing down to avoid flash.
- [ ] **Styles.** All under `ax-color-*`; no long spec/ticket comments in CSS (see README).
- [ ] **Errors.** ensureModalStyles() catch is silent; consider reporting in Phase 2 if needed.

### Modal content (createPaletteModal.js, createGradientModal.js)

- [ ] Phase 2; not required clean for modal shell prod. Lint/refactor when updating.

### Dev block (dev-color-shareui)

- [ ] Not deployed to prod (config/build). Used only for local/testing.
- [ ] Tests import from correct paths (dev block stub, not modal folder).

---

## 4. Capture template

When running before merge, fill in:

| Step | Command | Result |
|------|---------|--------|
| Lint (modal) | `npx eslint express/code/scripts/color-shared/modal/createModalManager.js express/code/scripts/color-shared/modal/logModalDimensions.js` | ✅ Pass / ❌ Fail |
| Tests | `npm test` | X passed, Y failed |
| Code review | This checklist | Done / Outstanding |

**Date:** _____________  
**Branch:** _____________
