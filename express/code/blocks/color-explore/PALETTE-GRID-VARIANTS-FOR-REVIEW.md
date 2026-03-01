# Palette grid – variants for integration review (MWPW-185804 style)

**Emulates:** [MWPW-185804](https://jira.corp.adobe.com/browse/MWPW-185804) PR focus and layout (1440px container, 1360px content + 40px padding, 1/2/3 cols, 24px gap).

---

## PR focus (emulate MWPW-185804)

| Item | Value |
|------|--------|
| **Delivers** | Palette grid (Summary) for integration review; strip variants (Compact, Simplified, Horizontal) outside grid. Same layout as gradients: 1 col mobile, 2 col tablet (600px+), 3 col desktop (1200px+). |
| **Container** | Block: `max-width: 1440px`, `padding: 40px` → content width 1360px. Grids: `max-width: 1360px`, `gap: 24px`. Desktop column width ≈ (1360 − 48) / 3 ≈ 437.33px. |
| **Main files to review** | `color-explore.css` (grid + container tokens), `color-strip.css` (one-row strips, palette cards), `createStripsRenderer.js` (variant sections), `palettes.css` (variant section layout). |
| **Support / wiring** | `color-explore.js` (block, renderer choice), adapters — connect the experience; variant components are the deliverable. |

---

## 1. Palette grid (integration review)

| Item | Value |
|------|--------|
| **Section** | `data-variant="summary"` |
| **Title** | Summary (explore) |
| **Layout** | Same as gradients: 1 col mobile, 2 col tablet (600px+), 3 col desktop (1200px+). Max content 1360px, gap 24px. Desktop column ≈ (1360 − 2×24) / 3 ≈ 437.33px (MWPW-185804). |
| **DOM** | `.palette-variants-section[data-variant="summary"]` → `.palettes-grid` → `.color-card` (color-card + color-shared-palette-strip + color-palette WC). |
| **Figma** | Summary card: 5806-89102 (palette summary). |

This is the only section that receives the explore grid styling (`.color-explore--factory-variants .palette-variants-section[data-variant="summary"] .palettes-grid`).

---

## 2. Variants outside the palette grid

These sections are **outside** the palette grid; they are variant demos for review.

### Compact

| Item | Value |
|------|--------|
| **Section** | `data-variant="compact"` |
| **Title** | Compact |
| **DOM** | `.palette-variants-section[data-variant="compact"]` → `.palettes-grid` → compact cards (no explore grid layout). |
| **Figma** | Compact 48px strip variant. |

### Simplified (Figma 5639-129905)

| Item | Value |
|------|--------|
| **Section** | `data-variant="simplified"` |
| **Title** | Simplified (Figma 5639-129905) |
| **DOM** | `.palette-variants-section[data-variant="simplified"]` → `.palette-variants-simplified-wrap` (not `.palettes-grid`) → `.ax-color-strip.ax-color-strip--simplified` (vertical color-swatch-rail). |
| **Figma** | 5639-129905 (Simplified color strip – vertical strip container). |

### Color-strip-container horizontal (Figma 6215 / 6180)

| Item | Value |
|------|--------|
| **Section** | `data-variant="horizontal-container"` |
| **Title** | Color-strip-container horizontal (Figma 6215 / 6180) |
| **DOM** | `.palette-variants-section[data-variant="horizontal-container"]` → `.ax-color-strip-container.ax-color-strip-container--horizontal` → `.ax-color-strip__cell` (horizontal color-swatch-rail). |
| **Figma** | 6215-344297 (Color-strip-container), 6180 (strip spec). |

---

## Order on page (hardcoded)

1. **Palette grid** – Summary (explore)  
2. **Outside** – Compact  
3. **Outside** – Simplified (Figma 5639-129905)  
4. **Outside** – Color-strip-container horizontal (Figma 6215 / 6180)  

Defined in `createStripsRenderer.js` when `config.showAllPaletteVariants === true`. Grid styling in `color-explore.css` targets only `[data-variant="summary"] .palettes-grid`.

**One-row strips (L/M/S):** Same contract — `.color-explore--strips-one-row` uses `--explore-grid-gap` (24px), `--explore-content-max` (1360px), 3 cols at 1200px+ → each palette card ≈ 437.33px. Card min/max overridden so width comes from grid only (`color-strip.css`).
