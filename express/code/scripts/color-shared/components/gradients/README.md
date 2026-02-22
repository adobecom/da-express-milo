# Gradients — shared components (contracts + API)

Single doc for consumers: contracts, API, and usage. No other .md in this folder.

---

## Principle

Shared components have a **contract** and an **API**. That is all we care about.

- **No association or context to any consumer.** The shared layer does not know or care who uses it. Consumers call the API and use the returned DOM however they need; the shared code is consumer-agnostic.
- **Contract:** Structure, dimensions, and behavior of the component (defined in CSS and, where relevant, Figma). Consumers may place the component in layout (grid, container); they do not override the contract.
- **API:** Inputs (e.g. gradient data, callbacks) and outputs (e.g. DOM elements).

**Dimensions** are defined by the contract (breakpoints). Callers get elements that follow the contract; the contract’s CSS handles responsive behavior.

---

## Card API (batch)

**`createGradientCardElements(gradients, options)` → `HTMLElement[]`**

Single batch call: pass the full list and options; get back card elements. Do not call a "create one card" in a loop.

| Parameter   | Type       | Description |
|------------|------------|--------------|
| `gradients`| `Object[]` | Array of `{ id, name, gradient }` (gradient = CSS string) or `{ id, name, colorStops, angle }`. |
| `options`  | `Object`   | See options table below. |

**Options**

| Option          | Type       | Default | Description |
|-----------------|------------|---------|-------------|
| `onExpandClick` | `Function` | —       | Callback when expand icon is clicked. Receives `(gradient)`. Parent owns behavior (open modal, navigate, analytics). |
| `iconSrc`       | `string`   | open-in-20-n.svg | Optional URL for action icon. Defaults to cacheable asset. |
| `size`          | `'l' \| 'm' \| 's'` | `'l'` | Size variant (Large / Medium / Small). Drives dimensions and typography. |

**Returns:** Array of card DOM elements. Caller appends them (e.g. `container.append(...elements)`).

**Contract:** `gradient-card-grid.css` — `.gradient-card`, bar + info row; dimensions and gap at breakpoints (e.g. 300px min, 50px bar).

**Usage**

```js
import { createGradientCardElements } from '…/gradients/createGradientCardElements.js';

const elements = createGradientCardElements(gradients, {
  size: 'l',
  onExpandClick: (gradient) => { /* open modal, etc. */ },
});
grid.append(...elements);
```

---

## Section API (bar only)

**`createGradientSection(gradient, options)` → `HTMLElement`**

One DOM element: a gradient bar, with optional color-stop circles when `showStops: true`. Caller appends it wherever needed (e.g. detail view, modal row).

| Parameter  | Type       | Description |
|------------|------------|-------------|
| `gradient` | `string` or `Object` | **CSS string** (e.g. `'linear-gradient(90deg, #a 0%, #b 100%)'`) or **structured** `{ type?, angle?, colorStops }`. `type`: `'linear' \| 'radial' \| 'conic'`. `position`: 0–1. |
| `options`  | `Object`   | `ariaLabel` — accessible label. `showStops` — when `true`, overlays circles at each color stop. `size` — `'s' \| 'm' \| 'l'` for bar dimensions. |

**Contract:** `gradient-section.css` — bar dimensions at breakpoints. DOM: `div.ax-color-gradient-section.ax-color-gradient-section--{size}` with `div.ax-color-gradient-section-bar`.

**Note:** Card API accepts CSS gradient strings. Section API accepts CSS string or structured object. Do not mix: section expects structured when you need type/angle/colorStops.

---

## Detail section API

**`createGradientDetailSection(gradient, options)` → `HTMLElement`**

Taller bar + circles for detail views. Same gradient input and options pattern as Section API. Contract: `gradient-detail-section.css`.

---

## Contract files

| File | Contract |
|------|----------|
| `gradient-card-grid.css` | Card: `.gradient-card`, bar + info row; dimensions and gap at breakpoints, 50px bar. |
| `gradient-card.css` | Card (ax-color-*): bar proportion, info row; dimensions at breakpoints. |
| `gradient-section.css` | Bar only: dimensions at breakpoints (size variants). |
| `gradient-detail-section.css` | Detail: taller bar + circles; dimensions at breakpoints. |
| `gradient-modal-sizes.css` | Modal row dimensions at breakpoints. |
| `gradient-extract.css` | Strip dimensions at breakpoints. |

---

## For consumers

- **Layout:** The block/page owns grid, columns, gaps, wrapping at breakpoints. The component owns card/bar dimensions per contract.
- **Expand behavior:** Use `onExpandClick` callback; parent decides what happens (modal, navigation, etc.).
- **One batch call** for cards; one place for options. Keeps callers simple and allows future optimizations (fragment, virtualization) without changing consumers.
