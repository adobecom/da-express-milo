---
name: build-content-from-figma
description: >
  Extracts content from Figma designs and produces an authored HTML
  document following the Express EDS block authoring pattern. Downloads
  Figma assets locally, then uploads images and HTML directly to the DA
  admin API. Handles text, media, and icons.
---

# Build Content from Figma Skill

You are creating an authored HTML document for an **Adobe Express** block
by extracting content from Figma designs. The document follows the
standard EDS block authoring pattern and is uploaded to **DA** (Document
Authoring) for publishing via Adobe EDS.

> **Critical rules**
>
> - Assets are downloaded from Figma locally, then uploaded directly
>   to the DA admin API via `curl POST` to
>   `admin.da.live/source/...` with multipart form data.
> - Block content is authored as a `<table>` (see
>   `references/authoring-pattern.md`).
> - **Never embed images as base64 in DA HTML.**
> - The HTML references assets using their **final
>   `content.da.live` URLs** (computed from the DA destination and
>   the shadow folder convention). Since we upload assets ourselves,
>   we know the exact paths upfront.
> - Express blocks handle responsive layout purely in CSS — the
>   authored HTML contains a **single set of content** (no
>   `mobile-viewport`/`desktop-viewport` keyword rows). Viewport
>   differences noted from Figma are handed to the block developer
>   as CSS reference, not authored separately.
> - Link URLs use `https://www.adobe.com/` as a placeholder.
>   Link display text must match Figma.
> - Heading levels and body sizes are determined by visual heuristics
>   (font size, weight, position) since Express Figma designs do not
>   use `--s2a-typography-*` tokens.

## Bundled resources

Do **not** load these upfront. Each phase tells you which file to
read when it becomes relevant.

### references/
| File | Purpose |
|------|---------|
| `authoring-pattern.md` | HTML structure for DA block authoring: document skeleton, content rows, media placement, complete examples. |
| `token-mapping.md` | Visual heuristics for classifying Figma text elements (heading level, body size, eyebrow, CTA style). |

### agents/
| File | Purpose |
|------|---------|
| `figma-content-extractor.md` | Extracts structured content (text, media) from a Figma frame. |

---

## Inputs

Collect all inputs before starting extraction work.

| Input | Required | Example |
|---|---|---|
| **Figma URL(s)** | At least one | One URL per viewport you want as reference |
| **DA destination** (org, repo, path) | Yes | `adobecom / da-express-milo / drafts/methomas/my-page.html` |

If multiple Figma URLs are provided, ask which viewport each represents
(mobile / tablet / desktop) — these are for extraction reference only,
not for authoring separate viewport sections.

---

## Phase 1 — Gather requirements

### 1a. Collect Figma frames

Ask the user for Figma frame URL(s). At minimum one frame is required.

### 1b. Confirm block name (BLOCKING)

For each Figma URL, use **Figma MCP** `get_metadata` to inspect
the frame name. Look for a recognizable block name in the frame
label or parent component name (e.g. `ax-marquee`, `banner`, `cards`,
`collapsible-card`).

Present the suggested name and ask the user to confirm or provide
an alternative. This name becomes the class on the block's outer `<div>`.

> **STOP**: Do NOT proceed to Phase 2 until the user explicitly
> confirms the block name.

### 1c. Collect DA destination

Ask for:
- **Organization** (e.g. `adobecom`)
- **Repository** (e.g. `da-express-milo`)
- **File path** (e.g. `drafts/methomas/my-page.html`)

The media folder is derived automatically in Phase 4c using the
dot-prefixed shadow folder convention.

### 1d. Confirm before proceeding

```
Block name:    <name>
Figma frames:  <N> provided
DA target:     <org>/<repo>/<path>
Media folder:  <org>/<repo>/<parent-path>/.<page-name>/
```

Wait for user confirmation.

---

## Phase 2 — Extract content from Figma

**Load `references/token-mapping.md` now.**

For each provided Figma frame, **load `agents/figma-content-extractor.md`**
and follow its procedure.

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

---

## Phase 3 — Note responsive differences

If multiple Figma frames were provided, compare them and compile a
brief summary of what changes across viewports. This is **reference
only** for the block developer to implement in CSS — it does not
affect the authored HTML structure.

