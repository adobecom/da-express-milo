# Palette strip variants — Figma → code mapping

**Figma file:** [Final Color Expansion CCEX 221263](https://www.figma.com/design/mcJuQTxJdWsL0dMmqaecpn/Final-Color-Expansion-CCEX-221263?m=dev)

One variant at a time: where it lives and what contract/API it uses.

**REST Inspect (layout/CSS):** `node dev/figma-node-inspect.js mcJuQTxJdWsL0dMmqaecpn <nodeId>`

---

## 5517-203140 — Palette thumbnails and grid (all sizes, pixel-perfect source)

**Figma:** [node-id=5517-203140](https://www.figma.com/design/mcJuQTxJdWsL0dMmqaecpn/Final-Color-Expansion-CCEX-221263?node-id=5517-203140&m=dev)

**What it is:** Section containing all explore palette sizes and breakpoints (Desktop 1920/1440, Tablet 899, Mobile 679/375). Includes the **Explore-Palettes-Swatch** component set (3088-201177) with every variant. Use this node + REST inspector for **pixel-perfect** L/M/S CSS.

**Exact REST (from 3088-201177 children in this section):**

| Variant | Card (W×H) | gap | minWidth | maxWidth | Strip (W×H) | Footer |
|---------|------------|-----|----------|----------|-------------|--------|
| Breakpoint=Desktop, State=Default, Type=Color | 400×116 | 4px | 400 | 518 | 400×80 | 400×32 |
| Breakpoint=Mobile, State=Default, Type=Color | 342×88 | **0** | **300** | — | 342×56 | 342×32 |
| Breakpoint=Mobile, State=Default, Type=Gradient | 342×82 | **0** | **300** | — | 342×50 | 342×32 |

Implementation: `color-strip.css` uses these values exactly (card gap 0 for M/S, min-width 300 for M/S, strip heights 80/56/50).

---

## 5659-59868 — Explore - Colour palettes **Tablet** (M/Tablet source of truth)

**Figma:** [node-id=5659-59868](https://www.figma.com/design/mcJuQTxJdWsL0dMmqaecpn/Final-Color-Expansion-CCEX-221263?node-id=5659-59868&m=dev)

**What it is:** Tablet breakpoint frame (899px width, minWidth 600, maxWidth 1199). **Use this node for M/Tablet dimensions** — do not infer from Desktop or Mobile.

**REST exact (run `node dev/figma-node-inspect.js mcJuQTxJdWsL0dMmqaecpn 5659-59868`):**
- **Palette-container:** 835px, gap **16px**
- **Explore-Palettes-Swatch (each card):** **409.5×88**, itemSpacing **0**, minWidth **300**
- **Color (strip):** **409.5×56**, border-radius 8, border 0.5px solid #e9e9e9
- **Palette info:** 409.5×32, gap 10

**Implementation:** `.palette-card--size-m` → max-width **410px**, strip **56px**, gap **0**. Same strip height as Mobile (56px); Tablet card is **wider** (410) than Mobile (342).

---

## 5659-63634 — Explore - Colour palettes **Mobile** (mobile-first source)

**Figma:** [node-id=5659-63634](https://www.figma.com/design/mcJuQTxJdWsL0dMmqaecpn/Final-Color-Expansion-CCEX-221263?node-id=5659-63634&m=dev)

**What it is:** Mobile breakpoint frame. Use with [3088-201177](https://www.figma.com/design/mcJuQTxJdWsL0dMmqaecpn/Final-Color-Expansion-CCEX-221263?node-id=3088-201177&m=dev) / [5517-203140](https://www.figma.com/design/mcJuQTxJdWsL0dMmqaecpn/Final-Color-Expansion-CCEX-221263?node-id=5517-203140&m=dev) for pixel-perfect Mobile values.

**Contract (from 3088-201177):**
- **Mobile Color (size-m):** Card 342×88, gap 0, minWidth 300, strip 342×56, footer 32px, gap 10px.
- **Mobile Gradient (size-s):** Card 342×82, gap 0, minWidth 300, strip 342×**50**, footer 32px.

**Figma Inspect (Dev Mode) — card frame:**
```css
display: flex;
height: 88px;
min-width: 300px;
flex-direction: column;
align-items: flex-end;
align-self: stretch;
```
(REST gives W×H/minWidth; Inspect adds layout. Use these for pixel-perfect match.)

---

## 5659-58868 — Explore - Colour palettes (Desktop frame)

**Figma:** [node-id=5659-58868](https://www.figma.com/design/mcJuQTxJdWsL0dMmqaecpn/Final-Color-Expansion-CCEX-221263?node-id=5659-58868&m=dev)

**What it is:** Desktop explore palettes frame. For **M/Tablet** use [5659-59868](https://www.figma.com/design/mcJuQTxJdWsL0dMmqaecpn/Final-Color-Expansion-CCEX-221263?node-id=5659-59868&m=dev) instead.

---

## 3088-201177 — Explore-Palettes-Swatch (canonical explore; REST + MCP)

**Figma:** [node-id=3088-201177](https://www.figma.com/design/mcJuQTxJdWsL0dMmqaecpn/Final-Color-Expansion-CCEX-221263?node-id=3088-201177&m=dev)

**What it is:** Component set for the explore palettes view (also embedded in [5517-203140](https://www.figma.com/design/mcJuQTxJdWsL0dMmqaecpn/Final-Color-Expansion-CCEX-221263?node-id=5517-203140&m=dev)): 14 variants (Desktop/Mobile × Color/Gradient × states). Single card = strip + "Palette info". **Pixel-perfect values** in `color-strip.css` come from REST on this node and 5517-203140.

**REST-derived (run `node dev/figma-node-inspect.js mcJuQTxJdWsL0dMmqaecpn 3088-201177`). Key variants:**

| Variant | Card (W×H) | gap | minWidth | maxWidth | Strip (W×H) |
|---------|------------|-----|----------|----------|-------------|
| Desktop, Default, Color | 400×116 | 4 | 400 | 518 | 400×80 |
| Mobile, Default, Color | 342×88 | **0** | **300** | — | 342×56 |
| Mobile, Default, Gradient | 342×82 | **0** | **300** | — | 342×50 |

**Our L/M/S mapping:** size-l = Desktop Color; size-m = Mobile Color; size-s = Mobile Gradient.

- **Card (Desktop Default):** 400×116px, flex column, gap 4px, align-items flex-end, minWidth 400, maxWidth 518.
- **Strip (Color):** 400×80px, flex row, gap 0, border-radius 8px, border 0.5px solid #e9e9e9. Five cells 80×80: #a6a094, #bfbab4, #f2efe8, #3f3529, #8b7e6d.
- **Palette info:** 400×32px, flex row, gap 10px. Palette name: #131313. Actions: 70×32 (or 32×32 gradient-only), gap 6px.
- **Focus ring:** 2px solid #4b75ff, border-radius 10px.
- **Container:** padding 20px, gap 46px between cards, border-radius 5px.

**Assets / data:** Default palette colors and name "Palette name lorem ipsum" from this node; see `createColorDataService.js` (`FIGMA_EXPLORE_PALETTE_COLORS`, `FIGMA_EXPLORE_PALETTE`). CSS in `color-strip.css`. **Action icons (Edit, View):** Exported from this node via REST (Figma Images API). Run `node dev/figma-export-palette-icons.js` to re-download; outputs `express/code/icons/palette-edit.svg`, `palette-view.svg`. Renderer uses these in `createStripsRenderer.js`.

---

## 5674-67799 — Explore palettes swatch (data, contract, CSS)

**Figma:** [node-id=5674-67799](https://www.figma.com/design/mcJuQTxJdWsL0dMmqaecpn/Final-Color-Expansion-CCEX-221263?node-id=5674-67799&m=dev)

**What it is:** Design spec for the grid palette card: strip + **title** (palette name) + **2 action buttons** (Edit, View). Base component includes 2 action buttons; Edit can be conditional in some variants.

**Design tokens (from Figma variables):**
- Title: Express web Label/Medium (Label-M) — 14px, weight 500, line-height 20; color `Alias/content/typography` / `Content/neutral/default`.
- Spacing: `Spacing/Spacing-75` = 4px (card gap, footer gap, actions gap).
- Icons: `Icon/primary/gray/default` = #292929.
- Focus: `S2A/Color/border/focus-indicator` = #4b75ff; `Focus-radius/focus-radius-80` = 10px.
- Corner: `Corner-radius/corner-radius-100` = 8px (action buttons).

---

## 5524-151471 — Palette card (grid / list item)

**Figma:** [node-id=5524-151471](https://www.figma.com/design/mcJuQTxJdWsL0dMmqaecpn/Final-Color-Expansion-CCEX-221263?node-id=5524-151471&m=dev)

**What it is:** The full palette card as shown in the explore grid: horizontal color strip + palette name (title) + action icons (Edit, View) per 5674-67799.

**Where in our files:**

| Layer | File | What |
|-------|------|------|
| **Card structure** | `createStripsRenderer.js` | `createPaletteCard(palette)` when `isVariantDemo === false` (and `stripType !== 'summary-card'`). Builds: strip + `.palette-card__footer` (title + 2 actions). |
| **Strip inside card** | `<color-palette>` WC | `createPaletteAdapter(palette, { onSelect })` — single implementation for palette strips (Figma 6180). |
| **Grid of cards** | `createStripsRenderer.js` | `createPalettesGrid()` → `.palettes-grid` / `.color-grid` containing multiple `.palette-card`. |
| **Styles** | `color-strip.css` | Card + footer + Label-M + action buttons (Figma 5674-67799 tokens). Strip: `.ax-color-strip`, etc. |

**Contract / API**

- **Input:** A palette object with:
  - **name** (string) — Display name in the card footer.
  - **colors** (string[]) — Hex array for the strip.
  - **editLink** (string, optional) — URL for the Edit action; when set, Edit renders as `<a href>` (target _blank).
  - **viewLink** (string, optional) — URL for the View action; when set, View renders as `<a href>`. When omitted, View is a button that emits `palette-click` (open modal).
  - `id`, `category?`, `tags?` as needed.
- **Output:** One `.palette-card` DOM node:  
  `[ <color-palette> , .palette-card__footer ( .palette-name , .palette-card__actions [ Edit, View ] ) ]`
- **Events:** Card click or View button (when no viewLink) → `emit('palette-click', palette)`.
- **Layout:** Grid in shared; card gap 4px; min-width 400px, max-width 518px.

**Figma spec (implemented in shared):** Node 5524-151471 + 5674-67799 — card uses `--Spacing-Spacing-75`, Label-M typography, Icon gray default, focus indicator. See `color-strip.css` (`.color-explorer-strips .palettes-grid .palette-card` and `.palette-card__*`).

---

## Other strip-related Figma nodes (reference)

| Node | Variant | Our code |
|------|---------|----------|
| 5639 | Vertical strip | `createStripsRenderer` stripType `'vertical'` → `orientation: 'vertical'` |
| 6180 | Horizontal strip (default) | stripType `'horizontal'` → `<color-palette>` WC (createPaletteAdapter) |
| 5806 | Summary card (strip + title + count + actions) | `createSummaryStripCard` + strip 36px, corner full |
| 6407 | Strip summary (bar 180×36) | Summary strip inside 5806 |
| 5724-59264 | Palette strip colors (Eternal Sunshine) | `createColorDataService.js` — `FIGMA_PALETTE_STRIP_COLORS` |
