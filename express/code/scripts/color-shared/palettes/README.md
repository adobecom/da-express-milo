# Palette variants

**Factory:** `createPaletteVariantFactory.js` — one entry point for all strip variants. Figma: 5639-129905 (Simplified), 6180-230471 (Color strip spec), 6215-344297 (Color-strip-container).

---

## Variants

| Variant | Description |
|---------|-------------|
| **SUMMARY** | Figma 5806-89102 — Palette summary card with title, count, strip, actions |
| **COMPACT** | 48px strip |
| **SIMPLIFIED** | Figma 5639-129905 — vertical color-swatch-rail in ax-color-strip--simplified |
| **HORIZONTAL_CONTAINER** | Figma 6215 / 6180 — horizontal color-swatch-rail in ax-color-strip-container |

---

## Contract and API (variants)

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
| `swatchFeatures` | object \| array \| 'all' | Feature flags per Figma 6180-230477 |

**Events:**
| Event | Detail |
|-------|--------|
| `color-swatch-rail-color-blindness` | `{ colors }` — when color blindness badge clicked |
| `color-swatch-rail-edit` | `{ index, hex }` — before native picker; preventDefault to use custom picker |
| `color-swatch-rail-reorder` | `{ fromIndex, toIndex, swatches }` |

**Contract:** Max 10 swatches (Figma 5806-89102).

**Vertical/stacked:** Color blindness badge auto-enabled unless `swatchFeatures.colorBlindness === false` (e.g. modal rail).

---

### CSS custom properties (color-swatch-rail)

| Variable | Default | Description |
|----------|---------|-------------|
| `--swatch-column-flex` | `0 0 165px` | Vertical: use `1 1 0` for dynamic width |
| `--swatch-column-width` | `165px` | Column width |
| `--swatch-column-min-width` | `0` | Min width |

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

- `STRIPS_CONTRACT.md` — Strip and palette WC contract
- `LIT_LOADING_DECISION.md` — When Lit loads
- `createPaletteVariantFactory.js` — Implementation
