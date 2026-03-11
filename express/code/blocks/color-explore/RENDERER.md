# Renderer creation — Color Explore block

## Overview

This block supports two variants; each uses a **shared** renderer from `express/code/scripts/color-shared/renderers/`:

| Variant   | Renderer                 | Source |
|----------|--------------------------|--------|
| Gradients | `createGradientsRenderer` | `color-shared/renderers/createGradientsRenderer.js` |
| Palettes  | `createStripsRenderer`   | `color-shared/renderers/createStripsRenderer.js` |

## Steps to create / wire the renderer

1. **Resolve variant** from block (e.g. `.color-explore--gradients` or `.color-explore--palettes`).
2. **Get data**  
   - Gradients: mock or data service; set `BlockMediator` state for the variant.  
   - Palettes: `createColorDataService` → `fetchData()`.
3. **Create container** — one `div` with block container class; append to block.
4. **Instantiate renderer**  
   - Gradients: `createColorRenderer(config.variant, { container, data, config, dataService, modalManager, stateKey })` (factory in block).  
   - Palettes: `createStripsRenderer({ container, data, config })` from color-shared.
5. **Call** `renderer.render(container)` (or `await renderer.render()` for gradients).
6. **Subscribe to events** (e.g. `palette-click`, `item-click`, `search`, `filter`, `load-more`) and wire to modal and data updates.
7. **Store** `block.rendererInstance = renderer` (and modal/dataService if used).

## Contract

- **Gradients:** options include `container`, `data`, `config`, `dataService`, `modalManager`, `stateKey`. Exposes `render()`, `update()`, `on(event, cb)`.
- **Strips:** options include `container`, `data`, `config`. Exposes `render(container)`, `update(data)`, `on(EVENTS.PALETTE_CLICK | SEARCH | FILTER | LOAD_MORE, cb)`.

## Where the logic lives

- **Block:** `color-explore.js` — config parsing, variant detection, container creation, renderer choice, event wiring, modal open.
- **Shared:** `color-shared/renderers/createBaseRenderer.js`, `createStripsRenderer.js`, `createGradientsRenderer.js` — UI structure and events; no block-specific DOM.
