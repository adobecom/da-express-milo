# Variant Matching Reference

Variants (`dark`, `no-background`, `large`, `featured`, …) are class
names added to the block's outer `<div>` that change style or
behavior. Figma designs almost never label them explicitly — a
designer draws "the dark version of the hero," not `.ax-marquee.dark`.
This reference is how to go from a visual impression in Figma to a
specific, real class name, without guessing.

---

## Why not infer variants from Figma alone

A variant name is a code fact, not a design fact. Two variants can
look visually similar (`dark` vs a background-image with dark
overlay) while being different classes, and one variant can look
different across breakpoints. Guessing from Figma visuals and
inventing a plausible-sounding class name (e.g. writing `dark-mode`
when the real class is `dark`) silently breaks the page — DA authors
a class name as plain text, and nothing validates it until someone
notices the block didn't restyle. Always match against the **known
variant registry** produced by `agents/block-structure-resolver.md`,
never free-invent a class name.

---

## Matching procedure

Given the variant registry (from Source 1 or 2 — Source 3 has no
visual examples, see below) and the Figma frame/screenshot:

1. **No known variants exist for this block** → skip this step
   entirely. Author the base structure with no variant classes. Do
   not invent one because the design "looks different" — it may just
   be content, not a variant.

2. **One or more known variants exist** → for each candidate:
   - Fetch a screenshot of the candidate's example page (Playwright
     MCP `browser_navigate` + `browser_take_screenshot`, or Figma MCP
     `get_screenshot` is not applicable here since the example is a
     live EDS page, not Figma).
   - Compare side-by-side against the Figma frame screenshot already
     captured in Phase 3 (content extraction). Look specifically at
     the properties variants typically touch: background
     color/presence, text color, spacing/density, border/divider
     visibility, image size or position.
   - If a candidate's rendered look matches the Figma frame on these
     properties, it's a match. Multiple variants can apply
     simultaneously (e.g. `dark` + `large` are independent classes) —
     check each candidate independently rather than picking one.

3. **Ambiguous or no visual match** — do not guess. Present the
   Figma screenshot and the candidate screenshots side by side to the
   user and ask which (if any) applies:

   ```
   Known variants for <block-name>: dark, featured, large
   None matched the Figma frame with confidence.

   [screenshots or descriptions of each]

   Which variant(s) apply, or is this the default/no variant?
   ```

4. **Source 3 (code-inferred) registry** — there is no rendered
   example to compare against. Skip visual matching and always ask
   the user directly, listing the CSS-derived candidate class names
   and what each selector implies structurally if inferable from the
   CSS rules (e.g. `.cards.large { --card-width: ... }` suggests a
   sizing variant).

5. **Don't trust the registry as exhaustive, even from Source 1 or
   2.** `block.json` records what nala explicitly tests, not
   necessarily every class a block ships with — a real example
   surfaced a block rendering with `blog-columns text-right` on its
   root div while `block.json` only registered `div.blog-columns`,
   with no `text-right` entry anywhere in the fixture.
   `agents/block-structure-resolver.md` scans each fetched example's
   actual class list and adds anything undocumented to the registry
   it hands off — treat those entries exactly like any other
   candidate in step 2, screenshot-compare them the same way, don't
   deprioritize them just because they lack a `block.json` name.

## Recording the result

Confirmed variants go in the header row, space-separated inside the
parentheses, matching the block's existing convention. `colspan` must match
the resolved base table's actual column count (`N`), not a fixed value —
2 below is just an example for a 2-column block:

```html
<tr><td colspan="2"><p>cards (dark, large)</p></td></tr>
```

No variants confirmed → omit the parentheses entirely:

```html
<tr><td colspan="2"><p>cards</p></td></tr>
```

Report the variant decision and reasoning in the Phase 10 summary,
including any variants that were considered but ruled out.
