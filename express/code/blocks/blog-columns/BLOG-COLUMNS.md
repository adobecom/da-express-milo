# Blog Columns Block — Code Review

## Overview

The `blog-columns` block is a content block that renders a two-column layout (content + media) for blog/article pages. It reads content from block structure (not metadata) and supports multiple authoring patterns including raw images, image URLs, and flexible row configurations.

---

## File Structure

| File | Purpose |
|------|---------|
| `blog-columns.js` | Block decoration logic, structure parsing, image handling |
| `blog-columns.css` | Layout, typography, responsive styles |
| `CODE_REVIEW.md` | This document |

Related files elsewhere:
- `test/blocks/blog-columns/` — Unit tests (Mocha/Chai)
- `nala/blocks/blog-columns/` — E2E tests (Playwright), page object, block schema
- `drafts/nala/blocks/blog-columns/default/` — Draft page for manual testing

---

## Block Structure (Authoring)

The block expects **3 rows** of content:

| Row | Content | Required |
|-----|---------|----------|
| 1 | Image (raw `<picture>`/`<img>` or URL as link/text) | Yes |
| 2 | Eyebrow (p), Headline (p or h), Subcopy (p) | Yes (for full layout) |
| 3 | Product name (p), Product date (p), CTA (p > a) | Optional |

**Backward compatibility:** A 2-row block (image + CTA only) is supported when row 2 contains only a single link.

---

## JavaScript (`blog-columns.js`)

### Constants & Configuration

```javascript
MOBILE_MAX = 600, TABLET_MAX = 900
HERO_IMAGE_WIDTHS = { mobile: 480, tablet: 720, desktop: 960 }
DEFAULT_PRODUCT_ICON_PATH = "https://main--da-express-milo--adobecom.aem.page/..."
PRODUCT_ICON_SIZE = 48
```

- Breakpoints align with common responsive patterns.
- `DEFAULT_PRODUCT_ICON_PATH` is hardcoded to main; consider making it configurable for other environments.

### Image URL Detection

**`isImageUrl(url)`** — Validates that a string is an image URL:
- Requires `https?://` and either:
  - File extension: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.avif`, `.svg`
  - Or `/media_` (Adobe media paths)

**`extractImageUrlFromNode(node)`** — Extracts image URL from:
1. `<a href="...">` when `href` is an image URL
2. Nested `a[href]` when `href` is an image URL
3. Plain text that matches image URL pattern

**Note:** URLs without extensions (e.g. CDN URLs with query params only) may not be detected unless they include `/media_`.

### Image Optimization

**`buildOptimizedImageUrl(src, width)`**:
- **Same-origin:** Returns path with `?width=&format=webp&optimize=medium` for Milo image service.
- **Cross-origin:** Returns original URL unchanged (preserves author-provided domain).

**`optimizeImage(img, options)`**:
- Applies optimized URL, preconnect, preload when requested.
- Sets `loading`, `decoding`, `width`/`height` attributes.
- Uses `getAspectRatio` for height when width/height are present.

### Structure Parsing

**`parseContentRow(row)`**:
- Collects all `p, h1–h6` elements.
- Maps to: `eyebrow` (1st), `headline` (2nd), `subcopy` (3rd+ joined).
- Order is fixed; custom structures may not map correctly.

**`parseProductRow(row)`**:
- `productName` = first `p` text.
- `date` = second `p` text.
- CTA = `extractCTA(row)` (finds `p:has(a)` or `a` and wraps in `.button-container`).

**`isCtaOnlyRow(row)`**:
- Detects a row with a single `p` containing one `a` (legacy 2-row format).
- Used to avoid treating CTA text as content.

### `prepareStructure(block)`

1. Splits block into rows (`div` children).
2. **Image row:** Processes each cell:
   - Picture-only cells → move media to `mediaColumn`.
   - Other cells → `processImageCell` (raw image or URL → `img`).
3. **Content row (row 2):** Parsed when there are 3+ rows.
4. **Product row (row 3):** Parsed when there are 3+ rows.
5. **2-row case:** If row 2 is CTA-only, extracts CTA; otherwise parses content.

**Edge case:** Empty block creates a minimal structure with empty content and no CTA.

### `decorateContentColumn(column, content, ctaNode, opt)`

- Renders: eyebrow → headline (h2) → subcopy → product highlight → CTA.
- `buildProductHighlight` uses `productName` and `date`; `productIcon` and `productCopy` are supported but not populated from block content.
- Product highlight is omitted when both `productName` and `date` are empty.

### CTA Decoration

- `decorateButtons(block, 'button-xl')` runs before structure parsing (Milo handles `em a`, `strong a`, etc.).
- Post-decorate: adds `button-xl`, `con-button`, and strips `#_button-*` from `href` (e.g. `#_button-fill` → `.fill`).

