# Figma Content Extractor Subagent

Delegated from Phase 2 of the main SKILL.md. Extracts structured
content from a single Figma frame.

---

## Inputs

- **Figma frame URL** (fileKey and nodeId)
- **Viewport label** (mobile, tablet, or desktop — for reference only)

---

## Extraction procedure

### Step 1 — Get design context

Use Figma MCP `get_design_context` with the provided fileKey and nodeId.
Also use `get_screenshot` to capture a visual reference.

### Step 2 — Identify and classify text elements

Scan the design context for all text elements. For each, determine:

1. **Content**: the visible text string.
2. **Typography token or text style**: inspect the design context for
   bound SOT or S2A typography variables, CSS variable references, and
   text-style names. Follow `references/token-mapping.md` to classify
   headings, body sizes, and eyebrows. If the context omits variable names,
   use Figma MCP `get_variable_defs` when available. Record the source
   token/style alongside the classification.
3. **Position**: vertical position within the frame determines order
   (top to bottom).

Classify each text element as:

- **Eyebrow**: an eyebrow token or text style, such as
  `--s2a-typography-font-size-eyebrow`.
- **Heading**: a title token or text style. Use the token-mapping reference
  to determine the heading level.
- **Body**: a body token or text style. Record its size for the block
  developer; do not add a body-size class to the authored content.
- **Link / CTA**: text inside button-shaped elements or underlined
  interactive text. Record display text and CTA style:
  - **Primary** (filled button) → `<strong><a>`
  - **Secondary** (outline button) → `<em><a>`
  - **Plain** (text link) → bare `<a>`

For missing, ambiguous, or unrecognized tokens/styles, use the visual
fallbacks in `references/token-mapping.md` and document the classification.

### Step 3 — Identify media elements

- **Icons**: small graphic ≤ 48px, typically above or beside the eyebrow/heading.
  Look for containers with `data-node-id` wrapping multiple layers or SVG.
  Record the **parent icon node ID** — do not use individual child layer URLs.
  Phase 4 exports the composite SVG via `use_figma` + `exportAsync`.

- **Background**: the largest visual behind the content.
  - Color: extract the CSS color string (hex, rgb, gradient).
  - Image: record the Figma asset URL and node ID.

- **Foreground**: image layered in front of the background (product shot,
  illustration). Record asset URL and node ID.

- **Additional media**: any other image elements. Record each.

> **Do not download or base64-encode images.** Only capture Figma asset
> URLs and node IDs. Phase 4 handles all media transfers.

### Step 4 — Compile output

```
Viewport: <label>

Icon:
  present: true/false
  node_id: <parent icon node id>
  name: <icon component name>
  alt_text: <description>

Eyebrow:
  present: true/false
  text: "<text>"
  typography_token_or_style: "<source name, if available>"

Heading:
  text: "<text>"
  typography_token_or_style: "<source name, if available>"
  approx_font_size: <px>
  weight: bold/regular
  inferred_level: <1-4>
  has_bold_formatting: true/false

Body:
  text: "<text>"
  typography_token_or_style: "<source name, if available>"
  approx_font_size: <px>
  inferred_body_size: <large|medium|small|extra-small, for developer handoff only>

Links:
  count: <N>
  items:
    - text: "<text>", style: primary|secondary|plain

Background:
  type: color | image
  value: "<css color string>" (if color)
  asset_url: <figma asset url> (if image)
  node_id: <figma node id> (if image)
  alt_text: <description> (if image)

Foreground:
  present: true/false
  asset_url: <figma asset url>
  node_id: <figma node id>
  alt_text: <description>

Additional_media:
  items: []

Fallback_classifications:
  - "<element>: <reason heuristic was used>"

Implementation_notes:
  - "<unsupported text size or conflicting token/style classification>"
```

---

## Error handling

- If `get_design_context` omits token/style information and variable
  definitions are unavailable, rely on `get_screenshot` and visual
  heuristics. Document which elements required it.
- If a media element cannot be captured, flag it for manual handling.
- For complex frames, focus on top-level content elements visible
  to the end user.
