# Renderer creation — Color Explore block

## Overview

This block supports two top-level variants (`gradients`, `palettes`) and multiple palette render modes:

| Variant / Mode | Renderer | Source |
|---|---|---|
| Gradients | `createColorRenderer(...)` | `blocks/color-explore/factory/createColorRenderer.js` |
| Palettes (default cards/strips) | `createStripsRenderer(...)` | `scripts/color-shared/renderers/createStripsRenderer.js` |
| Palettes (swatches mode) | `createSwatchesRenderer(...)` | `scripts/color-shared/renderers/createSwatchesRenderer.js` |
| Swatches demo: color-blindness matrix | `createStripContainerRenderer(...)` | `scripts/color-shared/renderers/createStripContainerRenderer.js` |

## Steps to create / wire the renderer

1. **Resolve variant** from block (e.g. `.color-explore--gradients` or `.color-explore--palettes`).
2. **Get data**  
   - Gradients: mock or data service; set `BlockMediator` state for the variant.  
   - Palettes: `createColorDataService` → `fetchData()`.
3. **Create container** — one `div` with block container class; append to block.
4. **Instantiate renderer**  
   - Gradients: `createColorRenderer(config.variant, { container, data, config, dataService, modalManager, stateKey })`
   - Palettes default: `createStripsRenderer({ container, data, config })`
   - Palettes swatches mode (`swatchesOnly` / `contentMode='swatches'` / `renderMode='swatches'`): `createSwatchesRenderer({ container, data, config })`
5. **Call** `renderer.render(container)` (or `await renderer.render()` for gradients).
6. **Subscribe to events** (e.g. `palette-click`, `item-click`, `search`, `filter`, `load-more`) and wire to modal and data updates.
7. **Store** `block.rendererInstance = renderer` (and modal/dataService if used).

## Contract

- **Gradients:** options include `container`, `data`, `config`, `dataService`, `modalManager`, `stateKey`. Exposes `render()`, `update()`, `on(event, cb)`.
- **Strips:** options include `container`, `data`, `config`. Exposes `render(container)`, `update(data)`, `on(EVENTS.PALETTE_CLICK | SEARCH | FILTER | LOAD_MORE, cb)`.
- **Swatches:** options include `container`, `data`, `config`. Exposes `render(container)`, `update(data)`, `destroy()`.

## Swatches Demo Contract + API

`createPalettesReviewDemo(container, data, config)` renders demo-only variants:

- `stacked`
- `vertical`
- `vertical-10` (`swatchOrientation='vertical'`, `swatchVerticalMaxPerRow=10`)
- `two-rows`
- `color-blindness` (four-rows matrix path)

Renderer mapping in demo:

- `stacked`, `vertical`, `vertical-10`, `two-rows` -> `createSwatchesRenderer`
- `color-blindness` -> `createStripContainerRenderer` with:
  - `colorBlindness: true`
  - `stripContainerOrientations: ['four-rows']`

Swatches config keys used by demo:

- `swatchOrientation: 'stacked' | 'vertical' | 'two-rows'`
- `swatchVerticalMaxPerRow: number` (clamped to `1..10`)
- `swatchFeatures: object` (example demo uses `{ drag: true, trash: true }` on stacked)
- `colorBlindness: boolean` (color-blindness matrix mode)
- `stripContainerOrientations: ['four-rows']` (color-blindness matrix)

## Shared CSS Loading

`color-explore.css` imports shared strip styles:

- `/express/code/scripts/color-shared/components/strips/color-strip.css`

In addition, `color-explore.js` calls `loadStripSharedStyles()` to ensure that shared strip styles are available when swatch/strip renderers are used.

## Block Init Helpers

`color-explore.js` includes `loadStripSharedStyles()`:
  - Loads each URL in `STRIP_SHARED_STYLES` via `loadCSS()`
  - Logs non-fatal failures to LANA and continues

## Where the logic lives

- **Block:** `color-explore.js` — config parsing, variant detection, container creation, renderer choice, event wiring, modal open.
- **Shared:** `color-shared/renderers/createBaseRenderer.js`, `createStripsRenderer.js`, `createSwatchesRenderer.js`, `createStripContainerRenderer.js`, `createGradientsRenderer.js` — UI structure and events; no block-specific DOM.