```
Responsive notes (for CSS implementation):
  Typography:   heading font-size larger at desktop
  Layout:       mobile stacked → desktop side-by-side
  Background:   solid at mobile, gradient at desktop
  Foreground:   hidden at mobile, visible at ≥ 600px
```

Use the **desktop** (or widest available) frame as the primary source
for the authored content. Use the mobile frame to note what differs.

---

## Phase 4 — Download and prepare media

Collect all Figma asset URLs from Phase 2 and download them locally.

> **Critical constraints**
>
> - **No compression, no resizing, no Python scripts.** DA and EDS
>   handle image optimization.
> - **Never read image data into context.** Do not use the Read
>   tool on image files. Do not `cat` them. Do not print base64
>   output to inspect it.

### 4a. Collect asset URLs

From the Phase 2 extraction output, collect every Figma asset URL:
- Icon asset URLs
- Background image asset URLs
- Foreground image asset URLs
- Any additional media asset URLs

Deduplicate: if the same asset appears in multiple frames, include it only once.

### 4b. Download assets locally

Download each Figma asset to a local folder with descriptive filenames:

```bash
mkdir -p /tmp/figma-media/<page-name>
curl -sL "<figma-asset-url>" -o /tmp/figma-media/<page-name>/<filename>
```

After downloading, verify the file type:
```bash
file /tmp/figma-media/<page-name>/<filename>
```

Common types from Figma:
- `SVG Scalable Vector Graphics image` → `.svg`
- `PNG image data` → `.png`
- `JPEG image data` → `.jpg`

#### SVG icons

Icons in Figma are often multi-layer (background + symbol). Export the
composite SVG via the Figma Plugin API:

```javascript
// use_figma: Export icon node as composite SVG
const node = await figma.getNodeByIdAsync('<icon-node-id>');
const svgBytes = await node.exportAsync({ format: 'SVG' });
const svgString = String.fromCharCode(...svgBytes);
return svgString;
```

Save the returned SVG to a local `.svg` file. Then:

1. Upload the SVG to the **same directory as the document** via
   `POST admin.da.live/source/<org>/<repo>/<parent-path>/<icon-name>.svg`.
2. **Preview** it via
   `POST admin.hlx.page/preview/<org>/<repo>/main/<parent-path>/<icon-name>.svg`.
3. Use the resulting **`aem.page` preview URL** in the HTML as both
   the `href` and the display text of the icon `<a>` tag.

### 4c. Compute DA asset paths

Use the **dot-prefixed shadow folder** convention:

```
https://content.da.live/<org>/<repo>/<parent-path>/.<page-name>/<filename>
```

Example: page at `drafts/methomas/my-block.html` stores media at:
```
https://content.da.live/adobecom/da-express-milo/drafts/methomas/.my-block/bg.png
```

These URLs go directly into the HTML in Phase 5.

### 4d. Color backgrounds

Solid colors, gradients, and semi-transparent values are plain text in
the media column — no download needed:
- `#1a1a1a`
- `linear-gradient(135deg, #1a1a1a, #2d2d2d)`
- `rgb(255 255 255 / 0)`

---

## Phase 5 — Build HTML document

**Load `references/authoring-pattern.md` now.**

### Document skeleton

```html
<body>
  <header></header>
  <main>
    <div>
      <table>
        <tbody>
          <tr><td colspan="2"><p>block-name (variant1, variant2)</p></td></tr>
          <!-- content rows -->
        </tbody>
      </table>
    </div>
  </main>
  <footer></footer>
</body>
```

No metadata block needed. No `section-metadata` block needed unless
the user specifically requests one.

### Assembly rules

The header row is followed directly by the content row(s). There are
**no viewport keyword rows** — Express blocks are single-content with
CSS-driven responsive behaviour.

**Left column text cell**:
1. Icon (SVG): `<p><a href="<aem.page-url>"><aem.page-url></a></p>` (if present)
2. Eyebrow: `<p>eyebrow text</p>` (if present)
3. Heading: `<hN>text</hN>` where N is from the token mapping heuristic
4. Body: `<p>text</p>`
5. Links:
   - Primary CTA: `<strong><a href="https://www.adobe.com/">text</a></strong>`
   - Secondary CTA: `<em><a href="https://www.adobe.com/">text</a></em>`
   - Plain link: `<a href="https://www.adobe.com/">text</a>`

