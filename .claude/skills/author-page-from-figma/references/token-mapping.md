# Token Mapping Reference

Visual heuristics for classifying Figma text and interactive elements
in Express designs. Express Figma files do not use `--s2a-typography-*`
tokens, so classification relies on font size, weight, position, and
visual style.

---

## Heading level

Determine heading level from font size and visual weight:

| Visual cue | Heading level |
|---|---|
| Largest text on frame, bold, dominant — typically 36px+ | `<h1>` |
| Large bold text, secondary prominence — typically 24–36px | `<h2>` |
| Medium bold text, section title — typically 18–24px | `<h3>` |
| Smaller bold text, sub-heading — typically 14–18px | `<h4>` |

When in doubt, default to `<h2>` for hero/marquee blocks and `<h3>` for
card/detail blocks. Document any fallback used.

Express font size tokens for reference:
```
--heading-font-size-xxxl: 5rem    (80px)
--heading-font-size-xxl:  3.75rem (60px)
--heading-font-size-xl:   2.8125rem (45px)
--heading-font-size-l:    2.25rem (36px)
--heading-font-size-ml:   2rem    (32px)
--heading-font-size-m:    1.75rem (28px)
--heading-font-size-s:    1.375rem (22px)
--heading-font-size-xs:   1.25rem (20px)
```

---

## Body size class

| Font size (approx) | Class |
|---|---|
| 18px+ | `body-lg` |
| 14–17px | `body-md` (default) |
| 12–13px | `body-sm` |

Express font size tokens for reference:
```
--body-font-size-xxl: 1.5rem   (24px)
--body-font-size-xl:  1.25rem  (20px)
--body-font-size-l:   1.125rem (18px)
--body-font-size-m:   1rem     (16px)  ← default body
--body-font-size-s:   0.875rem (14px)
--body-font-size-xs:  0.75rem  (12px)
```

`body-md` is the default and needs no class override. Only emit `body-lg`
or `body-sm` as a block variant when the design explicitly uses a
non-default size.

---

## Eyebrow

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
