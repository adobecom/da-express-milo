# Figma Content Semantics Reference

Use this reference to translate Figma's text hierarchy into DA-authored
content. It guides semantic markup and supported content variants, not CSS
implementation or design-token selection.

---

## Heading level

Determine heading level from the content hierarchy in Figma. Use relative
font size and visual weight as visual cues to classify semantic heading
levels, not to reproduce CSS styling:

| Visual cue | Heading level |
|---|---|
| Largest text on frame, bold, dominant — typically 36px+ | `<h1>` |
| Large bold text, secondary prominence — typically 24–36px | `<h2>` |
| Medium bold text, section title — typically 18–24px | `<h3>` |
| Smaller bold text, sub-heading — typically 14–18px | `<h4>` |

When Figma does not establish the heading level, default to `<h1>` for
hero/marquee blocks, `<h3>` for card blocks, and `<h2>` for other blocks.
Document any fallback used.

## Body text

Author body copy as paragraphs.

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
| Heading fallback by block type | Hero/marquee `<h1>`, card `<h3>`, other `<h2>` |
| Text below heading | Body paragraph |
| Small uppercase above heading | Eyebrow |
| Text in filled/pill button | Primary CTA |
| Text in outlined button | Secondary CTA |
| Underlined text, inline | Plain link |
| Small graphic ≤ 48px, above content | Icon |

Always document which elements required fallback classification so the
user can verify before uploading.
