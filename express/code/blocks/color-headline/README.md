# color-headline

Renders the page heading, subheading, and Adobe Express logo for color tool pages. Loads early via AEM block loading order to improve FCP.

## Variants

| Variant | Used by | Status |
|---------|---------|--------|
| `extract` | `color-extract` | Active |
| `tools` | `contrast-checker`, `color-blindness`, `color-wheel` | Active |

## Adoption contract

The tool block uses `findHeadline` (`scripts/color-shared/utils/adoptHeadline.js`) to locate `.color-headline.tools` in the same section before layout creation. Discovery does not depend on color-headline's `init()` having run. `findHeadline` also ensures the logo is injected if `init()` hasn't executed yet.

The found element is passed as `headlineEl` to `createColorToolLayout`, which places it in the sidebar slot synchronously during slot construction — before CSS loads and before the layout is appended to the DOM.

After layout creation, `markAdopted` sets `data-adopted="true"` on the element.

## CSS alignment

The `tools` variant styles must match the shell's `.ax-text-content` typography so there is no visual shift when the element is placed in the sidebar. Both use the same CSS custom properties defined in `styles/styles.css`:

- `--ax-heading-xl-size` (heading font size)
- `--ax-body-s-size` (paragraph font size)
- `--ax-body-weight` (paragraph font weight)
- `--heading-font-weight-extra` (heading font weight)
