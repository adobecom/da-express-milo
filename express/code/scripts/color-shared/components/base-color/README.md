# `<base-color>`

A standalone color picker with a color area, hue slider, channel sliders, and support for multiple color modes (HEX, RGB, HSB, Lab). Includes a lock toggle and mobile bottom-sheet layout.

## Properties

| Property | Attribute | Type | Default | Description |
|---|---|---|---|---|
| `color` | `color` | `String` | `'#FF0000'` | Initial hex color value |
| `colorMode` | `color-mode` | `String` | `'HEX'` | Active color mode — `'HEX'`, `'RGB'`, `'HSB'`, or `'Lab'` |
| `showHeader` | `show-header` | `Boolean` | `true` | Whether to display the header row (title, mode dropdown, hex input, lock) |
| `showBrightnessControl` | `show-brightness-control` | `Boolean` | `true` | Whether to show the brightness slider |
| `mobile` | `mobile` | `Boolean` | `false` | Renders as a bottom sheet when `true` |
| `open` | `open` | `Boolean` | `false` | Controls bottom-sheet visibility (mobile only) |

## Events

| Event | Detail | Description |
|---|---|---|
| `color-change` | `{ hex, rgb, hsb, hsl, lab, hue, saturation, brightness }` | Fired when the color is modified |
| `mode-change` | `{ mode }` | Fired when the color mode is switched |
| `lock-change` | `{ locked }` | Fired when the lock state is toggled |
| `panel-close` | — | Fired when the mobile bottom sheet is dismissed |

## Methods

| Method | Description |
|---|---|
| `show()` | Opens the bottom sheet (mobile) |
| `hide()` | Closes the bottom sheet and emits `panel-close` |

## Usage — Lit component

```js
import 'path/to/color-components/components/base-color/index.js';
```

```html
<base-color
  color="#3B82F6"
  color-mode="HEX"
  @color-change=${(e) => console.log(e.detail)}
  @mode-change=${(e) => console.log('mode', e.detail.mode)}
  @lock-change=${(e) => console.log('locked', e.detail.locked)}
></base-color>
```

### Without header (embedded use)

When used inside another component like `<color-edit>`:

```html
<base-color
  color=${this._hex}
  color-mode=${this.colorMode}
  .showHeader=${false}
  .showBrightnessControl=${true}
  @color-change=${this._onBaseColorChange}
></base-color>
```

### Mobile bottom-sheet

```html
<base-color
  mobile
  color="#FF5733"
  @panel-close=${() => console.log('closed')}
></base-color>
```

Open / close programmatically via `el.show()` and `el.hide()`.

## Usage — Factory method

```js
import { createBaseColorComponent } from 'path/to/color-shared/components/createBaseColorComponent.js';

const picker = createBaseColorComponent({
  color: '#3B82F6',
  colorMode: 'HEX',
  showHeader: true,
  mobile: false,
  onColorChange: (detail) => console.log(detail),
  onModeChange: (detail) => console.log('mode', detail.mode),
  onClose: () => console.log('closed'),
});

document.body.appendChild(picker.element);
```

### Factory return object

| Member | Description |
|---|---|
| `element` | The wrapper DOM node to append |
| `show()` | Opens the bottom sheet |
| `hide()` | Closes the bottom sheet |
| `setColor(hex)` | Updates the color |
| `setColorMode(mode)` | Switches to `'HEX'`, `'RGB'`, `'HSB'`, or `'Lab'` |
| `setShowHeader(bool)` | Toggles the header row |
| `getElement()` | Returns the underlying `<base-color>` element |
| `destroy()` | Removes the component from the DOM |
