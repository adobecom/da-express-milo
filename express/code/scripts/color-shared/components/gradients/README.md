# Gradients — shared components (contracts + API)

Single doc for consumers: contracts, API, and usage. No other .md in this folder.

---

## Principle

Shared components have a **contract** and an **API**. That is all we care about.

- **No association or context to any consumer.** The shared layer does not know or care who uses it. Consumers call the API and use the returned DOM however they need; the shared code is consumer-agnostic.
- **Contract:** Structure, dimensions, and behavior of the component (defined in CSS and, where relevant, Figma). Consumers may place the component in layout (grid, container); they do not override the contract.
- **API:** Inputs (e.g. gradient data, callbacks) and outputs (e.g. DOM elements).

**Dimensions** are defined by the contract (breakpoints). Callers get elements that follow the contract; the contract's CSS handles responsive behavior.

---

## Gradient variants (no page names)

| Name                 | Description |
|----------------------|-------------|
| **gradient-strip**   | Grid item: visual bar + name + expand button. Used in explore grid; reusable wherever a strip card is needed. |
| **gradient-strip-tall** | Tall read-only bar with stop circles. For detail/modal context. |
| **gradient-editor**  | Editable strip (draggable color stops). For extract or any editing flow. |

Use these names in code and docs instead of page or feature names.

---

## Gradient strip API (grid item, batch)

**`createGradientStripElements(gradients, options)` → `HTMLElement[]`**

**File:** `gradient-strip.js`

Single batch call: pass the full list and options; get back strip elements. Do not call a "create one strip" in a loop.

| Parameter   | Type       | Description |
|------------|------------|-------------|
| `gradients`| `Object[]` | Array of `{ id, name, gradient }` (gradient = CSS string) or `{ id, name, colorStops, angle }`. |
| `options`  | `Object`   | See options table below. |

**Options**

| Option          | Type       | Default | Description |
|-----------------|------------|---------|-------------|
| `onExpandClick` | `Function` | —       | Callback when expand icon is clicked. Receives `(gradient)`. Parent owns behavior (open modal, navigate, analytics). |
| `iconSrc`       | `string`   | open-in-20-n.svg | Optional URL for action icon. Defaults to cacheable asset. |

**Returns:** Array of strip DOM elements. Caller appends them (e.g. `container.append(...elements)`).

**Contract:** `gradient-strip.css` — `.gradient-strip` (root), `.gradient-strip-visual`, `.gradient-strip-info`, `.gradient-strip-name`, `.gradient-strip-actions`, `.gradient-strip-action-btn`; dimensions and gap at breakpoints (e.g. 300px min, 50px visual).

**Usage**

```js
import { createGradientStripElements } from '…/gradients/gradient-strip.js';

const elements = createGradientStripElements(gradients, {
  onExpandClick: (gradient) => { /* open modal, etc. */ },
});
grid.append(...elements);
```

---

## Gradient strip tall API (tall bar)

**`createGradientDetailSection(data, options)` → `HTMLElement`**

**File:** `gradient-strip-tall.js`

Tall bar with color-stop circles for detail/modal views. Accepts `data` with optional `data.gradient` or the gradient object directly.

| Parameter  | Type       | Description |
|------------|------------|-------------|
| `data`     | `Object`   | `{ gradient? }` or gradient object `{ type?, angle?, colorStops }`. |
| `options`  | `Object`   | `size` — `'s' \| 'm' \| 'l'` for bar dimensions. |

**Contract:** `gradient-strip-tall.css` — `.gradient-strip-tall`, `.gradient-strip-tall--{size}`, `.gradient-strip-tall-bar-wrap`, `.gradient-strip-bar` (and stops) inside; dimensions at breakpoints.

---

## Editor API (editable strip)

**`createGradientEditor(initialGradient, options)` → `{ element, getGradient, setGradient, updateColorStop, destroy }`**

**File:** `gradient-editor.js`

Editable horizontal gradient strip: draggable color-stop handles along the bar. Consumer owns color picker: `onColorClick(stop, index)` opens picker; then call `updateColorStop(index, color)`.

| Parameter           | Type     | Description |
|---------------------|----------|-------------|
| `initialGradient`   | `Object` | `{ type?, angle?, colorStops }`. `colorStops`: `{ color, position }[]`, `position` 0–1. |
| `options`           | `Object` | See below. |

**Options**

| Option        | Type       | Default | Description |
|---------------|------------|---------|-------------|
| `height`      | `number`   | `80`    | Bar height in px. |
| `size`        | `'l' \| 's'` | `'l'` | Width contract: `l` max 668px, `s` max 343px. |
| `ariaLabel`   | `string`   | `'Gradient editor'` | Accessible label for the bar. |
| `onChange`    | `Function` | —       | Called when stops change (drag). Receives `(gradientData)`. |
| `onColorClick`| `Function` | —       | Called when a handle is clicked. Receives `(stop, index)`. Open color picker then call `updateColorStop(index, color)`. |

**Returns:** Object with `element`, `getGradient()`, `setGradient(gradient)`, `updateColorStop(index, color)`, `on(event, callback)`, `emit(event, detail)`, `destroy()`.

**Events:** Subscribe with `editor.on('change', (gradientData) => { ... })` and `editor.on('color-click', ({ stop, index }) => { ... })`. The editor also dispatches `CustomEvent`s on its **element**: `gradient-editor:change` (detail: gradient data) and `gradient-editor:color-click` (detail: `{ stop, index }`). Both bubble and are composed.

**Contract:** `gradient-editor.css` — root `.gradient-editor.gradient-editor--{size}`, bar `.gradient-editor-bar`, handles `.gradient-editor-handles` / `.gradient-editor-handle`.

**Usage**

```js
import { createGradientEditor } from '…/gradients/gradient-editor.js';

const editor = createGradientEditor(
  { type: 'linear', angle: 90, colorStops: [{ color: '#000', position: 0 }, { color: '#fff', position: 1 }] },
  {
    height: 80,
    onChange: (data) => { /* sync to state */ },
    onColorClick: (stop, index) => { /* open picker; on pick call editor.updateColorStop(index, newColor) */ },
  }
);
container.appendChild(editor.element);
```

---

## Files in this folder

| File | Role |
|------|------|
| `gradient-strip.js` | Gradient strip API: `createGradientStripElements` (grid item batch). |
| `gradient-strip.css` | Strip grid item: `.gradient-strip`, visual, info, actions; dimensions at breakpoints. |
| `gradient-strip-tall.js` | Gradient strip tall API: `createGradientDetailSection` (tall bar with stops). |
| `gradient-strip-tall.css` | Tall bar: `.gradient-strip-tall`, bar wrap, bar + stops; size variants. |
| `gradient-editor.js` | Editor API: `createGradientEditor` (draggable stops). |
| `gradient-editor.css` | Editor: bar + handles; size variants. |
| `README.md` | This doc. |

---

## For consumers

- **Layout:** The block/page owns grid, columns, gaps, wrapping at breakpoints. The component owns strip/bar dimensions per contract.
- **Expand behavior:** Use `onExpandClick` callback; parent decides what happens (modal, navigation, etc.).
- **One batch call** for strips; one place for options. Keeps callers simple and allows future optimizations (fragment, virtualization) without changing consumers.
