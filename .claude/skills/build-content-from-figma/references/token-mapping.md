# Token Mapping Reference

Map Figma typography tokens and text styles to DA-authored headings, body
size variants, and eyebrows. Tokens are classification evidence, not CSS
to add to the authored HTML.

## Detect typography tokens and styles

Inspect `get_design_context` for direct variable references, text-style
names, and component properties. If variable names are missing, consult
`get_variable_defs` when available.

Use this preference order: direct typography token > text-style name >
component property > visual heuristic. Support both legacy SOT and newer
S2A designs. Preserve the source name in the extraction output.

For SOT designs, use an explicit heading/body/eyebrow role in the token or
style name when available. Do not assume an SOT size label such as
`--heading-font-size-l` specifies an HTML heading level. If the role or
heading level is unclear, use the content hierarchy and document the
fallback. Do not infer a token by finding another variable with the same
numeric value.

## S2A typography classification

| Figma token | Authored classification |
|---|---|
| `--s2a-typography-font-size-title-1` | Heading `<h1>` |
| `--s2a-typography-font-size-title-2` | Heading `<h2>` |
| `--s2a-typography-font-size-title-3` | Heading `<h3>` |
| `--s2a-typography-font-size-title-4` | Heading `<h4>` |
| `--s2a-typography-font-size-body-lg` | Body, large |
| `--s2a-typography-font-size-body-md` | Body, medium (default) |
| `--s2a-typography-font-size-body-sm` | Body, small |
| `--s2a-typography-font-size-body-xs` | Body, extra-small; record for the block developer if unsupported |
| `--s2a-typography-font-size-eyebrow` | Eyebrow `<p>` above the heading |

Matching `--s2a-typography-line-height-*`, `--s2a-typography-letter-spacing-*`,
and `--s2a-typography-font-weight-*` tokens corroborate the classification.
If these disagree, prefer the font-size token and flag the discrepancy.
Recognizable text styles such as "Title 3", "Body MD", or "Eyebrow" provide
the same classification when a direct token reference is unavailable.

Only emit text-size variants the Express block supports. Express uses a
single set of authored content, not viewport-specific rows. Record
unsupported sizes as implementation notes instead of inventing an authored
variant.

---

## Heading fallback

When tokens/styles do not determine a heading level, use the content
hierarchy in Figma. Use relative font size and visual weight as visual cues
to classify semantic heading levels, not to reproduce CSS styling:

| Visual cue | Heading level |
|---|---|
| Largest text on frame, bold, dominant — typically 36px+ | `<h1>` |
| Large bold text, secondary prominence — typically 24–36px | `<h2>` |
| Medium bold text, section title — typically 18–24px | `<h3>` |
| Smaller bold text, sub-heading — typically 14–18px | `<h4>` |

When in doubt, default to `<h2>` for hero/marquee blocks and `<h3>` for
card/detail blocks. Document any fallback used.

---

## Body size fallback

| Font size (approx) | Class |
|---|---|
| 18px+ | `body-lg` |
| 14–17px | `body-md` (default) |
| 12–13px | `body-sm` |

`body-md` is the default and needs no class override. Only emit `body-lg`
or `body-sm` as a block variant when the design explicitly uses a
non-default size.

---

## Eyebrow fallback

Small uppercase or spaced-out text appearing **above** the heading,
typically 10–13px. Rendered as `<p>`. Optional.

---

## CTA / link style

| Visual appearance | Authored as |
|---|---|
| Filled/solid button background | `<strong><a href="...">text</a></strong>` |
| Outline/ghost button (border only) | `<em><a href="...">text</a></em>` |
| Plain underlined link, no button | bare `<a href="...">text</a>` |

Multiple CTAs in the same paragraph are space-separated inside a single `<p>`:
```html
<p><strong><a href="...">Primary</a></strong> <em><a href="...">Secondary</a></em></p>
```

---

## Fallback heuristics summary

| Visual cue | Classification |
|---|---|
| Largest, boldest text near top | Heading (`<h2>` default) |
| Medium text below heading | Body (`body-md` default) |
| Small uppercase above heading | Eyebrow |
| Text in filled/pill button | Primary CTA |
| Text in outlined button | Secondary CTA |
| Underlined text, inline | Plain link |
| Small graphic ≤ 48px, above content | Icon |

Always document which elements required fallback classification so the
user can verify before uploading.
