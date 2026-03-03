# Gradient components — variants and spec

Shared gradient UI components for color-explore and modals. Single source of truth for variants, Figma sizes, APIs, and scope.

**Figma file:** [Final-Color-Expansion-CCEX-221263](https://www.figma.com/design/mcJuQTxJdWsL0dMmqaecpn/Final-Color-Expansion-CCEX-221263?m=dev)  
**fileKey:** `mcJuQTxJdWsL0dMmqaecpn`

Use the REST inspect script for layout/dimensions:  
`node dev/FigmaRest/figma-node-inspect.js mcJuQTxJdWsL0dMmqaecpn <nodeId>`

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
**Figma nodes:** 6198-370556, 6223-154851 (Extract Gradient Editor — MWPW-187036)

| Size | Width | Height | Handles | Notes |
|------|-------|--------|---------|--------|
| **s** | 343px | 80px | Color | Color handles |
| **m** | 488px | 80px | Color | Color handles (explore section bar M) |
| **l** | 668px | 80px | Color + gradient | Color + gradient handles; track 2px, radius 8px, gap 10px |

- **Breakpoints (if responsive):** S &lt;680, M 680–1199, L 1200+ (align with strip-tall).
- **API:** `createGradientEditor(gradient, { size: 's' | 'm' | 'l', height: 80 })`.

### API

```js
import { createGradientEditor } from './gradient-editor.js';

const editor = createGradientEditor(initialGradient, {
  height: 80,
  size: 'l',
  ariaLabel: 'Gradient editor',
  showMockDebug: false,
  showMockHandlesOrder: false,
  onChange: (payload) => {},
  onColorClick: (stop, index) => {},
});

editor.element
editor.getGradient()
editor.setGradient(g)
editor.updateColorStop(index, color)
editor.on('change', cb)
editor.on('color-click', cb)
```

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
  colorStops: Array<{ color: string; position: number }>;
  midpoints?: number[];
}
```

---

## 2. Gradient strip tall (modal / detail section)

**Files:** `gradient-strip-tall.js`, `gradient-strip-tall.css`  
**Figma nodes:** 5724-62647 (S), 5724-60681 (M), 5724-59267 (L). Modal shell: 5738-196384.

| Size | Width | Height | Radius | Breakpoint |
|------|-------|--------|--------|------------|
| **s** | 343px | 200px | 8px | &lt;680px |
| **m** | 488px | 300px | 8px | 680–1199px |
| **l** | 834px | 400px | 16px | 1200px+ |

- **Responsive:** Use `size: 'responsive'`; CSS applies S/M/L via media queries. Content stops at L.
- **API:** `createGradientDetailSection(gradientData, { size: 's' | 'm' | 'l' | 'responsive' })`.

---

## 3. Gradient extract (standalone bar)

Same as gradient editor for S and L: **S 343×80**, **L 668×80** (Figma 6198-370556).

| Size | Width | Height |
|------|-------|--------|
| **s** | 343px | 80px |
| **l** | 668px | 80px |

**API:** `createGradientExtract({ stops, size: 's' | 'l', onChange })`.

---

## 4. Gradient card (explore grid)

**Figma node:** 5724-85752 (Desktop L). Bar 400×80; card min 400 / max 518, height 116, gap 4px.

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
