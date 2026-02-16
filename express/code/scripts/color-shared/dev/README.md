# dev — ticket-specific (not in main PR bundle)

This folder holds material scoped by ticket, not required by the current strips/palettes implementation but kept for reference or future variants.

## MWPW-185804 (gradients)

Gradient component. Files stay in their current paths (block uses them when `variant=gradients`). See **`MWPW-185804/README.md`** for the list of gradient files to exclude from the strips PR.

## MWPW-187682 (strips/palettes)

- **`MWPW-187682/createColorStrip.js`** — Vanilla strip and summary card. Palette strips use the `<color-palette>` WC only; this file is for non-palette variants when we add them. Do not import from here in the main block path.
- **`MWPW-187682/FIGMA_VARIANTS.md`** — Figma → code mapping (node IDs, L/M/S dimensions, REST values). Reference for implementing or updating `color-strip.css`; not loaded at runtime.
