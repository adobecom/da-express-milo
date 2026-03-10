# `<color-channel-slider>`

A custom range slider with a gradient track, designed for color channel editing. Uses a native `<input type="range">` with full CSS control in shadow DOM. Renders a 24px-tall track with rounded ends, a dynamic gradient background, and a circular 14px-diameter handle.

## Properties

| Property | Attribute | Type | Default | Description |
|---|---|---|---|---|
| `value` | `value` | `Number` | `0` | Current slider value |
| `min` | `min` | `Number` | `0` | Minimum value |
| `max` | `max` | `Number` | `100` | Maximum value |
| `label` | `label` | `String` | `''` | Accessible label applied via `aria-label` |
| `gradient` | `gradient` | `String` | `''` | CSS gradient for the track background (e.g. `linear-gradient(to right, #000, #fff)`) |
| `disabled` | `disabled` | `Boolean` | `false` | Disables the slider and reduces opacity |

## Events

| Event | Detail | Description |
|---|---|---|
| `input` | `{ value }` | Fired on every input change with the current numeric value |

## Usage

```js
import 'path/to/color-components/components/color-channel-slider/index.js';
```

```html
<color-channel-slider
  .value=${50}
  min="0"
  max="100"
  label="Red"
  gradient="linear-gradient(to right, rgb(0,128,200), rgb(255,128,200))"
  @input=${(e) => console.log(e.detail.value)}
></color-channel-slider>
```

### Disabled state

```html
<color-channel-slider
  disabled
  .value=${50}
  gradient="linear-gradient(to right, #ccc, #999)"
></color-channel-slider>
```
