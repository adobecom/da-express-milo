# Gradient components — Figma sizes (single source of truth)

**Figma file:** [Final-Color-Expansion-CCEX-221263](https://www.figma.com/design/mcJuQTxJdWsL0dMmqaecpn/Final-Color-Expansion-CCEX-221263?m=dev)  
**fileKey:** `mcJuQTxJdWsL0dMmqaecpn`

Use the REST inspect script for layout/dimensions:  
`node dev/FigmaRest/figma-node-inspect.js mcJuQTxJdWsL0dMmqaecpn <nodeId>`

---

## 1. Gradient editor (Extract / inline)

**Figma nodes:** 6198-370556, 6223-154851 (Extract Gradient Editor — MWPW-187036)

| Size | Width | Height | Handles | Notes |
|------|-------|--------|---------|--------|
| **s** | 343px | 80px | No | Bar only |
| **m** | 488px | 80px | No | Bar only (explore section bar M) |
| **l** | 668px | 80px | Yes (22×22) | Track 2px, radius 8px, gap 10px |

- **Breakpoints (if responsive):** S &lt;680, M 680–1199, L 1200+ (align with strip-tall).
- **API:** `createGradientEditor(gradient, { size: 's' | 'm' | 'l', height: 80 })`.

---

## 2. Gradient strip tall (modal / detail section)

**Figma nodes:** 5724-62647 (S), 5724-60681 (M), 5724-59267 (L). Modal shell: 5738-196384.

| Size | Width | Height | Radius | Breakpoint |
|------|-------|--------|--------|------------|
| **s** | 343px | 200px | 8px | &lt;680px |
| **m** | 488px | 300px | 8px | 680–1199px |
| **l** | 834px | 400px | 16px | 1200px+ |

- **Responsive:** Use `size: 'responsive'`; CSS applies S/M/L via media queries. Content stops at L.
- **API:** `createGradientDetailSection(gradientData, { size: 's' | 'm' | 'l' | 'responsive' })`.

---

## 3. Gradient extract (standalone bar)

Same as gradient editor for S and L: **S 343×80**, **L 668×80** (Figma 6198-370556).

| Size | Width | Height |
|------|-------|--------|
| **s** | 343px | 80px |
| **l** | 668px | 80px |

---

## 4. Gradient card (explore grid)

**Figma node:** 5724-85752 (Desktop L). Bar 400×80; card min 400 / max 518, height 116, gap 4px.

| Size | Card max width | Bar aspect |
|------|-----------------|------------|
| **s** | 343px | 400/80 |
| **m** | 488px | 400/80 |
| **l** | 400–518px | 400/80 |

---

## CSS tokens (already in use)

- `--gradient-stop-size: 22px`, `--gradient-stop-border-width`, `--gradient-stop-shadow` (color-tokens.css).
- `--Corner-radius-bar: 8px`, `--Corner-radius-detail: 16px`.
- Gradient editor max-widths: 343 (s), 488 (m), 668 (l) in gradient-editor.css.
- Strip-tall dimensions in gradient-strip-tall.css (S 343×200, M 488×300, L 834×400; content stops at L).
