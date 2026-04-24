# Image Compressor — Block Reuse Analysis

Scope: 5 da-express-milo requirements for the Image Compressor JDI feature, mirrored on the Image Resize quick-action pattern. Each decision is grounded in `file:line` evidence from the current `stage` branch.

---

## 1. Add `compress-image` entry to `QA_CONFIGS`

**Decision:** reuse-extend
**Anchor block:** `express/code/scripts/utils/frictionless-utils.js` (shared util; not a block)
**Why:** `QA_CONFIGS` is the single registry of allowed frictionless quick actions (`frictionless-utils.js:86-130`). `resize-image` is present at line 97 as `'resize-image': { ...getBaseImgCfg(JPG, JPEG, PNG, WEBP) }` and is the exact shape the charter calls for. `compress-image` is not in the registry today, so we add one new key — this is a data-only addition, no logic change (per the decision guide row "Type missing from both → `reuse-extend`"). `getBaseImgCfg` already defaults `max_size` to `40 * 1024 * 1024` at line 50, so "40MB max" requires no override.
**Change surface:** Add a single line to `QA_CONFIGS` alongside `resize-image`: `'compress-image': { ...getBaseImgCfg(JPG, JPEG, PNG, WEBP) },`. No other edits to this file for this requirement.
**Loading phase:** L (utility module imported by the frictionless-quick-action block, which is loaded lazily when the block is encountered on the page — not eager/Phase E).

---

## 2. Add `compress-image` dispatch case to `executeQuickAction`

**Decision:** reuse-extend
**Anchor block:** `express/code/scripts/utils/frictionless-utils.js` (shared util)
**Why:** The `quickActionMap` in `executeQuickAction` at `frictionless-utils.js:336-436` routes each quick action id to the matching `ccEverywhere.quickAction.<method>` call. `resize-image` is mapped at lines 364-369. `compress-image` is missing from the map and without an entry, the upload flow silently no-ops (see the `if (action)` guard at line 439). Adding the dispatch case is a pure data/switch addition — no logic change — so `reuse-extend`.
**Change surface:** Add one entry to the `quickActionMap` object mirroring the `resize-image` shape: `'compress-image': () => ccEverywhere.quickAction.compressImage(docConfig, appConfig, exportConfig, contConfig),`. Assumes the Horizon SDK exposes `compressImage` on `ccEverywhere.quickAction` — this is an SDK dependency flagged as a charter Tier 1 blocker and is out of scope for the block analysis. If the SDK method has a different name, this becomes a one-line swap, still `reuse-extend`.
**Loading phase:** L (same module as #1).

---

## 3. Purple promo band block ("Easily compress JPEGs with Adobe Express.")

**Decision:** reuse-as-is
**Anchor block:** `express/code/blocks/banner/`
**Why:** The `banner` block already matches the charter spec exactly without modification:
- Default variant background is `var(--color-info-accent)` at `banner.css:10-12`, which resolves to `#5c5ce0` at `express/code/styles/styles.css:60` — identical to the charter's `~#5c5ce0` indigo/purple.
- Default text color is `var(--color-white)` at `banner.css:49-50`, h2 color is also white at `banner.css:70-72`.
- `h2` is rendered center-aligned (`banner.css:28-35`) with `--heading-font-weight-extra` and `--heading-font-size-m` (`banner.css:79-86`) — this is Adobe Clean Black heavy weight, close to the 28px centered heading the charter calls for. Any small size tweak can be a section-scoped CSS override on the authored page (no block change).
- CTA: `decorateButtonsDeprecated` + the banner.js logic at lines 42-58 makes the anchor an `accent dark` button on the dark default background. Against `#5c5ce0`, the rendered pill CTA is indigo/white reverse — matches the charter's "rounded pill CTA in indigo" intent. Shape is rounded (global button styles).
- `promotion` block is verified dead: `promotion.js:1-9` is a stub that only removes itself from the DOM. Do not use.
- Other candidates rejected: `banner-bg` layers a background image (wrong — charter asks for a solid band); `ribbon-banner` is a thin strip above hero; `sticky-promo-bar` is a floating/sticky element; `template-promo` centers on template grids; `quotes` is for testimonial copy with attribution; `marquee`/`hero-marquee` are for hero slots not secondary promo bands.
**Change surface:** No code change. Author adds a `banner` block on the jpg compress page with a single row containing the h2 heading ("Easily compress JPEGs with Adobe Express.") and a CTA button. The existing default-variant background and typography already produce the charter design. If the exact 28px heading size is required and `--heading-font-size-m` differs, that can be tuned via a section metadata inline style — still no block change.
**Loading phase:** L (body block, not in the hero/first section — appears below the frictionless hero per the charter).

---

## 4. Update hero on `/express/feature/image/compress/jpg`

**Decision:** reuse-as-is
**Anchor block:** `express/code/blocks/frictionless-quick-action/`
**Why:** `frictionless-quick-action` resolves the quick action from an authored table row, not a CSS variant class: at `frictionless-quick-action.js:778-782` it reads `quickActionRow?.[0].children[1]?.textContent` to set `quickAction`. So adding `quick-action = compress-image` in a new content row is sufficient — no `.js`/`.css` change. The block already proxies `quickAction` straight through to `QA_CONFIGS[...]` and `executeQuickAction(...)` (already handled by requirements #1 and #2). The CSS selector `#<quickaction>-container` at `frictionless-quick-action.css:167` is auto-generated from the quick action id, so `#compress-image-container` will scope cleanly; any sizing tweak if the compress panel needs different dimensions would be a cosmetic CSS add, still inside the same block, but is NOT required for initial parity with resize.
**Change surface:** No code change. Authoring replaces the HARMAN hero on the page with a `frictionless-quick-action` block whose rows include `quick-action | compress-image`, the upload animation, and the upload CTA. How-to step 1 copy is authoring on the same page. The variant class `compress-image` on the block element is purely a hook for any future scoped CSS — it is not read by the block today.
**Loading phase:** E (first section of the marketing page; the frictionless hero is Phase E per aem-franklin-loading-phases — it's the LCP block).

---

## 5. Page metadata on `/express/feature/image/compress/jpg`

**Decision:** reuse-as-is
**Anchor block:** n/a (section metadata table, not a block)
**Why:** `show-floating-cta`, `desktop-floating-cta`, `mobile-floating-cta`, and `frictionless-safari` are all existing metadata keys consumed by already-shipped code paths (floating-button blocks + frictionless Safari handling). No new key needs to be registered.
**Change surface:** No code change. Authoring adds a section metadata table (or page metadata) with the four key/value pairs.
**Loading phase:** E (metadata is parsed during initial page decoration in Phase E).

---

## Summary of decisions

| # | Requirement | Decision |
|---|-------------|----------|
| 1 | `QA_CONFIGS` entry | reuse-extend |
| 2 | `executeQuickAction` dispatch | reuse-extend |
| 3 | Purple promo band | reuse-as-is (`banner` default variant) |
| 4 | Hero uses `frictionless-quick-action` | reuse-as-is |
| 5 | Page metadata | reuse-as-is |

**Highest risk:** requirement #2 depends on the Horizon standalone-QA SDK exposing `ccEverywhere.quickAction.compressImage(...)` with the same `(docConfig, appConfig, exportConfig, contConfig)` signature as `resizeImage`. If the SDK method is named differently (e.g. `compressJPEG`) or has a different signature, the one-line dispatch entry needs to change — cheap to fix but requires SDK confirmation before landing. This is already flagged as a Tier 1 blocker in the charter.
