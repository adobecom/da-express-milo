---
name: author-page-from-figma
description: >
  Authors a DA page from a Figma design for a block that already
  exists in code. Resolves the exact authoring structure and known
  variants from real examples (nala test fixtures, then kitchen
  sink, then code as a last resort) instead of inventing one, matches
  the Figma frame to the correct block name, and extracts content to
  produce an authored HTML document uploaded to DA.
---

# Author Page from Figma Skill

You are authoring a DA (Document Authoring) page for an **existing**
Adobe Express block, using a Figma design purely as the content
source. This skill never designs or invents an authoring structure —
that decision belongs to the block's own code. Your job is to find
the block's real, already-established authoring pattern and variant
set, then pour the Figma content into it.

> **Critical rules**
>
> - **Never invent authoring structure.** The table shape (rows,
>   columns, `rowspan`/`colspan`, header format) must be copied from
>   a real example — nala test fixture, kitchen sink page, or (last
>   resort) reasoned from code — never assembled from a generic
>   template. See `agents/block-structure-resolver.md`.
> - **Never invent variant class names.** A variant is a code fact.
>   Match against the block's actual known variants; never write a
>   plausible-sounding class that isn't confirmed to exist. See
>   `references/variant-matching.md`.
> - **The block name in Figma rarely matches the code name exactly.**
>   Always resolve and confirm against the real block folder list in
>   `express/code/blocks/`. See `references/block-name-matching.md`.
> - **Not all visible Figma text is authorable content.** Some blocks
>   source UI text from `/express/placeholders.json` via
>   `replaceKey`/`replaceKeyArray` instead of the DOM. Detect this
>   before authoring so that text isn't duplicated or misplaced. See
>   `references/placeholder-detection.md`.
> - Assets are downloaded from Figma locally, then uploaded directly
>   to the DA admin API via `curl POST` to `admin.da.live/source/...`
>   with multipart form data. **Never embed images as base64 in DA
>   HTML.**
> - **Never default to screenshot-cropping for images.** Try
>   `get_design_context` on the image's own (instance) node ID first —
>   `download_assets`/`get_screenshot` only resolve a component's
>   default fill, not an instance override. See Phase 5.
> - **`metadata` and `section-metadata` are not interchangeable** —
>   one is page-wide, one is per-section. See
>   `references/metadata-conventions.md`.
> - The HTML references assets using their final `content.da.live`
>   URLs (dot-prefixed shadow folder convention).
> - Link URLs use `https://www.adobe.com/` as a placeholder. Link
>   display text must match Figma.
> - Heading levels and body sizes are determined by visual heuristics
>   since Express Figma designs do not use `--s2a-typography-*`
>   tokens.

## Bundled resources

Do **not** load these upfront. Each phase tells you which file to
read when it becomes relevant.

### references/
| File | Purpose |
|------|---------|
| `block-name-matching.md` | Fuzzy-matches a Figma frame/component name to a real block folder in `express/code/blocks/`. |
| `variant-matching.md` | How to match a Figma frame's visual style against a block's known variant registry without inventing class names. |
| `token-mapping.md` | Visual heuristics for classifying Figma text elements (heading level, body size, eyebrow, CTA style). |
| `placeholder-detection.md` | Detects text this block sources from `/express/placeholders.json` instead of authored DOM content, so it isn't mistakenly re-authored. |
| `metadata-conventions.md` | Distinguishes page-wide `metadata` from per-section `section-metadata`, and documents the `style` key's spacing/comma-delimited conventions. |

### agents/
| File | Purpose |
|------|---------|
| `block-structure-resolver.md` | Resolves the real authoring table structure + variant registry via the nala → kitchen-sink → code cascade. |
| `figma-content-extractor.md` | Extracts structured content (text, media) from a Figma frame. |

---

## Inputs

Collect all inputs before starting extraction work.

| Input | Required | Example |
|---|---|---|
| **Figma URL(s)** | At least one | One URL per viewport you want as reference |
| **DA destination** (org, repo, path) | Yes | `adobecom / da-express-milo / drafts/methomas/my-page.html` |

If multiple Figma URLs are provided, ask which viewport each
represents (mobile / tablet / desktop) — these are for extraction
reference only; Express blocks are single-content, CSS-driven
responsive, so there are no separate authored viewport sections.

---

## Phase 1 — Identify the block (BLOCKING)

**Load `references/block-name-matching.md` now.**

1. Use Figma MCP `get_metadata` on the frame(s) to read the frame
   name, parent component/section name, and any attached component
   name.
2. Follow the matching procedure to score candidates against
   `express/code/blocks/`.
3. Present the best match and alternatives; wait for the user to
   confirm or correct it.

> **STOP**: Do not proceed to Phase 2 until the block name is
> confirmed. Every later phase targets this exact block.

---

