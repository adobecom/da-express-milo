# Font Generator — Architecture Guide

This document describes the component architecture, state management, and communication patterns for the unicode font generator block. Use it as a reference when building any component in this feature.

---

## What it does

Displays a grid of font cards, each showing the user's preview text transformed into a different unicode style (circled letters, strikethrough, etc.). Users can filter by font category, change the layout, adjust font size, and type custom preview text. All settings are preserved in URL parameters. On mobile and tablet, filters live in a slide-out panel.

---

## Component hierarchy

```
Container (block entry point, owns state)
├── Toolbar                        ← layout toggle, font size slider, font count label
│   └── [Filter button]            ← mobile/tablet only, opens panel
├── TextInput                      ← preview text input
├── Filters                        ← category filter buttons + CTA Banner (desktop, always visible)
├── [Panel - TBD]                  ← mobile/tablet only, shows/hides via CSS class
│   └── Filters                   ← same component, same store interaction
└── FontCardGrid                   ← slices and renders visible font cards
    └── FontCard[]                 ← renders transformed preview text
```

---

## Tickets

| Ticket | Component(s) | Notes |
|---|---|---|
| Container + setup | `state.js`, `font-generator.js` | Entry point, store, URL sync. Build first. |
| Unicode transformation engine | `unicodeEngine.js` | Pure utility, no UI. Build first — all other tickets depend on it for realistic previews. |
| Text input | `textInput.js` | Writes `previewText` to store |
| Filters | `filters.js` | Writes `activeFilters` to store. Includes CTA Banner markup. Single component used in two places. |
| Toolbar | `toolbar.js` | Writes `layout`, `fontSize`. Reads `activeFonts.length` for count label. Owns panel open/close toggle. |
| FontCard | `fontCard.js` | Presentational. Receives `previewText`, `fontSize`, `fontDef` as arguments. |
| FontCardGrid | `fontCardGrid.js` | Reads `activeFonts`, `visibleCount`, `layout`. Owns Load More button, writes `visibleCount`. |

---

## State

All shared state lives in `state.js`. Components never share state with each other directly — they only read from and write to the store.

```js
// state.js
let state = {
  previewText: 'Hello',       // string   — synced to URL
  activeFilters: [],          // string[] — synced to URL. empty = show all categories
  layout: 'grid',             // 'grid' | 'list' — synced to URL
  fontSize: 16,               // number   — synced to URL
  activeFonts: [...allFonts], // derived  — NOT synced to URL, never set directly by components
  visibleCount: 12,           // number   — NOT synced to URL, resets on filter change
};
```

### Derived state

`activeFonts` is computed inside `setState` whenever `activeFilters` changes. No component sets it directly.

```js
export function setState(patch) {
  state = { ...state, ...patch };

  if (patch.activeFilters !== undefined) {
    state.activeFonts = allFonts.filter(f =>
      state.activeFilters.length === 0 || state.activeFilters.includes(f.id)
    );
    state.visibleCount = 12; // reset pagination when filters change
  }

  syncToUrl(state);
  listeners.forEach(fn => fn(state));
}
```

### Who reads and writes what

| Component | Reads | Writes |
|---|---|---|
| TextInput | `previewText` | `previewText` |
| Filters | `activeFilters` | `activeFilters` |
| Toolbar | `activeFonts.length`, `layout`, `fontSize` | `layout`, `fontSize` |
| FontCardGrid | `activeFonts`, `visibleCount`, `layout` | `visibleCount` |
| FontCard | `previewText`, `fontSize` | — |
| **store itself** | — | `activeFonts`, `visibleCount` (on filter change) |

---

## The store

Follow the same pub/sub pattern used in `ColorThemeExpressController.js`. `subscribe` returns an unsubscribe function. Subscribers receive the full state snapshot.

```js
// state.js
import { allFonts } from './unicodeEngine.js';

const listeners = new Set();

let state = {
  previewText: 'Hello',
  activeFilters: [],
  layout: 'grid',
  fontSize: 16,
  activeFonts: [...allFonts],
  visibleCount: 12,
};

export function getState() {
  return { ...state };
}

export function setState(patch) {
  state = { ...state, ...patch };

  if (patch.activeFilters !== undefined) {
    state.activeFonts = allFonts.filter(f =>
      state.activeFilters.length === 0 || state.activeFilters.includes(f.id)
    );
    state.visibleCount = 12;
  }

  syncToUrl(state);
  listeners.forEach(fn => fn(state));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function initFromUrl() {
  const params = new URLSearchParams(location.search);
  const patch = {};
  if (params.get('text')) patch.previewText = params.get('text');
  if (params.get('filters')) patch.activeFilters = params.get('filters').split(',');
  if (params.get('layout')) patch.layout = params.get('layout');
  if (params.get('size')) patch.fontSize = Number(params.get('size'));
  if (Object.keys(patch).length) setState(patch);
}

function syncToUrl(s) {
  const params = new URLSearchParams();
  if (s.previewText) params.set('text', s.previewText);
  if (s.activeFilters.length) params.set('filters', s.activeFilters.join(','));
  if (s.layout !== 'grid') params.set('layout', s.layout);
  if (s.fontSize !== 16) params.set('size', s.fontSize);
  const query = params.toString();
  history.replaceState(null, '', query ? `?${query}` : location.pathname);
}
```

