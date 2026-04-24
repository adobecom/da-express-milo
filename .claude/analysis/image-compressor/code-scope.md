# Code Change Scope — Image Compressor

## express/code/scripts/utils/frictionless-utils.js

**Action:** modify
**Reason:** Charter requirements #1 (`QA_CONFIGS` entry) and #2 (`executeQuickAction` dispatch) — both are `reuse-extend` in `block-reuse.md` §1 and §2. This file is the single registry/dispatch shared by both desktop `frictionless-quick-action` and `frictionless-quick-action-mobile`; adding the two entries here auto-enables the compress flow on both.
**Change surface:** Two small additions to a single shared module.
1. **`QA_CONFIGS` object** — add `'compress-image'` key. Mirror the `resize-image` reference at `express/code/scripts/utils/frictionless-utils.js:97` (`'resize-image': { ...getBaseImgCfg(JPG, JPEG, PNG, WEBP) },`). Insert immediately after line 97 so related image QAs stay grouped. Registry block spans `frictionless-utils.js:86-130`. No override for `max_size` — `getBaseImgCfg` at `frictionless-utils.js:48-53` already defaults to `40 * 1024 * 1024`.
2. **`quickActionMap` inside `executeQuickAction`** — add `'compress-image'` dispatch case. Mirror the `resize-image` reference at `express/code/scripts/utils/frictionless-utils.js:364-369`. Map spans `frictionless-utils.js:336-436`; the `if (action)` guard at `frictionless-utils.js:438-441` is why a missing entry silently no-ops — this is the reason the dispatch addition is non-optional. Same 4-arg signature (`docConfig, appConfig, exportConfig, contConfig`) as `resizeImage`.

**Loading phase:** L — module is imported by the `frictionless-quick-action` block (lazy load when the block is encountered). Note: the block itself lives in Phase E (first-section hero), but this util is pulled in by the block's own lazy chain.
**Phase-B rules to consult at edit time:** `.cursor/rules/express-blocks.mdc`, `.cursor/rules/aem-franklin-loading-phases.mdc`, `.cursor/rules/testing-quality.mdc`
**Risk:** medium
**Risk rationale:** Dispatch line depends on Horizon SDK method being named `compressImage` with the `(docConfig, appConfig, exportConfig, contConfig)` signature — charter confirms the name but ship is gated on SDK availability. If the SDK renames the method, it's a one-line fix; if the signature diverges, this entry must change shape.

### Concrete diff sketch (pseudo-diff, NOT executed — for review)
```diff
// Around line 97 (after 'resize-image')
  'crop-image': { ...getBaseImgCfg(JPG, JPEG, PNG) },
  'resize-image': { ...getBaseImgCfg(JPG, JPEG, PNG, WEBP) },
+ 'compress-image': { ...getBaseImgCfg(JPG, JPEG, PNG, WEBP) },
  'remove-background': { ...getBaseImgCfg(JPG, JPEG, PNG) },
```

```diff
// Around lines 364-369 (after 'resize-image' branch)
    'resize-image': () => ccEverywhere.quickAction.resizeImage(
      docConfig,
      appConfig,
      exportConfig,
      contConfig,
    ),
+   'compress-image': () => ccEverywhere.quickAction.compressImage(
+     docConfig,
+     appConfig,
+     exportConfig,
+     contConfig,
+   ),
    'remove-background': () => ccEverywhere.quickAction.removeBackground(
```

---

## Out of scope (explicitly)
- New block folder for purple promo band — reuse-as-is via existing `banner` block (see block-reuse.md req #3)
- `.js`/`.css` edits to `frictionless-quick-action` — reuse-as-is via authored `quick-action | compress-image` row (see block-reuse.md req #4)
- Nala E2E tests — dropped from scope per user instruction
- SDK bump for CCEverywhere — charter handoff item, not da-express-milo scope
- Page metadata edits on `/express/feature/image/compress/jpg` — content/authoring layer, not code (see block-reuse.md req #5)
- `frictionless-quick-action-mobile.js` — mobile reads the same `QA_CONFIGS` + `executeQuickAction`; the two edits above enable mobile automatically (charter "Explicitly NOT required")

## Cross-repo dependencies (charter handoffs)
- CCEverywhere SDK must expose `ccEverywhere.quickAction.compressImage(docConfig, appConfig, exportConfig, contConfig)` — if renamed, the one-line dispatch entry changes.
- Horizon must implement the `compress-image` standalone QA panel — not our code.
