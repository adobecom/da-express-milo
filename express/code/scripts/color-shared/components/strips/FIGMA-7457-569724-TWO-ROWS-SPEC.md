# Figma 7457-569724 – Two-Row Color Strip

**Figma:** [Final Color Expansion CCEX-221263 – Two rows](https://www.figma.com/design/mcJuQTxJdWsL0dMmqaecpn/Final-Color-Expansion-CCEX-221263?node-id=7457-569724&m=dev)

**Source:** REST API `GET /v1/files/mcJuQTxJdWsL0dMmqaecpn/nodes?ids=7457:569724`

## Layout (from REST inspect)

### Color-palette-panel (parent)
- **height:** 712px
- **layoutMode:** VERTICAL

### Color-strip-container (GRID)
- **width:** ~899px (responsive)
- **height:** 600px
- **layoutMode:** GRID
- **children:** 10 (5 columns × 2 rows) or 12 (6 columns × 2 rows)

### Color-strip (each cell)
- **width:** ~178px per column (5 cols) or ~16.67% (6 cols)
- **height:** ~299px per row
- **padding:** 12px all sides
- **row/column gap:** 2px (per spec)

### Border radius (rectangleCornerRadii: [topLeft, topRight, bottomRight, bottomLeft])
| Position | Figma radii | CSS border-radius |
|----------|-------------|-------------------|
| Row 1 Col 1 (top-left) | [16, 0, 0, 0] | 16px 0 0 0 |
| Row 1 Col 5 (top-right) | [0, 16, 0, 0] | 0 16px 0 0 |
| Row 2 Col 1 (bottom-left) | [0, 0, 0, 16] | 0 0 0 16px |
| Row 2 Col 5 (bottom-right) | [0, 0, 16, 0] | 0 0 16px 0 |

## CSS (applied in color-swatch-rail)

- **Row/column gap:** 2px
- **Height:** 712px (content wrapper)
- **Border radius:** 16px on outer corners
- **Empty strip:** white background (--Palette-gray-0)