---

## Component pattern

Each component exports an `init(el)` function. It sets up event listeners and subscribes to state. `main.js` (the block's `decorate` function) is the only place that calls `init` and knows about the full tree.

```js
// textInput.js
import { setState, subscribe } from './state.js';

export function init(el) {
  const input = el.querySelector('input');

  // Write to store on user input (debounced — see below)
  input.addEventListener('input', debounce(e => {
    setState({ previewText: e.target.value });
  }, 150));

  // Sync UI from store (handles URL load on page init)
  subscribe(({ previewText }) => {
    if (input.value !== previewText) input.value = previewText;
  });
}
```

```js
// font-generator.js (block entry point)
import { initFromUrl } from './state.js';
import { init as initTextInput } from './textInput.js';
import { init as initFilters } from './filters.js';
import { init as initToolbar } from './toolbar.js';
import { init as initFontCardGrid } from './fontCardGrid.js';

export default function decorate(block) {
  initFromUrl(); // must run before any component init

  initTextInput(block.querySelector('.text-input'));
  initFilters(block.querySelectorAll('.filters')); // two instances: desktop + panel (if panel exists)
  initToolbar(block.querySelector('.toolbar'));
  initFontCardGrid(block.querySelector('.font-card-grid'));
}
```

---

## Real-time card updates

Cards update on every keystroke via the store subscription. No special wiring needed — FontCardGrid's subscriber already re-renders with the latest `previewText` whenever state changes.

```
User types → TextInput calls setState({ previewText }) →
store notifies subscribers → FontCardGrid re-renders cards with new text
```

Debounce text input at 150ms to avoid re-rendering on every keypress during fast typing. The debounce lives in `textInput.js` — it's a detail of how input is reported to the store, not something the store or grid should know about.

---

## Panel open/close (mobile/tablet)

> **Note:** A dedicated panel component is TBD. The pattern below applies if one is added.

`panelOpen` is not stored in the state store. It's transient UI state that no other component needs. The Toolbar toggles a CSS class on the container; the panel responds via CSS.

```js
// toolbar.js
const filterBtn = el.querySelector('.filter-btn');
const container = el.closest('.font-generator');

filterBtn.addEventListener('click', () => {
  container.classList.toggle('panel-open');
});
```

```css
.panel { display: none; }
.panel-open .panel { display: block; }
```

---

## Filters: two instances, one component

On desktop, Filters renders inline alongside the CTA Banner. On mobile/tablet, it renders inside a panel. Both instances are initialized by passing a NodeList to `initFilters`. Both subscribe to the store and reflect `activeFilters` independently, so they always stay in sync without any direct communication between them.

---

## Load more / pagination

`visibleCount` starts at 12 and increases by 12 each time Load More is clicked. It resets to 12 automatically when filters change (handled in `setState`). FontCardGrid owns the Load More button.

```js
// fontCardGrid.js
import { getState, setState, subscribe } from './state.js';

export function init(el) {
  const grid = el.querySelector('.cards');
  const loadMoreBtn = el.querySelector('.load-more');

  loadMoreBtn.addEventListener('click', () => {
    setState({ visibleCount: getState().visibleCount + 12 });
  });

  subscribe(state => {
    const visible = state.activeFonts.slice(0, state.visibleCount);
    const hasMore = state.visibleCount < state.activeFonts.length;

    grid.className = `cards cards--${state.layout}`;
    grid.innerHTML = visible.map(f => `
      <div class="font-card" style="font-size: ${state.fontSize}px">
        <p class="font-card-preview">${transformText(state.previewText, f)}</p>
        <span class="font-card-label">${f.label}</span>
      </div>
    `).join('');

    loadMoreBtn.hidden = !hasMore;
  });
}
```

---

## Unicode transformation engine

A pure utility module. No state, no DOM. Takes a string and a font definition and returns the transformed unicode string. All components that need to display transformed text import from here directly.

```js
// unicodeEngine.js
export const allFonts = [ /* font definitions */ ];

export function transformText(text, fontDef) {
  return [...text].map(char => fontDef.map[char] ?? char).join('');
}
```

Build and test this module first. Every other ticket depends on it.

---

## Reference patterns in this codebase

- **Pub/sub store**: `scripts/color-shared/controllers/ColorThemeExpressController.js`
- **URL param API**: `scripts/color-shared/utils/utilities.js` lines 200–277
- **Init/factory pattern**: `blocks/color-wheel/color-wheel.js`
- **Architecture docs**: `scripts/color-shared/INITIALIZATION_ARCHITECTURE.md`