**Right column media cells** (background first, foreground second):
- Color: `<td>#1a1a1a</td>`
- Image: `<td><picture><img src="<content.da.live-url>" alt="..."></picture></td>`

The left `<td>` uses `rowspan="N"` when there are multiple media sub-rows.

### Save HTML to disk

```
/tmp/da-upload/<da-path>/<page-name>.html
```

### Present HTML for review

Show the constructed HTML to the user and ask for confirmation before uploading.

---

## Phase 6 — Upload to DA

```bash
TOKEN=$(da-auth-helper token 2>/dev/null)
```

### 6a. Ask the user

```
DA upload:
  HTML:    /tmp/da-upload/<da-path>/<page-name>.html
  Assets:  <N> images in /tmp/figma-media/<page-name>/
  Target:  <org>/<repo>

Ready to upload?
```

### 6b. Check token

```bash
da-auth-helper token >/dev/null 2>&1 && echo "Token OK" || echo "No token"
```

If the command fails, instruct the user to:
1. Install: `npm install -g github:adobe-rnd/da-auth-helper`
2. Log in: `da-auth-helper login` (opens browser for Adobe IMS; choose the **Skyline** profile)
3. Verify: `da-auth-helper token`

### 6c. Upload images

```bash
curl -s -w "\n%{http_code}" -X POST \
  "https://admin.da.live/source/<org>/<repo>/<parent-path>/.<page-name>/<filename>" \
  -H "Authorization: Bearer $TOKEN" \
  -F "data=@/tmp/figma-media/<page-name>/<filename>;type=<mime-type>"
```

Expect **201 Created**. Run uploads in parallel.

### 6d. Upload HTML

```bash
curl -s -w "\n%{http_code}" -X POST \
  "https://admin.da.live/source/<org>/<repo>/<da-path>/<page-name>.html" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: text/html" \
  --data-binary @/tmp/da-upload/<da-path>/<page-name>.html
```

Expect **200** or **201**.

### 6e. Verify images

```bash
curl -s -o /dev/null -w "%{http_code}" \
  "https://content.da.live/<org>/<repo>/<parent-path>/.<page-name>/<filename>" \
  -H "Authorization: Bearer $TOKEN"
```

### 6f. Handle result

**On success:** `https://da.live/edit#/<org>/<repo>/<da-path>/<page-name>`

**On failure:**
- 401 → token expired: `da-auth-helper login` (Skyline profile)
- 403 → check org/repo permissions
- Images 404 → verify the POST returned 201 and path matches HTML reference

---

## Phase 7 — Preview & Publish

### 7a. Ask user

```
Document uploaded. Would you like to preview and publish? (y/n)
```

If no, skip to Phase 8.

### 7b. Path safety check (BLOCKING)

**Path contains `/drafts/`:** safe to proceed.

**Path does NOT contain `/drafts/`:** present this warning:

```
⚠️  You're about to publish a document on production.
Are you sure you want to proceed? (y/n)
```

> **STOP**: Do NOT call the preview or publish APIs without passing this check.

### 7c. Preview

```bash
curl -s -w "\n%{http_code}" -X POST \
  "https://admin.hlx.page/preview/<org>/<repo>/main/<da-path>/<page-name>" \
  -H "Authorization: Bearer $TOKEN"
```

Report: `Preview: https://main--<repo>--<org>.aem.page/<da-path>/<page-name>`

### 7d. Publish

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

## Phase 8 — Cleanup

```
Upload complete. Delete /tmp/da-upload/ and /tmp/figma-media/ ? (y/n)
```

---

## Phase 9 — Summary

1. **Block name** and DA file path.
2. **Content structure**: icon, eyebrow, heading level, body size, link count.
3. **Responsive notes**: what differs across viewports (for CSS implementation).
4. **Placeholder links**: remind the user to replace `https://www.adobe.com/` URLs.
5. **Fallback classifications**: elements where visual heuristics were used.
6. **Obstacles encountered**: Figma ambiguities or content requiring manual judgment.
7. **Local files**: paths to `/tmp/da-upload/` and `/tmp/figma-media/`, if not deleted.
