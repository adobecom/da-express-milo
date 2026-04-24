---
feature: Image Compressor (JDI)
jira: n/a
wiki: https://wiki.corp.adobe.com/spaces/cclight/pages/3747034497/JDI+Image+Compressor
figma:
  acom_page: https://www.figma.com/design/RJnlFSA7WqcyMwnOuWWfmy/Shairilk-image-compress-acom?node-id=0-1
  flow_loaded_state: https://www.figma.com/design/EAYzMQMVbBiP16wHXrSP4o/shairilk-2
status: confirmed
date: 2026-04-24
---

## What We Are Building

Add a new `compress-image` frictionless quick action to `/express/feature/image/compress/jpg`, replacing the current HARMAN add-on funnel with the existing frictionless upload pattern. After upload, da-express-milo hands off to CCEverywhere SDK `ccEverywhere.quickAction.compressImage()`; Horizon renders the post-upload panel (format picker, size slider, Original/New size readouts, Reset, Download, "Open in Adobe Express" CTAs) via the standalone quick-action SDK shell — the exact same architecture as the existing Image Resize feature.

Content-layer scope on the Acom page is a **hero swap only** (plus how-to step 1 copy update and a new purple promo band) — rest of the page body is identical to today's live page and stays as-is.

## da-express-milo Requirements

### Code layer

