# Palette Variant Factory Wiki

## File
- `express/code/scripts/color-shared/palettes/createPaletteVariantFactory.js`

## Purpose
- Single factory for palette visual variants used by color surfaces.
- Produces DOM elements for summary/compact cards and swatch-rail variants.

## Public Exports
- `FIGMA_STRIP_NODES`
- `PALETTE_VARIANT`
- `createRailControllerFromPalette(palette)`
- `createPaletteVariant(palette, variant, options)`

## Variant Keys
- `summary`
- `compact`
- `simplified`
- `horizontal-container`

## Inputs
- `palette`: `{ id, name, colors }`
- `variant`: one of `PALETTE_VARIANT.*`
- `options`:
- `emit(eventName, payload)` for interactions (`palette-click`, `share`)
- `registry` with optional hooks:
- `pushStrip(strip)`
- `pushController(controller)`
- `pushAdapter(adapter)`
- `cardFocusable` (defaults to `true`)
- `swatchFeatures` (forwarded to swatch rail adapter)

## Output
- Returns `{ element }` where `element` is an `HTMLElement` ready for insertion.

## Behavior by Variant
- `summary` / `compact`:
- Uses `createPaletteStrip(...)` with strip variants.
- Wraps output in Spectrum theme via `wrapInTheme(..., { system: 'spectrum-two' })`.
- Adds edit/view actions and keyboard accessibility behavior.
- `simplified`:
- Creates a vertical swatch rail inside `.ax-color-strip--simplified`.
- `horizontal-container`:
- Creates a horizontal swatch rail inside `.ax-color-strip__cell--with-strip`.

## Rail Controller Contract
- `subscribe(cb)`:
- Immediately emits `{ swatches, baseColorIndex: 0 }`.
- Returns unsubscribe function.
- `updateFromPalette(palette)`:
- Rebuilds swatches from incoming colors and notifies subscribers.

## Notes
- Colors are normalized to hex with `#` prefix.
- Empty palette colors fallback to one placeholder swatch: `#e0e0e0`.
