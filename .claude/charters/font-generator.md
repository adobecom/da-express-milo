---
feature: Font Generator (JDI)
jira: n/a
wiki: https://wiki.corp.adobe.com/pages/viewpage.action?pageId=3740768555&spaceKey=cclight&title=JDI%2BFont%2BGenerator
figma: https://www.figma.com/design/6h3Jy13fi4HYyxQkcRbYDe/shairilk-font-generator?t=YAXYs1ZJnkUfKZzL-0
status: confirmed
date: 2026-04-20
---

## What We Are Building

A standalone Font Generator page for adobe.com/express — an SEO/TOF acquisition tool targeting
high-MSV "font generator" keywords. Users type text and see it previewed in real-time across 12+
Unicode font styles (circled, script, glitch, symbol, etc.), then copy the styled text or open
Adobe Express with that text pre-loaded. This is NOT a frictionless quick action and does NOT use
the CCEverywhere SDK embed — the "Design with style" CTA is a direct deep-link to express.adobe.com
that opens in a new tab.

---

## da-express-milo Requirements

<!-- label each item: [new-build], [existing-modify], [existing-extend], or [content-only] -->
<!-- ⚠️ Do NOT include Nala tests or unit tests here — tests are scoped during implementation, not discovery -->

- [ ] [new-build] `font-generator` block — core interactive tool
  - Two-column layout: sticky 477px left panel + scrollable right card grid (3-col desktop, 1-col mobile)
  - Left panel: text input field (up to 2,200 chars), category filter pills, language filter accordion, sticky promo area
  - Right panel: filter bar row (list/grid toggle + count) + 12+ font cards in grid + "load more" / pagination
  - Real-time unicode transformation as user types — hardcoded JS character map (6 categories; Phase L lazy load — not Phase E — since the generator section is below the hero)
  - Copy icon (S2_Icon_Copy_20_N) in text field — copies unicode text to clipboard via `navigator.clipboard`; shows error toast on clipboard API failure
  - "Design with style" CTA button (S2_Icon_OpenIn_20_N) in text field — constructs platform-aware deep-link (see platform routing item below); opens in new tab
  - Per-card "Use this font" CTA (confirm exact label — see Open Items) — copies that style's unicode text to clipboard
  - Full skeleton shimmer loading state for text input, filter pills, and all font cards (shimmer gradient `#f8f8f8 → #e6e6e6 → #f8f8f8`; pending button state `rgba(0,0,0,0.09)` + circular progress)
  - Design ref: Figma node 2:32236 (desktop full page), 2:29014 (loading state), 2:28958 (mobile)

- [ ] [new-build] Category filter — 6 pills: 𝓐𝓵𝓵 (All), Popular, Cool, Fancy, Glitch, Symbol
  - Desktop: always visible in left panel, 3×2 pill grid
  - Mobile: hidden; accessed via filter button in filter bar → opens mobile overlay drawer
  - Reuse mobile drawer pattern from `color-shared/components/createFiltersComponent.js` for the mobile overlay
  - Selected pill state: white bg + blue `#3b63fb` border; unselected: white bg, no border

- [ ] [new-build] Language filter accordion — secondary filter below category pills
  - Desktop: collapsible accordion in left panel (collapsed by default)
  - Mobile: part of filter overlay panel (same overlay as category filter)

