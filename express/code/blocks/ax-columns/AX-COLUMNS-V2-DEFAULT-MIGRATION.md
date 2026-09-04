# ax-columns: v2 spacing model promoted to default

## Why

`v2` was an opt-in authorable variant (`.ax-columns.v2`) providing a
self-contained, symmetric top/bottom spacing model (32px mobile/tablet,
64px desktop) that didn't rely on the legacy section-spacing override chain.
Design has confirmed v2's model is the correct baseline going forward.
This change promotes it to be the default `.ax-columns` behavior and removes
the legacy chain it was built to route around, instead of maintaining both
side by side indefinitely.

For bare `.ax-columns` (no variant class): per team direction, out of scope
for this change since it's authored on very few pages.

## What changed

- Base `.ax-columns` now carries the spacing model that used to live under
  `.ax-columns.v2` (custom prop `--ax-columns-v2-spacing`, symmetric
  top/bottom padding, `max-width: 599px`, `gap: 16px`, zero column padding,
  16px image border-radius).
- `.marquee` and `.color` (which manage their own outer spacing) explicitly
  zero out the new top/bottom padding rather than stacking on top of it.
- Removed the legacy section-spacing-variant override chain that `v2` used
  to opt out of via `:not(.v2)`:
  - `.section:not(:first-child)... .ax-columns:first-child:not(.v2) { padding-top: 60px; }`
  - `.section:has(...)... .ax-columns:last-child / .content:last-child { padding-bottom: var(--spacing-600); }` (had an 8-variant exclusion list)
  - `.section:not(...) .ax-columns.highlight:last-child, .dark:last-child { padding-bottom: 40px; }`
  - `.section .ax-columns:not(.v2)>div { padding: var(--spacing-600) 0; }`
- Removed `.section .ax-columns` from the tablet/desktop max-width overrides
  (it was there only so bare/legacy instances matched those breakpoints;
  `.top.center`, `.fullsize.center`, `.light` keep their own rules).
- Desktop `--ax-columns-v2-spacing` override (`--spacing-800`) now targets
  base `.ax-columns` instead of `.ax-columns.v2`.

## Bugs fixed as a side effect

1. **`.marquee` double-padding** — previously got both the legacy
   `padding-bottom: var(--spacing-600)` chain *and* its own explicit
   vertical spacing, stacking to more space than designed. Now zeroed
   explicitly against the new base padding.
2. **`.color` dead-CSS / specificity bug** — `.color` was in the legacy
   chain's exclusion list, but a *later*, equal-specificity rule was
   re-adding `padding-bottom: var(--spacing-600)` anyway due to source
   order, silently overriding the intended exclusion. Now moot — `.color`
   explicitly zeroes the new base padding instead.
3. **`.numbered`/`.centered` asymmetric bottom padding** — previously
   inherited the legacy chain's `padding-bottom: var(--spacing-600)` on
   `:last-child` but not an equivalent top value, giving them uneven
   vertical spacing depending on section position. Now symmetric via the
   shared base model.
4. **`main .ax-columns a.con-button.fill` hover-color regression** — a
   leftover pre-`milo-buttons` rule (`a.button.fill` renamed to
   `a.con-button.fill` during that merge, not removed) was still
   overriding hover/active background-color, fighting the new `.s2` button
   system's own hover styles. Removed; `.s2` (applied via
   `block.classList.add('s2')` in `ax-columns.js`) now owns button styling
   end-to-end.
5. **`.temporary-font-generator-styles` redundant button CSS** — same
   root cause as #4 for this block's own scoped button-color rules; the
   CTA is authored with `#_button-fill`, which `.s2` already styles via
   `styles.css`. Removed the redundant rules, left a comment pointing at
   the replacement.

## Explicitly out of scope (left untouched)

- Desktop `.ax-columns:not(.fullsize):not(.marquee) .column:not(.column-picture):not(.hero-animation-overlay):not(.text) { padding: var(--spacing-600); }`
  — touches `.enterprise` desktop column padding; no live verification done, left alone.