- [ ] [new-build] Add `compress-image` entry to `QA_CONFIGS` in [express/code/scripts/utils/frictionless-utils.js:86-130](express/code/scripts/utils/frictionless-utils.js#L86-L130) — mirror the `resize-image` shape at line 97: `'compress-image': { ...getBaseImgCfg(JPG, JPEG, PNG, WEBP) }`. 40MB max. Input formats confirmed from the Acom Figma hero card: "JPEG/JPG/PNG/WebP under 40MB".

- [ ] [existing-extend] Add `compress-image` dispatch case to `executeQuickAction` in [express/code/scripts/utils/frictionless-utils.js:327-442](express/code/scripts/utils/frictionless-utils.js#L327-L442):
  ```js
  'compress-image': () => ccEverywhere.quickAction.compressImage(docConfig, appConfig, exportConfig, contConfig)
  ```
  SDK method name **confirmed** as `compressImage`. Container/config reuse `createContainerConfig()` at [frictionless-utils.js:255-263](express/code/scripts/utils/frictionless-utils.js#L255-L263).

- [ ] [new-build] **Purple promo band block** — "Easily compress JPEGs with Adobe Express" (Acom Figma hero area).
  - This is a **net-new block** — no existing block matches cleanly.
  - `promotion.js` is deprecated; **do NOT resurrect it**.
  - Implementation Agent must scope: block folder name, authoring shape (table rows), DOM/CSS, tokens.
  - Inherit colour, type, and spacing tokens from the Acom Figma (primary purple band background, white text, rounded pill CTA in indigo `#5c5ce0`).
  - ⚠️ **This is the one net-new block in this charter. Everything else is config or reuse. Call it out explicitly in PR/commits.**

- [ ] [new-build] Nala E2E coverage — add a `compress-image` test case to the existing [nala/blocks/frictionless-qa-image/](nala/blocks/frictionless-qa-image/) suite, following the `resize-image` pattern at [nala/blocks/frictionless-qa-image/frictionless-qa-image.spec.cjs:19-29](nala/blocks/frictionless-qa-image/frictionless-qa-image.spec.cjs#L19-L29):
  - Test path: `/drafts/nala/test-gen/frictionless-qa-image/fqa-image-compress`
  - Locator: `[class*="frictionless-quick-action"][data-frictionlesstype="compress-image"]`
  - Expected data: h1 text, JPG/JPEG/PNG/WebP file-type restriction text, 40MB limit
  - Tags: `@frictionless-qa-image @frictionless-qa-compress-image @express @smoke @regression @t2`
  - 5-step structure (navigate → block+upload → a11y → analytics → upload → SDK iframe visible)

### Content layer (AEM — DA authoring)

- [ ] [existing-modify] Update existing page `/express/feature/image/compress/jpg` — **hero swap only**:
  - Replace current hero (HARMAN add-on install funnel) with the `frictionless-quick-action` block + variant class `compress-image`
  - Update how-to step 1 copy: "Launch Adobe Express / install the add-on..." → "Select / Upload your image to our image compressor tool"
  - Insert the new purple promo band block in the hero area per Acom Figma
  - **All other body content stays unchanged** — Marquee blocks, Discover-even-more rail, FAQ, footer are already identical to the new design (per Figma reference comparison, node `0:1867` vs `0:3`)

- [ ] [content-only] Page metadata on `/express/feature/image/compress/jpg`:
  - `show-floating-cta` = `yes`
  - `desktop-floating-cta` = appropriate CTA block
  - `mobile-floating-cta` = appropriate mobile CTA block
  - `frictionless-safari` = `on` (unlocks iOS/Safari frictionless path — same as other image QAs)
  - Any Milo config adjustment for the page lives in Milo docs (out of this repo's scope).

- [ ] [new-build] Create Nala draft test page at `/drafts/nala/test-gen/frictionless-qa-image/fqa-image-compress` in DA, publish, and append URL to [nala/assets/urls.txt](nala/assets/urls.txt).

### Explicitly NOT required (confirmed from codebase check)

- ❌ No edits to `frictionless-quick-action-mobile.js` — the mobile block reuses the same `QA_CONFIGS` + `executeQuickAction` dispatch as desktop. Once the two code-layer items above are in, mobile support is automatic.
- ❌ No separate hero block — the `frictionless-quick-action` block IS the hero upload card (confirmed from `resize-image` pattern).
- ❌ No changes to SDK loading, container creation, or auth pipelines — all reused from existing frictionless infrastructure.

## CCEverywhere Requirements (handoff)

- [ ] [new-build] Expose `ccEverywhere.quickAction.compressImage(docConfig, appConfig, exportConfig, contConfig)` on the SDK. Same signature as `resizeImage`. Accepts image blob input; mounts the Horizon standalone quick-action panel inside the `{quickActionId}-container` div created by da-express-milo.

## Horizon Requirements (handoff)

- [ ] [new-build] Implement `compress-image` standalone quick action — parallel Horizon track. All post-upload UI renders inside the `qa-standalone-app / standalone-quick-action` shell (same pattern as Image Resize):
  - File format picker — default: "PNG (Best for images)" with "Recommended" badge
  - Size slider (default 50%) paired with numeric value field
  - Original size vs New size readout — New size in bold (Adobe Clean Bold 15px)
  - Reset button — disabled by default; enabled after user changes any setting
  - Download (secondary button) — downloads compressed image client-side
  - "Open in Adobe Express" (primary CTA, `#3b63fb`) — triggers existing TOU → LOE → Express editor flow (inherited from Image Resize, no new work)
  - Trust badges: "Free to use" + "No credit card required"

## Decisions Made During Clarification

| Question | Answer | Source |
|---|---|---|
| Which Figma is authoritative? | User's `shairilk-*` copies. PRD's JDI Figma is rate-limited; user duplicated the relevant content into personal working copies. | User |
| Acom page scope — full re-author or hero swap? | Hero swap only; body content stays | User |
| Follow `resize-image` pattern end-to-end? | Yes | User |
| Mobile in P0 scope? | Yes; enable `frictionless-safari=on`. Milo config adjustment handled via content docs. | User |
| SDK method name | `compressImage` — confirmed | User |
| Purple promo band | New block; highlight prominently for Implementation Agent | User |
| Error / loading / missing states in Figma | Inherit all from existing `frictionless-quick-action` block | User |
| Analytics | Skip for P0; flag in docs as follow-up; do NOT block implementation | User |
| Video Compressor launch dependency | None from our side. Build order: image → video → co-launch. No action required from da-express-milo. | User |
| Include linked Jira tickets (CCEX-265061, CCEX-263645) | No — keep out of charter | User |

## Architectural Notes (for the Implementation Agent)

- **Three-repo boundary**: da-express-milo builds ONLY the upload entry + the new purple promo block + page authoring. Everything visible after the user uploads — format picker, slider, size readouts, Reset, Download, Open-in-Express CTAs, TOU modal, LOE state, editor iframe — is rendered by Horizon via the standalone QA SDK shell.
- **Loading-phase classification**: the `frictionless-quick-action` block is a hero block → lives in the first section → **Phase E** eager load. Keep any new code paths under the existing block's budget; do not add blocking imports.
- **Mobile support is automatic** once `QA_CONFIGS` + dispatch are added — `frictionless-quick-action-mobile.js` reads the same `QA_CONFIGS` and uses the same `executeQuickAction` dispatch. Do NOT duplicate logic in the mobile block.

## Explicitly Out of Scope

- Any UI inside the Horizon standalone QA panel (format picker, slider, size readouts, Reset, Download, Open-in-Express CTA)
- Any UI inside the full Express editor iframe after "Open in Adobe Express" (TOU modal, LOE state, editor tools)
- `frictionless-quick-action-mobile.js` code changes
- Video Compressor (tracked separately in [.claude/charters/video-compressor.md](.claude/charters/video-compressor.md))
- Custom bitrate / resolution / aspect-ratio controls
- Full Acom page re-authoring (hero + how-to-step-1 + purple band only)
- Resurrecting `promotion.js` (deprecated; do NOT use)
- Analytics custom instrumentation for `compress-image` (P0 inherits default frictionless events; DS spec is a Tier 2 follow-up)

## Open Items

### Tier 1 — Blocks implementation start

- **(none)** — all prior Tier 1 blockers resolved in this discovery pass: SDK method name confirmed (`compressImage`), input formats confirmed (JPG/JPEG/PNG/WebP @ 40MB from Acom Figma), mobile scope confirmed (in P0; handled by shared dispatch), video-compressor dependency removed.

### Tier 2 — Blocks shipping

- **Analytics spec confirmation**
  Wiki's Analytics Requirements section is empty. The existing `frictionless-quick-action` block already fires `view-quickaction-upload-page` and `complete-quickaction-upload` events via `sendFrictionlessEventToAdobeAnalytics` and applies `daa-lh` / `daa-im` attributes — these will fire automatically for `compress-image` with zero new code. **Not a blocker for implementation start.** Before ship: confirm with DS team whether the default pattern is sufficient or whether `compress-image`-specific event names / metadata keys / segment IDs are required.

- **Purple promo band — block naming and authoring shape**
  Implementation Agent should propose a block name (e.g. `promo-band`, `promo-bar`, or an `ax-columns` variant) and confirm with the Acom authoring team before committing. The Figma provides visual tokens but does not dictate an authoring contract.
