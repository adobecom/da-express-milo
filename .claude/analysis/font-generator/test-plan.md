# Test Plan — Font Generator JDI (CCEX-259350)

**Branch:** `shairillk/discovery_agent`
**Charter:** `.claude/charters/font-generator.md`
**Date:** 2026-05-11

> Nala/Playwright test files are NOT generated for this feature (no spec exists yet;
> content placeholders are not yet filled). This plan covers what to author when ready.
> Pre-requisite: AEM draft page at `/drafts/nala/blocks/font-generator/desktop` must exist.

---

## 1. transparent-img-marquee block

**Block path:** `express/code/blocks/transparent-img-marquee/`
**Phase:** E (LCP hero — first section)
**Test page:** `/drafts/nala/blocks/transparent-img-marquee/default`

| # | Test case | Steps | Expected |
|---|---|---|---|
| T1 | Block renders with black background | Load page, inspect block | `background-color: #000` on `.transparent-img-marquee` |
| T2 | Two-column layout present | Check `.marquee-left` and `.marquee-right` exist | Both columns visible; flex-direction row |
| T3 | Adobe Express white logo injected | Inspect `.express-logo` | Img present with `adobe-express-logo-white.svg` src |
| T4 | H1 text is white and correct | Check h1 inside `.marquee-left` | White (#fff) text, copy matches Figma |
| T5 | Body paragraph is white | Check p inside `.marquee-left` | White text |
| T6 | Hero image renders | Inspect `.marquee-right picture img` | Image visible, not broken |
| T7 | Logo link points to express.adobe.com | Check `.express-logo-link href` | `https://express.adobe.com/` |
| T8 | LCP image is eager-loaded | Check `img[loading]` attribute | Not `loading=lazy` (or absent — browser default is eager) |
| T9 | Accessibility: heading hierarchy | `axe` check on block | No heading-order violations |
| T10 | Analytics attributes | Check `daa-lh` on section, `daa-lh` on block | Block-level daa attrs present |

---

## 2. font-generator block

**Block path:** `express/code/blocks/font-generator/`
**Phase:** L (below-fold interactive tool)
**Test page:** `/drafts/nala/blocks/font-generator/desktop`

### 2a. Initial load

| # | Test case | Steps | Expected |
|---|---|---|---|
| T11 | Block renders after scroll-into-view | Scroll to block, wait for Spectrum bundles | `.font-generator-container` visible |
| T12 | Side panel appears on left | Check `.font-generator-panel` width | 477px, position sticky |
| T13 | Card grid has correct column count | Count `.font-generator-grid` columns | 3 columns |
| T14 | All stub cards render | Count `.font-card` elements | Matches count in `unicode-styles.js` |
| T15 | Default text "Hello" shows transformed in cards | Read `.font-card-text` textContent | Non-empty, contains Unicode chars |
| T16 | Textarea visible with placeholder | Check `sp-textfield[placeholder]` | Correct placeholder text |
| T17 | Slider visible | Check `sp-slider` | Present with min=12, max=72, value=32 |
| T18 | Category pills render | Count `sp-action-button` in pill row | 6 pills: All, Popular, Cool, Fancy, Glitch, Symbol |
| T19 | "All" pill selected by default | Check `sp-action-button[selected]` | "All" has selected attribute |
| T20 | Suggestion tags render | Count `sp-tag` | 7 tags |

### 2b. Interactivity

| # | Test case | Steps | Expected |
|---|---|---|---|
| T21 | Typing in textarea updates card previews | Type "Test" in textarea, wait 200ms | All visible `.font-card-text` show transformed "Test" |
| T22 | Character counter updates | Type 10 chars | Counter shows "10 / 2200" |
| T23 | Character limit enforced | Type 2201 chars | Input truncated at 2200 |
| T24 | Clicking suggestion tag fills textarea | Click first suggestion tag | Textarea value equals tag text; cards update |
| T25 | Category pill filters cards | Click "Popular" pill | Only cards with `data-category="Popular"` visible |
| T26 | Filter persists during typing | Filter to "Cool", type new text | Only Cool cards update |
| T27 | "All" pill shows all cards | Click "All" after filtering | All `.font-card` visible (none have `font-card--hidden`) |
| T28 | Font size slider updates preview text size | Move slider to 48 | `.font-card-text` style has `font-size: 48px` |
| T29 | Copy button copies unicode text to clipboard | Click copy on a card (with clipboard permission) | Clipboard contains the unicode-transformed text |
| T30 | "Design with style" CTA opens new tab | Click CTA link | `target="_blank"`, href includes `express.adobe.com/new?` |
| T31 | "Design with style" URL includes encoded text | Inspect CTA href | URL param contains encoded unicode text |
| T32 | Promo "Get Adobe Express Free" link | Check `.font-panel-promo-cta` | Links to `express.adobe.com/` |

### 2c. Accessibility

| # | Test case | Steps | Expected |
|---|---|---|---|
| T33 | Copy button has aria-label | Check `button.font-card-copy[aria-label]` | Present and descriptive |
| T34 | "Design with style" links have text | Check `a.font-card-cta` | Non-empty text content |
| T35 | axe: no critical violations | Run axe on block | 0 critical issues |
| T36 | Keyboard: tab through category pills | Tab through pills | Focus visible on each pill |
| T37 | Keyboard: Enter/Space activates pill | Focus a pill, press Enter | Category filters |

---

## 3. font-bento block

**Block path:** `express/code/blocks/font-bento/`
**Phase:** L (below-fold)
**Test page:** `/drafts/nala/blocks/font-bento/default`

| # | Test case | Steps | Expected |
|---|---|---|---|
| T38 | Block background is #f8f8f8 | Inspect block | `background-color: #f8f8f8` |
| T39 | Header H2 present | Check `h2` in `.font-bento-header` | Correct heading text |
| T40 | Header CTA is blue pill | Inspect `.font-bento-cta-link` | `background-color: #3b63fb`, border-radius visible |
| T41 | Grid has 6 cards | Count `.font-bento-card` | 6 |
| T42 | Social media card spans 2 columns | Check `[style*='span 2']` first occurrence | `grid-column: span 2` |
| T43 | Documents card spans 2 columns | Check last `[style*='span 2']` | `grid-column: span 2` |
| T44 | Card labels appear above images | DOM order: `.font-bento-card-label` before `.font-bento-card-image` | Label is first child |
| T45 | Card images render (when AEM assets uploaded) | Check picture img | Not broken |
| T46 | Responsive: 2-col at tablet | Viewport 900px, check grid | 2 columns |
| T47 | Responsive: 1-col at mobile | Viewport 375px, check grid | 1 column |

---

## 4. Content-layer blocks (existing blocks, content-authoring only)

These blocks require no code changes. Test against the authored draft page.

| # | Block | Test case | Expected |
|---|---|---|---|
| T48 | how-to-v2 | H2 visible above block | "How the unicode font generator works." |
| T49 | how-to-v2 | Step 1 open by default | First step accordion panel visible |
| T50 | how-to-v2 | Steps 2–4 collapsed | Click expands, re-click collapses |
| T51 | how-to-cards (summary) | Heading visible | "Add your text everywhere Unicode is supported." |
| T52 | how-to-cards (summary) | 5 cards with labels | Social media, Messaging apps, Gaming platforms, Professional tools, Forums & communities |
| T53 | ax-columns | Two-column layout | Text left, image right |
| T54 | banner (standout) | Black background | `background-color: #000` |
| T55 | faqv2 (expandable) | Accordion works | Click question → answer expands |
| T56 | quotes (carousel) | Carousel shows | First quote visible; carousel controls present |

---

## 5. Metadata and page-level

| # | Test case | Steps | Expected |
|---|---|---|---|
| T57 | Floating CTA visible on desktop | Load page on desktop (>768px), scroll | Floating CTA button appears |
| T58 | Floating CTA links to correct destination | Click floating CTA | Navigates to `desktop-floating-cta-link` value |
| T59 | Page title is correct | Check `<title>` | "Free Unicode Font Generator \| Adobe Express" |
| T60 | gnav rendered | Check global nav | Express gnav present |

---

## 6. Known Phase 1 limitations (do NOT test these — out of scope)

- Copy confirmation UI — no feedback after clicking copy icon (Phase 1 decision)
- Mobile layout — desktop-only Phase 1; mobile Figma pending
- Analytics event tracking — block-level daa-lh/daa-im only; custom events deferred
- "Design with style" URL param — placeholder `text` param name; confirm with CCEverywhere before launch
- Unicode styles — stub data only; replace with full 56-style list before launch
