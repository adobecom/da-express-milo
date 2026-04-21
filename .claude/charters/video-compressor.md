---
feature: Video Compressor (JDI)
jira: n/a (CCEX-265060, CCEX-265067 — PLG Epic; HZ-71088 — Horizon POC)
wiki: https://wiki.corp.adobe.com/pages/viewpage.action?pageId=3757292163
figma: https://www.figma.com/design/l7a2MvBrm37ocRUgYN5beA/Shairilk-1?node-id=0-1 (user) | https://www.figma.com/design/R5O9y5LCn313nw1hUFWMWs/Image-Video-Compressor?node-id=96-557 (wiki-linked)
status: confirmed
date: 2026-04-19
---

## What We Are Building

A new frictionless video compressor quick action page on adobe.com/express. Users upload a video (MP4, MOV, or GIF), the page calls the CCEverywhere SDK `compressVideo` method (name TBC), and the SDK opens the Express editor iframe. Inside the iframe (Horizon), users see a 3-step compression preset slider (Small / Balanced / Quality), original vs. estimated new file size, and download/open-in-editor buttons. The marketing page (da-express-milo) owns only the upload UI and SDK invocation — the compression logic, preset slider, and size estimation live entirely inside the Horizon iframe.

This is a new page distinct from the existing `/express/feature/video/convert` (MP4 converter). Platform scope: desktop + mobile (both block variants).

---

## da-express-milo Requirements

### Code layer

- [ ] [new-build] Add `compress-video` entry to `QA_CONFIGS` in `frictionless-utils.js`
  - Accepted input formats: MP4, MOV, GIF — define a dedicated `COMPRESS_VIDEO_FORMATS` constant (not shared with `VIDEO_FORMATS`, per decision: formats are specific to this action)
  - Max file size: 1 GB (consistent with other video actions)
  - `frictionlessgroup: 'video'`
  - Maps to SDK method `ccEverywhere.quickAction.compressVideo()` (exact method name pending SDK confirmation — see Open Items)

- [ ] [existing-extend] Add `compress-video` SDK call branch in `frictionless-utils.js`
  - Add to the `executeQuickAction` dispatch map
  - Use same video `docConfig` pattern as other video types (`createDocConfig(blob, 'video')`)

- [ ] [existing-extend] Add `data-frictionlesstype="compress-video"` to `frictionless-quick-action.js` (desktop block)
  - Handled automatically if `QA_CONFIGS` entry exists; verify type-assignment logic covers it

- [ ] [existing-extend] Add `compress-video` support to `frictionless-quick-action-mobile.js` (mobile block)
  - Same pattern as other mobile video types

- [ ] [existing-extend] Add `compress-video` to `video-quick-action-picker-config.js`
  - Action type: `QUICK_ACTION` (not `APP_INSTALL`) — runs SDK inline
  - Max duration limit: TBD (see Open Items)
  - Applies on iOS modal flow; filters based on MIME type support for MP4/MOV/GIF

- [ ] [new-build] Nala E2E tests — 3-file pattern under `nala/blocks/frictionless-qa-video-compress/`
  - `frictionless-qa-video-compress.page.cjs` — locators, upload helper
  - `frictionless-qa-video-compress.spec.cjs` — test data, draft page paths
  - `frictionless-qa-video-compress.test.cjs` — 4-step test structure (navigate → verify block + upload button → accessibility → analytics → upload → verify iframe)
  - ⚠️ Use `.cjs` not `.js` (cursor rule `nala-test-generation.mdc` uses `.js` — override per CLAUDE.md)
  - Draft test page required at `/drafts/nala/test-gen/frictionless-qa-video/fqa-video-compress` (page must be created in DA before tests run)

### Content layer (AEM — DA authoring)

- [ ] [new-build] New AEM page for desktop block
  - Path: TBD — confirm with PM/SEO (e.g., `/express/feature/video/compress`) — see Open Items
  - Block: `frictionless-quick-action` with variant class `compress-video`
  - Metadata keys required: `show-floating-cta`, `mobile-floating-cta`, `frictionless-safari`, `desktop-floating-cta`
  - Breadcrumb: Home / Feature / Video Compressor (Figma shows "Image Compressor" as placeholder — use "Video Compressor")

- [ ] [new-build] New AEM page for mobile block (or mobile variant on same page)
  - Block: `frictionless-quick-action-mobile` with variant class `compress-video`

