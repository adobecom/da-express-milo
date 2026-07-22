# EDS Patterns Reference

The project is built on **Adobe Edge Delivery Services (EDS)**.
Consult the **Fluffyjaws MCP** for authoritative EDS conventions.
This document captures the key patterns relevant to Express block building.

---

## EDS block anatomy

An EDS block is a section of authored content (originally a table in a
Google Doc / Word document) that is converted into semantic HTML divs.
By the time `decorate(block)` runs, the block element looks like:

```html
<div class="block-name variant-a variant-b" data-block-name="block-name" data-block-status="loading">
  <div>                        <!-- row -->
    <div>cell 1 content</div>  <!-- column -->
    <div>cell 2 content</div>  <!-- column -->
  </div>
  <div>                        <!-- row -->
    <div>cell content</div>
  </div>
</div>
```

- The **outer div** has the block name as its class, plus any variant
  classes from the authored document.
- Each **child div** is a row.
- Each **grandchild div** is a column/cell within that row.

---

## Block file conventions (Express)

```
express/code/blocks/
  block-name/
    block-name.js        ← export default async function decorate(block)
    block-name.css       ← all styles for the block
```

- JS exports `export default async function decorate(block) { ... }`.
- CSS is loaded automatically by the EDS framework when the block
  appears on a page.
- No build step — files are served as-is from the edge.
- No registration array — blocks are auto-discovered by name.

---

## Three-phase DOM transformation

EDS delivers blocks through three states. **Users never see states 1 or 2** (`body { display: none }` holds until loading completes). Write CSS selectors against the **loaded** structure, not the raw HTML.

```
Raw HTML (Phase 1) → data-status="decorated" (Phase 2) → data-block-status="loaded" (Phase 3)
```

Example: `grid-marquee` block
```html
<!-- Raw (Phase 1): simple nested divs -->
<div class="grid-marquee ratings">
  <div><div><h1>Title</h1><p>Body</p></div></div>
  <div><div><picture>...</picture></div></div>
</div>

<!-- Loaded (Phase 3): decorated structure -->
<div class="grid-marquee ratings" data-block-status="loaded">
  <div class="background"><picture>...</picture></div>
  <div class="foreground">
    <div class="headline"><h1>Title</h1><p>Body</p></div>
  </div>
</div>
```

CSS must target the **loaded** structure:
```css
/* ✅ correct — targets decorated class */
.grid-marquee .foreground .headline h1 { }

/* ❌ wrong — raw div structure doesn't survive decoration */
.grid-marquee > div > div h1 { }
```

---

## Import pattern

Always import Express utilities statically at the top of the file.
Milo utilities are loaded lazily via `getLibs()`:

```js
import { getLibs, decorateButtonsDeprecated, getIconElementDeprecated, fixIcons } from '../../scripts/utils.js';

let createTag;

export default async function decorate(block) {
  ({ createTag } = await import(`${getLibs()}/utils/utils.js`));
  // ...
}
```

If multiple milo utilities are needed:
```js
const [{ createTag, getConfig }, { getMetadata }] = await Promise.all([
  import(`${getLibs()}/utils/utils.js`),
  import(`${getLibs()}/utils/utils.js`),
]);
```

Or, more commonly:
```js
await Promise.all([import(`${getLibs()}/utils/utils.js`), decorateButtonsDeprecated(block)])
  .then(([utils]) => {
    ({ createTag } = utils);
  });
```

---

## Critical Express rules (from CLAUDE.md)

- **Never use `.innerHTML`** — it destroys Preact/Lit components.
  Use `.append()`, `cloneNode(true)`, or `createTag` to build DOM.
- **No hardcoded text** — all user-visible text (including aria labels,
  alt text, button labels) must come from the authored DOM content or
  from placeholders via `replaceKey`/`replaceKeyArray` from milo.
- **Icons**: use `getIconElementDeprecated('icon-name')` for cross-Express
  compatibility. Never create `<img>` tags for icons manually.
- **Cart CTAs**: always async-enhance dynamic cart links with
  `formatDynamicCartLink(cta)` from `../../scripts/utils/pricing.js`.
- **Branch tracking**: always `await trackBranchParameters([link])`
  on every CTA anchor before it is shown to the user.

---

## Common shared utilities

| Utility | Location | Purpose |
|---------|----------|---------|
| `getLibs` | `../../scripts/utils.js` | Returns the base URL for milo lib imports. |
| `decorateButtonsDeprecated` | `../../scripts/utils.js` | Decorates `<em>/<strong>` link markup into button elements. |
| `getIconElementDeprecated` | `../../scripts/utils.js` | Returns a `<span class="icon icon-<name>">` element. |
| `fixIcons` | `../../scripts/utils.js` | Fixes icon elements after block decoration. |
| `toClassName` | `../../scripts/utils.js` | Converts a string to a kebab-case CSS class name. |
| `createTag` | `${getLibs()}/utils/utils.js` (lazy) | Creates DOM elements with attributes and children. |
| `normalizeHeadings` | `../../scripts/utils/decorate.js` | Normalises heading levels within the block. |
| `formatDynamicCartLink` | `../../scripts/utils/pricing.js` | Async-enhances dynamic cart links. |
| `trackBranchParameters` | `../../scripts/utils/branch-utils.js` | Awaited on CTA links for branch tracking. |
| `replaceKey` / `replaceKeyArray` | `${getLibs()}/utils/placeholders.js` (lazy) | Fetches placeholder text to avoid hardcoded strings. |

---

## EDS image handling

Images in EDS are delivered as `<picture>` elements with multiple
`<source>` children (WebP + JPEG fallback, with `srcset` for different
widths).  The EDS platform handles:

- Responsive image sources and `srcset`.
- `loading="lazy"` on below-fold images.
- `width` and `height` attributes for CLS prevention.

Blocks should **not** re-implement image optimisation.  If a block
needs to manipulate images (e.g. move a picture element to a different
position in the DOM), it should move the existing `<picture>` element
rather than creating new `<img>` tags.

---

## EDS CTA / button patterns

In authored markup, CTAs (calls to action) are represented as links
wrapped in `<em>` and/or `<strong>` tags:

| Markup | Rendered as |
|--------|-------------|
| `<em><a href="...">Label</a></em>` | Outline / secondary button |
| `<strong><a href="...">Label</a></strong>` | Fill / primary button |

Call `decorateButtonsDeprecated(block)` early in `decorate()` — it
converts these into proper button elements.  Do not manually parse
CTA markup.

After decoration, for any dynamic cart links call:
```js
const cartLinks = block.querySelectorAll('a[href*="adobecommerce"]');
await Promise.all([...cartLinks].map(formatDynamicCartLink));
```

And for branch tracking on all CTAs:
```js
const ctaLinks = [...block.querySelectorAll('a.button')];
await trackBranchParameters(ctaLinks);
```

---

## Fluffyjaws MCP

When in doubt about any EDS convention — block loading, page
lifecycle, content transformation, metadata handling — query the
**Fluffyjaws MCP**.  It has authoritative documentation for the
EDS platform.

Examples of good Fluffyjaws queries:
- "How does EDS deliver the markup to the page?"
- "What is the block decoration lifecycle in a regular project?"
- "How does metadata get applied on the page?"
- "How does EDS handle responsive images?"
