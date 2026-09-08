# Block Structure Resolver Subagent

Delegated from Phase 2 of the main SKILL.md. Given a **confirmed
block name**, resolves the exact DA authoring table structure for
that block plus its list of known variants — without inventing or
generalizing a structure. This skill never defines authoring
structure; it always copies one that already exists.

---

## Inputs

- **Block name** (confirmed in Phase 1)
- **Repo root**: `/Users/meganthomas/Projects/da-express-milo`

---

## Resolution cascade

Try each source in order. Each source yields the same two outputs: a
**base table structure** and a **variant registry**. Record which
source was used — it is reported to the user in the final summary and
affects confidence.

**The cascade is per-variant, not per-block — don't stop early just
because an earlier source answered *something*.** Nala answering the
base variant does not mean it answered the *specific* variant Phase 4
needs. If the variant you need isn't in the source that succeeded,
keep walking the remaining sources for that variant specifically
before concluding it's code-inference-only. This mattered in practice:
a block's base variant came from its nala fixture, but the one variant
actually needed only existed in that same block's kitchen-sink page —
checking kitchen sink only ever happens if nala's answer is treated as
per-variant, not as "this block is resolved, move on."

### Source 1 — Nala test fixtures (preferred)

Nala's `block.json` is a structured registry, not just markup: each
entry names a variant, the CSS selector that produces it, and a live
page that already renders it. This is the only source that answers
"what variants exist and what does each look like" directly, so
prefer it whenever it exists.

1. Check for the fixture:
   ```bash
   ls nala/blocks/<block-name>/<block-name>.block.json
   ```
   If absent, go to Source 2.

2. Read the file. For each entry in `variants`, extract:
   - `name` (e.g. `@cards-dark`)
   - `selector` (e.g. `div.cards.dark`) — the class list is the
     ground truth for what a variant is actually called in code.
     Some entries have no `selector`; infer the variant token from
     the `name` suffix instead (e.g. `@cards-featured` → `featured`).
   - `path` (e.g. `/drafts/nala/blocks/cards-featured`)

3. Pick the **default/base variant** — the entry whose `selector`
   has no extra classes beyond the block name (or the first entry if
   none is unambiguous) — and fetch its rendered markup:
   ```bash
   curl -s "https://main--da-express-milo--adobecom.aem.live<path>.plain.html"
   ```
   **This is not the authored table** — see "Reverse-transforming
   fetched markup" below before treating it as source. Convert it to
   authored table HTML first; that conversion is what this skill must
   reproduce (header row text, column count, `rowspan`/`colspan`
   usage, cell ordering).

4. Build the **variant registry** from every entry's selector/name —
   this is the full candidate list for Phase 4 (variant matching).
   Also check the fetched page's own root class list against this
   registry — see "Undocumented variants" below, since `block.json`
   is not guaranteed to enumerate every class in live use.

### Reverse-transforming fetched markup into authored table HTML

`.plain.html` (from nala pages, kitchen sink, or any published/
previewed EDS page) returns the block's **rendered runtime markup** —
`<div class="block-name variant">` wrapping child `<div>`s — not the
literal `<table>` DA stores as source. EDS's pipeline transforms an
authored table into this div structure before the page is served;
`.plain.html` reflects the page *after* that transform, not before.
Confirmed by fetching `.plain.html` directly: it never contains a
`<table>` element, even for blocks this skill has previously
authored as tables via the DA admin API.

The transform is mechanical and losslessly reversible:

- Outer `<div class="block-name variant-a variant-b">` → header row
  `<tr><td colspan="N"><p>block-name (variant-a, variant-b)</p></td></tr>`.
  No variant classes → `<p>block-name</p>` with no parentheses.
- Each direct child `<div>` of the outer block div → one `<tr>`.
- Each direct child `<div>` of a row div → one `<td>`. The cell's
  own children (`<p>`, `<hN>`, `<picture>`, `<a>`, …) become the
  `<td>`'s content directly — the wrapping `<div>` itself is dropped,
  it does not become a nested element inside the `<td>`.
- A `<td>` whose only content is another `<div>` containing key/value
  text (e.g. `<div>Tags</div><div>Small business</div>`) is a
  **config row**, not display content — author it as-is in its own
  `<tr>`; do not try to merge it into the adjacent content row.