### `createTag` Usage

- `createTag` is imported from Milo utils at runtime.
- Used for all dynamic DOM creation.

---

## CSS (`blog-columns.css`)

### Layout

- **Mobile:** Single column, content above media.
- **≥800px:** Flex row, content and media side-by-side (6-col grid widths).
- **≥1200px:** Increased padding, product highlights in a row.

### Variants

- **`.text-right`:** Swaps content/media order via `order` (media first, content second).

### Design Tokens

Uses `--ax-*` and `--spacing-*` variables. Assumes these are defined in global styles.

### Button Styles

- `.con-button.blue` — default CTA.
- `.con-button.blue.fill` — filled variant (from `#_button-fill`).

---

## Tests

### Unit Tests (`test/blocks/blog-columns/blog-columns.test.js`)

| Test | Coverage |
|------|----------|
| Full 3-row decoration | Structure, content, product, CTA, media |
| Image URL in row 1 | URL → `img` with correct `src` |
| 2-row CTA-only | Backward compatibility |
| Image + content only (no product row) | No product, no CTA |
| Product row with CTA only | No product highlight, CTA present |
| `text-right` variant | Column order |
| `#_button-fill` | Fill class applied, hash removed |

**Gaps:**
- No test for empty block.
- No test for image URL as plain text (no link).
- No test for `productIcon` or `productCopy` (not used in current flow).

### Nala E2E (`nala/blocks/blog-columns/`)

- **blog-columns.page.cjs:** Locates `.blog-columns` block.
- **blog-columns.test.cjs:** Loads draft page, checks block and inner structure visibility.
- **blog-columns.block.json:** Block schema for Nala (selectors, semantic data).

---

## Recommendations

### High Priority

1. **`DEFAULT_PRODUCT_ICON_PATH`** — Use config or relative path so it works across environments.
2. **Image URL detection** — Consider supporting CDN URLs that lack file extensions (e.g. `?width=800`).
3. **Alt text** — Image URL path creates `img` with `alt=""`; add support for author-provided alt.

### Medium Priority

4. **`productCopy`** — `buildProductHighlight` supports it but it is never set from block content; document or add parsing if needed.
5. **Error handling** — `prepareStructure` can run with malformed DOM; add guards for missing/malformed rows.
6. **`p:has(a)`** — Ensure support in target browsers (modern browsers support it).

### Low Priority

7. **`normalizeHeadingLevel`** — Only `h2` is used; could be simplified.
8. **`getResponsiveWidth`** — Used for hero image; `decorateMediaColumn` also uses `getBoundingClientRect().width`, which may be 0 before layout.

---

## Accessibility Notes

- Headline is `h2` (appropriate for sub-page content).
- Product highlight uses semantic structure.
- CTA receives `con-button` and `button-xl` from Milo.
- **Missing:** No explicit `aria-label` or `role` on the block; consider if needed for screen readers.

---

## Performance Notes

- Preconnect for cross-origin images.
- Preload for hero image.
- `loading="lazy"` for product icon.
- Same-origin images use Milo optimization params.

---

## Summary

The block is well-structured, with clear separation of parsing, decoration, and styling. It supports multiple authoring patterns and preserves external image URLs. Main improvements: environment-aware defaults, broader URL detection, and alt text handling for URL-based images.
