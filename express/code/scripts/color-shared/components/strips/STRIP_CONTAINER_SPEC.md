# Strip container — spec & config (explore palettes)

**Scope:** color-explore **(palettes)** → **strip container** variant.  
**Figma spec:** [Final Color Expansion CCEX-221263 — node 6215-344297](https://www.figma.com/design/mcJuQTxJdWsL0dMmqaecpn/Final-Color-Expansion-CCEX-221263?node-id=6215-344297&m=dev) / [6215-344299 strip](https://www.figma.com/design/mcJuQTxJdWsL0dMmqaecpn/Final-Color-Expansion-CCEX-221263?node-id=6215-344299&m=dev). CSS variables are sourced from the Figma REST API: run `FIGMA_ACCESS_TOKEN=<token> node tools/figma-variables-to-css.js` to generate `color-strip-figma.css` from `GET /v1/files/:file_key/variables/local`. The color-explore block loads `color-strip-figma.css` after `color-strip.css` so API tokens override fallbacks when the file exists.

**WC API:** See `COLOR_PALETTE_WC_API.md` for what `<color-palette>` supports and the spec→WC mapping.

---

## Hierarchy

| Level | Name | Notes |
|-------|------|--------|
| **Page variant** | color-explore (gradients) | Grid / Modal / Extract gradient types. |
| **Page variant** | color-explore (palettes) | Palette cards with strip inside. |
| **Sub-variant** | **Strip container** | This spec. One of several palettes subtasks. |
| **Component** | Color-strip (Figma) | Options below apply to the strip container. |

Other palettes subtasks (~5) are out of scope for this doc; we focus on the strip container only.

---

## Color-strip properties (from Figma “Properties for explore palettes page”)

Source: design spec — property name, type, default/example.

### Variant (blue)

| Property   | Description | Default / value |
|-----------|-------------|------------------|
| Orientation | Layout of strip | All options apply (horizontal / vertical) |
| State      | UI state       | Default |
| Theme      | Light/dark etc. | All options apply |

### Boolean (pink)

| Property              | Default  | Notes |
|-----------------------|----------|--------|
| Show hover state      | False    | |
| Super light           | All options apply | |
| Locked                | False    | |
| Show color blindness  | False    | |
| Show drag             | False    | |
| Show lock             | False    | |
| Show trash            | False    | |
| Show copy hex         | **True** | |
| Show edit tint        | False    | |
| Show add left         | False    | |
| Show add right        | False    | |
| Add empty color strip | False    | |
| Base color set        | False    | |
| Show base color       | False    | |
| Show Edit color       | **True** | |

### Text (purple)

| Property | Example | Notes |
|----------|---------|--------|
| @Label   | #FF7500 | Label format/example |

---

## Where this plugs in

- **Block config:** color-explore block can expose strip options (e.g. table rows or a dedicated “strip” section). `parseBlockConfig` → extend with strip-container keys.
- **Defaults:** Single source of truth for default values (e.g. in `color-explore/helpers/constants.js` or here) so strip renderer and `<color-palette>` WC get the same defaults.
- **Renderer:** `createStripsRenderer` / `createPaletteAdapter` receive `stripOptions` and pass them to the WC (attributes/properties) and to any vanilla strip markup. `<color-palette>` WC lives in libs; we only pass what the WC supports.
- **CSS:** `color-strip.css` already supports orientation (horizontal/vertical), with-labels, compact, size L/M/S, color-blindness label. New options may need new classes or data attrs.

---

## Implementation order (suggested)

1. Add **strip container defaults** in code (constants) matching this spec.
2. Extend **parseBlockConfig** to read strip options from block table (when authors add them).
3. Pass **stripOptions** from color-explore → createStripsRenderer → createPaletteAdapter; set attributes on `<color-palette>` (or DOM) per supported props.
4. Add or map **CSS** for any new options (e.g. theme, state) as needed.
