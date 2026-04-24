# Test Plan — Image Compressor (JDI)

**Scope note:** The user deferred Nala E2E `.cjs` authoring for this feature. This plan is retained so the downstream Nala agent (or the author manually verifying before ship) has a concrete checklist. No `.cjs` files were written by the Implementation Agent.

**Code changes under test:** [express/code/scripts/utils/frictionless-utils.js](express/code/scripts/utils/frictionless-utils.js) — two additions (QA_CONFIGS entry at line 98, quickActionMap dispatch at line 371). No `.js` / `.css` changes to any block.

**Content changes under test:** `/express/feature/image/compress/jpg` (desktop, mobile, iOS Safari).

---

## Happy path

| # | Case | Entry | Expected outcome | Priority |
|---|---|---|---|---|
| 1 | Qualified-desktop hero renders `frictionless-quick-action` | Chrome/Firefox/Safari desktop on `/express/feature/image/compress/jpg` | `frictionless-quick-action` block visible in hero with upload CTA; Section 1 fallback hero hidden; H1 "Free image compressor." visible | P0 |
| 2 | Upload JPEG → Horizon panel renders | Click "Upload your photo" → pick valid JPEG <40MB | `#compress-image-container` div injected; Horizon standalone QA panel mounts inside (Picker + Slider + Reset + Download + Open-in-Adobe-Express CTAs) | P0 |
| 3 | Upload JPG → same as #2 | same | same | P0 |
| 4 | Upload PNG → same as #2 | same | same | P0 |
| 5 | Upload WebP → same as #2 | same | same | P0 |
| 6 | Qualified-mobile hero on Android Chrome | Android Chrome on feature URL | `frictionless-quick-action-mobile` block visible; Section 1 and Section 2 hidden; mobile fork-button floating CTA appears | P0 |
| 7 | Qualified-mobile hero on iOS Safari | iOS Safari on feature URL | Same as #6 (gated by `frictionless-safari=on`) | P0 |
| 8 | Non-qualified fallback hero | Disable frictionless (older browser / flag off) | Section 1 `columns (fullsize)` hero visible; `Upload your photo` link navigates to the Express app (no in-page QA panel) | P1 |
| 9 | Banner promo band renders with default variant styling | Any viewport | Purple `#5c5ce0` band with centered white H2 "Easily compress JPEGs with Adobe Express."; no CTA row | P0 |
| 10 | Breadcrumb leaf shows "Image Compressor" | Any viewport | Not "JPEG Compressor" | P1 |
| 11 | Mobile floating fork button appears | Mobile viewport, scroll past hero | Floating CTA with "Get free app" + "Continue" options; "Continue" opens `#mobile-fqa-upload` | P0 |

## Platform variants

| # | Case | Platform | Expected outcome | Priority |
|---|---|---|---|---|
| 12 | iOS Safari frictionless unlock | iOS 15+ Safari | `frictionless-safari=on` metadata unlocks the in-page upload flow; mobile block visible instead of fallback | P0 |
| 13 | Desktop Safari (non-qualified fallback) | Safari <16 or flag off | Fallback `columns (fullsize)` hero shown | P2 |
| 14 | Android Chrome fork button copy | Android Chrome | Fork button exposes `fork-cta-1-text="Get free app"` + `fork-cta-2-text-frictionless="Upload photo"` | P1 |

## Error / edge cases

| # | Case | Trigger | Expected outcome | Priority |
|---|---|---|---|---|
| 15 | Upload >40MB file | Pick 41MB JPEG | Error toast / message from existing `frictionless-quick-action` error handling; panel does not mount | P1 |
| 16 | Upload unsupported format (BMP, GIF, HEIC, TIFF) | Pick BMP or GIF | Error toast — file rejected per `QA_CONFIGS['compress-image'].input_check` | P1 |
| 17 | Missing SDK method `compressImage` | SDK not yet deployed to Horizon | `if (action)` guard at `frictionless-utils.js:439` means no dispatch fires; user sees the panel container injected but empty. Acceptable graceful degradation; not a prod-blocker before SDK ship | P2 |
| 18 | Cross-origin iframe events | Open-in-Adobe-Express CTA click | Horizon TOU modal appears; agreeing advances to LOE editor state (existing Image-Resize-inherited flow) | P1 |
| 19 | Draft-page missing xlsx inheritance | Test URL under `/drafts/nala/test-gen/...` | Any metadata key not authored on the draft itself will be absent — the full metadata block (including `fork-cta-*`) must be copied onto the draft for accurate testing | P1 |

## Analytics assertions

| # | Event | Attribute | Expected value |
|---|---|---|---|
| 20 | Upload-page view | `daa-lh` on frictionless-quick-action section | emitted with section index + block name; fires automatically via `sendFrictionlessEventToAdobeAnalytics` (inherited — no code change) |
| 21 | Upload-complete | `daa-im` on upload button | fired after successful upload → SDK dispatch |

> Charter Tier-2 note: analytics spec confirmation is open. The default `view-quickaction-upload-page` / `complete-quickaction-upload` events fire automatically from the existing frictionless-quick-action block. If the DS team requires `compress-image`-specific event names or segment IDs, follow-up code changes will be required — not covered by this plan.

## Out of scope for automated test

- CCEverywhere SDK internals (cross-origin iframe; cannot assert from the host page)
- Horizon standalone QA panel internals (Picker behavior, Slider interaction, Reset / Download behavior — owned by Horizon, tested in their repo)
- TOU modal and LOE editor state transitions (inside the Express editor iframe)
- Locale variants (`/<locale>/express/feature/image/compress/jpg`) — translated copy authored separately
- Client-side compression quality / file-size reduction accuracy (Horizon-owned)

## Priority legend

- **P0** = smoke / critical (maps to `@t1` if Nala tags applied)
- **P1** = regression (`@t2`)
- **P2** = edge / nice-to-have (`@t3`)

## Manual pre-ship checklist (while E2E is deferred)

- [ ] Upload DA doc; Sidekick preview on `{branch}--da-express-milo--adobecom.aem.page`
- [ ] Verify cases #1–#11 on desktop Chrome and mobile Chrome
- [ ] Verify case #12 on a real iOS Safari device (simulator is not always reliable for frictionless-safari)
- [ ] Confirm CCEverywhere SDK has `compressImage` before merging the metadata `Publish` in Sidekick
- [ ] Confirm analytics team has signed off on default events, OR file the custom-spec follow-up
