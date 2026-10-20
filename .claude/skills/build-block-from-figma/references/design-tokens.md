# Design Tokens Reference

Express design tokens live in `express/code/styles/styles.css`, defined as
CSS custom properties on `:root`. S2A tokens are provided separately by
`https://www.adobe.com/libs/c2/styles/s2a-tokens.css`. Use the stylesheet
that defines the exact Figma variable; `styles.css` is not the source for
S2A definitions.

## Express token generations and external S2A tokens

The Express `:root` block contains **two naming generations** that you
must recognize:

- **Older, kebab-case tokens** near the **top** of `:root` —
  `--color-gray-100`, `--spacing-300`, `--heading-font-size-l`,
  `--border-radius-10`. These predate the current Figma variable system.
- **Newer, Figma-mirrored tokens** near the **bottom** of `:root` —
  `--Palette-gray-100`, `--Corner-radius-corner-radius-100`,
  `--Alias-content-typography-Body`, `--Global-Typography-Size-Headings-Heading-L`.
  These are named to match Figma variables almost character-for-character.

**Ordering convention applies only within Express `styles.css`: newest at
the bottom, oldest at the top.** When two Express candidates are otherwise
equally valid, prefer the **newer (lower)** one. If you add a new Express
token, add it at the **bottom** of `:root`. S2A variables are external and
must be looked up in the S2A stylesheet, not copied into `styles.css`.

For either source, first match Figma variables by **exact name**, not by
value.

---

## Token mapping algorithm

For **every** variable/value Figma reports for a property you are styling,
match named variables exactly. When Figma supplies a hardcoded value
without a variable, use that exact value in CSS rather than searching for
a different variable with an equal or similar value. Record the outcome
for the token-mapping report (see below).

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
> values with no bound variable), use the exact raw Figma value in CSS.

### Step 1 — Exact name match (case-insensitive)

Normalize the Figma variable name and look for an identical CSS custom
property in the relevant source: Express `:root` in
`express/code/styles/styles.css` or the S2A stylesheet at
`https://www.adobe.com/libs/c2/styles/s2a-tokens.css`.

1. Replace `/` and spaces with `-`.
2. Prepend `--`.
3. Compare **case-insensitively** against existing `--*` names.

Examples:
| Figma variable | Normalized | Existing token? |
|---|---|---|
| `Palette/gray-100` | `--Palette-gray-100` | ✅ exact |
| `Corner-radius/corner-radius-100` | `--Corner-radius-corner-radius-100` | ✅ exact |
| `Alias/content-typography-Body` | `--Alias-content-typography-Body` | ✅ exact |
| `spacing/spacing-300` | `--spacing-spacing-300` | `--Spacing-spacing-300` is an exact case-insensitive match in Express |

If you find a case-insensitive exact match, **use it** and record it as an
exact-name match. This is the strongly preferred outcome. Look up S2A
variables in the external stylesheet using their Figma names and the
normalization rules above.

### Step 2 — Use a hardcoded Figma value or flag an unmatched variable

- If Figma provides a raw value without a bound variable, use that exact
  value in CSS. Do not substitute a different variable because it happens
  to have the same or a similar value.
- If Figma names a variable that is absent from both the Express and S2A
  stylesheets, flag the missing variable for review. Do not invent a
  substitute or duplicate an S2A definition in Express `styles.css`.
- A new Express `:root` token may still be proposed for a reusable,
  non-S2A design-system value, but it requires user confirmation before
  being added.

---

## Token-mapping report

This is a required deliverable, folded into the Phase 9 summary. Its
purpose is to make every non-obvious token decision auditable.

Produce a table covering **every named Figma variable that did not resolve
to an exact CSS custom property** and every hardcoded Figma value. Exact
matches are the happy path and only need to be counted:

```
Figma variable            | Raw value | CSS property      | Resolution                              | Needs decision?
──────────────────────────────────────────────────────────────────────────────────────────────────────────────
Palette/gray-100              | #E9E9E9  | color             | exact match → --Palette-gray-100        | no
(unnamed)                   | 6px      | border-radius     | hardcoded exact Figma value             | no
Heading/size-display        | 64px     | font-size         | no match in either stylesheet           | YES — review missing variable
```

Columns:
- **Figma variable** — the name from `get_variable_defs`, or `(unnamed)` if
  the layer used a raw value.
- **Raw value** — from `get_design_context`.
- **CSS property** — what you were styling.
- **Resolution** — one of: `exact match → --token`, `hardcoded exact Figma
  value`, `NEW TOKEN proposed: --token`, or `missing named variable`.
- **Needs decision?** — `YES` for a missing named variable or proposed new
  Express token; `no` for exact matches and hardcoded Figma values.

Anything marked `YES` must be raised with the user **before** it ships,
since it either changes the global stylesheet or leaves a named design
variable unresolved.

---

## Quick token inventory

A non-exhaustive map of Express tokens, to orient name searches. Always
read the live `:root` in `styles.css` — this list drifts. For S2A names,
consult the external stylesheet rather than relying on this inventory.

### Colour
`--color-white`, `--color-black`, `--color-gray-100`…`--color-gray-950`
(plus `-variant` shades), `--text-color-secondary`, `--color-info-accent`
(+ `-hover/-down/-reverse/-light`), `--color-info-primary/-secondary`
(+ states), `--color-info-premium`, `--color-blue-600/-700/-800`,
`--color-green-800/-900/-1000`, `--color-orange-700`, `--color-purple-1000`,
`--color-focus-ring-strong`, `--color-brand-title`, `--gradient-highlight-*`.
Newer Express Figma-mirrored: `--Palette-gray-100`…`-1000`, `--Palette-blue-1000`,
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

S2A custom properties use the `--s2a-*` prefix. Consult the external S2A
stylesheet for their exact names and values; this inventory does not
enumerate them.

### Width / shadow / misc
`--block-{sm/md/lg/wd}-max-width`, `--block-wd-grid-max-width`,
`--ax-grid-*` (margins, gutters, n-col widths),
`--Alias-drop-shadow-*`, `--Elevation-Dialog`, `--Modal-*-shadow-*`,
`--border-width-2`.

---

## Responsive behaviour

Do not assume spacing or typography variables change values per breakpoint.
When Figma shows different values at different viewports, use a media query
to select the exact named variable or hardcoded Figma value for each
breakpoint:

```css
.my-block .heading { font-size: var(--heading-font-size-m); }

@media (width >= 900px) {
  .my-block .heading { font-size: var(--heading-font-size-l); }
}
```

---

## Checklist before submitting block CSS

- [ ] Ran `get_variable_defs` for every frame; have Figma variable names, not just values.
- [ ] Every named variable resolved by exact name in Express `styles.css` or the external S2A stylesheet; unmatched names are flagged.
- [ ] Hardcoded Figma values are used exactly, without substituting a same-valued variable.
- [ ] Colours use the named Figma variable where available or the exact hardcoded Figma value.
- [ ] Font families and weights use the exact named Express or S2A variable when Figma provides one; otherwise follow the documented hardcoded-value guidance and known font-family exception.
- [ ] Any new `:root` token was confirmed with the user before commit and added at the bottom of `:root`.
- [ ] Token-mapping report compiled for the Phase 9 summary, with every `YES`/`review` row called out.
