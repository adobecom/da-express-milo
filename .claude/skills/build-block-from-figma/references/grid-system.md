# Grid System Reference

The Express layout grid is defined in the global styles and section metadata.
The `.container` class constrains content width — blocks do not add it
themselves, but must understand how it affects their layout.

---

## Breakpoints

| Name | Breakpoint | Typical use |
|------|-----------|-------------|
| **Mobile** | 0 – 599 px (base) | Single-column layouts. |
| **Small tablet** | 600 px | Typography and spacing adjustments; layout may still be stacked. |
| **Large tablet** | 900 px | Side-by-side layouts typically begin at this point. |
| **Desktop** | 900 px | Wider content, larger typography. |
| **Large desktop** | 1200 px | Full-width layouts, max content width. |
| **Wide** | 1680 px | HD / stress-test viewports. |

Use **mobile-first** overrides with `min-width:` syntax — this is what the codebase uses:

```css
/* base = mobile */
@media (min-width: 600px)  { /* small tablet */ }
@media (min-width: 900px)  { /* large tablet — side-by-side layouts often start here */ }
@media (min-width: 1200px) { /* desktop */ }
@media (min-width: 1680px) { /* wide */ }
```

Not every block needs all breakpoints — only add the ones where the Figma design actually changes.

> **Critical**: The breakpoint at which a block switches from stacked to
> side-by-side must be derived from the Figma designs using `get_design_context`,
> not assumed from the generic grid table. Many marquee-style blocks are stacked
> at 600–899 px and side-by-side only at ≥ 900 px. Always verify with the actual
> Figma frames before writing media queries.

---

## Container variants

| Class | Behaviour |
|-------|-----------|
| `.container` | Standard: max-width content area (typically 1200–1440 px). |
| `.full-width` | Stretches to the full viewport width. |

Blocks should respect whichever container they are placed inside.
Do not hardcode `max-width` on a block unless explicitly required by
the Figma design.

---

## Multi-column distribution (n-up)

Applied on the **section** wrapping the blocks, not on the blocks
themselves.  Common classes used at the section level:

| Class | Behaviour |
|-------|-----------|
| `.two-up` | 2 blocks per row |
| `.three-up` | 3 blocks per row |
| `.four-up` | 4 blocks per row |

Blocks should be built to work at any width — they will be placed into
n-up layouts by the page author.

---

## Key takeaway for block authors

Blocks should be **width-agnostic**.  They sit inside a container
that controls their outer width.  A block's CSS should use relative
units, percentages, or flex/grid to fill its allocated space — never
assume a fixed pixel width.
