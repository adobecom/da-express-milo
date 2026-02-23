# Gradient components

Shared gradient UI components for color-explore and modals. APIs and contracts for all variants.

---

## Variants overview

| Component | Variants | Interactive | Use case |
|-----------|----------|--------------|----------|
| **gradient-editor** | s, m, l | Yes (L only) | Draggable editor, renderable anywhere |
| **gradient-extract** | s, l | Yes | Extract-style bar with stops + midpoints |
| **gradient-strip-tall** | s, m, l, xl, responsive | No | Static display, modal picker |
| **gradient-strip** | — | Click | Card in gradients grid (explore page) |

---

## 1. gradient-editor

**File:** `gradient-editor.js`, `gradient-editor.css`

Draggable gradient editor with color stops and midpoint diamonds. L size only shows handles; M/S show bar only.

### API

```js
import { createGradientEditor } from './gradient-editor.js';

const editor = createGradientEditor(initialGradient, {
  height: 80,           // default 80
  size: 'l',            // 's' | 'm' | 'l'
  ariaLabel: 'Gradient editor',
  showReviewerDebug: false,  // default false; set true for QA (shows latest color + event)
  onChange: (payload) => {},
  onColorClick: (stop, index) => {},
});

// Return object
editor.element          // HTMLElement to append
editor.getGradient()    // () => { type, angle, colorStops, midpoints }
editor.setGradient(g)   // (gradient) => void — gradient may include midpoints for restore
editor.updateColorStop(index, color)
editor.on('change', cb)
editor.on('color-click', cb)
```

### Events (CustomEvent, bubbles, composed)

| Event | Detail |
|-------|--------|
| `gradient-editor:change` | `{ type, angle, colorStops, midpoints }` — full state (midpoints are 0–1 blend positions) |
| `gradient-editor:color-click` | `{ stop, index }` |

### Contract (size × dimensions)

Dimensions align with Figma color handle ring spec (see gradient-editor.css). No dedicated Figma node in repo.

| Variant | Max width | Height | Handles |
|---------|-----------|--------|---------|
| s | 343px | 80px | No |
| m | 488px | 80px | No |
| l | 668px | 80px | Yes (22×22 circles, 8.5×8.5 diamonds) |

### Gradient data contract

```ts
{
  type?: 'linear' | 'radial' | 'conic';
  angle?: number;  // 0–360
  colorStops: Array<{ color: string; position: number }>;
  midpoints?: number[];  // optional; length colorStops.length - 1, 0–1 blend positions (used by getGradient/setGradient/change)
}
```

---

## 2. gradient-extract

**File:** `gradient-extract.js`, `gradient-extract.css`

Standalone draggable bar with color stops and midpoint diamonds.

### API

```js
import { createGradientExtract } from './gradient-extract.js';

const el = createGradientExtract({
  stops: [{ id, position, color }, ...],
  size: 'l',           // 's' | 'l'
  onChange: (stops, midpoints) => {},
});

// HTMLElement with methods
el.getStops()
el.getMidpoints()
```

### Contract

| Variant | Max width | Height |
|---------|-----------|--------|
| s | 343px | 80px |
| l | 668px | 80px |

### Stops contract

```ts
Array<{ id: number; position: number; color: string }>
```

---

## 3. gradient-strip-tall

**File:** `gradient-strip-tall.js`, `gradient-strip-tall.css`

Static gradient bar for modal picker. No drag. Shows color stop circles.

### API

```js
import { createGradientDetailSection } from './gradient-strip-tall.js';

const el = createGradientDetailSection(gradientData, {
  size: 'l',  // 's' | 'm' | 'l' | 'xl' | 'responsive'
});

// Returns HTMLElement (no methods)
```

### Contract

| Variant | Width | Bar size |
|---------|-------|----------|
| s | 343px | 343×200 |
| m | 488px | 488×300 |
| l | 834px | 834×400 |
| xl | 834px | 834×400 |
| responsive | S &lt;680, M 680–1199, L 1200+ | Same as above |

---

## 4. gradient-strip

**File:** `gradient-strip.js`, `gradient-strip.css`

Card element for gradients grid. Visual bar + name + action button.

### API

```js
import { createGradientStripElements } from './gradient-strip.js';

const elements = createGradientStripElements(gradients, {
  onExpandClick: (gradient) => {},
  iconSrc: '/express/code/icons/open-in-20-n.svg',
});
// Returns HTMLElement[] (one per gradient)
```

### Gradient contract

```ts
{
  id: string;
  name?: string;
  gradient?: string;  // CSS gradient string
  colorStops?: Array<{ color: string; position: number }>;
  angle?: number;
}
```

---

## 5. Lit adapter

**File:** `../../adapters/litComponentAdapters.js`

```js
import { createGradientEditorAdapter } from '../../adapters/litComponentAdapters.js';

const adapter = createGradientEditorAdapter(initialGradient, {
  onChange: (gradient) => {},
  onColorClick: (stop, index) => {},
});

container.appendChild(adapter.element);
adapter.setGradient(newGradient);
adapter.updateColorStop(0, '#ff0000');
adapter.destroy();
```

---

## 6. createGradientInspector (block-level)

**File:** `express/code/blocks/color-explore/components/createGradientInspector.js` (block-level, not in color-shared)

Wrapper for explore page: label + gradient-editor. Uses `createGradientEditor` with size `l` when responsive.

```js
import { createGradientInspector } from '../components/createGradientInspector.js';

const el = createGradientInspector({
  gradient: { colorStops: [...] },
  size: 'responsive',  // 's' | 'm' | 'l' | 'responsive'
});
```

---

## CSS imports

| Consumer | Imports |
|----------|---------|
| color-explore | gradient-strip.css, gradient-editor.css |
| modal | gradient-strip-tall.css |
| gradient-extract | gradient-extract.css (when used) |
