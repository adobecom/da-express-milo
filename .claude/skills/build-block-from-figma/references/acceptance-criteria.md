# Acceptance Criteria

Load this reference at the start of Phase 4 (Build the component).
All rules here apply to the block's JS and CSS files.

---

## JS rules

- **Entry point**: `export default async function decorate(block)`.
  This is the module's only public export.
- Import Express utilities statically from `../../scripts/utils.js`.
  Lazy-load milo utilities via `await import(\`${getLibs()}/utils/utils.js\`)`.
- Call `decorateButtonsDeprecated(block)` early to convert `<em>/<strong>`
  link markup into button elements before any DOM restructuring.
  `decorateButtonsDeprecated` delegates to milo's `decorateButtons` first,
  which wraps CTA anchor parents with the class **`action-area`** (not
  `button-container`). Any DOM classification logic (e.g. splitting a
  foreground into text-content vs cta-container) and any CSS targeting the
  CTA row must use `.action-area` as the selector. Always verify the actual
  class name by inspecting `decorateButtonsDeprecated` output in a running
  block before writing selectors.
- **Never use `.innerHTML`** — destroys Preact/Lit components.
  Use `.append()`, `cloneNode(true)`, or `createTag` to build DOM.
- **No hardcoded user-visible text** — all text must come from the
  authored DOM (already in the block when `decorate` runs) or from
  `replaceKey`/`replaceKeyArray` placeholders.  This includes aria-labels,
  button text, and alt attributes.
- **Icons**: use `getIconElementDeprecated('icon-name')` — never create
  raw `<img>` tags for icons.  Call `fixIcons(block)` at the end of
  `decorate` if icon `<img>` elements are present in the authored content.
- **Cart CTAs**: any link that is a dynamic cart link must be enhanced
  with `await formatDynamicCartLink(cta)` (imported from
  `../../scripts/utils/pricing.js`).
- **Branch tracking**: `await trackBranchParameters([...ctaLinks])` on
  every CTA anchor before it is shown to the user.
- **Media parity across breakpoints**: cross-check the element
  inventory from Phase 3. If an image or media element appears in
  the Figma frame for **every** provided breakpoint, the implementation
  must render that media at every breakpoint too.  Do not hide media
  via CSS (`display: none`) at larger breakpoints unless the Figma
  frame explicitly omits it.
- **LCP blocks (first section)**: if the block is likely to appear in the first viewport,
  never `await` before inserting the core DOM structure.  Create and append the basic visual
  structure synchronously first, then enhance with data asynchronously:
  ```js
  export default async function decorate(block) {
    // 1. Immediate: insert core structure (LCP element visible now)
    const foreground = createTag('div', { class: 'foreground' });
    block.append(foreground);
    // 2. Deferred: fetch data and enhance
    const data = await fetchData();
    enhance(foreground, data);
  }
  ```
  Anti-pattern: `const data = await fetchData(); block.append(ui);` — delays LCP.
- Keep logic minimal — this is a presentational block.
- No self-initialisation — `decorate` is called externally by EDS.

## JS quality checklist

- Cache DOM queries — never query inside loops.
- Use event delegation on the block root, not per-child listeners.
- No synchronous layout thrashing: batch DOM reads before DOM writes.
  Never interleave `offsetHeight` / `getBoundingClientRect` reads
  with style writes in the same loop.
- `decorate()` should be lean; extract helpers for complex logic but
  keep the module's public surface to `export default async function decorate(block)`.
- ESLint must pass with zero errors.

---

## CSS rules

Refer to `references/design-tokens.md` (loaded in Phase 2) for full
token rules and `references/grid-system.md` for the grid/container system.

- **Mobile-first**: base styles target mobile (< 768 px).
- Use **`min-width:` syntax** — this is the convention throughout the codebase:
  ```css
  @media (min-width: 600px)  { /* tablet */ }
  @media (min-width: 900px)  { /* desktop */ }
  @media (min-width: 1200px) { /* large desktop */ }
  @media (min-width: 1680px) { /* wide */ }
  ```
- Only include breakpoints for which a Figma frame was provided.
- Use Express tokens for everything — `--color-*`, `--spacing-*`,
  `--body-font-size-*`, `--heading-font-size-*`, `--body-font-family`,
  `--heading-font-weight`.  See `references/design-tokens.md`.
- Add breakpoint-specific token overrides whenever Figma shows
  different sizes at different viewports (tokens do not auto-switch
  in Express — you must override per breakpoint).

## CSS quality checklist

- No `!important`.
- No inline styles.
- Use **CSS nesting** only when it reduces repetition. Do **not**
  nest a child rule whose selector already starts with the parent's
  class name — write it as a flat top-level rule instead. Block
  class names already namespace their children, so
  `.block { & .block-child { ... } }` is pure noise; write
  `.block-child { ... }` at the top level.
  Only nest when the child selector genuinely needs the parent for
  scoping — e.g. `&:hover`, `&[aria-expanded="true"]`, `&.variant`,
  `& > p`.
- **Omit `&` in nested selectors** unless it's required for
  compound selectors (pseudo-classes, pseudo-elements, attribute
  selectors, or class chaining on the same element). For
  descendant or child combinators, drop the `&`: write
  `.block-trigger { .icon { ... } }` rather than
  `.block-trigger { & .icon { ... } }`. Required `&` cases:
  `&:focus-visible`, `&::before`, `&[aria-expanded="true"]`,
  `&.is-open`.
- Use `:is()` and `:has()` where they reduce duplication.
- Selector chain depth ≤ 3.
- Use **CSS logical properties** (`margin-inline`, `padding-block`,
  `inset-inline-start`, etc.) instead of physical properties.
- No magic numbers — every value maps to a token or has an
  explanatory comment.
- Scope block-level custom properties with a block-name prefix
  (e.g. `--ax-hero-gap`).
- Nesting depth ≤ 3 levels.
- Prefer `transform` and `opacity` for animations
  (compositor-friendly, won't hurt CLS).
- No bare/unqualified tag selectors (`p`, `div`); always scope
  under the block class.