- [ ] [new-build] Draft Nala test page at `/drafts/nala/test-gen/frictionless-qa-video/fqa-video-compress`
  - Must be created and published in DA before Nala tests can run

---

## CCEverywhere Requirements (handoff)

- [ ] [new-build] SDK must expose `compressVideo(docConfig, appConfig, exportConfig, contConfig)` (or equivalent method name — confirm with SDK team)
  - Must accept a video blob input
  - Must pass the uploaded video into the Horizon quick action editor
  - Method name drives the `QA_CONFIGS` key in da-express-milo; needed before code work begins

---

## Horizon Requirements (handoff)

- [ ] [new-build] Compression preset slider UI inside the quick action iframe
  - 3 stepped presets: Small (0.5× baseline) / Balanced (1.0× — default) / Quality (1.6× or preserve if lower)
  - Slider is 3-stepped (confirmed in Figma frame 1:1285 — tick marks at positions 0, ~160, 319)
  - "Recommended" label on Balanced preset

- [ ] [new-build] Original size + new estimated size display
  - Labels: "Original size: XX MB" and "New size: XX MB" (confirmed in Figma frames 1:1306–1:1314)
  - Estimated new size computed from: resolution baseline bitrate × preset multiplier × duration

- [ ] [new-build] Bitrate-based compression logic
  - Resolution baselines: 1080p → 4,000 kbps / 720p → 2,500 kbps / 480p → 1,200 kbps
  - Preset multipliers: Small=0.5×, Balanced=1.0×, Quality=1.6× (capped at original bitrate)
  - Audio: Balanced/Quality → 128 kbps, Small → 96 kbps

- [ ] [new-build] Resolution handling
  - Input ≤ 1080p → preserve original resolution
  - Input > 1080p (4K) → downscale to 1080p max
  - Always preserve aspect ratio

- [ ] [new-build] Reset button (confirmed in Figma frame 1:1315) — resets preset to Balanced
- [ ] [new-build] Inline alert variant (confirmed in Figma frame 1:1545 / 1:1357) — error/warning state
- [ ] [new-build] Export with compression applied and Download + "Open in Adobe Express" buttons (Figma frames 1:1324–1:1329)

---

## Decisions Made During Clarification

| Question | Answer | Source |
|---|---|---|
| Is the compression preset UI on the page or inside the iframe? | Inside the iframe (Horizon scope) — confirmed by Figma frame tree showing `hz-context-provider-locator` / `qa-app-root` wrapping all preset UI | Figma metadata + user answer #8 |
| New page or update existing `/express/feature/video/convert`? | New separate page | User answer #4 |
| SDK method name for compression? | `compressVideo` (or similar — pending SDK team confirmation) | User answer #3 |
| Input formats (MOV/GIF) — global or action-specific? | Specific to this compress-video action only | User answer #5 |
| Platform scope? | All platforms — both desktop and mobile block variants | User answer #6 |
| Add compress-video to video-quick-action-picker (iOS modal)? | Yes | User answer #7 |
| Estimated file size display ownership? | Horizon (relates to export/quick action output) | User answer #8 |
| Analytics requirements? | Skip for now (not scoped in P0) | User answer #9 |
| MWPW ticket? | None yet (discovery phase) | User answer #10 |

---

## Explicitly Out of Scope (P0)

- User-defined target file size input (e.g., "Reduce to 25MB")
- Custom bitrate control
- Resolution selector (no user-facing resolution chooser)
- In-editor video compression (editor-side feature, not quick action)
- Advanced codec selection
- Analytics instrumentation (deferred post-P0)
- Localization / new locale pages (not in charter)

---

## Open Items

<!-- Must be empty before implementation starts -->

- **SDK method name**: User said `compressVideo` "or something" — exact method name must be confirmed with CCEverywhere/SDK team before da-express-milo code work begins. This name drives the `QA_CONFIGS` key and the SDK dispatch call.
- **Page path**: New page confirmed, but exact URL path not decided (e.g., `/express/feature/video/compress` vs `/express/feature/video/compressor`). Needs PM/SEO alignment.
- **Max duration limit for video-quick-action-picker**: Other actions have limits (e.g., `convert-to-gif` = 60s, `caption-video` = 300s). The compress-video limit is not specified in the wiki. Needs Horizon/SDK team input.
- **MOV/GIF format validation**: Confirm these MIME types (`video/quicktime`, `image/gif`) are passable to the SDK `compressVideo` method — SDK may have its own format constraints.