- [ ] [new-build] Platform-aware deep-link construction for "Design with style"
  - Use `getMobileOperatingSystem()` (`express/code/scripts/utils.js`) to branch:
    - Desktop / unknown → `express.adobe.com` new tab with unicode text pre-loaded in 1:1 square project
    - Android → logged-out Express editor path with unicode text
    - iOS → app install / SUSI flow URL with unicode text
  - Exact URL format / params defined by Horizon URL-passing spec (see Open Items #1)

- [ ] [new-build] Error toast — shown when clipboard API fails (permission denied or unsupported)
  - Reuse/adapt existing clipboard error pattern; see `color-extract.js` and siblings for reference

- [ ] [existing-modify] `how-to-v2` block (`express/code/blocks/how-to-v2/how-to-v2.js`)
  - Existing block supports a single static media element + stepped accordion
  - Figma shows per-step visual swapping (magenta `#a3053e` card panel changes content as user clicks each step; step 1 shows phone mockup + filter pills + text field; steps 2–4 show different visuals)
  - Current implementation reads one media element at init and does not swap it per step — needs extension to accept per-step media/images
  - Alternatively: if the per-step visuals are static image assets (as suggested by How-to visual tiles in Figma), this may only need authoring — confirm during implementation
  - Design ref: Figma node 2:32320; active step indicator = gradient `rgb(255,72,133) → rgb(252,125,0)`, inactive = gray `rgb(143,143,143)`

- [ ] [content-only] AEM page creation — Font Generator page authored in DA with all sections:
  - Hero (`transparent-img-marquee`): black background, full-width, H1 "Free unicode font generator."
  - `font-generator` block (tool section, `#f3f3f3` background)
  - Font bento (6-card use case grid: ads / social / games / design / messaging / documents)
  - Testimonials block
  - `how-to-v2` (4-step accordion)
  - FAQ accordion
  - Banner CTA ("Looking for more fonts?" + "Get Adobe Express Free")
  - Icon carousel ("Add your text everywhere Unicode is supported")
  - Footer
  - Page metadata: `template` value TBD; no `show-floating-cta` needed (page has built-in CTAs throughout)

- [ ] [content-only] "Looking for more fonts?" Columns-Variables section (river-flow layout of font name tiles: Bacalar, Bogart, RINGOLD, etc.) — static links to fonts.adobe.com; likely uses existing `columns` block or similar; no new block JS expected — confirm during implementation (see Open Items #4)

- [ ] [content-only] Sticky promo in left panel ("Looking for more fonts?" + "Get Adobe Express Free" CTA) — approach TBD: authored as part of `font-generator` block table, or as a separate authored element below the block, or metadata-driven. Decide before implementation (see Open Items #5)

---

## CCEverywhere Requirements (handoff)

None — "Design with style" is a direct deep-link to `express.adobe.com`. No CCEverywhere SDK embed or invoke is needed for this feature.

---

## Horizon Requirements (handoff)

- [ ] [unverifiable] Handle incoming deep-link from Font Generator — pre-populate the Express editor with unicode text in a 1:1 square project
  - Confirm: (a) URL param name/format for passing unicode text payload, (b) whether 1:1 square project creation from a URL param is already supported or requires new Horizon work
  - Provide the URL-passing spec document to da-express-milo team (currently referenced by user but not yet shared)
  - Android variant: confirm the "logged-out Express editor" URL format expected for the Android deep-link
  - iOS variant: confirm the app install / SUSI flow URL format

---

## Decisions Made During Clarification

| Question | Answer | Source |
|---|---|---|
| "Design with style" vs "Design with this font" as post-copy CTA label | "Design with style" (confirmed from Figma label) | User + Figma |
| How is unicode text passed to Express? | Direct deep-link to `express.adobe.com`; da-express-milo constructs URL; Horizon handles the incoming request. Passing spec document exists but not yet shared. | User |
| Unicode mapping data source | Hardcoded in the `font-generator` block JS | User |
| Android vs iOS routing | da-express-milo uses `getMobileOperatingSystem()` to construct platform-appropriate deep-link URL | User |
| Clipboard fail behavior | Error toast shown to user. Unicode generation fail = silent (user continues typing normally) | User |
| Filter component reuse | Reuse `color-shared/components/createFiltersComponent.js` mobile drawer pattern where feasible | User |
| How-to section | `how-to-v2` block exists at `express/code/blocks/how-to-v2/`; use as-is or extend for per-step visual swapping | User + Codebase |
| Analytics instrumentation | Skip for now — confirm exact event names and daa values with DS team | User |
| Adobe Fonts API (font listings, premium fonts, filters) | Entirely out of scope for this JDI | User |
| Floating CTA on page | Not applicable — page has its own CTAs (sticky promo, card CTAs, banner); no `show-floating-cta` metadata needed | User |
| Phase E / unicode map budget | Load unicode map lazily (Phase L) — hero + text input skeleton are the LCP elements; tool section is below fold | Architecture constraint |

---

## Explicitly Out of Scope

- P1 Font Library / Adobe Font Collaboration experience
- Adobe Fonts API integration (font listings, premium font paywall, filter by font metadata)
- AI-generated fonts
- CCEverywhere SDK embed mode on this page
- Font style filters (marked unnecessary by wiki given the number of options)

---

## Open Items

<!-- Must be empty before implementation starts -->

1. **Horizon URL-passing spec** — User confirmed a document exists for how unicode text is passed to `express.adobe.com` via URL. Share this document before implementation so da-express-milo can construct the correct URL (including Android logged-out path and iOS install/SUSI path).

2. **Post-copy confirmation UI** — After clicking the copy icon on a font card, the wiki describes "a 'Design with style' CTA surfaced alongside the copy confirmation." No Figma frame shows this state. Confirm with designer: what exactly renders post-copy? (inline CTA appears, button changes to checkmark, toast with secondary CTA, etc.)

3. **Font card CTA label** — Figma skeleton shows "Use this font" tentatively; the loaded-state label is not clearly readable in the summary. Confirm exact CTA label and action (copy only vs copy + surface "Design with style") with designer.

4. **"Explore more fonts" / Columns-Variables section** — Font tiles section (Bacalar, Bogart, RINGOLD, etc.) links to fonts.adobe.com. Confirm: (a) is this a standard `columns` block or needs a new block, (b) are the font tile images static authored content, (c) destination URL (always fonts.adobe.com or configurable per tile).

5. **Sticky promo authoring approach** — "Get Adobe Express Free" element in the left panel: authored as part of the `font-generator` block table, as a separate block below, or metadata-driven? Decide before implementation to determine block authoring schema.

6. **Page scope (localization)** — Single English page launch or localized pages for JDI? Confirm with PM. Affects AEM page creation scope and URL structure.

7. **Analytics requirements** — Specific `daa-lh` values, `daa-im` attributes, and any custom events (copy, "Design with style" click, filter interactions). TBD — confirm with DS team before implementation.

8. **`how-to-v2` per-step visual swapping** — Confirm whether the how-to step visuals are static image assets (each step authored with its own image, swapped by JS) or if the visual is a single static image for the whole section. Determines whether `how-to-v2` needs code modification or just content authoring.
