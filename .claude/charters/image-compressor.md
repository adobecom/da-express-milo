---
feature: Image Compressor (JDI)
jira: n/a
wiki: https://wiki.corp.adobe.com/spaces/cclight/pages/3747034497/JDI+Image+Compressor
figma: https://www.figma.com/design/EAYzMQMVbBiP16wHXrSP4o/shairilk-2?node-id=0-1
status: confirmed
date: 2026-04-19
---

## What We Are Building

A new frictionless image compressor quick action on the existing `/express/feature/image/compress/jpg` page, replacing the current suboptimal add-on experience. Users upload an image via the standard frictionless upload UI; the page calls the CCEverywhere SDK `compressImage` method (exact name TBC with SDK team); the SDK opens the Express editor iframe where Horizon renders all compression controls (format picker, size slider, original/new size stats, Reset, Download, and "Open in Adobe Express" buttons). da-express-milo owns only the upload UI and SDK invocation — all post-upload UI lives inside the Horizon iframe.

Upload/loading/error states reuse the existing frictionless patterns from other quick actions (e.g. `resize-image`). Mobile scope and analytics are open items pending designer/PM/DS confirmation.

---

## da-express-milo Requirements

### Code layer

- [ ] [new-build] Add `compress-image` entry to `QA_CONFIGS` in `frictionless-utils.js`
  - Accepted input formats: TBD — confirm with PM (see Open Items)
  - `frictionlessgroup: 'image'`
  - Maps to SDK method `ccEverywhere.quickAction.compressImage()` (exact method name pending SDK confirmation — see Open Items)

- [ ] [existing-extend] Add `compress-image` SDK call branch in `frictionless-utils.js`
  - Add to the `executeQuickAction` dispatch map: `'compress-image': () => ccEverywhere.quickAction.compressImage(docConfig, appConfig, exportConfig, contConfig)`
  - Use same image `docConfig` pattern as other image types

- [ ] [existing-extend] `data-frictionlesstype="compress-image"` on the frictionless block (desktop)
  - Handled automatically once `QA_CONFIGS` entry exists — the existing `decorate()` in `frictionless-quick-action.js` reads the variant class and sets the attribute

- [ ] [existing-extend — mobile, pending scope confirmation] Add `compress-image` support to `frictionless-quick-action-mobile.js`
  - Same pattern as other mobile image types
  - Blocked on mobile scope confirmation with designer — see Open Items

- [ ] [new-build] Nala E2E tests — 3-file `.cjs` pattern under `nala/blocks/frictionless-qa-image-compress/`
  - `frictionless-qa-image-compress.page.cjs` — locators, upload helper, block selector `[class*="frictionless-quick-action"][data-frictionlesstype="compress-image"]`
  - `frictionless-qa-image-compress.spec.cjs` — test data, draft page path
  - `frictionless-qa-image-compress.test.cjs` — 5-step structure: navigate → verify block + upload button → accessibility → analytics → upload → verify SDK iframe
  - Draft test page required at `/drafts/nala/test-gen/frictionless-qa-image/fqa-image-compress` (must be created in DA before tests run)

### Content layer (AEM — DA authoring)

- [ ] [existing-modify] Update existing page `/express/feature/image/compress/jpg`
  - Replace current add-on block with `frictionless-quick-action` block, variant class `compress-image`
  - Metadata keys required: `show-floating-cta`, `desktop-floating-cta`, `mobile-floating-cta` (pending mobile scope), `frictionless-safari` (pending mobile/iOS scope)

- [ ] [new-build] Draft Nala test page at `/drafts/nala/test-gen/frictionless-qa-image/fqa-image-compress`
  - Must be created and published in DA before Nala tests can run
  - Add URL to `nala/assets/urls.txt`

---

## CCEverywhere Requirements (handoff)

- [ ] [new-build] SDK must expose `compressImage(docConfig, appConfig, exportConfig, contConfig)` (exact method name TBC)
  - Must accept an image blob input
  - Must pass the uploaded image into the Horizon quick action editor
  - Method name drives the `QA_CONFIGS` key in da-express-milo; needed before code work begins

---

## Horizon Requirements (handoff)

- [ ] [new-build] Implement `compress-image` quick action type (work in progress — parallel Horizon track)
  - File format Picker (Figma: PNG default; full format list TBD with PM)
  - Size Slider (Figma: 50% default) with original size vs. new size stats display
  - Reset button (resets slider to default)
  - Download (secondary) + "Open in Adobe Express" (primary, `#3b63fb`) buttons
  - "Free to use + No credit card required" trust badges
  - "Open in Editor" flow — standard TOU → LOE → Express editor pattern (pre-existing, same as other quick actions)
  - All controls rendered inside the CCEverywhere iframe; da-express-milo has no DOM access to these

---

## Decisions Made During Clarification

| Question | Answer | Source |
|---|---|---|
| Is `compress-image` a new or existing quick action type? | New — Horizon building in parallel | User |
| Are right-column controls (picker, slider, stats, buttons) on-page or in iframe? | Inside Horizon iframe — da-express-milo does not build these | User |
| Page path — new or update existing? | Update existing `/express/feature/image/compress/jpg` | User |
| "Open in Editor" button behaviour — new tab or iframe? | Horizon/SDK scope — not a da-express-milo concern | User |
| Upload/loading/error states — new design or reuse? | Reuse existing frictionless patterns | User |
| QA_CONFIGS key name | `compress-image` (confirmed) | User |

---

## Explicitly Out of Scope

- Any UI inside the Express editor iframe (format picker, size slider, stats, reset, download, open-in-editor — all Horizon)
- "Open in Editor" new-tab flow logic (Horizon/SDK)
- Video compression (separate charter: `.claude/charters/video-compressor.md`)
- Custom bitrate or resolution controls
- Analytics instrumentation (deferred — pending DS/PM confirmation)

---

## Open Items

<!-- Must be empty before implementation starts -->

- **SDK method name**: Exact `ccEverywhere.quickAction` method for image compression not yet confirmed with CCEverywhere/SDK team. The `QA_CONFIGS` key `compress-image` and the dispatch call both depend on this. Block code work until confirmed.
- **Input file formats**: Accepted input formats for `QA_CONFIGS` not specified in the wiki. Follow up with PM. (Reference: `resize-image` accepts JPG, JPEG, PNG, WEBP as a likely baseline.)
- **Mobile scope**: Wiki says "All" platforms but Figma only shows desktop. Designer follow-up needed — does `frictionless-quick-action-mobile` block variant need to be built? If yes, is `frictionless-safari=on` required for iOS?
- **Video compressor coordination**: Wiki notes both pages should ideally launch together. Confirm with PM whether image compressor can ship independently or has a hard dependency on video compressor readiness.
- **Analytics**: Wiki analytics section is blank. Confirm with DS team and PM whether `daa-lh`/`daa-im` attributes and `sendFrictionlessEventToAdobeAnalytics` calls are required for P0.
