# Template X Carousel Loop Block - Function Documentation

An infinite, center-pinned ("spotlight") template carousel. Unlike `template-x-carousel`
(native scroll-snap, finite), this block uses a JS-transform engine
(`scripts/widgets/gallery/gallery-loop.js`) that owns position as an integer index and
moves the track with `translate3d`. The centered item is scaled up and is the only card
that reveals its hover CTA. Navigation loops endlessly via prev/next buttons, keyboard
arrows, or pointer drag/swipe (one step per gesture). Items must be uniform width — the
block CSS enforces this with `--loop-card-width`.

The styling that `template-x-carousel` exposes behind its `centered-toolbar`, `full-bleed`,
and `v2` variant classes is the **default** here — no variant class needed: the toolbar is
centered, the carousel is full-bleed (`100vw`), and cards use the v2 look (persistent bottom
label bar, hover-darken overlay). Snap-specific bits (e.g. first-child left margins) are
intentionally omitted since centering handles edge spacing.

## Authoring

| Row | Content |
| --- | --- |
| 1 | Toolbar: heading (`h1`/`h2`/`h3`) and optional description (`p`) |
| 2 | Recipe string, e.g. `tasks=card&orderBy=-remixCount&limit=10&collection=default` |
| 3 | (optional) "View all" link |
| 4 | (optional) Extra query params appended to template CTA links |

## Functions

### `createTemplates(recipe, customProperties = null)`
Fetches a recipe, filters to valid templates, and renders each into a template element.

### `createTemplatesContainer(recipe, queryParams = '')`
Builds the templates container, resolves localized prev/next labels via `replaceKey`, and
wires up the loop gallery engine. Uses a custom cart URL config on desktop/Android and
default links on iOS. Returns `{ templatesContainer, control }`.

### `extractQueryParams(row)`
Reads and removes the optional query-params row, returning its trimmed text.

### `renderTemplates(el, recipe, toolbar, queryParams = '')`
Renders templates, appends the control into the toolbar, and handles load errors (removes
the block in prod, shows an error message otherwise).

### `init(el)`
Block entry point. Parses the authored rows (toolbar/heading/description, recipe, view-all,
query params) and renders the loop carousel.

## Engine: `buildLoopGallery(items, container, options)`
Generic, block-agnostic JS-transform carousel.
- `options.labels` — `{ prev, next }` aria-labels for the controls.
- Returns `{ control, destroy }`. Call `destroy()` to disconnect the resize observer.
- Assumes uniform item width; clones a measured buffer of items onto each end for the
  seamless loop, marking clones `inert` + `aria-hidden` so they stay out of the tab order
  and accessibility tree.
