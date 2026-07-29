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
