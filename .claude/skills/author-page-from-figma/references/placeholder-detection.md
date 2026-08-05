# Placeholder Detection Reference

Per this repo's authoring convention, blocks must not hardcode UI
text — anything not authored in the DOM comes from the shared
`/express/placeholders.json` sheet via `replaceKey`/`replaceKeyArray`
(see `test/mocks/libs/features/placeholders.js` for the reference
behavior: look up the key, normalized loosely — case and
hyphen/space are interchangeable — falling back to the raw key name
if unregistered).

This matters here because a Figma frame shows the **rendered**
result — it draws no distinction between text that must be authored
in the page and chrome text the block injects itself. Treating every
visible string as authorable content produces HTML with dead cells
the block never reads, or worse, shifts positional content into the
wrong slot for blocks that key off child order.

---

## Detection procedure

Run this as part of `agents/block-structure-resolver.md`, once the
block name is confirmed — before content extraction, so Phase 3
knows what to skip.

1. Search the block's JS for placeholder calls:
   ```bash
   grep -n "replaceKey(\|replaceKeyArray(" express/code/blocks/<block-name>/<block-name>.js
   ```
   Also check any co-located helper files the block imports (e.g.
   `breadcrumbs.js` alongside `template-list.js`).

2. If no matches: this block doesn't use placeholders. Skip the rest
   of this reference — all visible Figma text is authorable content.

3. If matches exist, extract the key from each call, e.g.:
   ```js
   await replaceKey('edit-this-template', getConfig())
   await replaceKeyArray(['apple-store-rating-score', 'apple-store-rating-count'], getConfig())
   ```
   Build a list of keys used by this block.

4. Fetch the current values:
   ```bash
   curl -s "https://main--da-express-milo--adobecom.aem.live/express/placeholders.json"
   ```
   This returns `{"data": [{"key": "...", "value": "...", "note": "..."}, ...]}`.
   Match each code key against a sheet entry, normalizing hyphens to
   spaces (`edit-this-template` → `edit this template`).

5. Note which keys carry **visible text** vs. **structural/config
   data** (some placeholder values are JSON blobs or icon lists, not
   display text — e.g. `template-filter-premium`,
   `template-filter-premium-icons`). Only text-bearing keys are
   relevant for cross-referencing against Figma.

---

## Using this during content extraction (Phase 3) and build (Phase 6)

For each text element extracted from Figma, check whether its value
matches a placeholder's current `value` (case-insensitive, ignoring
minor whitespace differences):

- **Match found** → this is chrome text, not page content. **Do not
  author it in the HTML.** Record it as `sourced-from-placeholder:
  <key>` instead of an authored cell.
- **No match, but the block is known to use placeholders for this
  kind of string** (e.g. a button whose position in the design
  corresponds to a `replaceKey`-driven label) → flag for the user:
  the Figma copy may represent an intended placeholder update rather
  than new page content. Ask whether to (a) leave the existing
  placeholder value as-is, since it's shared across every page using
  this block, or (b) note that `placeholders.json` needs a content
  update — that edit happens outside this skill's scope (it's a
  shared sheet, not this page), so surface it in the Phase 10
  summary rather than silently editing it.
- **No match, and the element isn't placeholder-shaped** → author
  normally as page content.

## Recording the result

Report in the Phase 10 summary:
```
Placeholders detected: <N> keys used by this block
  - edit-this-template → "Edit this template" (matches Figma; not authored, block-supplied)
  - apple-store-rating-score → "4.8" (Figma shows "4.9" — sheet may need updating; not authored)
```

If the block uses no placeholders, state that explicitly so the user
knows every visible string was treated as authorable content.
