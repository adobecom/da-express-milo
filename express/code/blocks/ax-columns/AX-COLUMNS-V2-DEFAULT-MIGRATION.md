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
