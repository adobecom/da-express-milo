# Figma 5806-89102 – Palette summary

**Figma:** [Final Color Expansion CCEX-221263 – Palette summary](https://www.figma.com/design/mcJuQTxJdWsL0dMmqaecpn/Final-Color-Expansion-CCEX-221263?node-id=5806-89102&m=dev)

**Purpose:** Gives users a preview of their palette colors. Can contain up to 10 colors.

## CSS values (from node inspect)

Re-run inspect:
```bash
node dev/figma-node-inspect.js mcJuQTxJdWsL0dMmqaecpn 5806-89102
```

### Container (Palette summary COMPONENT_SET)
- `padding`: 20px
- `gap`: 20px
- `border-radius`: 5px
- `display`: flex; `flex-direction`: column

### Strip row variants
| Variant              | Height | Border radius      | Notes        |
|----------------------|--------|--------------------|--------------|
| Height=Short         | 32px   | 8px                | min-width 150, max-width 180 |
| Height=Full         | 36px   | 8px                | max-width 180 |
| Height=Full, Mobile | 24px   | 16px 16px 0 0      | top corners only |

- **No border** on container or strip (match Figma exactly).
- `gap` (between swatches): 0
- First/last swatch: rounded to match row (8px left on first, 8px right on last; mobile: 16px top-left / top-right only)
- First summary card in explore is always rendered with **10 colors** (padded by repeating if palette has fewer).

## Figma 3424-115475 (exact strip dimensions)

Same component set; use for **exact width/height** of horizontal strip rows:

| Variant   | Width | Height | Radius   |
|-----------|-------|--------|----------|
| Short     | 180px | 32px   | 8px      |
| Full      | 180px | 36px   | 8px      |
| Mobile    | 180px | 24px   | 16px 16px 0 0 |

- Strip row: `display: flex; flex-direction: row; align-items: center; gap: 0`
- Wrapper: `min-width: 150px; max-width: 180px`

## Implementation

Variables and rules are in `color-strip.css`:

- `:root`: `--figma-palette-summary-*` (padding, gap, radius, strip heights, strip radius, border, max/min width)
- `.ax-color-strip-summary-card`: uses `--summary-padding`, `--summary-gap`, `--summary-radius` (Figma 20px, 20px, 5px)
- `.ax-color-strip-summary-card__strip .ax-color-strip`: 8px radius, 1px solid #1f1f1f; first/last cell rounded
- Modifiers: `--short` (32px), `--mobile` (24px, top-only radius); default strip height is 36px (Full)
