# Color-Shared Adapters

Thin wrappers around Lit-based color components. Each adapter lazily imports its component, creates the DOM element, wires up event listeners, and returns a control object with `element` and helper methods.

---

## `createSwatchRailAdapter(paletteOrController, options)`

Adapter for `<color-swatch-rail>`. Used by strips/swatches flows to render palette rails with shared behavior.

### Input

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `paletteOrController` | `object` | required | Palette data (`{ colors: string[] }`) or a controller with `subscribe/getState/setState`. |
| `options.orientation` | `string` | `'vertical'` | Orientation: `horizontal`, `vertical`, `stacked`, `two-rows`, `four-rows`, `vertical-responsive`. |
| `options.variant` | `string` | `undefined` | Optional variant marker set as `data-variant`. |
| `options.verticalMaxPerRow` | `number` | `5` | Max columns per row for vertical wrapping. |
| `options.hexCopyFirstRowOnly` | `boolean` | `false` | In four-rows variants, limits editable/copyable hex controls to first row. |
| `options.swatchFeatures` | `object\|string[]\|'all'` | `undefined` | Feature set passed to the rail. |
| `options.swatchFeaturesByOrientation` | `object` | `undefined` | Orientation keyed feature overrides. |
| `options.hoverOnlyActions` | `string[]\|string` | `undefined` | Feature-name map for hover-only top-right actions. Supported keys: `drag`, `lock`, `editTint`, `trash`. |
| `options.hoverOnlyActionCount` | `number` | `0` | Fallback count mode for hover-only actions when `hoverOnlyActions` is not set. |

### Returns

```js
{
  element: HTMLElement, // themed wrapper
  rail: HTMLElement,    // color-swatch-rail element
  destroy: () => void,
  setOrientation: (orientation: string) => void,
  setSwatchFeatures: (features: object | string[] | 'all') => void,
  // Present only when input was palette data:
  controller?: object,
  update?: (newPaletteData: object) => void,
}
```

---

## `createColorEditAdapter(options, callbacks)`

Adapter for `<color-edit>`. Use from strips, color wheel, contrast checker, or modal content. Loads the Lit component and returns a wrapper with the element and API.

### Options

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `palette` | `string[]` | `[]` | Hex color array (up to 10 per Figma). |
| `selectedIndex` | `number` | `0` | Selected palette index. |
| `colorMode` | `string` | `'RGB'` | `'RGB'` \| `'HEX'`. |
| `showPalette` | `boolean` | `true` | Whether to show the palette row. |
| `mobile` | `boolean` | `false` | When true, renders as bottom sheet. |

### Callbacks

| Name | Signature | Description |
|------|-----------|-------------|
| `onColorChange` | `(detail) => void` | Fired on color change. |
| `onSwatchSelect` | `(detail) => void` | Fired when a swatch is selected. |
| `onModeChange` | `(detail) => void` | Fired when color mode changes. |
| `onClose` | `() => void` | Fired on panel close. |

### Returns

```js
{
  element: HTMLElement,
  show: () => void,
  hide: () => void,
  setPalette: (colors: string[]) => void,
  setSelectedIndex: (n: number) => void,
  setColorMode: (mode: string) => void,
  getElement: () => HTMLElement,
  destroy: () => void,
}
```

---

## `createColorConflictsAdapter(options)`

Adapter for `<color-conflicts>`. Displays a badge indicating whether color-blind conflicts exist for the current palette.

### Options

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `conflictsFound` | `boolean` | `false` | Whether conflicts were detected. |
| `label` | `string` | `'Potential color blind conflicts'` | Label text. |

### Returns

```js
{
  element: HTMLElement,
  setConflicts: (found: boolean) => void,
  setLabel: (text: string) => void,
  getElement: () => HTMLElement,
  destroy: () => void,
}
```

---

## `createBaseColorAdapter(options, callbacks)`

Adapter for `<base-color>`. Use when only the color picker (no palette) is needed.

### Options

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `color` | `string` | `'#FF0000'` | Initial hex color. |
| `colorMode` | `string` | `'HEX'` | `'HEX'` \| `'RGB'` \| `'HSB'` \| `'Lab'`. |
| `showHeader` | `boolean` | `true` | Show header row. |
| `showBrightnessControl` | `boolean` | `true` | Show brightness slider. |

### Callbacks

| Name | Signature | Description |
|------|-----------|-------------|
| `onColorChange` | `(detail) => void` | Fired on color change. |
| `onModeChange` | `(detail) => void` | Fired when color mode changes. |
| `onLockChange` | `(detail) => void` | Fired when lock state changes. |

### Returns

```js
{
  element: HTMLElement,
  setColor: (hex: string) => void,
  setColorMode: (mode: string) => void,
  getElement: () => HTMLElement,
  destroy: () => void,
}
```