## Phase 2 — Resolve the authoring structure

**Load `agents/block-structure-resolver.md` now.**

Follow its cascade (nala fixtures → kitchen sink → code inference)
for the confirmed block name. This produces:
- The base authored table structure (copied, not designed).
- The registry of known variants for this block.
- A confidence level and source, to report in the final summary.
- The list of `/express/placeholders.json` keys this block sources
  text from (via `references/placeholder-detection.md`), if any.

Do not continue past this phase without a concrete base table
structure in hand — if code inference (Source 3) was needed, flag it
clearly and expect to lean on the user more heavily in Phase 5.

Carry the placeholder key list into Phase 3 — it determines which
visible Figma text should **not** be authored.

---

## Phase 3 — Extract content from Figma

**Load `references/token-mapping.md` now.**

For each provided Figma frame, **load
`agents/figma-content-extractor.md`** and follow its procedure.

Each extraction returns:
- Icon (Figma asset URL + node ID + alt text, if present)
- Eyebrow text (if present)
- Heading text + level (h1–h4)
- Body text + size class (body-lg, body-md, body-sm)
- Links (display text + CTA style: primary/secondary/plain)
- Background (color string, or Figma asset URL + node ID if image)
- Foreground image (Figma asset URL + node ID, if present)
- Additional media (if present)
- Fallback classifications (elements where heuristics were used)

If multiple Figma frames were provided, use the desktop (or widest)
frame as the primary content source and compile a brief note of what
differs across viewports — reference only, for the block developer's
CSS, not separate authored sections.

### Placeholder cross-reference

For each extracted text element, check it against the placeholder
keys carried over from Phase 2 (per
`references/placeholder-detection.md`). Text matching a placeholder's
current value is **chrome, not content** — exclude it from the
authored output entirely and record it as
`sourced-from-placeholder: <key>` instead. If the Figma copy differs
from the sheet's current value for a key this block is known to use,
flag it for the Phase 10 summary rather than authoring it — updating
`/express/placeholders.json` is a shared-sheet change outside this
page, not something this skill edits silently.

---

## Phase 4 — Match variants

**Load `references/variant-matching.md` now.**

Using the variant registry from Phase 2 and the Figma screenshot(s)
from Phase 3, determine which known variant(s), if any, apply. Ask
the user to confirm whenever the visual match isn't clear-cut, and
always ask directly if Phase 2 used code inference (no rendered
example exists to compare against).

Record the confirmed variant list — it goes in the header row
alongside the block name.

---

## Phase 5 — Download and prepare media

Collect all Figma asset URLs from Phase 3 and download them locally.

> **Critical constraints**
>
> - **No compression, no resizing, no Python scripts.** DA and EDS
>   handle image optimization.
> - **Never read image data into context.** Do not use the Read
>   tool on image files. Do not `cat` them. Do not print base64
>   output to inspect it.

### 5a. Collect asset URLs and node IDs

From the Phase 3 extraction output, collect every Figma **node ID**
(not just the asset URL) for: icon, background image, foreground
image, additional media. Deduplicate across frames.

### 5b. Download the REAL asset, not a screenshot crop

**Never default to a full-frame screenshot + crop.** When an image
sits inside a component instance with an overridden fill,
`download_assets` and `get_screenshot` resolve the **master
component's default fill** (often a placeholder), not the instance's
actual content — because both tools only accept plain `digit:digit`
node IDs, which can't address an instance-specific override. Follow
this order for every image, stopping at the first step that produces
a real, non-blank asset:

1. **`get_design_context` on the image's own node ID**, using the
   full semicolon-chained instance form if it has one (e.g.
   `I3941:57367;3931:19024` — this tool's `nodeId` pattern supports
   that format; `download_assets`/`get_screenshot` do not). Its output
   embeds real asset URLs as `const imgX = "https://www.figma.com/api/mcp/asset/..."`.
   If multiple `<img>` constants are stacked in the same slot, the
   **last one in the output is the one actually painted on top** —
   still verify by downloading it.
2. **Verify the download isn't blank** before trusting it:
   ```bash
   curl -sL "<asset-url>" -o /tmp/figma-media/<page-name>/<filename>
   file /tmp/figma-media/<page-name>/<filename>
   magick identify -verbose /tmp/figma-media/<page-name>/<filename> | grep mean:
   ```
   A real photo will not show `mean: 0` on every channel. If it does,
   step 1 resolved to a placeholder — go to step 3.
3. **`download_assets` on the nearest plain-ID ancestor** (e.g. the
   whole section frame, not the instance). Inspect **every** URL in
   the returned `rawImages` list the same way (download + `identify`
   + look at it) — the list often mixes real photos with unrelated
   broken-image glyphs from other elements in the subtree, in no
   particular order. Match each to its content by eye.