- Infer `rowspan`/`colspan` by comparing row widths: if one row has
  fewer cells than its neighbors, the widest row's first cell likely
  needs `rowspan` to span the shorter rows beneath it (this mirrors
  the pattern documented for generic Express authoring — media
  stacking vertically against a single spanning text cell — but only
  apply it if the fetched markup's row/cell counts actually show that
  shape; do not assume it by default).

If uncertain about the exact row/cell boundary for a given block,
prefer under-splitting (fewer, larger `<td>`s) over guessing a
`rowspan` that isn't clearly evidenced by the fetched structure, and
flag the uncertainty in the Phase 10 summary.

**Also check for a sibling `.section-metadata` div** in the fetched
markup, alongside the block's own outer div (both are direct children
of the same section wrapper). If present, its rows — especially a
`background` key — are section-level config, not part of the block's
own table; note them separately as evidence the real page uses this
mechanism. See `references/metadata-conventions.md` for what the
`background` key means and when to author it.

### Undocumented variants

`block.json`'s variant list is not guaranteed to be exhaustive — it
records what nala explicitly tests, not necessarily every class in
production use. After fetching a page, read the outer div's full
class attribute and diff it against the registry built in step 4.
Any class not already listed is a **real, undocumented variant** —
add it to the registry (source: "found on live page, not in
block.json") rather than discarding it. Do not treat registry
completeness as guaranteed just because a `block.json` exists.

### Source 2 — Kitchen sink

If no `block.json` exists, check the kitchen sink library page:

```bash
curl -s -o /dev/null -w "%{http_code}" \
  "https://main--da-express-milo--adobecom.aem.live/docs/library/kitchen-sink/<block-name>.plain.html"
```

If `200`:
- Fetch the `.plain.html` body and convert it to authored table HTML
  using "Reverse-transforming fetched markup" above — this is the
  same rendered-div format as nala pages, not literal table markup.
- Kitchen sink pages sometimes demonstrate multiple variants stacked
  on one page (separate block instances with different root div
  classes). Scan the fetched HTML for every distinct block instance
  matching `<block-name>` — each distinct class list found is a
  variant registry entry. If only one instance appears, the variant
  registry is just the base (no known variants beyond default).

If `404` (block missing from kitchen sink): go to Source 3.

### Source 3 — Code inference (last resort, low confidence)

Only reached when neither fixture exists. This never fully replaces
a real example, so **flag every output from this path as low
confidence** in the summary.

1. Read `express/code/blocks/<block-name>/<block-name>.js`. Look at
   the `decorate(block)` function to determine:
   - How many top-level children (`block.children`) the code expects
     — this maps to table rows.
   - How child elements are re-parented/classified — this hints at
     column structure (e.g. first child = text, second = media).
2. Read `express/code/blocks/<block-name>/<block-name>.css`. Collect
   every selector of the form `.<block-name>.<extra-class>` — each
   `<extra-class>` is a **candidate** variant name. CSS-only variants
   (no JS branching) are common in this codebase and are real
   variants even though the JS never mentions them.
3. Because there is no live rendered example, there is no way to
   visually confirm what a variant looks like. Say so explicitly and
   rely on Phase 4 asking the user directly instead of visual match.
4. Construct the base table structure by best-effort reasoning from
   the code, using the generic Express authoring conventions (header
   row = `<p>block-name</p>`, content rows follow) as a starting
   skeleton — but mark this structure as inferred, not copied.

---

### Source 4 — Placeholder detection (always run, alongside the above)

Regardless of which structure source was used, check whether this
block sources any of its text from `/express/placeholders.json`
instead of authored DOM content. **Load
`references/placeholder-detection.md` now** and follow its
procedure. This must happen before Phase 3 (content extraction) so
placeholder-sourced text can be excluded from authoring rather than
mistakenly written into a cell.

## Output

```
Structure source:  nala | kitchen-sink | code-inference
Confidence:        high | medium | low
Base table HTML:   <table markup reverse-transformed from .plain.html, or reasoned skeleton>
Base source path:  <URL or file path used>

Known variants:
  - token: dark       selector: div.cards.dark       example: <path or "none — inferred from CSS">
  - token: featured    selector: (name-derived)        example: <path>
  - token: large       selector: div.cards.large       example: <path>
  - token: text-right  selector: (found on live page, not in block.json)  example: <path>

Placeholder keys used: <N> (or "none")
  - <key> → "<current value>"
```

If Source 3 was used, add:
```
⚠️ No live example found (checked nala fixtures and kitchen sink).
Structure and variants below are inferred from code and unverified
visually. Confirm carefully before uploading.
```
