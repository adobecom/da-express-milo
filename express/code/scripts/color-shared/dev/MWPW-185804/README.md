# MWPW-185804 — Gradient component (out of scope for strips PR)

Gradient work is tracked in **MWPW-185804**. The files below belong to this ticket and are **excluded from the strips/palettes PR** (MWPW-187682). Revert any changes to them for the strips PR; do not move them into this folder (the block still uses them when `variant=gradients`).

**Gradient renderers**
- `express/code/scripts/color-shared/renderers/gradients/gridVariant.js`
- `express/code/scripts/color-shared/renderers/gradients/extractVariant.js`
- `express/code/scripts/color-shared/renderers/gradients/modalVariant.js`

**Gradient components**
- `express/code/scripts/color-shared/components/gradients/gradient-card.css`
- `express/code/scripts/color-shared/components/gradients/gradient-modal-sizes.css`
- `express/code/scripts/color-shared/components/gradients/gradient-extract.css`
- `express/code/scripts/color-shared/components/gradients/createGradientCardElements.js`
- `express/code/scripts/color-shared/components/gradients/*.md`

**Other gradient-related**
- `express/code/scripts/color-shared/renderers/createExtractRenderer.js`
- `express/code/scripts/color-shared/renderers/createGradientsRenderer.js`
- `express/code/scripts/color-shared/utils/gradientFallback.js`

When working on the gradient ticket, edit these files in place. This folder is for reference only.
