# Design Tokens Reference

Express design tokens live in `express/code/styles/styles.css`, defined as
CSS custom properties on `:root`. They are the **single source of truth**
for the design system, and most of them mirror the variables in the Figma
design system.

## Two generations of tokens coexist

The `:root` block has accreted over time and contains **two naming
generations** that you must recognize:

- **Older, kebab-case tokens** near the **top** of `:root` —
  `--color-gray-100`, `--spacing-300`, `--heading-font-size-l`,
  `--border-radius-10`. These predate the current Figma variable system.
- **Newer, Figma-mirrored tokens** near the **bottom** of `:root` —
  `--Palette-gray-100`, `--Corner-radius-corner-radius-100`,
  `--Alias-content-typography-Body`, `--Global-Typography-Size-Headings-Heading-L`.
  These are named to match Figma variables almost character-for-character.

**Ordering convention: newest at the bottom, oldest at the top.** When two
candidate tokens are otherwise equally valid, prefer the **newer (lower)**
one — it reflects the current Figma naming and is less likely to be
deprecated. If you add a token, add it at the **bottom** of `:root`.

Because Figma names map directly onto the newer tokens, your first move is
always to match by **name**, not by value.

---

## Token mapping algorithm

For **every** variable/value Figma reports for a property you are styling,
work through these steps **in order** and stop at the first that succeeds.
Record the outcome of each one for the token-mapping report (see below).

### Step 0 — Get the Figma variable names

In Phase 3, call **`get_variable_defs`** for each frame (in addition to
`get_screenshot` and `get_design_context`). It returns the **named
variables** Figma applied, e.g.:

```
Palette/gray-100          → #E9E9E9
Corner-radius/corner-radius-100 → 8px
Alias/content-typography-Body   → #505050
spacing/spacing-300       → 16px
```

The variable **name** is what powers Step 1. `get_design_context` gives you
the raw value and the CSS property it applies to; `get_variable_defs` gives
you the name. You need both.

> If `get_variable_defs` returns nothing for a node (some layers use raw
> values with no bound variable), skip to Step 2 and match by value.

### Step 1 — Exact name match (case-insensitive)

Normalize the Figma variable name and look for an identical CSS custom
property in `:root`:

1. Replace `/` and spaces with `-`.
2. Prepend `--`.
3. Compare **case-insensitively** against existing `--*` names.

Examples:
| Figma variable | Normalized | Existing token? |
|---|---|---|
| `Palette/gray-100` | `--Palette-gray-100` | ✅ exact |
| `Corner-radius/corner-radius-100` | `--Corner-radius-corner-radius-100` | ✅ exact |
| `Alias/content-typography-Body` | `--Alias-content-typography-Body` | ✅ exact |
| `spacing/spacing-300` | `--spacing-spacing-300` | only `--spacing-300` / `--Spacing-spacing-300` exist → not exact, go to Step 2 |

If you find a case-insensitive exact match, **use it** and record it as an
exact-name match. This is the strongly preferred outcome.

### Step 2 — Value match within the correct semantic category

No exact name match. Search `:root` for a token whose **value** equals (or
is within ~1px / a rounding hair of) the Figma raw value — **but only among
tokens whose semantic category fits the CSS property** you are setting.

This guardrail is critical: many tokens share a value. `16px` is the value
of `--spacing-300`, `--Corner-radius-corner-radius-200`, and
`--Global-Typography-Size-Body-Body-M` all at once. Picking the wrong one
is a real bug even though the rendered pixels match.

**Semantic category → allowed CSS properties:**

| Category | Token families (examples) | Use for | Never use for |
|---|---|---|---|
| **Spacing** | `--spacing-*`, `--Spacing-*`, `--ax-grid-margin/-gutter` | `padding`, `margin`, `gap`, `row-gap`, `column-gap`, `inset`/`top/left/...` offsets | width, height, border-radius, border-width, font-size, line-height |
| **Radius** | `--Corner-radius-*`, `--corner-radius-*`, `--Radius-*`, `--border-radius-*`, `--corner-radius-80` | `border-radius` only | spacing, size |
| **Color** | `--color-*`, `--Palette-*`, `--palette-*`, `--Alias-content-*`, `--Background-*`, `--Buttons-*`, `--text-color-*`, `--gradient-*`, `--S2-Buttons-*`, `--transparent-*` | `color`, `background`/`-color`, `border-color`, `fill`, `stroke` | any non-color property |
| **Font size** | `--body-font-size-*`, `--heading-font-size-*`, `--ax-*-size`, `--typography-*`, `--Global-Typography-Size-*` | `font-size` only | line-height, spacing |
| **Line height** | `--ax-*-lh`, `--*-line-height-*`, `--Global-Typography-Line-height-*`, `--heading-line-height`, `--body-line-height` | `line-height` only | font-size |
| **Font weight** | `--heading-font-weight*`, `--body-font-weight`, `--subheading-font-weight`, `--font-weight-medium`, `--ax-*-weight` | `font-weight` only | — |
| **Width / max-width** | `--block-*-max-width`, `--ax-grid-*-col-width`, `--ax-grid-container-width` | `width`, `max-width`, `flex-basis` | padding/margin/gap |
| **Shadow / elevation** | `--Alias-drop-shadow-*`, `--Elevation-*`, `--Modal-*-shadow-*` | `box-shadow` | — |
| **Border width** | `--border-width-2` | `border-width` | — |

