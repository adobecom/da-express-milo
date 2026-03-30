# color-headline

Renders the page heading, subheading, and Adobe Express logo for color tool pages. Loads early via AEM block loading order to improve FCP.

## Variants

| Variant | Used by | Status |
|---------|---------|--------|
| `extract` | `color-extract` | Active |
| `tools` | `contrast-checker`, `color-blindness`, `color-wheel` | Active |

## Adoption contract

After `createColorToolLayout` returns, the tool block calls `adoptHeadline(layout)` from `scripts/color-shared/utils/adoptHeadline.js`. This function locates `.color-headline.tools`, ensures the Adobe Express logo is injected (in case `init()` hasn't run yet), prepends the element into the layout's sidebar slot, and sets `data-adopted="true"` on it.

Discovery does not depend on color-headline's `init()` having run.

## CSS alignment

The `tools` variant styles must match the shell's `.ax-text-content` typography so there is no visual shift when the element is placed in the sidebar. Both use the same CSS custom properties defined in `styles/styles.css`:

- `--ax-heading-xl-size` (heading font size)
- `--ax-body-s-size` (paragraph font size)
- `--ax-body-weight` (paragraph font weight)
- `--heading-font-weight-extra` (heading font weight)
