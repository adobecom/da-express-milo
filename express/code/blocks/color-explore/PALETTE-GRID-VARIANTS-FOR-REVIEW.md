# Palette grid – strict rendering vs static for review (MWPW-185804 style)

**Naming:** Explore page variants = **Gradient** and **Palette Strips**. **Summary** = Figma [5806-89102](https://www.figma.com/design/mcJuQTxJdWsL0dMmqaecpn/Final-Color-Expansion-CCEX-221263?node-id=5806-89102) only (Palette summary card). Both look similar; only one Summary variant.

**Emulates:** [MWPW-185804](https://jira.corp.adobe.com/browse/MWPW-185804) separation of *in-review* (strict rendering from block) vs *demo/static for review* (hardcoded variant section).

---

## Separation overview

| Type | What | When shown |
|------|------|------------|
| **Normal rendering (integration)** | Strips L/M/S, Strip container, **Palette summary** (Figma 5806-89102), **Palette Strips** (explore grid). Palette Strips = color-card + color-shared-palette-strip grid. | Always. |
| **Static for review only** | Demo section: **Simplified**, **Horizontal** (Compact removed — variant needs work). | Always — below the integration content. |

**Rule:** Explore page = Gradient and **Palette Strips**. Summary is the one Figma 5806-89102 variant (Palette summary card).

---

## 1. Strict rendering from color-explore (palettes) — integration

Sections built and rendered by the block from data. The explore grid = **Palette Strips** (color-card + color-shared-palette-strip).

| Section | Description | Renderer |
|---------|-------------|----------|
| **Strips (L/M/S)** | One row, three palette cards (Size L, M, S). Grid: 1/2/3 cols, 24px gap, 1360px max. | `createStripsRenderer` with `simpleSizeVariants: true`. |
| **Strip container** | Vertical or horizontal strip container (Figma 6215). | `createStripContainerRenderer`. |
| **Palette summary** | Summary (Figma 5806-89102): ax-color-strip-summary-card with title, count, strip. | `createPaletteSummaryRenderer`. |
| **Palette Strips** | Explore grid: color-card + color-shared-palette-strip. 1/2/3 col grid. | `createStripsRenderer` with `renderGridVariant: 'summary'`. |

**Layout:** 1440px max container, 40px padding, 1360px content. Grid: 1 col mobile, 2 col tablet (600px+), 3 col desktop (1200px+). Desktop column ≈ 437.33px.

**Files (strict rendering — focus for review):**

- `express/code/blocks/color-explore/color-explore.js` — builds sections; Palette Strips = explore grid; Demo = Simplified, Horizontal (Compact removed).
- `express/code/blocks/color-explore/color-explore.css` — container tokens, grid for strips/gradients and `.color-explore--palette-grid .palettes-grid`.
- `express/code/scripts/color-shared/components/strips/color-strip.css` — one-row strips, palette cards, layout.
- `express/code/scripts/color-shared/renderers/createStripsRenderer.js` — `showDemoVariants: true` (demo = Strips L/M/S, Palette summary, Strip container, Simplified, Horizontal; no Compact).
- `express/code/scripts/color-shared/renderers/createStripContainerRenderer.js`, `createPaletteSummaryRenderer.js` — strip container and Summary (5806-89102).
- `express/code/scripts/color-shared/palettes/palettes.css` — palette variant section layout.

---

## 2. Static (variants solo) for review only

Demo section — **Simplified**, **Horizontal** (Compact removed from demo; variant needs work, not matching anything yet).

| Section | Description |
|---------|-------------|
| **Demo (Simplified, Horizontal)** | Strips L/M/S, Palette summary, Strip container, Simplified (Figma 5639-129905), Color-strip-container horizontal (Figma 6215/6180). No Compact. |

Simplified and Horizontal are for design/QA review only.

**Page order:** Normal rendering (Strips, Strip container, Palette summary, **Palette Strips** grid) first, then Demo (Simplified, Horizontal — Compact removed).

---

## PR-style file list (like MWPW-185804 PR-FILES-BOTH-TYPES)

### ========== STRICT RENDERING (focus here) — block + shared renderers/CSS ==========

express/code/blocks/color-explore/color-explore.js
express/code/blocks/color-explore/color-explore.css
express/code/blocks/color-explore/helpers/constants.js
express/code/blocks/color-explore/helpers/parseConfig.js
express/code/scripts/color-shared/components/strips/color-strip.css
express/code/scripts/color-shared/renderers/createStripsRenderer.js
express/code/scripts/color-shared/renderers/createStripContainerRenderer.js
express/code/scripts/color-shared/renderers/createPaletteSummaryRenderer.js
express/code/scripts/color-shared/palettes/palettes.css

### ========== STATIC (VARIANTS SOLO) FOR REVIEW — always on page ==========

Demo uses `createStripsRenderer.js` with `showDemoVariants: true`. Contains Strips L/M/S, Palette summary, Strip container, Simplified, Horizontal. Compact removed (variant needs work).

---

## One-row strips (L/M/S) — strict rendering

- Class: `color-explore--strips-one-row`.
- Grid: `--explore-grid-gap` (24px), `--explore-content-max` (1360px), 3 cols at 1200px+ → card width ≈ 437.33px.
- Card dimensions: L 116px height, M/S 88px; `min-width: 437px` desktop. See `color-strip.css`.