When a value matches a token **outside** the property's category, that is
**not** a valid match — continue to Step 3.

Also sanity-check **role**, not just category: `--Alias-content-typography-Body`
(#505050) is for body text color specifically — don't reach for it just
because you need some gray. Prefer the token whose name describes the role
you are filling.

When you use a value match, record: the Figma variable name (or "(unnamed)"),
the raw value, and which token you substituted.

### Step 3 — No suitable token: evaluate adding one

No exact-name match and no value match in the right category. Decide
between two outcomes and **flag it for the user either way** (see report):

- **Add a new token** when the value is clearly a reusable design-system
  value (a named Figma variable that simply isn't in `styles.css` yet, or a
  value you expect to recur). Add it at the **bottom** of `:root`, named to
  mirror the Figma variable (Step 1 normalization). Prefer aliasing an
  existing primitive if one holds the value
  (e.g. `--Corner-radius-corner-radius-200: var(--spacing-300);` style).
- **Hardcode with a comment** when it's a true one-off with no Figma
  variable behind it:
  ```css
  /* No token for this 6px radius — Figma value, verify with design */
  border-radius: 6px;
  ```

Adding to `:root` in `styles.css` touches a global file — **never add a
token silently.** Surface it in the report and let the user confirm before
you commit a new `:root` entry.

---

## Token-mapping report

This is a required deliverable, folded into the Phase 9 summary. Its
purpose is to make every non-obvious token decision auditable.

Produce a table covering **every Figma variable/value you encountered that
did not resolve via a Step 1 exact-name match** (exact-name matches are the
happy path and don't need individual reporting — just note the count):

```
Figma variable            | Raw value | CSS property      | Resolution                              | Needs decision?
──────────────────────────────────────────────────────────────────────────────────────────────────────────────
spacing/spacing-300        | 16px      | padding           | value-match → --spacing-300             | no
(unnamed)                  | #2C2C2C   | color             | value-match → --c1-text-text            | review: odd one-off token
Card/corner-radius-large   | 12px      | border-radius     | NEW TOKEN proposed: --Card-corner-...   | YES — confirm before commit
(unnamed)                  | 6px       | border-radius     | hardcoded (no token, no Figma var)      | YES — verify w/ design
Heading/size-display       | 64px      | font-size         | no category match; closest --heading... | YES — value differs, confirm
```

Columns:
- **Figma variable** — the name from `get_variable_defs`, or `(unnamed)` if
  the layer used a raw value.
- **Raw value** — from `get_design_context`.
- **CSS property** — what you were styling.
- **Resolution** — one of: `value-match → --token`, `NEW TOKEN proposed: --token`,
  `hardcoded`, or a near-miss note.
- **Needs decision?** — `YES` for anything that adds a `:root` token,
  hardcodes a value, or substitutes a token whose value isn't an exact match;
  `review` for a match you're not fully confident is semantically right;
  `no` for clean in-category value matches.

Anything marked `YES` must be raised with the user **before** it ships,
since it either changes the global stylesheet or leaves an unmatched value.

---

## Quick token inventory

A non-exhaustive map of what exists today, to orient value searches. Always
read the live `:root` in `styles.css` — this list drifts.

### Colour
`--color-white`, `--color-black`, `--color-gray-100`…`--color-gray-950`
(plus `-variant` shades), `--text-color-secondary`, `--color-info-accent`
(+ `-hover/-down/-reverse/-light`), `--color-info-primary/-secondary`
(+ states), `--color-info-premium`, `--color-blue-600/-700/-800`,
`--color-green-800/-900/-1000`, `--color-orange-700`, `--color-purple-1000`,
`--color-focus-ring-strong`, `--color-brand-title`, `--gradient-highlight-*`.
Newer Figma-mirrored: `--Palette-gray-100`…`-1000`, `--Palette-blue-1000`,
`--Alias-content-typography-Title/-Heading/-Body`,
`--Alias-content-neutral-default/-hover`, `--Background-accent-default`,
`--Background-secondary-default`, `--Buttons-default/-hover`,
`--S2-Buttons-*`.

### Spacing
`--spacing-0` (0px), `-50` (2px), `-75` (4px), `-80` (6px), `-100` (8px),
`-200` (12px), `-250` (14px), `-300` (16px, base), `-325` (18px),
`-350` (20px), `-400` (24px), `-500` (32px), `-600` (40px), `-700` (48px),
`-800` (64px), `-900` (80px), `-1000` (96px).

### Radius
`--border-radius-10` (10px), `--border-radius-max` (999px),
`--Corner-radius-corner-radius-100` (8px), `-200` (16px), `-500` (100px),
`--Radius-corner-radius-75` (4px), `--corner-radius-80` (6px),
`--SN-Radius-corner-radius-full` (2000px).

### Typography (legacy rem scale)
Body: `--body-font-size-xxl` (1.5rem) → `--body-font-size-xs` (0.75rem).
Heading: `--heading-font-size-xxxl` (5rem) → `--heading-font-size-xs`
(1.25rem), plus `--heading-font-size-ml` (2rem) and `-2xl` (45px).

### Typography (`ax-` px scale, mirrors current Figma)
`--ax-heading-{xxxl…xxs}-size` / `-lh`, `--ax-body-{xxl…xxs}-size` / `-lh`,
`--ax-detail-{xl…s}-size` / `-lh`, weights `--ax-heading-weight` (700),
`--ax-body-weight` (400), `--ax-body-weight-bold` (700),
`--ax-detail-weight` (700).

### Font family / weight
`--body-font-family` (Adobe Clean — use for body **and** headings),
`--body-serif-font-family`, `--heading-font-weight` (800),
`--heading-font-weight-extra` (900), `--heading-font-weight-medium` (700),
`--heading-font-weight-regular` (400), `--body-font-weight` (normal),
`--subheading-font-weight` (700), `--font-weight-medium` (500).

Headings have **no** dedicated font-family token — they use
`--body-font-family` with a heavier `--heading-font-weight*`.

> **Known exception — do not flag the font family.** Figma's design system
> uses **Adobe Clean Spectrum VF** (the Spectrum 2 variable font), which has
> no matching token; the codebase uses `--body-font-family` ('adobe-clean').
> This is a **known, intentional** difference between design and dev that we
> are not addressing yet. When Figma reports a Spectrum VF font family
> (`Family/font-family-*`, `Font family/Sans serif`, etc.), silently map it
> to `--body-font-family` and **omit it from the token-mapping report** — do
> not raise it as a gap or a decision.

### Width / shadow / misc
`--block-{sm/md/lg/wd}-max-width`, `--block-wd-grid-max-width`,
`--ax-grid-*` (margins, gutters, n-col widths),
`--Alias-drop-shadow-*`, `--Elevation-Dialog`, `--Modal-*-shadow-*`,
`--border-width-2`.

---

## Responsive behaviour

Spacing and font tokens do **not** change value per breakpoint in the token
layer (a few `--ax-grid-*` values do, in `@media` `:root` blocks). When
Figma shows different sizes at different viewports, switch **which token**
you reference inside a media query:

```css
.my-block .heading { font-size: var(--heading-font-size-m); }

@media (width >= 900px) {
  .my-block .heading { font-size: var(--heading-font-size-l); }
}
```

---

## Checklist before submitting block CSS

- [ ] Ran `get_variable_defs` for every frame; have Figma variable names, not just values.
- [ ] Every value resolved through the algorithm: exact-name → in-category value-match → new token / hardcoded.
- [ ] No value-match crosses semantic categories (no spacing token on a radius, etc.).
- [ ] Colours map to a colour-family token (matched by role, not just hue) or are flagged.
- [ ] Font families use only `--body-font-family` (or `--body-serif-font-family`).
- [ ] Font weights use the weight tokens.
- [ ] Any new `:root` token was confirmed with the user before commit and added at the bottom of `:root`.
- [ ] Token-mapping report compiled for the Phase 9 summary, with every `YES`/`review` row called out.
