# PR CSS vs styles.css tokens

Comparison of hardcoded values in PR CSS files with tokens in `express/code/styles/styles.css`. **Applied:** literals replaced with `var(--token)` from styles.css where available.

---

## color-explore.css

| Location | Hardcoded value | styles.css token? | Suggested replacement |
|----------|-----------------|-------------------|------------------------|
| .color-explore-variant-wrap gap | 4px | `--spacing-75: 4px` | `var(--spacing-75)` |
| .color-explore-variant-size font-size | 12px | `--body-font-size-xs: 0.75rem` (12px), `--ax-body-xxs-size: 12px` | `var(--body-font-size-xs)` or `var(--ax-body-xxs-size)` |
| .color-explore.is-loading::after width/height | 40px | `--spacing-600: 40px` | `var(--spacing-600)` |
| .color-explore.is-loading::after margin | -20px | (half of 40) | `calc(var(--spacing-600) / -2)` if using --spacing-600 |
| .color-explore.is-loading::after border | 4px solid | No 4px border token; `--spacing-75: 4px` | `var(--spacing-75) solid` |
| .color-explore--gradients .gradients-grid minmax | 280px, 320px, 360px | No exact match | Keep or add block-level tokens |
| .gradient-card:hover box-shadow | 0 4px 12px rgba(0,0,0,0.1) | No shadow token | Keep or add token |
| Media queries | 768px, 1024px | No breakpoint tokens | Keep (or use design tokens if added later) |

---

## color-strip.css

### Values in rules (outside :root)

| Location | Hardcoded value | styles.css token? | Suggested replacement |
|----------|-----------------|-------------------|------------------------|
| .ax-color-strip__inner gap | 2px | `--spacing-50: 2px` | `var(--spacing-50)` |
| .ax-color-strip--with-labels .ax-color-strip__cell padding | 4px | `--spacing-75: 4px` | `var(--spacing-75)` |
| .ax-color-strip__color-blindness-label padding | 4px 8px 0 | 4px = `--spacing-75`, 8px = `--spacing-100` | `var(--spacing-75) var(--spacing-100) 0` |
| .ax-color-strip__cell-label font-size | 10px | `--ax-detail-s-size: 10px` | `var(--ax-detail-s-size)` |
| .ax-color-strip__color-blindness-label font-size | 11px | No 11px | Keep or add token |
| .ax-color-strip--vertical .ax-color-strip__inner gap | 8px (via token) | — | Already `var(--Corner-radius-corner-radius-100)` (8px) |
| .ax-color-strip--gap-s/m .ax-color-strip__inner | 2px, 4px | `--spacing-50`, `--spacing-75` | `var(--spacing-50)`, `var(--spacing-75)` |
| .ax-color-strip--horizontal... .ax-color-strip__cell min-width | 24px | `--spacing-400: 24px` | `var(--spacing-400)` |
| .ax-color-strip--corner-mobile border-radius | 16px | `--spacing-300: 16px` | `var(--spacing-300)` |
| .ax-color-strip-summary-card__title font-weight | 600 | No 600 in styles (700, 400) | Keep 600 or use `--ax-body-weight-bold` (700) if acceptable |

### color-strip.css :root tokens that exist in styles.css

These are redefined locally; could use styles.css and remove from local :root if we want one source of truth:

| color-strip :root token | Value | styles.css equivalent |
|-------------------------|--------|------------------------|
| (none for #fff) | #fff | `--color-white` |
| (gray-100 local) | #e9e9e9 | `--color-light-gray: #E9E9E9` |
| (Palette-gray-100) | #f8f8f8 | `--color-gray-100: #F8F8F8` |
| Alias-content-typography-Title | #131313 | `--color-gray-950`, `--color-default-font` |
| Icon-primary-gray-default / Alias-content-neutral-default | #292929 | `--color-gray-800-variant` |
| Content-neutral-default | #222222 | `--color-content-neutral`, `--color-gray-900` |
| Spacing-Spacing-75 | 4px | `--spacing-75` |
| Global-Typography-Size-Label-Label-M | 14px | `--body-font-size-s`, `--ax-heading-xxs-size` |
| Corner-radius-corner-radius-100 | 8px | `--spacing-100` (8px); no generic 8px radius token |
| summary-gap, summary-padding | 20px | `--spacing-350: 20px` |
| summary-title-size | 14px | `--body-font-size-s`, `--ax-body-xs-size` |
| summary-count-size | 12px | `--body-font-size-xs`, `--ax-body-xxs-size` |

---

## Summary

- **color-explore.css:** Applied `--spacing-75` (gap, border), `--body-font-size-xs` (variant size), `--spacing-600` (spinner size/margin).
- **color-strip.css:** Applied in rules: `--spacing-50`, `--spacing-75`, `--spacing-100`, `--ax-detail-s-size`, `--spacing-400`, `--spacing-300`. Applied in :root: local tokens that had styles.css equivalents now alias to `var(--color-*)`, `var(--spacing-*)`, `var(--body-font-size-s)`, `var(--body-font-size-xs)`.
- **Left as-is (no token in styles.css):** 11px, font-weight 600, 120px, 280/320/360px, shadows, durations, breakpoints, strip-specific colors (#505a5f, #e5e5e5, #4b75ff, #1f1f1f).
