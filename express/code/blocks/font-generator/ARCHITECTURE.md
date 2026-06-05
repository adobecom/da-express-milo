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
| Skeleton loader | `font-generator.css` + markup | Pulsing placeholders over text input, toolbar, and cards. Shown before fonts load; hidden once ready. |

---

## State

All shared state lives in `state.js`. Components never share state with each other directly — they only read from and write to the store.

| Key | Type | URL-synced | Notes |
|---|---|---|---|
| `previewText` | string | yes | |
| `activeFilters` | string[] | yes | empty = show all |
| `layout` | `'grid'`\|`'list'` | yes | |
| `fontSize` | number | yes | |
| `activeFonts` | FontDef[] | no | derived — never set directly |
| `visibleCount` | number | no | resets to 12 on filter change |

### Derived state

`activeFonts` is computed inside `setState` whenever `activeFilters` changes. No component sets it directly. `visibleCount` also resets to 12 at that point.

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

Follow the same pub/sub pattern used in `ColorThemeExpressController.js`. `subscribe` returns an unsubscribe function. Subscribers receive the full state snapshot. `state.js` exports: `getState`, `setState`, `subscribe`, `initFromUrl`.

---

## Component pattern

Each component exports an `init(el)` function. It sets up event listeners and subscribes to state. `font-generator.js` (the block's `decorate` function) is the only place that calls `init` and knows about the full tree.

```js
// font-generator.js
export default function decorate(block) {
  initFromUrl(); // must run before any component init
  initTextInput(block.querySelector('.text-input'));
  initFilters(block.querySelectorAll('.filters')); // two instances: desktop + panel
  initToolbar(block.querySelector('.toolbar'));
  initFontCardGrid(block.querySelector('.font-card-grid'));
}
```

Each component follows the same shape: listen → `setState`, subscribe → update DOM.

```js
// example: textInput.js
export function init(el) {
  const input = el.querySelector('input');
  // We'll need to test the debounce out to find a balance between code performance and visual crispness
  input.addEventListener('input', debounce(e => setState({ previewText: e.target.value }), 150));
  subscribe(({ previewText }) => { if (input.value !== previewText) input.value = previewText; });
}
```

---

## Real-time card updates

Cards update on every keystroke via the store subscription. No special wiring needed — FontCardGrid's subscriber already re-renders with the latest `previewText` whenever state changes.

```
User types → TextInput calls setState({ previewText }) →
store notifies subscribers → FontCardGrid re-renders cards with new text
```

Start by debouncing text input at 150ms to avoid re-rendering on every keypress during fast typing. Tune this to optimize UX. The debounce lives in `textInput.js` — it's a detail of how input is reported to the store, not something the store or grid should know about.

---

## Panel open/close (mobile/tablet)

> **Note:** A dedicated panel component is up to the discretion of the developer. The pattern below applies if one is added.

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

`visibleCount` starts at 12 and increases by 12 each time Load More is clicked. It resets to 12 automatically when filters change (handled in `setState`). FontCardGrid owns the Load More button and slices `activeFonts` to `visibleCount` on each render.

---

## Spectrum components

### Font size slider

`createExpressSlider` already exists in `scripts/color-shared/spectrum/components/express-slider.js` and is exported from the barrel (`spectrum/index.js`). Font generator is its first consumer. Wire it in `toolbar.js`:

- `onInput` → `setState({ fontSize: value })` for live card updates
- Subscribe to store → `slider.setValue()` to sync on URL init

### Categories accordion

`sp-accordion` is not yet in the dist bundle and has no Express wrapper. Three steps to add it:

**1. Add to the dist bundle**

Add `@spectrum-web-components/accordion` to the Spectrum build config and run the bundle script to generate `accordion.js` in `scripts/widgets/spectrum/dist/`. Check how other components are added in that build config — follow the same pattern.

**2. Add `loadAccordion()` to `load-spectrum.js`**

Follow the same shape as `loadSlider()` or `loadButton()` — call `loadCoreDeps()`, wrap the import in `installRegistryGuard`, import `accordion.js` from `DIST`, and `waitForComponents(['sp-theme', 'sp-accordion', 'sp-accordion-item'])`.

**3. Create `express-accordion.js`**

Add `scripts/color-shared/spectrum/components/express-accordion.js` and export it from `spectrum/index.js`. Model it on `express-slider.js`: call `loadAccordion()` and `loadOverrideStyles`, create the `sp-accordion` / `sp-accordion-item` elements inside a theme wrapper, wire the `toggle` event, and return `{ element, destroy }`.

The accordion's open/closed state stays out of the store — it's transient UI, same as `panelOpen`.

---

## Skeleton loader

Pulsing gray placeholders are shown over the text input, toolbar items, and font cards before content is ready. The skeleton is CSS-only — a `loading` class on the container block activates the pulse animation, and `font-generator.js` removes it once fonts are initialized.

Skeleton elements are inert markup siblings of the real components, hidden by default and revealed only while `loading` is present. No JS is needed inside individual components to manage skeleton state.

---

## Unicode transformation engine

A pure utility module. No state, no DOM. Takes a string and a font definition and returns the transformed unicode string. All components that need to display transformed text import from here directly.

Also pay attention to the fonts that have prefixes/suffixes or repeating separators rather than a 1:1 relationship. The runtime engine must consume the generated `pattern` metadata, not just the character maps.

Runtime constraints:

- Input is capped at 200 characters before transformation.
- Transforming a 200-character input across every v1 style should stay under 50ms.

```js
// unicodeEngine.js
export function transformText(text, fontDef) {
  // Maps characters and applies any start/end/repeating-middle pattern metadata.
}
```

Build and test this module first. Every other ticket depends on it.

### Font Sheet Generation

Font sheet source files are not served publicly. The source/output flow is:

```
scripts/font-generator/v1/v1.csv
  -> scripts/font-generator/transform.js
  -> express/code/blocks/font-generator/font-sheets/v1/v1.json
```

Regenerate the public JSON after editing the CSV:

```sh
npm run build:font-sheets
```

Only the generated `v1.json` is a runtime asset. Do not include source-only fields like the raw CSV style string in that JSON.

### Test Coverage

There are two separate test boundaries:

- `test/blocks/font-generator/font-sheets/transform.test.js` verifies CSV parsing, pattern detection, generated character maps, and generated metadata.
- `test/blocks/font-generator/unicodeEngine.test.js` verifies runtime behavior against generated `v1.json`, including direct maps, combining-mark maps, start/end patterns, repeating-middle patterns, empty input, invalid input, and length limits.

Both suites intentionally log structured transform records with `styleName`, `source`, `actual`, and `expected` so each style can be inspected in test output.

### Development Visualizer

Use the `font-generator-visualizer` block for manual inspection while building the feature. It renders a table of generated `v1.json` font rows and includes a preview text input that updates the runtime `unicodeEngine` output for every style.

The visualizer reads only the generated public JSON. It does not fetch the private CSV source.

---

## Reference patterns in this codebase

- **Pub/sub store**: `scripts/color-shared/controllers/ColorThemeExpressController.js`
- **URL param API**: `scripts/color-shared/utils/utilities.js` lines 200–277
- **Init/factory pattern**: `blocks/color-wheel/color-wheel.js`
- **Architecture docs**: `scripts/color-shared/INITIALIZATION_ARCHITECTURE.md`
