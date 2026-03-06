# `<color-edit>`

A color editing panel with palette swatches, a color picker (via `<base-color>`), mode switching (RGB / HEX), and mobile bottom-sheet support.

## Properties

| Property | Attribute | Type | Default | Description |
|---|---|---|---|---|
| `palette` | — | `Array` | `[]` | Array of hex color strings (e.g. `['#FF0000', '#00FF00']`) |
| `selectedIndex` | `selected-index` | `Number` | `0` | Index of the currently selected palette color |
| `colorMode` | `color-mode` | `String` | `'RGB'` | Active color mode — `'RGB'` or `'HEX'` |
| `showPalette` | `show-palette` | `Boolean` | `true` | Whether to display the palette swatch row |
| `mobile` | `mobile` | `Boolean` | `false` | Renders as a draggable bottom sheet when `true` |
| `open` | `open` | `Boolean` | `false` | Controls bottom-sheet visibility (mobile only) |

## Events

| Event | Detail | Description |
|---|---|---|
| `color-change` | `{ hex, rgb, index, hue, saturation, brightness }` | Fired when the color is modified |
| `swatch-select` | `{ index }` | Fired when a palette swatch is clicked |
| `mode-change` | `{ mode }` | Fired when the color mode is switched |
| `panel-close` | — | Fired when the mobile bottom sheet is dismissed |

## Methods

| Method | Description |
|---|---|
| `show()` | Opens the bottom sheet (mobile) |
| `hide()` | Closes the bottom sheet and emits `panel-close` |

## Usage — Lit component

```js
import 'path/to/color-components/components/color-edit/index.js';
```

```html
<color-edit
  .palette=${['#FF0000', '#00FF00', '#0000FF']}
  selected-index="0"
  color-mode="RGB"
  @color-change=${(e) => console.log(e.detail)}
  @swatch-select=${(e) => console.log('selected', e.detail.index)}
></color-edit>
```

### Mobile bottom-sheet

```html
<color-edit
  mobile
  .palette=${['#FF0000', '#00FF00']}
  @panel-close=${() => console.log('closed')}
></color-edit>
```

Open / close programmatically via `el.show()` and `el.hide()`.

## Usage — Factory method

```js
import { createColorEditComponent } from 'path/to/color-shared/components/createColorEditComponent.js';

const editor = createColorEditComponent({
  palette: ['#FF0000', '#00FF00', '#0000FF'],
  selectedIndex: 0,
  colorMode: 'RGB',
  mobile: false,
  onColorChange: (detail) => console.log(detail),
  onSwatchSelect: (detail) => console.log('selected', detail.index),
  onModeChange: (detail) => console.log('mode', detail.mode),
  onClose: () => console.log('closed'),
});

document.body.appendChild(editor.element);
```

### Factory return object

| Member | Description |
|---|---|
| `element` | The wrapper DOM node to append |
| `show()` | Opens the bottom sheet |
| `hide()` | Closes the bottom sheet |
| `setPalette(colors)` | Updates the palette array |
| `setSelectedIndex(index)` | Changes the selected swatch |
| `setColorMode(mode)` | Switches to `'RGB'` or `'HEX'` |
| `getElement()` | Returns the underlying `<color-edit>` element |
| `destroy()` | Removes the component from the DOM |
