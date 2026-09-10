# Viewport Content Reference

Some Express blocks support **per-viewport content or layout variations**
by detecting the current viewport width at runtime and adjusting
the block's rendered content or class state accordingly.

---

## Authoring approach

Unlike some systems that parse special keyword rows in authored markup,
Express blocks typically handle viewport variations through one of two
patterns:

### Pattern A — CSS-only responsive

Most blocks handle viewport differences purely in CSS using
mobile-first media queries.  No JS viewport detection is needed.

```css
/* mobile: stacked */
.ax-hero .content { flex-direction: column; }

/* tablet and above: side-by-side */
@media (width >= 768px) {
  .ax-hero .content { flex-direction: row; }
}
```

Use this pattern unless Figma shows genuinely different content
(not just layout) at different viewports.

### Pattern B — JS breakpoint config

For blocks that need to render different content, load different
assets, or apply different logic per viewport, use a breakpoint
config array + `window.matchMedia`:

```js
const BREAKPOINTS = [
  { name: 'mobile',  minWidth: 0 },
  { name: 'desktop', minWidth: 768 },
  { name: 'hd',      minWidth: 1440 },
];

function applyBreakpoint(block, breakpoint) {
  block.dataset.viewport = breakpoint.name;
  // ... viewport-specific logic
}

export default async function decorate(block) {
  // ... initial decoration

  BREAKPOINTS.slice().reverse().forEach((bp) => {
    const mq = window.matchMedia(`(min-width: ${bp.minWidth}px)`);
    if (mq.matches) applyBreakpoint(block, bp);
    mq.addEventListener('change', (e) => {
      if (e.matches) applyBreakpoint(block, bp);
    });
  });
}
```

Look at `express/code/blocks/ax-marquee/ax-marquee.js` for a full
example of the breakpoint config pattern.

---

## Which pattern to use

| Situation | Pattern |
|-----------|---------|
| Same content, different layout/spacing | CSS-only (Pattern A) |
| Same content, different font sizes | CSS-only (Pattern A) |
| Different images per viewport | JS breakpoint config (Pattern B) |
| Different text/headings per viewport | Authored with hidden/shown elements via CSS, or Pattern B |
| Different block behaviour per viewport | Pattern B |

**Default to CSS-only unless JS is clearly needed** — it is simpler,
more performant, and easier to maintain.

---

## Breakpoints

Use these breakpoint values consistently (matches the codebase convention):

| Name | `min-width` |
|------|------------|
| Mobile (base) | 0 px (no media query) |
| Tablet | 600 px |
| Desktop | 900 px |
| Large desktop | 1200 px |
| Wide | 1680 px |

---

## SEO considerations

- If you are toggling between two heading elements across viewports,
  ensure only one `<h1>` is ever in the DOM at a time.  If both must
  exist, use `aria-hidden="true"` on the hidden duplicate.
- Avoid using `display: none` on content that search engines should
  index — prefer opacity or clip techniques if the content is
  semantically meaningful at all viewports.