4. **Only if neither above works**: fall back to a full-frame
   `get_screenshot` and crop the region with ImageMagick (`magick
   <input> -crop WxH+X+Y +repage <output>`). Flag in the Phase 10
   summary that this asset is a lower-fidelity crop, not a native
   export — it will lack transparency and may not match the block
   CSS's expected aspect ratio.

#### SVG icons

Icons in Figma are often multi-layer (background + symbol). Export
the composite SVG via the Figma Plugin API:

```javascript
// use_figma: Export icon node as composite SVG
const node = await figma.getNodeByIdAsync('<icon-node-id>');
const svgBytes = await node.exportAsync({ format: 'SVG' });
const svgString = String.fromCharCode(...svgBytes);
return svgString;
```

Save the returned SVG locally, then:
1. Upload it to the **same directory as the document** via
   `POST admin.da.live/source/<org>/<repo>/<parent-path>/<icon-name>.svg`.
2. **Preview** it via
   `POST admin.hlx.page/preview/<org>/<repo>/main/<parent-path>/<icon-name>.svg`.
3. Use the resulting **`aem.page` preview URL** in the HTML as both
   the `href` and the display text of the icon `<a>` tag.

### 5c. Compute DA asset paths

Dot-prefixed shadow folder convention:
```
https://content.da.live/<org>/<repo>/<parent-path>/.<page-name>/<filename>
```

### 5d. Color backgrounds

Solid colors, gradients, and semi-transparent values are plain text
in the media column — no download needed (`#1a1a1a`,
`linear-gradient(135deg, #1a1a1a, #2d2d2d)`, `rgb(255 255 255 / 0)`).

---

## Phase 6 — Build HTML document

Start from the **base table structure resolved in Phase 2** — do not
restructure it. Substitute the Phase 3 content into the corresponding
cells, following the same row/column/rowspan pattern as the real
example. Apply the Phase 4 confirmed variants to the header row:

```html
<tr><td colspan="N"><p>block-name (variant-a, variant-b)</p></td></tr>
```

`N` is the resolved base table's column count from Phase 2 — not always 2. No
variants confirmed → `<p>block-name</p>` with no parentheses.

### Content placement

- **Skip anything flagged `sourced-from-placeholder` in Phase 3.**
  That text is supplied by the block at runtime — do not add a cell
  or paragraph for it, even if Figma shows it in that position.
- **Text content** (icon, eyebrow, heading, body, links) goes in
  whichever cell the resolved example uses for text — do not assume
  it's always the left column; some blocks put text first, some put
  media first, some interleave. Match the resolved example's cell
  order exactly.
- **Media** (background, foreground, additional) goes in the
  resolved example's media cell(s), in the same order the example
  demonstrates.
- Element-level authoring conventions still apply:
  - Icon (SVG): `<p><a href="<aem.page-url>"><aem.page-url></a></p>`
  - Links: **check the resolved base structure from Phase 2 for how
    its real example authors CTAs before defaulting to a generic
    convention.** `<strong><a>` = primary CTA, `<em><a>` = secondary
    CTA, bare `<a>` = plain link is a reasonable default, but it does
    not hold for every block — some blocks (particularly ones on the
    legacy `decorateButtonsDeprecated` path, or ones using a
    `#_button-fill`-style hash suffix) author CTAs with different
    wrapping, nesting, or hash conventions in their real example. If a
    real base structure exists, copy its exact link markup instead of
    assuming the generic rule; only use the generic rule when Source 3
    (code inference) left no real example to copy from.
  - Image media: `<picture><img src="<content.da.live-url>" alt="..."></picture>`
  - Color background: plain text in the cell, e.g. `<td>#1a1a1a</td>`

> **DA colspan rule**: DA pads every row to the table's widest row
> with empty cells. Any full-width row (header, a full-width color
> row, etc.) needs an explicit `colspan="N"` matching the column
> count, or content shifts into the wrong column.

### Document skeleton

```html
<body>
  <header></header>
  <main>
    <div>
      <table>
        <tbody>
          <!-- resolved base structure, populated with Phase 3 content -->
        </tbody>
      </table>
    </div>
  </main>
  <footer></footer>
</body>
```

No `metadata` or `section-metadata` block needed by default — **but
check first**: if Phase 2 found the block calls `getMetadata()` for
something Figma's design implies a non-default value for (e.g. a logo
variant, a feature toggle), or the user requests a section-level style
(spacing, a named style), author it per
`references/metadata-conventions.md`. Don't skip this check just
because it wasn't explicitly requested — a block can silently render
with the wrong default if a `metadata`-driven value is missing.

### Save HTML to disk

```
/tmp/da-upload/<da-path>/<page-name>.html
```

### Present HTML for review

Show the constructed HTML to the user, alongside the source used for
the structure (nala fixture path / kitchen-sink page / code
inference) and the confirmed variants, and ask for confirmation
before uploading.

