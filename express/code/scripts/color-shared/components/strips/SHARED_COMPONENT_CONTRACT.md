# Strip & Summary Card — Shared Component Contract (MWPW-187682)

**Scope:** Contract and API only. No wiring.

**Folder:** Strip UI lives only under `components/strips` (no separate `components/palette`). This folder holds shared strip/card layout CSS. Vanilla strip for future non-palette variants (summary card, etc.) is in `scripts/color-shared/dev/MWPW-187682/` (not used by current PR).

**Single implementation for palette strips:** Use the **`<color-palette>` Web Component** (`libs/color-components/components/color-palette`) via `createPaletteAdapter()` in `scripts/color-shared/adapters/litComponentAdapters.js`. Explore, modal, and global-colors-ui use the WC. Do not use `createColorStrip` for palette cards.

### Palette strip (canonical): `<color-palette>` WC

| Input | Description |
|-------|-------------|
| `palette` | `{ name?, colors: string[] }` (hex with or without `#`) |
| `show-name-tooltip` | Optional; omit or false when name is rendered outside (e.g. card footer). |
| `palette-aria-label` | Template for pill aria-label: `{hex}`, `{index}`. |
| Events | Listen for `ac-palette-select` (detail: `{ palette, searchQuery, selectionSource }`). |

Use `createPaletteAdapter(paletteData, { onSelect })` to get a `<color-palette>` element and wire selection. Style via CSS custom properties (e.g. `--color-palette-min-height`, `--color-palette-border-radius`) on the host.

### WC features we leverage (maximize WC, minimal JS)

| WC feature | Use in our cases |
|------------|------------------|
| **Props** | `palette` (required), `show-name-tooltip` (false when we render name in footer), `palette-aria-label`, optional `searchQuery` / `selection-source` for analytics. |
| **Events** | `ac-palette-select` → we emit `palette-click` or call `onSelect`. No custom strip logic. |
| **Styling** | All L/M/S via CSS vars on host: `--color-palette-min-height`, `--color-palette-border-radius`, `--color-palette-border-width`, `--color-palette-border-color`, `--color-palette-active-border-color`, `--color-palette-margin-bottom`. No JS for layout. |
| **Vertical** | WC supports `vertical` attribute + `--vertical-color-palette-*` vars (e.g. color-palette-list on mobile). Use when needed. |
| **Slots** | Per-pill `color-picker-button-${index}` and `mobile-color-picker-button` — we don’t need them for explore/modal; available if a feature needs picker in pill. |

**What we add in JS (minimal):**

- **Explore card:** Create card wrapper, append WC, build footer (name + Edit/View buttons), one `ac-palette-select` listener and card click/keydown with `closest()` so action buttons don’t trigger card open. No strip DOM built by us.
- **Modal:** Create container, append WC, optional `onSelect`. No footer.
- **Lists:** `color-palette-list` uses `<color-palette>` directly; no adapter in our code.

**When vanilla is an option:** Only for non-palette cases: summary strip (title + count + small strip bar), vertical strip with hex labels, or color-blindness label above strip. For any **palette** strip (data = `{ name, colors }`), use the WC only. Vanilla implementation lives in `scripts/color-shared/dev/MWPW-187682/createColorStrip.js` (not in main bundle for this PR).

---

## 1. `createColorStrip(colors, options)` — non-palette variants only (in dev/)

**Returns:** One `HTMLElement` — root `.ax-color-strip` with variant classes. No wrapper.

### Inputs

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `colors` | `Array<string \| { color, name? }>` | No (defaults to 2 greys) | Hex strings or `{ color, name? }` per cell. |
| `options.ariaLabel` | `string` | No | `aria-label` on root (default `"Color strip"`). |
| `options.orientation` | `'horizontal' \| 'vertical'` | No | Default `'horizontal'`. |
| `options.compact` | `boolean` | No | 48px height. |
| `options.showLabels` | `boolean` | No | Show hex/name per cell. |
| `options.colorBlindnessLabel` | `string \| true` | No | Label above strip (`true` → "Color blindness friendly"). |
| `options.cornerRadius` | `'start' \| 'middle' \| 'end' \| 'full' \| 'none' \| 'mobile'` | No | Per-cell radius. |
| `options.gapSize` | `'s' \| 'm' \| 'l'` | No | Gap between cells (2 / 4 / 8px). |
| `options.sizing` | `'s' \| 'm' \| 'l'` | No | Row height: 32 / 36 / 48px. |
| `options.className` | `string` | No | Extra class(es) on root. |

### Output

- Single DOM node: `div.ax-color-strip[role="list"]` with optional `.ax-color-strip__color-blindness-label` and `.ax-color-strip__inner` containing `.ax-color-strip__cell` elements.
- Styles: `express/code/scripts/color-shared/components/strips/color-strip.css` (Figma-aligned).

### Width / max-width — L/M/S contract (horizontal strip)

- **Horizontal strip does not expand to container.** It uses a max-width so the strip respects the L/M/S contract:
  - **No size / default:** `max-width: 518px` (same as L).
  - **`sizing: 's'`:** `max-width: 280px`.
  - **`sizing: 'm'`:** `max-width: 400px` (default for horizontal in grid).
  - **`sizing: 'l'`:** `max-width: 518px`.
- **Width:** `width: 100%` so the strip can shrink in narrow containers but never exceed the max for its size.
- **Summary-card strip:** Figma 6407/5806 — `max-width: 180px`, `min-width: 150px` on `.ax-color-strip-summary-card__strip`.
- **Orchestrator override:** Block/page CSS can override width or max-width via media queries when needed.

---

## 2. `createSummaryStripCard(opts)`

**Returns:** One `HTMLElement` — root `.ax-color-strip-summary-card`. No wrapper.

### Inputs

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `opts.title` | `string` | No | Heading text. |
| `opts.count` | `number` | No | e.g. "5 colors". |
| `opts.strip` | `HTMLElement` | No | Result of `createColorStrip(...)`. |
| `opts.actions` | `HTMLElement[]` | No | Buttons or other actions (e.g. View). |

### Output

- Single DOM node: `div.ax-color-strip-summary-card` with optional `__title`, `__count`, `__strip`, `__actions`.
- Same CSS file as above.

---

## Usage

- **Consumers** (e.g. color-explore, other blocks/pages) call these APIs and place the returned elements in their own layout. No extra wrappers from the shared layer.
- **color-explore block:** Display-only — renders each variant (horizontal, vertical, compact, with-labels, color-blindness-label, spec-parity, states, summary-card) with up to 3 items per variant, no card containers, no result-list chrome. Sole purpose: show shared components.
