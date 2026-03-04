# Gradient components — variants and spec

Shared gradient UI components for color-explore and modals. Single source of truth for variants, sizes, APIs, and scope.

Sizes are documented in the tables below (no separate sizes file in this folder). The sizes demo is rendered by color-explore (gradients variant) from block demo code; use block config `enableSizesDemo: true` (default) or author "sizes demo" = false to hide.

---

## Variants overview

| Component | Variants | Interactive | Use case |
|-----------|----------|--------------|----------|
| **gradient-editor** | s, m, l | Yes (L only) | Draggable editor, renderable anywhere |
| **gradient-extract** | s, l | Yes | Extract-style bar with stops + midpoints |
| **gradient-strip-tall** | s, m, l, responsive | No | Static display, modal picker (content stops at L) |
| **gradient-strip** | — | Click | Card in gradients grid (explore page) |

---

## 1. Gradient editor (Extract / inline)

**Files:** `gradient-editor.js`, `gradient-editor.css`

Draggable color stops and midpoints with full keyboard and screen-reader support. Renderable anywhere (inline, modal, demo). L: 668×80, cornerRadius 8; M/S: bar only or with color handles per size.

### Layout, size, and feature flags (config-driven)

The component is driven by **layout**, **size**, and optional feature flags. No variant; use `layout: 'static'` for the full editor and `layout: 'responsive'` for the strip-style preview (modal/demo).

| Layout | Sizes | Handles | Midpoints | Drag | Copy | Use |
|--------|-------|---------|-----------|------|------|-----|
| **static** | s, m, l, responsive | S/L/responsive: color circles; M: hidden | L/responsive only (diamonds) | Yes (default) | No (default) | Full editor |
| **responsive** | strip-s, strip-m, strip-l, strip-responsive | Color circles only | No | No (default) | Yes (default, click) | Modal/demo preview |

| Size (static) | Width | Height | Notes |
|----------------|-------|--------|--------|
| **s** | 343px | 80px | Color handles |
| **m** | 488px | 80px | Handles hidden (only size that hides color handles) |
| **l** | 668px | 80px | Color + midpoint diamonds; 2px white track |
| **responsive** | 100% (no max-width) | 80px | Mobile-first: &lt;600px handles + bar (no midpoints); 600px+ full |

| Size (responsive layout) | Width | Height | Breakpoint |
|---------------------------|-------|--------|------------|
| strip-s | 343px | 200px | &lt;600px |
| strip-m | 488px | 300px | 600–1199px |
| strip-l | 834px | 400px | 1200px+ |
| strip-responsive | S/M/L via media queries | tokens | — |

- **Responsive layout:** Fluid width/height from tokens; navigate + copy; no drag, no midpoints, no 2px track. First/last handles shifted inward; focus ring on first/last via `::before`.
- **Breakpoints:** 600px, 1200px (responsive layout and static size responsive).
- **Handles cutoff:** Color handles hidden only for static size **m** (488px).
- **CSS classes:** Root gets `gradient-editor--layout-{static|responsive}`, `gradient-editor--size-{s|m|l|responsive|strip-s|strip-m|strip-l|strip-responsive}`, and when applicable `gradient-editor--draggable`, `gradient-editor--copyable`. Bar track visibility: `data-show-bar-track="true"|"false"`.

### Contract and API

**`createGradientEditor(initialGradient, options)`**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `height` | number | 80 | Bar height (px); ignored when `layout: 'responsive'` |
| `size` | string | 'l' | Static: 's' \| 'm' \| 'l' \| 'responsive'. Responsive: 'strip-s' \| 'strip-m' \| 'strip-l' \| 'strip-responsive' |
| `layout` | string | 'static' | 'static' \| 'responsive' — full editor vs strip-style preview |
| `draggable` | boolean | derived | When false, handles and midpoints cannot be dragged. Default: true for static, false for responsive. |
| `copyable` | boolean | derived | When true, click copies handle color to clipboard. Default: false for static, true for responsive. |
| `showHandles` | boolean | derived | Whether to show color handles (default from layout/size). |
| `showMidpoints` | boolean | derived | Whether to show midpoint handles (default: static + size l only). |
| `showBarTrack` | boolean | derived | Whether to show 2px bar track (default: true for static, false for responsive). |
| `ariaLabel` | string | 'Gradient editor' | Root region label |
| `onChange` | function | — | Called with `(payload)` on gradient change |
| `onColorClick` | function | — | Called with `(stop, index)` on handle click |
| `showMockDebug` | boolean | false | **Dev/QA only.** Latest color + event text (not for prod). |
| `showMockHandlesOrder` | boolean | false | **Dev/QA only.** Handles order list HEX + swatch (not for prod). |

**Returns:**  
`{ element, getGradient, setGradient, updateColorStop, on, emit, destroy }`

| Method / property | Signature / type | Description |
|-------------------|-----------------|-------------|
| `element` | HTMLElement | Root wrapper (single tab stop; Enter to enter focus order). |
| `getGradient()` | `() => Object` | Current gradient data (type, angle, colorStops, midpoints). |
| `setGradient(gradient)` | `(Object) => void` | Replace gradient; rebuilds bar and handles. |
| `updateColorStop(index, color)` | `(number, string) => void` | Set color at stop index (hex). |
| `on(event, callback)` | `(string, Function) => void` | Subscribe to 'change' or 'color-click'. |
| `emit` | Function | Internal; use `on()` or CustomEvents. |
| `destroy()` | `() => void` | Remove wrapper from DOM. |

**Example:**

