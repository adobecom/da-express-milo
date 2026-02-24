# `<color-palette>` Web Component — API summary

**Source:** `express/code/libs/color-components/components/color-palette/index.js` (Lit).

---

## All options at a glance

**Properties (set as JS or attribute):**

| Option | Attribute / property | Type | Default |
|--------|----------------------|------|--------|
| Palette data | `palette` (property only) | `{ name?, colors: string[] }` | — (required) |
| Wrap rows | `wrap` | boolean | `false` |
| Active (no click) | `active` | boolean | `false` |
| Aria label template | `palette-aria-label` | string (`{hex}`, `{index}`) | — |
| Search query | `searchQuery` (property) | string | `''` |
| Show name tooltip | `show-name-tooltip` | boolean | `false` |
| Selection source | `selection-source` | string | `'default-palette'` |
| Vertical layout | `vertical` | boolean (attribute present = true) | false |

**CSS custom properties (on host):**

| Variable | Default |
|----------|--------|
| `--color-palette-min-width` | 272px |
| `--color-palette-min-height` | 40px |
| `--color-palette-margin-bottom` | 20px |
| `--color-palette-border-radius` | 8px |
| `--color-palette-border-width` | 2px |
| `--color-palette-border-color` | #0000001A |
| `--color-palette-active-border-color` | #000 |
| `--color-palette-height` | 40px |
| `--vertical-color-palette-min-width` | 48px |
| `--vertical-color-palette-min-height` | 90px |
| `--vertical-color-palette-margin` | 4px |
| `--color-palette-vertical-border-color` | #242C33 |
| `--color-palette-vertical-border-radius` | 12px |
| `--vertical-color-palette-border-width` | 2px |

**Events:** `ac-palette-select` (detail: `{ palette, searchQuery, selectionSource }`).

**Slots:** `color-picker-button-${index}`, `mobile-color-picker-button`.

---

## Properties (LitElement)

| Property | Type | Attribute | Default | Description |
|----------|------|-----------|---------|-------------|
| `palette` | Object | — | — | `{ name?, colors: string[] }` (hex). Required. |
| `wrap` | Boolean | — | `false` | Wrap colors into multiple rows when many (e.g. > 5). |
| `isActive` | Boolean | `active` | `false` | When true, click does not fire `ac-palette-select` (e.g. picker open). |
| `paletteAriaLabel` | String | `palette-aria-label` | — | Template for pill aria-label: `{hex}`, `{index}`. |
| `searchQuery` | String | — | `''` | Passed in `ac-palette-select` detail. |
| `showNameTooltip` | Boolean | `show-name-tooltip` | `false` | Show tooltip with palette name (wraps in sp-overlay-trigger). |
| `selectionSource` | String | `selection-source` | `'default-palette'` | Passed in event detail (e.g. `'search-palette'` when searchQuery set). |

---

## Orientation (vertical strip)

| Attribute | Effect |
|-----------|--------|
| `vertical` | Present on host → vertical layout. Styles use `:host([vertical])` and vertical-specific CSS vars. |

So **orientation** is supported as a boolean attribute: no attribute = horizontal, `vertical` = vertical. This matches the legacy [Color explore](https://color.adobe.com/es/explore) behavior.

---

## CSS custom properties (on host)

From `styles.css.js` and usage in `color-strip.css`:

| Variable | Default (in WC) | Use |
|----------|------------------|-----|
| `--color-palette-min-width` | 272px | Horizontal strip min width |
| `--color-palette-min-height` | 40px | Strip min height |
| `--color-palette-margin-bottom` | 20px | Bottom margin |
| `--color-palette-border-radius` | 8px | Corner radius |
| `--color-palette-border-width` | 2px | Outline width |
| `--color-palette-border-color` | #0000001A | Outline color |
| `--color-palette-active-border-color` | #000 | Focus/hover/active outline |
| `--color-palette-height` | 40px | Row height when wrapped |
| `--vertical-color-palette-min-width` | 48px | Vertical layout |
| `--vertical-color-palette-min-height` | 90px | Vertical layout |
| `--vertical-color-palette-margin` | 4px | Vertical layout |
| `--color-palette-vertical-border-color` | #242C33 | Vertical active border |
| `--color-palette-vertical-border-radius` | 12px | Vertical border radius |
| `--vertical-color-palette-border-width` | 2px | Vertical border width |

---

## Events

| Event | Detail | When |
|-------|--------|------|
| `ac-palette-select` | `{ palette, searchQuery, selectionSource }` | Click on strip (unless `isActive`). |

---

## Slots

| Slot name | Purpose |
|-----------|--------|
| `color-picker-button-${index}` | Per-color button overlay (index 0, 1, …). |
| `mobile-color-picker-button` | Mobile color picker button. |

---

## Mapping: strip-container spec → WC support

| Spec option | WC support | How |
|-------------|------------|-----|
| **Orientation** | ✅ | Set `vertical` attribute for vertical; omit for horizontal. |
| **State** | ✅ | `active` attribute ≈ “default” vs inactive (no click). |
| **Theme** | ⚠️ CSS only | No prop. Use CSS vars / wrapper class (e.g. dark theme overrides). |
| **Show hover state** | ✅ | WC has hover outline via `--color-palette-active-border-color`. Can hide with CSS if false. |
| **Super light** | ❌ | Not in WC. Would need wrapper/CSS or WC change. |
| **Locked** | ⚠️ | No `locked` prop. Could map to `active` (no click) or wrapper class. |
| **Show color blindness** | ❌ | Not in WC. We have `.ax-color-strip__color-blindness-label` in our CSS; WC has no slot for it. |
| **Show drag** | ❌ | Not in WC. |
| **Show lock** | ❌ | Not in WC. |
| **Show trash** | ❌ | Not in WC. |
| **Show copy hex** | ❌ | Not in WC (no copy UI). |
| **Show edit tint** | ❌ | Not in WC. |
| **Show add left / right** | ❌ | Not in WC. |
| **Add empty color strip** | ❌ | Not in WC. |
| **Base color set / Show base color / Show Edit color** | ❌ | Not in WC. |
| **@Label** | ❌ | WC has no hex labels on pills. Our `.ax-color-strip--with-labels` is in shared CSS for vanilla strip, not WC. |

**Summary:** The WC supports **orientation** (horizontal/vertical), **active state**, **wrap**, **showNameTooltip**, **paletteAriaLabel**, and styling via **CSS vars**. It does **not** implement copy-hex, lock, trash, drag, add, color-blindness label, or hex labels. Those would need either a different component (e.g. vanilla strip from dev), a wrapper that adds UI around the WC, or changes to the WC itself.