---

## Phase 7 — Upload to DA

```bash
TOKEN=$(da-auth-helper token 2>/dev/null)
```

### 7a. Ask the user

```
DA upload:
  HTML:    /tmp/da-upload/<da-path>/<page-name>.html
  Assets:  <N> images in /tmp/figma-media/<page-name>/
  Target:  <org>/<repo>

Ready to upload?
```

### 7b. Check token

```bash
da-auth-helper token >/dev/null 2>&1 && echo "Token OK" || echo "No token"
```

If the command fails, instruct the user to:
1. Install: `npm install -g github:adobe-rnd/da-auth-helper`
2. Log in: `da-auth-helper login` (opens browser for Adobe IMS;
   choose the **Skyline** profile)
3. Verify: `da-auth-helper token`

### 7c. Upload images

```bash
curl -s -w "\n%{http_code}" -X POST \
  "https://admin.da.live/source/<org>/<repo>/<parent-path>/.<page-name>/<filename>" \
  -H "Authorization: Bearer $TOKEN" \
  -F "data=@/tmp/figma-media/<page-name>/<filename>;type=<mime-type>"
```

Expect **201 Created**. Run uploads in parallel.

### 7d. Upload HTML

```bash
curl -s -w "\n%{http_code}" -X POST \
  "https://admin.da.live/source/<org>/<repo>/<da-path>/<page-name>.html" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: text/html" \
  --data-binary @/tmp/da-upload/<da-path>/<page-name>.html
```

Expect **200** or **201**.

### 7e. Verify images

```bash
curl -s -o /dev/null -w "%{http_code}" \
  "https://content.da.live/<org>/<repo>/<parent-path>/.<page-name>/<filename>" \
  -H "Authorization: Bearer $TOKEN"
```

### 7f. Handle result

**On success:** `https://da.live/edit#/<org>/<repo>/<da-path>/<page-name>`

**On failure:**
- 401 → token expired: `da-auth-helper login` (Skyline profile)
- 403 → check org/repo permissions
- Images 404 → verify the POST returned 201 and path matches HTML reference

---

## Phase 8 — Preview & Publish

### 8a. Ask user

```
Document uploaded. Would you like to preview and publish? (y/n)
```

If no, skip to Phase 9.

### 8b. Path safety check (BLOCKING)

**Path contains `/drafts/`:** safe to proceed.

**Path does NOT contain `/drafts/`:** present this warning:

```
⚠️  You're about to publish a document on production.
Are you sure you want to proceed? (y/n)
```

> **STOP**: Do NOT call the preview or publish APIs without passing
> this check.

### 8c. Preview

```bash
curl -s -w "\n%{http_code}" -X POST \
  "https://admin.hlx.page/preview/<org>/<repo>/main/<da-path>/<page-name>" \
  -H "Authorization: Bearer $TOKEN"
```

Report: `Preview: https://main--<repo>--<org>.aem.page/<da-path>/<page-name>`

### 8d. Publish

```bash
# Publish each SVG icon first (if any)
curl -s -w "\n%{http_code}" -X POST \
  "https://admin.hlx.page/live/<org>/<repo>/main/<parent-path>/<icon>.svg" \
  -H "Authorization: Bearer $TOKEN"

# Publish the document
curl -s -w "\n%{http_code}" -X POST \
  "https://admin.hlx.page/live/<org>/<repo>/main/<da-path>/<page-name>" \
  -H "Authorization: Bearer $TOKEN"
```

Report: `Live: https://main--<repo>--<org>.aem.live/<da-path>/<page-name>`

---

## Phase 9 — Cleanup

```
Upload complete. Delete /tmp/da-upload/ and /tmp/figma-media/ ? (y/n)
```

---

## Phase 10 — Summary

1. **Block name** confirmed (and how it was matched, if not exact).
2. **Structure source**: nala fixture / kitchen sink / code inference
   — and confidence level. If code inference was used, call this out
   prominently as needing extra scrutiny.
3. **Confirmed variants**, and any candidates considered but ruled out.
4. **Content structure**: icon, eyebrow, heading level, body size,
   link count.
5. **Responsive notes**: what differs across viewports (for CSS
   implementation).
6. **Placeholder link URLs**: remind the user to replace
   `https://www.adobe.com/` URLs.
7. **Fallback classifications**: elements where visual heuristics
   were used.
8. **`placeholders.json` text**: keys this block sources text from,
   whether Figma's copy matched the current sheet value, and any
   mismatches that may need a `/express/placeholders.json` update
   (not made by this skill — it's a shared sheet).
9. **Obstacles encountered**: Figma ambiguities, missing fixtures, or
   content requiring manual judgment.
10. **Local files**: paths to `/tmp/da-upload/` and
    `/tmp/figma-media/`, if not deleted.
