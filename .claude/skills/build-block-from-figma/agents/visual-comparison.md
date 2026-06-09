# Visual Comparison Subagent

This script is delegated from Phase 5 of the main SKILL.md.
Use **Playwright MCP** for all browser interactions.

---

## Viewport → width mapping

| Viewport | Playwright width | CSS breakpoint it falls within |
|----------|-----------------|-------------------------------|
| Mobile | 375 px | base (< 600 px) |
| Small tablet | 768 px | 600 px – 899 px |
| Large tablet | 960 px | ≥ 900 px |
| Desktop | 1440 px | ≥ 1200 px |
| Widescreen | 1800 px | ≥ 1680 px |

Match these to whichever Figma frames were provided.

Only test viewports for which a Figma frame was provided.

> **Important**: "Small tablet" (768 px) and "Large tablet" (960 px) may have
> different layouts even though they are both ≥ 600 px — the block's actual
> side-by-side breakpoint is derived from the Figma design, not the generic
> grid system. Always test both narrower and wider sides of the tablet range
> when a 600–899 px Figma frame was provided.

---

## Comparison procedure (per breakpoint)

For each breakpoint:

1. **Navigate** to the Playwright URL (constructed in Phase 5b).
2. **Set viewport width** to the value from the table above.
   Set height to a generous value (e.g. 900 px) to avoid scroll
   clipping.
3. **Wait** for the block to finish rendering — wait for the block's
   root element to be visible and for any images inside it to load.
4. **Force-refresh the block's CSS** to bypass the CDN's `max-age`
   cache (EDS serves code with `max-age=7200`):
   ```js
   const links = [...document.querySelectorAll('link[rel="stylesheet"]')];
   const blockLink = links.find(l => l.href.includes('blocks/<block-name>'));
   if (blockLink) blockLink.href = blockLink.href.split('?')[0] + '?v=' + Date.now();
   ```
   Skip this step for localhost mode.
5. **Verify DOM structure** with `browser_evaluate` before screenshotting.
   Check that decorated classes and any expected structural divs (e.g.
   `.foreground`, `.text-content`, `.cta-container`) are present.
   If the structure doesn't match what the latest JS should produce,
   the browser module cache may be stale — close the browser with
   `browser_close`, navigate fresh, and re-check before continuing.
6. **Broken-image guard**: run the following to detect broken images:
   ```js
   const broken = [...document.querySelectorAll('.<block-name> img')]
     .filter(img => !img.complete || img.naturalWidth === 0)
     .map(img => ({
       src: img.src,
       cssAspectRatio: getComputedStyle(img).aspectRatio,
       intrinsic: `${img.naturalWidth}x${img.naturalHeight}`,
     }));
   ```
   If any images are broken:
   - Note it in **Obstacles Encountered**: "Image broken — CSS
     `aspect-ratio` cannot be visually verified; confirmed via
     `getComputedStyle`."
   - Skip shape, size, and aspect-ratio comparisons for those elements.
   - Do **not** fail the visual comparison for layout issues caused by
     the broken placeholder rendering at unexpected dimensions.
7. **Screenshot** the block's bounding box (not the full page).
   Use Playwright's element screenshot to capture just the component.
8. **Computed-style spot-check**: after the screenshot, run:
   ```js
   const block = document.querySelector('.<block-name>');
   const fg = block.querySelector('.foreground');
   return {
     blockFlexDir:    getComputedStyle(block).flexDirection,
     blockPaddingInline: getComputedStyle(block).paddingInline,
     blockPaddingBlock:  getComputedStyle(block).paddingBlock,
     fgMaxWidth:      fg ? getComputedStyle(fg).maxWidth : null,
   };
   ```
   Verify `flexDirection` matches the expected layout (column vs row)
   for this breakpoint. If it doesn't match, treat as a layout failure
   regardless of how the screenshot looks — the CSS breakpoint is wrong.
9. **Load the cached Figma frame** for this breakpoint from
   `/tmp/build-block-figma/<viewport>.png` (saved during Phase 3).
   Do **not** re-fetch from the Figma MCP — the cached file is the
   source of truth for visual comparison.  If the cache file is
   missing for a breakpoint, skip that breakpoint and document it
   in Obstacles Encountered.
10. **Compare** the screenshot against the Figma frame.

---

## What to assess

For each breakpoint, evaluate:

### Layout & stacking
- Are elements stacked vertically vs placed side-by-side correctly?
  This is the most common error — if Figma shows a mobile layout with
  heading above image, the implementation must stack them, not place
  them in a row.
- Flex/grid direction, wrapping, and alignment.
- Element ordering matches Figma layer order.

### Spacing
- Padding, margins, and gaps between elements.
- Spacing between the block and its container edges.
- Spacing between text elements (heading → body → CTA).
- Verify values map to `--spacing-*` tokens.

### Typography
- Font size, weight, and line height are visually consistent.
- Heading vs body font sizes are correct per Figma.
- Text colour matches the design — verify against `--color-*` tokens.

### Colours & backgrounds
- Background colours, gradients, or images match Figma.
- Foreground element colours (text, icons, borders) match.
- Verify colours against Express `--color-*` / `--gradient-*` variables.

### Media
- **Element presence check (critical)**: cross-reference the
  per-breakpoint element inventory from Phase 3.  If an image or
  media element exists in the Figma frame for this breakpoint, it
  **must** be visible in the implementation screenshot.  A missing
  image at tablet/desktop when it exists at mobile is the most
  common failure — flag this immediately.
- Images are positioned correctly relative to text content.
- Image aspect ratios are preserved.
- Image sizing fills or fits the container as shown in Figma.

### Overall fidelity
- The implementation looks like the Figma design at a glance.
- No missing elements, no extra elements.
- No overflow or clipping issues.

---

## Iteration loop

If a breakpoint differs meaningfully from the Figma design:

1. **Identify** the specific CSS properties causing the discrepancy.
   Use the computed-style spot-check (step 8) as the ground truth —
   if `flexDirection` is wrong, the breakpoint threshold is wrong, not
   just the visual appearance.
   Be precise — e.g. "the flex-direction should be column at 768 px
   but is currently row — the side-by-side breakpoint fires at 600 px
   but Figma shows stacked at small tablet".
2. **Update** the local CSS file (and JS if DOM restructuring is needed).
3. **Make changes visible**:
   - **Localhost mode:** reload the page in Playwright.
   - **Remote-branch-mode:** the main skill (Phase 5e) handles
     pushing updated files to the feature branch and
     force-refreshing the CDN. Follow those instructions rather
     than simply reloading.
4. **Re-screenshot** and **re-assess** the breakpoint.
5. **Repeat** until fidelity is high.

### Iteration limits

- Maximum **5 passes** per breakpoint.
- If after 5 passes there are still discrepancies, **stop iterating**
  and document the remaining issues in the **Obstacles Encountered**
  section.

---

## Obstacles Encountered

At the end of the visual comparison phase, compile a list of:

- Breakpoints that reached high fidelity (pass).
- Breakpoints that still have discrepancies after 5 passes, with
  specific details of what differs and which CSS properties were
  attempted.
- Any Figma ambiguities (e.g. unclear auto-layout settings, unusual
  spacing that doesn't match any token).

Surface this list back to the main skill for inclusion in the final
summary.
