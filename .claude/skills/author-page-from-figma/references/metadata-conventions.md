# Metadata Conventions Reference

Two authoring tables look similar but serve completely different
purposes. Confusing them produces a silent failure — the row uploads
fine, DA renders it without error, but the block never sees the value
it needed.

---

## `metadata` vs `section-metadata` — pick the right one

- **`section-metadata`**: a table titled `section-metadata`, authored
  as a sibling within one section's `<div>`. Its key/value rows become
  classes/config scoped to **that section only**.
- **`metadata`**: a table titled `metadata`. Regardless of where it
  sits in the document, EDS converts every row into a page-wide
  `<meta name="...">` tag in `<head>`. Blocks read these via
  `getMetadata(key)` (`express/code/scripts/utils.js`), which does a
  literal `document.head.querySelector('meta[name="key"]')` —
  there is **no per-section scoping** for these at all, no matter
  where in the body the `metadata` table is placed.

### How to tell which one a block needs

Before assuming a config value belongs in `section-metadata`, check
how the block's own JS actually reads it:

```bash
grep -n "getMetadata(" express/code/blocks/<block-name>/<block-name>.js
```

If the block calls `getMetadata('some-key')`, that key must be
authored via a `metadata` block, not `section-metadata` — even if the
value conceptually feels like it "belongs" to one section (e.g. a
branding-logo override for a single hero block still has to go through
the page-wide `metadata` table, because that's the only thing
`getMetadata()` can see).

This is the same kind of check `placeholder-detection.md` does for
`replaceKey`/`replaceKeyArray` — run it whenever Phase 2 finds a block
config option (logo injection, feature toggles, etc.) that Figma's
design implies a non-default value for. Don't skip this just because
the skill's default posture is "no metadata block needed" — that
default only holds when nothing in Figma requires overriding a
`getMetadata()`-driven default.

---

## `section-metadata`'s `background` key

A section can have its own background — solid color, gradient, or image —
independent of anything inside the block. This is read generically by
Milo core's `section-metadata.js` (`handleBackground`/`applyBackground`),
not by the block itself. **A block's own JS/CSS having no background
reference does not mean the section renders on plain white by design** —
it may just mean this key was never authored.

- **Value is a color/gradient string** (hex, `rgb()`/`rgba()`, or a CSS
  gradient) in the cell text → becomes `section.style.background`
  directly.
- **Multiple values, pipe-delimited** (`color1 | color2` or
  `color1 | color2 | color3`) → responsive breakpoints: one value applies
  at all sizes, two split mobile vs. tablet+desktop, three split
  mobile/tablet/desktop individually.
- **Value is an image** (a `<picture>` in the value cell instead of text)
  → inserted as the section's background image instead of a CSS color.

```html
<table>
  <tbody>
    <tr><td colspan="2"><p>section-metadata</p></td></tr>
    <tr><td>background</td><td>#f8f8f8</td></tr>
  </tbody>
</table>
```

### When to add it

Before concluding a section needs no `background` key, check both of these
— don't skip just because the block's own resolved structure (Phase 2)
didn't mention one:

1. **Does the Figma section have a real background?** Compare the frame's
   fill behind the *whole section* (not a card, icon, or media slot inside
   the block) against `--color-white`/transparent. A visible color,
   gradient, or photo behind the entire section is a signal this key is
   needed.
2. **Does the block already hardcode it instead?** Some blocks break this
   convention and set their own section-level background directly in CSS
   or JS rather than relying on `section-metadata`. Check before
   double-authoring:
   ```bash
   grep -n "^\.block-name\s*{" -A5 express/code/blocks/<block-name>/<block-name>.css
   ```
   Look specifically at the selector matching the block's **outer** class
   (e.g. `.block-name { background: ... }`), not a nested card/child
   selector (`.block-name-card { background: ... }`) — those style
   internal elements, not the section. If the outer selector already
   hardcodes a background, don't author a `section-metadata` background
   row for it; that would be redundant at best and could visually
   conflict at worst.

If a real section background exists in Figma and the block doesn't
already hardcode it, author the `section-metadata` block above — in the
same section `<div>` as the content block, as a sibling, exactly like the
`style` key example below.

---

## `section-metadata`'s `style` key

Every section-level style modifier — spacing tokens, one-off named
styles — goes through a **single `style` key**, not separate
purpose-specific keys:

```html
<table>
  <tbody>
    <tr><td colspan="2"><p>section-metadata</p></td></tr>
    <tr><td>style</td><td>XL spacing top, Ax-max-entitled</td></tr>
  </tbody>
</table>
```

- Multiple styles on one section are **comma-delimited in one row**,
  not multiple rows.
- The value is converted to a class via `toClassName()`
  (`express/code/scripts/utils.js`): lowercases and replaces every
  non-alphanumeric character with a hyphen. `"XL spacing top"` →
  `xl-spacing-top`. This means casing and spacing in the authored
  value don't need to exactly match the CSS class — `toClassName`
  normalizes it — but the *words* must match a real class.
- **Spacing tokens have directional variants.** Plain `XL spacing`
  (→ `xl-spacing`) applies to both the top and bottom of the section.
  Use `XL spacing top` / `XL spacing bottom` (→ `xl-spacing-top` /
  `xl-spacing-bottom`) when you only want one side — e.g. adding space
  above a section without also pushing space below a last-of-page
  section that didn't need it.
- Verify a style token is real the same way you'd verify a block
  variant (`references/variant-matching.md`) — grep the block/shared
  CSS for the resulting class before authoring it, never invent one
  because it "sounds right."
