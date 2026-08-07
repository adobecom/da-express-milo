# Wayfinder Component

The Wayfinder component displays text content with call-to-action buttons in a banner format.

## Custom Background Colors & Gradients

To add a custom background color or gradient to the wayfinder component, simply add an extra row at the bottom of the block. The value can be any valid CSS color or gradient string—**no prefix required**. This matches the authoring pattern used by `ribbon-banner` and other components.

### Example Authoring

**Gradient background:**
```html
<div class="wayfinder">
  <div>Text here</div>
  <div><a href="#">CTA 1</a> <a href="#">CTA 2</a></div>
  <div>linear-gradient(90deg, #C0C9FF 0%, #ACCFFD 100%)</div>
</div>
```

**Solid color background:**
```html
<div class="wayfinder">
  <div>Text here</div>
  <div><a href="#">CTA 1</a> <a href="#">CTA 2</a></div>
  <div>#C0C9FF</div>
</div>
```

**Named color:**
```html
<div class="wayfinder">
  <div>Text here</div>
  <div><a href="#">CTA 1</a> <a href="#">CTA 2</a></div>
  <div>lightblue</div>
</div>
```

- The background will be applied to the `.wayfinder` div only (not the whole section).
- The config row will be removed from the DOM and not displayed.
- You can use any valid CSS color, hex, rgb, hsl, or gradient string.

## Existing Variants

- `.dark`: Black background with white text
- `.light`: Light border with accent color
- `.gradient`: Pre-defined gradient background
- `.narrow`: Reduced width (850px)
- `.borderless`: No border
- `.metadata-triggered`: Only renders when the page metadata `enable-wayfinder-promo` is `yes`/`y`/`on`/`true`; otherwise the block is removed. Lets a shared template page toggle the banner per row.
- `.spreadsheet-powered`: Validates CTA `href`s after the page's metadata swap has run (see below), stripping any link that didn't resolve to a real `http(s)` URL instead of leaving a broken/mangled link in the page.

## Authoring for spreadsheet/bulk template pages

On pages that are metadata- or spreadsheet-driven (e.g. `sheet-powered: Y` page metadata, or bulk rows in a `metadata.json`/`relevant-rows.json` sheet), author the text and CTA with placeholder tokens instead of literal content:

```html
<div class="wayfinder template-page metadata-triggered spreadsheet-powered borderless">
  <div><p>{{wayfinder-text}}</p></div>
  <div><p><a href="#wayfinder-cta-1">{{wayfinder-cta-1-text}}</a></p></div>
</div>
```

with page metadata (or the equivalent bulk sheet row) supplying:
- `wayfinder-text` — the banner's text content
- `wayfinder-cta-1` — the CTA's destination URL (must be a full, absolute `https://...` URL — a bare hostname or path will resolve incorrectly)
- `wayfinder-cta-1-text` — the CTA's visible label
- `enable-wayfinder-promo` — `yes` to show the block on that page (required because of `.metadata-triggered`)

Two different token styles are used deliberately:
- **`{{key}}` for text content** — safe anywhere in the DOM's text; `content-replace.js`'s blade-token pass runs before block decoration and swaps it for the metadata value.
- **`#key` for the CTA `href`** — DA's link editor can percent-encode curly braces typed into a URL field (`{{` becomes `%7B%7B`), which silently breaks a `{{key}}`-style href. The `#key` hash-anchor convention avoids that entirely: `content-replace.js` resolves it via the DOM `href`/`hash` properties rather than string-matching raw HTML, so it's immune to the encoding issue.

Add `.spreadsheet-powered` when using this pattern — it's a second line of defense that strips the CTA link (rather than rendering a broken/relative URL) if the metadata value doesn't resolve to a valid `http(s)` URL, matching the same safeguard `blog-posts-v2` uses for its spreadsheet-driven links.

## Notes
- This pattern matches `ribbon-banner` and other blocks for consistency.
- If you want a background on the entire section, use `section-metadata` instead.
