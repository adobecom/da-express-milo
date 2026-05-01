# Report: Variant Completeness

Audit of CSS/JS variant coverage in kitchen sink files. For each block with a kitchen sink, this report compares the variants shown in the KS against the variants defined in the block's CSS and JS files.

**Methodology:** Variants were extracted from `.blockname.variantname` CSS selectors and `classList.contains('variant')` JS checks. Runtime/state classes (e.g., `appear`, `show`, `loaded`, `expanded`) are excluded — those are added programmatically, not authored. Results should be cross-checked against block source files as some variants may be defined in SCSS rather than compiled CSS.

---

## Blocks With Good Variant Coverage

These matched blocks show no significant gaps between KS and implementation.

| Block | Documented Variants | Status |
|---|---|---|
| `ax-accordion` | (default only) | No authoring variants — OK |
| `ax-panels` | (default only) | OK |
| `banner-bg` | `blue-bg`, `blue-green-pink-bg`, `blue-pink-orange-bg`, `blue-purple-gray-bg`, `green-blue-red-bg`, `light-bg`, `yellow-pink-blue-bg` | Covers all CSS variants; `cool-dark-bg` and `template-page-bg` missing (see below) |
| `banner` | `cool`, `light`, `standout` | Partial — see gaps |
| `collapsible-card` | (default only) | OK |
| `embed` | (default only) | Missing platform-specific variants — see gaps |
| `faq` | (default only) | OK for authoring; `narrow` variant is CSS-only |
| `how-to-steps-carousel` | `image`, `schema`, `video` | OK |
| `image-list` | `l`, `s`, `xl`, `xs` | Documented in KS; CSS only shows `xl`, `xs` in compiled output — verify SCSS |
| `quotes` | `singular` | Missing `carousel` — see gaps |
| `ratings` | `show-average` | OK |
| `search-marquee` | `spreadsheet-powered` | Documented; runtime variants excluded |
| `susi-light` | `b2b`, `checked`, `edu`, `email-first`, `email-only`, `no-redirect`, `student`, `tabs` | Comprehensive; verify `edu` is still active |
| `wayfinder` | `light`, `dark`, `gradient`, `borderless` | All 4 variants documented and shown with examples |

---

## Blocks With Missing Variants (Not Documented in KS)

These variants exist in the block's CSS or JS but are absent from the kitchen sink.

### High Priority

| Block | Missing Variants | Notes |
|---|---|---|
| `ax-table-of-contents` | `horizontal` | Variant exists in JS, not shown in KS |
| `banner` | `compact`, `multi-button` | Both are CSS-defined; `light` in KS but not in CSS — may be milo-inherited |
| `cards` | `featured`, `large` | Two significant display variants missing entirely from KS |
| `embed` | `embed-instagram`, `embed-twitter` | Platform-specific class names added by JS; should be noted in authoring instructions |
| `faqv2` | `bold`, `small`, `no-background` | Multiple CSS variants missing; only `expandable` and `longform` shown |
| `interactive-marquee` | `dark`, `horizontal-masonry`, `no-search`, `quad`, `tall`, `wide` | All 6 variants missing from KS (see note below) |
| `quotes` | `carousel` | Distinct layout variant not shown |
| `template-x` | `apipowered`, `horizontal`, `large`, `mini` | KS shows default only; 4 documented variants in CSS/JS |

### Medium Priority

| Block | Missing Variants | Notes |
|---|---|---|
| `ax-columns` | `marquee` | One CSS variant not shown; KS documents many variants that appear to come from milo's columns block |
| `banner-bg` | `cool-dark-bg`, `template-page-bg` | Two CSS color variants not in KS |
| `content-toggle-v2` | `padding-400`, `padding-m`, `padding-s` | KS shows only `padding-20`; 3 others exist |
| `floating-button` | `meta-powered` | Functional variant not documented |
| `how-to-cards` | `summary` | CSS variant not shown; `schema` shown in KS but not found in compiled CSS |
| `how-to-steps` | `template-x` | JS variant not documented; `noschema` shown in KS but not in JS |
| `template-list` | `large`, `toc-container` | Two variants missing from KS |
| `template-x-promo` | `template` | JS variant not documented |
| `toggle-bar` | `dark` | `float` and `sticky` are documented but `dark` is missing |

---

## Blocks With Extra/Stale Variants in KS

These KS files document variants that do not appear in the compiled CSS or JS. They may be valid variants defined in SCSS/milo, or they may be stale/removed.

| Block | KS-Only Variants | Likely Explanation |
|---|---|---|
| `ax-marquee` | `dark`, `narrow` | Defined in milo's marquee CSS, inherited |
| `blog-columns` | `text-right` | May be in SCSS; not in compiled CSS |
| `blog-posts-v2` | `include-heading`, `no-top-padding` | May be in SCSS |
| `browse-by-category` | `card`, `fullwidth` | May be in SCSS |
| `feature-grid` | `white-text` | May be in SCSS |
| `floating-panel` | `dark` | May be in SCSS |
| `faqv2` | `longform` | May be in SCSS |
| `grid-marquee` | `ratings` | May be in SCSS |
| `holiday-blade` | `still` | May be in SCSS |
| `how-to-steps-carousel` | `schema` | May be in SCSS or removed |
| `icon-list` | `fullwidth` | May be in SCSS |
| `link-list` | `centered`, `leftalign`, `spreadsheet-powered` | May be in SCSS |
| `make-a-project` | `centered` | May be in SCSS |
| `pricing-table` | `sticky-show3` | Verify whether this was removed |
| `steps` | `dark`, `highlight`, `schema` | Steps is a Milo block; variants defined there |
| `tabs-ax` | `m-spacing`, `pill` | May have been removed; verify |

> Note: "EXTRA in KS" items are not necessarily wrong — they could be defined in SCSS source files that were not accessible to this audit. Each should be manually verified against the block's SCSS before removal.

---

## Detailed Notes on Notable Gaps

### `interactive-marquee` — All variants undocumented
The KS file `interactive-marquee.html` shows only a title line; the actual block has 6 authored variants (`dark`, `horizontal-masonry`, `no-search`, `quad`, `tall`, `wide`). The H1 of the file is a content string ("Create the perfect poster with AI.") pulled from one of the example blocks rather than a proper block title, suggesting the description section was never filled in.

### `cards` — Missing `featured` and `large`
The cards KS file contains no variant examples beyond the default. Both `featured` and `large` produce meaningfully different card layouts and are likely used on live pages.

### `template-x` — Entirely missing variants
The `template-x` KS shows only a default rendering with no descriptions of its 4 documented variants (`apipowered`, `horizontal`, `large`, `mini`).

### `susi-light` — `edu` variant may be inactive
The KS documents an `edu` variant that is not present in the compiled CSS or JS. Confirm whether this variant is still active.

---

## Recommendations

1. Add missing variant examples to: `cards`, `quotes`, `template-x`, `interactive-marquee`, `faqv2`, `ax-table-of-contents`, `content-toggle-v2`.
2. Verify and remove stale variants: `tabs-ax` `pill`/`m-spacing`, `pricing-table` `sticky-show3`, `susi-light` `edu`.
3. Cross-check "EXTRA in KS" variants against SCSS source files before removing any from documentation.
4. For blocks where variants are defined only in milo (e.g., `steps`, `ax-marquee`), clarify in the KS that these are milo-inherited variants.
