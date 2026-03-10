# Adapters

This folder exposes adapter functions that wrap web components and shared UI modules behind a small common API.

## Exports

- `createSwatchRailAdapter(paletteOrController, options)`
- `createPaletteAdapter(paletteData, callbacks)`
- `createSearchAdapter(callbacks)`
- `createColorWheelAdapter(initialColor, callbacks)`
- `createGradientEditorAdapter(initialGradient, callbacks)`
- `createColorSwatchAdapter(color, callbacks)`
- `createColorEditAdapter(options, callbacks)`
- `createBaseColorAdapter(options, callbacks)`

## Adapter contract

Each adapter returns an object containing at least:

- `element`: root DOM element (or wrapper)
- `destroy()`: cleanup and remove DOM

Some adapters additionally expose:

- `update(data)`
- `setColor(color)`
- `setOrientation(orientation)`
- `setSwatchFeatures(features)`
- `show()` / `hide()`

## Swatch rail adapter

`createSwatchRailAdapter` accepts either:

- a palette object (`{ colors: [...] }`) and builds an internal controller, or
- an existing controller with `subscribe/getState/setState`.

Supported options:

- `orientation`: `horizontal | vertical | stacked | two-rows | four-rows | vertical-responsive`
- `variant`
- `hexCopyFirstRowOnly`
- `swatchFeatures`
- `swatchFeaturesByOrientation`

`vertical-responsive` resolves to `stacked` below `1200px` and `vertical` at/above `1200px`.

## Color edit adapter

`createColorEditAdapter(options, callbacks)` bridges `<color-edit>` events:

- options: `palette`, `selectedIndex`, `colorMode`, `showPalette`, `mobile`
- callbacks: `onColorChange`, `onSwatchSelect`, `onModeChange`, `onClose`

## Base color adapter

`createBaseColorAdapter(options, callbacks)` bridges `<base-color>` events:

- options: `color`, `colorMode`, `showHeader`, `showBrightnessControl`
- callbacks: `onColorChange`, `onModeChange`, `onLockChange`
