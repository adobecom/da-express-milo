# Palette variants

**Factory:** `createPaletteVariantFactory.js` — one entry point for all strip variants.
**Wiki:** `PALETTE-VARIANT-FACTORY-WIKI.md` — factory-specific contract and behavior.

## Public entrypoint (`palettes.js`)

Use `palettes.js` when you need a lightweight palette strip wrapper around the palette web component.

- Export: `PALETTE_STRIP_VARIANTS`
  - `EXPLORE`
  - `COMPACT`
- Export: `createPaletteStrip(paletteData, callbacks, variant)`
  - Returns: `{ element, update(newData), destroy() }`
  - `paletteData`: `{ id, name, colors }`
  - `callbacks`: optional `{ onSelect(selectedPalette) }`
  - `variant`: defaults to `EXPLORE`

---

## Variants

| Variant | Description |
|---------|-------------|
| **SUMMARY** | Palette summary card with title, count, strip, actions |
| **COMPACT** | 48px strip |
| **SIMPLIFIED** | Vertical color-swatch-rail in ax-color-strip--simplified |
| **HORIZONTAL_CONTAINER** | Horizontal color-swatch-rail in ax-color-strip-container |
| **TWO_ROWS** | 2 rows x 6 colors per row; horizontal strips |

---

## Contract and API (variants)

### createPaletteVariant(palette, variant, options)

**Input:**
- `palette` — `{ id, name, colors }`
- `variant` — `PALETTE_VARIANT.SUMMARY` | `COMPACT` | `SIMPLIFIED` | `HORIZONTAL_CONTAINER`
- `options.emit` — event callback (e.g. `'palette-click'`, `'share'`)
- `options.registry` — `{ pushStrip, pushController, pushAdapter }`
- `options.cardFocusable` — `true` (default): card has `tabindex="0"` (focusable like demo). `false`: card has `tabindex="-1"` so grid controls navigation (roving tabindex).

**Returns:** `{ element }` — for SUMMARY/COMPACT the element is a `.color-card` (always a `div`, never a link). When cardFocusable: `tabindex="0"` and `role="group"`; when false: `tabindex="-1"`. Card is focusable when cardFocusable; only action buttons (Edit, Share) trigger modal/share — opening the modal is via the action icon, not the strip or card.

---

### createSwatchRailAdapter(paletteOrController, options)

**Input:**
- `paletteOrController` — `{ colors: string[] }` or controller with `subscribe`, `getState`, `setState`
- `options.orientation` — `'horizontal'` | `'vertical'` | `'stacked'`
- `options.swatchFeatures` — Object `{ copy, colorPicker, lock, hexCode, trash, drag, addLeft, addRight, editTint, colorBlindness, baseColor, emptyStrip, editColorDisabled }` or array `['copy','colorPicker',...]` or `'all'`
- `options.swatchFeaturesByOrientation` — `{ stacked: ['copy'], vertical: ['copy','colorPicker'] }` — features per orientation (overrides swatchFeatures when set)

**Default swatchFeatures:** `{ copy: true, colorPicker: true, lock: false, hexCode: true }`

**Returns:** `{ element, rail, destroy, controller?, update?, setOrientation, setSwatchFeatures }`

---

### `<color-swatch-rail>` component

**Properties:**
| Property | Type | Description |
|----------|------|--------------|
| `controller` | object | `{ subscribe, getState, setState }` — state: `{ swatches: [{ hex }], baseColorIndex }` |
| `orientation` | string | `'horizontal'` \| `'vertical'` \| `'stacked'` |
| `swatchFeatures` | object \| array \| 'all' | Feature flags for rail controls |

**Events:**
| Event | Detail |
|-------|--------|
| `color-swatch-rail-color-blindness` | `{ colors }` — when color blindness badge clicked |
| `color-swatch-rail-edit` | `{ index, hex }` — before native picker; preventDefault to use custom picker |
| `color-swatch-rail-reorder` | `{ fromIndex, toIndex, swatches }` |

**Contract:** Max 10 swatches.

**Vertical/stacked:** Color blindness badge auto-enabled unless `swatchFeatures.colorBlindness === false` (e.g. modal rail).

---

### CSS custom properties (color-swatch-rail)

| Variable | Default | Description |
|----------|---------|-------------|
| `--swatch-column-flex` | `0 0 165px` | Vertical: use `1 1 0` for dynamic width |
| `--swatch-column-width` | `165px` | Column width |
| `--swatch-column-min-width` | `0` | Min width |

---

### Icons (color-swatch-rail)

**Our implementation**

| Feature | Source | Size |
|---------|--------|------|
| Copy | `sp-icon-copy` | 20px (via `size="s"`) |
| Trash | `sp-icon-delete` | 20px |
| Add | `sp-icon-add` | 20px |
| Color blindness | `sp-icon-accessibility` | 20px |
| Lock open/closed | `sp-icon-lock-open`, `sp-icon-lock-closed` | 20px |
| Base color | `sp-icon-circle`, `sp-icon-target` | 20px |
| Edit tint | `<img>` S2_Icon_Tint_20_N.svg | 20×20 |
| Drag | `<img>` S2_Icon_Drag_20_N.svg | 20×20 |

Spectrum icons use `size="s"`; tint/drag assets use fixed `20x20` `<img>`. Icon size is not configurable via API.

**Spectrum icon size options**

`<sp-icon>` and related components accept a `size` attribute:

| Value | Description |
|-------|-------------|
| `s` | Small (our default) |
| `m` | Medium |
| `l` | Large |
| `xl` | Extra large |
| `xxl` | 2× extra large |

[Spectrum Web Components — Icon](https://opensource.adobe.com/spectrum-web-components/components/icon/)

---

## Lit vs createTag: DOM construction

### When to use which

| Layer | Use | Reason |
|-------|-----|--------|
| **Vanilla renderers** (createPaletteVariantFactory, createStripsRenderer) | `createTag` | Imperative DOM; no Lit in scope |
| **Lit components** (color-swatch-rail, color-palette) | Lit `html` template | Declarative, reactive; Lit's idiomatic pattern |

### Milo/Express guidance on HTML strings

- **Prefer createTag over innerHTML** — `innerHTML` destroys event listeners and can introduce XSS.
- **No unsanitized API/user HTML** — Sanitize before injecting; use `HtmlSanitizer` when needed.
- **Lit `html` is safe** — Lit escapes interpolations by default; only `unsafeHTML()` injects raw HTML.

### Can you use createTag inside Lit components?

**Technically yes, but not recommended.**

| Effect | What happens |
|--------|--------------|
| **Previous nodes** | Orphaned and replaced each render |
| **Imperative listeners** | Lost on every re-render |
| **Lit `@event` directives** | Cannot be applied to createTag output |
| **Reactivity** | Bypassed; manual sync only |

Lit components should use Lit's `html` template and `@click` / `@dragstart` etc. createTag is for vanilla JS blocks and renderers.

### This factory's pattern

- **createTag** — Card wrapper, buttons, containers (vanilla DOM; built once, not re-rendered).
- **createSwatchRailAdapter** — Lit `<color-swatch-rail>` (reactive; uses Lit `html` internally).

The factory builds structure with createTag and embeds Lit component elements. It does not call createTag inside a Lit `render()`.

---

## Related

- `components/strips/README.md` — Strip component contract and usage notes
- `LIT_LOADING_DECISION.md` — When Lit loads
- `createPaletteVariantFactory.js` — Implementation
- `palettes.css` — Shared variant presentation styles for summary, compact, and simplified surfaces