```js
import { createGradientEditor } from './gradient-editor.js';

const editor = createGradientEditor(initialGradient, { layout: 'static', size: 'l', ariaLabel: 'Gradient editor', onChange: (p) => {} });
// Modal strip preview: { layout: 'responsive', size: 'strip-responsive', draggable: false, copyable: true }
document.body.appendChild(editor.element);
// editor.getGradient(); editor.setGradient(g); editor.updateColorStop(i, hex); editor.on('change', cb); editor.destroy();
```

### Accessibility (WCAG)

- **Focus:** One tab stop on wrapper. **Enter** enters gradient focus order (focus first handle). **Escape** exits back to page focus. **Tab / Shift+Tab** inside cycle handles only (don’t leave until Esc).
- **Handles:** Arrow Left/Right move stop or midpoint (1% step; Shift = 5%). Home/End go to 0% / 100%. Only 0 and 1 are absolute; other keys are deltas.
- **Live region:** Announces position changes, focus (“Color handle for #HEX”), “Gradient editor. Use arrow keys…”, “Left gradient editor.”
- **Order:** DOM (tab) order matches visual left-to-right (stop, midpoint, stop, …). Reordered on drag/release so focus is preserved.

### Events (CustomEvent, bubbles, composed)

| Event | Detail |
|-------|--------|
| `gradient-editor:change` | `{ type, angle, colorStops, midpoints }` |
| `gradient-editor:color-click` | `{ stop, index }` |

### Gradient data contract

```ts
{
  type?: 'linear' | 'radial' | 'conic';
  angle?: number;
  colorStops: Array<{ id?: number; color: string; position: number }>;
  midpoints?: number[];
}
```

Stops get `id` if missing. Positions normalized 0–1. Display uses design tokens; hex in data is fallback for invalid/missing.

### CSS contract (gradient-editor.css)

- **Root:** `.gradient-editor` — border + radius; overflow visible.
- **Bar:** `.gradient-editor-bar-wrap`, `.gradient-editor-bar` — bar + optional 2px white track (`::after`); strip-tall hides track.
- **Handles:** `.gradient-editor-handles`, `.gradient-editor-handle` — position/color via custom properties `--handle-position-pct` (0–100) and `--handle-color` (hex). Formulas in CSS; JS sets only those vars. S/L/strip-tall: 22×22 circles, 1px ring + inset. M: handles hidden.
- **Midpoints:** `.gradient-editor-midpoint` — L only; 8.485×8.485, -45°, fill #fff.
- **Strip-tall:** First/last handle shifted with `transform: translateX(11px)` / `translateX(-11px)`; focus ring on first/last via `::before` (same size as others, not clipped). Cursor pointer (no grab).

---

## 2. Gradient strip tall (modal / detail section)

**Files:** `gradient-strip-tall.js`, `gradient-strip-tall.css`

| Size | Width | Height | Radius | Breakpoint |
|------|-------|--------|--------|------------|
| **s** | 343px | 200px | 8px | &lt;680px |
| **m** | 488px | 300px | 8px | 680–1199px |
| **l** | 834px | 400px | 16px | 1200px+ |

- **Responsive:** Use `size: 'responsive'`; CSS applies S/M/L via media queries. Content stops at L.
- **API:** `createGradientDetailSection(gradientData, { size: 's' | 'm' | 'l' | 'responsive' })`.

---

## 3. Gradient extract (standalone bar)

Same as gradient editor for S and L: **S 343×80**, **L 668×80**.

| Size | Width | Height |
|------|-------|--------|
| **s** | 343px | 80px |
| **l** | 668px | 80px |

**API:** `createGradientExtract({ stops, size: 's' | 'l', onChange })`.

---

## 4. Gradient card (explore grid)

Bar 400×80; card min 400 / max 518, height 116, gap 4px.

| Size | Card max width | Bar aspect |
|------|-----------------|------------|
| **s** | 343px | 400/80 |
| **m** | 488px | 400/80 |
| **l** | 400–518px | 400/80 |

**API:** `createGradientStripElements(gradients, { onExpandClick, iconSrc })`.

---

## Lit adapter and block-level

- **Lit adapter:** `createGradientEditorAdapter` in `../../adapters/litComponentAdapters.js`.
- **Block-level:** `createGradientInspectorMock` / `createGradientSizesDemoSection` in `express/code/blocks/color-explore/components/gradientExploreMocks.js` — demo wrappers with label + gradient-editor.

---

## CSS tokens

- `--gradient-stop-size: 22px`, `--gradient-stop-border-width`, `--gradient-stop-shadow` (color-tokens.css).
- `--Corner-radius-bar: 8px`, `--Corner-radius-detail: 16px`.
- Gradient editor max-widths: 343 (s), 488 (m), 668 (l) in gradient-editor.css.
- Strip-tall dimensions in gradient-strip-tall.css (S 343×200, M 488×300, L 834×400; content stops at L).

---

## CSS imports

| Consumer | Imports |
|----------|---------|
| color-explore | gradient-strip.css, gradient-editor.css |
| modal | gradient-strip-tall.css |
| gradient-extract | gradient-extract.css (when used) |

---

## Scope (MWPW-187035, 187036, 187037)

| In scope | Status |
|----------|--------|
| Gradient display (Explore read-only grid) | Done |
| Gradient Editor component (context-agnostic) | Done |
| Responsive grid layout (1/2/3 columns) | Done |
| Gradient card rendering with CSS gradients | Done |
| Load More pagination (24 initial, 10 increment) | Done |
| Gradient editing UI (color handles, slider, stops) | Done |

| Out of scope | Ref |
|--------------|-----|
| Image upload/processing and extraction workflow | — |
| Modal UI container | MWPW-185800 |
| API integration | MWPW-186944 |
