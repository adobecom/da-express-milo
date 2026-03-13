# Color-Shared Adapters

Thin wrappers around Lit-based color components. Each adapter lazily imports its component, creates the DOM element, wires up event listeners, and returns a control object with `element` and helper methods.

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