- `.long-form ax-columns:last-child { padding-bottom: var(--spacing-600); }`
- `.extra-wide:first-child:not(:empty) { padding-top: 0; }`
- Bare `.ax-columns` (no variant class) — used on very few pages per team direction.
- `#3` in the earlier monkey-patch audit — the `fullsize+top+width-3-columns`
  height-equalizer in `ax-columns.js` — appears dead (no page authors both
  classes together, and `.s2` is now added unconditionally so the exact
  className match can't recur), but left in place with a comment flagging
  it for team-approved deletion, relocated to the end of `decorate()`.

## Impact estimate (from `content/express` mirror, class-combo counts)

| Variant combo | Pages | Effect |
|---|---|---|
| `.marquee` | ~190 | Spacing bug fixed (was double-padded); visually tightens slightly |
| `.fullsize` | ~9 | Minor — inherits new base model, low usage |
| `.centered` | ~23 | Width unaffected (own explicit max-width rule always wins); gap/column-padding/image-radius/vertical-spacing change to v2's model |
| `.top` (bare, no `.center`) | ~18 | Adopts v2 spacing model |
| `.v2` (explicit, now redundant) | ~2 | No visible change — same computed styles as before |
| `.temporary-font-generator-styles` | ~1 | Button styling now delegated to `.s2`, no visual change expected |

## Follow-up: CSS reorganized into per-variant sections

`ax-columns.css` has since been restructured so every variant's rules are
grouped under a `/* Variant: X */`-style comment header, instead of being
scattered across the file in the order they were originally added. The file's
existing mobile-first structure (base rules, then `@media (min-width: 600px)`,
then `@media (min-width: 1200px)`, plus a handful of narrower one-off media
queries) is unchanged — only the ordering *within* each of those media
contexts changed, plus a small number of shared multi-selector rules were
split into per-variant copies (identical declared values, e.g. the old
`.marquee, .color { padding-top: 0; padding-bottom: 0; }` became two rules)
so each variant's CSS lives in one place.

This was verified two ways, not just by inspection, because CSS cascade order
matters whenever two selectors of equal specificity target the same element:
- A static specificity/order analyzer that flags any pair of same-media,
  equal-specificity, potentially-overlapping selectors whose relative order
  changed. It found 5 real order flips (all from cases where a "generic"
  selector happened to have the *same* specificity as a variant-scoped one,
  not more) — an enterprise `>div` gap rule, a color-variant column padding
  rule, and three column-picture margin/padding rules shared by
  marquee/highlight/fullsize. Each was pinned back to its original relative
  cascade position.
- A before/after computed-style diff (Playwright, real `ax-columns.css`)
  across marquee, color, enterprise, centered, fullsize, fullsize+top,
  top.center, light, dark, highlight, highlight+dark, offer, extra-wide,
  width-2-columns, has-ribbon-banner, top, center, and
  temporary-font-generator-styles, at 375px and 1400px — 38 combinations,
  zero differences after the fixes above.

As part of this pass, the `.enterprise` padding/max-width specificity bug
noted above (dead `.section .ax-columns.enterprise { padding-left: var(--spacing-900); ...}`
rule, always overridden by a `main`-prefixed rule of equal class-specificity)
was consolidated into a single rule reflecting the actually-live values
(`padding: 0`, `max-width: unset`), confirmed via the same computed-style
check before deleting the dead one.

Also reduced `.section:has(...)` usage where the effect could be scoped to
the block/element itself instead:
- Dropped the redundant `:has(.ax-columns)` from every `.ax-max-entitled`
  selector whose own trailing part already required an `.ax-columns`
  descendant (e.g. `.section.ax-max-entitled:has(.ax-columns) .ax-columns`
  → `.section.ax-max-entitled .ax-columns`) — the `:has()` added nothing
  there. Left `:has(.ax-columns)` in place on the `.ax-max-entitled`
  selectors that target a *generic* descendant (`.column`, `.column-picture`,
  `h2`) instead of `.ax-columns` itself, since those aren't provably
  redundant (they exist to distinguish "this section has an ax-columns
  block" from any other block that might also produce a `.column`/`h2`).
- **Did not** convert `.section:has(.ax-columns.marquee) { padding-top/bottom }`
  to a `margin-top/bottom` on `.ax-columns.marquee` itself, despite that
  looking like an obvious candidate: 6 real pages
  (`express/create/background/zoom`, `.../flyer`, `.../banner`,
  `express/create/background`, `express/create/flyer/event`,
  `express/create/flyer/business`) author a `Background` color on the same
  section as the marquee. Margin (unlike padding) collapses through a
  parent with no border/padding of its own, which would make that spacing
  render *above* the section's painted background instead of inside it —
  a real visual regression on those 6 pages. Left as `:has()`.
- Left `.section:has(.ax-columns)>.content`, the `.legal`/heading rules
  under `:has(.ax-columns.highlight)`, the `steps-container` integration
  rules, and the `.long-form` content-padding rule untouched — all of these
  style a *sibling* of the block (`.content`, `.legal`, headings elsewhere
  in the section), not the section's own box, so there's no block-scoped
  equivalent to move them to.

Removed two more instances of dead CSS surfaced along the way:
- `.section:not(:first-child):not(...) .ax-columns.has-ribbon-banner:first-child { padding-top: 0; }`
  — `has-ribbon-banner` is added by `ax-columns.js` to any ax-columns block
  on a page that has a `.ribbon-banner` anywhere in `main`, but no page in
  `content/express` combines a `ribbon-banner` block with an `ax-columns`
  block (the one page that authors `ribbon-banner` pairs it with
  `grid-marquee` instead, and the only other `ribbon-banner` references are
  three unreferenced promo fragments).
- `.section:not(...):first-child .ax-columns:first-child { padding-top: 0; }`
  and `.section:not(...).long-form .ax-columns:last-child { padding-bottom: var(--spacing-600); }`
  — the `.long-form` rule had zero live matches (no page has an `ax-columns`
  block inside a `.long-form`-styled section at all); the first-child rule
  affected 7 pages (`spotlight/switch-now`, the `acrobat-express-jdi`
  homepage-columns fragment, `fragments/max-entitled-campaign`,
  `fragments/max-campaign`, `create/calendar`, `why-choose-express`,
  `express-is-better`), which now get the base v2 top padding on their
  first block instead of an explicit 0 — an intentional visual change per
  the "make v2 the default" direction above, not a bug.

## Dead code removed: `.enterprise` > `.content` rules

Checked every page that authors `.ax-columns.enterprise` or sits inside a
`.ax-max-entitled` section:

- `content/express/business.html`
- `content/express/spotlight/business.html`
- `content/express/why-choose-express.html`
- `content/express/entitled.html`
- `content/express/fragments/max-entitled-campaign.html`
- `content/express/fragments/max-campaign.html`
- `content/express/fragments/personalization/acrobat-express-jdi/acrobat-express-jdi-homepage-columns-desktop.html`

On every one of these, the section containing the block has exactly two
authored rows: the `ax-columns` block itself, and a `section-metadata` row.
`section-metadata` is consumed during decoration to set attributes/classes on
the section — it never renders as a `.content` div. None of the seven pages
has a third, plain-content row, and none authors a `.legal` block anywhere
near an `.enterprise`/`.ax-max-entitled` section. That means a `.content`
sibling of an `.enterprise` block never exists on any page that currently
uses this variant, so these rules were fully dead code (not merely
"unverifiable" as first assessed) and have been deleted outright:

- `main .section:has(.ax-columns.enterprise):not([data-padding='none'])>.content { padding-top: 0; }`
- `main .section:has(.ax-columns.enterprise):not([data-padding='none'])>.content h2 { font-size: var(--heading-font-size-s); padding-top: var(--heading-font-size-xl); }` (base tier)
- `.section:has(.ax-columns.enterprise) .content h2 { margin-top: 0; padding-top: var(--spacing-900); }` (base tier)
- the mobile (`max-width: 600px`) and tablet (`min-width: 600px`) duplicates
  of the `.content h2` rule

The `.legal`-related rules under `:has(.ax-columns.highlight)` were **not**
touched — those are scoped to `.highlight`, not `.enterprise`, and this
verification pass only covered the `.enterprise`/`.ax-max-entitled` page set,
not `.highlight` pages generally.

## Verification performed

- `stylelint` clean (pre-existing duplicate-selector warnings: 4, down from
  baseline 5 — one incidentally fixed by this change).
- Unit test suite: 22/22 passing.
- Computed-style Playwright harness across 14 variant combinations × 2
  viewports (375px / 1400px) — confirmed no double-padding or zero-padding
  regressions, and confirmed the 3 CSS bugs above are fixed.
- Visual verification (screenshots):
  - `http://localhost:3000/docs/library/kitchen-sink/ax-columns` (full page + individual variant crops, mobile & desktop)
  - `http://localhost:3000/express/create/post` (real `.marquee` page)
  - `http://localhost:3000/express/fragments/tests/2025/q2/aexg5181v3/invitation-create` (real `.centered` fragment)
  - `http://localhost:3000/express/feature/font/generator` (`.temporary-font-generator-styles`, confirms `.s2` button styling)
