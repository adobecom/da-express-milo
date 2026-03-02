# Figma 7457-569724 – Two-Row Color Strip

**Figma:** [Final Color Expansion CCEX-221263 – Two rows](https://www.figma.com/design/mcJuQTxJdWsL0dMmqaecpn/Final-Color-Expansion-CCEX-221263?node-id=7457-569724&m=dev)

**Source:** REST API `GET /v1/files/mcJuQTxJdWsL0dMmqaecpn/nodes?ids=7457:569724`

## Layout (from REST inspect)

### Color-palette-panel (parent)
- **height:** 712px
- **itemSpacing (gap between rows):** 16px
- **layoutMode:** VERTICAL

### Color-strip-container (GRID)
- **width:** ~899px (responsive)
- **height:** 600px
- **layoutMode:** GRID
- **children:** 10 (5 columns × 2 rows)

### Color-strip (each cell)
- **width:** ~178px per column
- **height:** ~299px per row
- **padding:** 12px all sides
- **itemSpacing (between swatches in strip):** 10px

### Border radius (rectangleCornerRadii: [topLeft, topRight, bottomRight, bottomLeft])
| Position | Figma radii | CSS border-radius |
|----------|-------------|-------------------|
| Row 1 Col 1 (top-left) | [16, 0, 0, 0] | 16px 0 0 0 |
| Row 1 Col 5 (top-right) | [0, 16, 0, 0] | 0 16px 0 0 |
| Row 2 Col 1 (bottom-left) | [0, 0, 0, 16] | 0 0 0 16px |
| Row 2 Col 5 (bottom-right) | [0, 0, 16, 0] | 0 0 16px 0 |

## CSS variables to apply

```css
/* Two-rows content */
.strip-variant--two-rows__content {
  height: 712px;
  gap: 16px;  /* Figma itemSpacing between rows */
}

/* Swatch rail (per row) – gap between columns */
.strip-variant--two-rows__row color-swatch-rail {
  --Spacing-Spacing-50: 10px;  /* Figma itemSpacing between swatches in strip */
}

/* Swatch column padding */
/* color-swatch-rail uses padding: 12px (--Spacing-Spacing-200) – matches Figma */
```
