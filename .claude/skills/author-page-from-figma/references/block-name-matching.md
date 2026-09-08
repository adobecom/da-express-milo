# Block Name Matching Reference

Figma frame/component names rarely match the code block name exactly
(e.g. Figma "Hero" → code `ax-marquee`, Figma "Testimonial Cards" →
code `cards` with a variant). This skill authors content for an
**existing** block — it never creates one — so an incorrect match
means the page renders with the wrong (or no) block styling.

---

## Candidate name universe

Build the candidate list from the actual block folders, not memory:

```bash
ls /Users/meganthomas/Projects/da-express-milo/express/code/blocks
```

This is the authoritative set of block names that exist in code. A
match outside this list is never valid **on the current branch** — but
see "Block missing from the current branch entirely" below before
concluding a Figma-named block doesn't exist anywhere.

### Block missing from the current branch entirely

If nothing in the folder listing matches even loosely (not a naming
gap — genuinely no candidate), don't jump straight to "this needs
code-inference from scratch" or "this can't be authored." Check
whether the block exists on another branch first:

```bash
git fetch origin --quiet
git log --all --oneline -- 'express/code/blocks/<figma-name>*'
git branch -a | grep -i <keyword-from-figma-name>
```

A block can be fully built (JS/CSS/nala fixtures) on an unmerged
colleague branch, with a real content page under that branch's
`drafts/`. If found:

1. Ask the user how to proceed (merge/cherry-pick the block's own
   files into the working branch, skip this section, or map to a
   different existing block) — this changes the working tree, so
   don't do it without confirming.
2. If cherry-picked, **check that branch's own `drafts/` pages for a
   real, published-content example of this block** — not just its
   nala fixtures. Content pages often exercise things nala tests
   don't: `metadata`/`section-metadata` keys the block reads (e.g. a
   branding-logo override), specific variant combinations, disclaimer
   text, etc. Fetch via `admin.da.live/source/<org>/<repo>/<path>.html`
   with the DA auth token if `.plain.html` 401s (unpublished/preview
   content on `.aem.page` is often gated even when the DA source
   itself is reachable with a valid token).

## Matching procedure

0. **Check for an explicit Figma annotation first — it beats every
   heuristic below.** Call Figma MCP `get_design_context` on the
   frame (not just `get_metadata`) and look for a
   `data-block-name-annotations="..."` attribute on the root element.
   This is the design team's own explicit tag, confirmed to appear
   directly in `get_design_context` output (e.g.
   `data-block-name-annotations="blog-feature-marquee blog-feature-marquee-ready"`)
   — far stronger evidence than any string-similarity heuristic. If
   present, check the annotated name(s) against the block folder list
   from `express/code/blocks/`:
   - Exact match → treat as the resolved name; still show it in the
     confirmation step below, but note it as "from Figma annotation"
     rather than "from string matching" so the user knows why
     confidence is high.
   - No match against real folders → the annotation is stale or
     refers to a renamed/removed block; fall back to steps 1–4, but
     mention the mismatched annotation to the user as a flag (the
     design file may need updating, or the block may have been
     renamed since the annotation was added).
   If no such attribute exists (older files, or the design wasn't
   annotated), proceed to step 1.

1. **Read the Figma signal.** Use Figma MCP `get_metadata` on the
   frame and its ancestors. Collect: frame name, parent
   component/section name, and (if the file uses a component library)
   the Figma component name the instance is attached to.
2. **Normalize both sides** before comparing: lowercase, strip
   punctuation, collapse whitespace/hyphens/underscores to a single
   separator (`hero section` → `hero-section`).
3. **Score candidates** against the block folder list using, in order
   of preference:
   - Exact normalized match.
   - Substring match either direction (`marquee` ⊂ `ax-marquee`).
   - Token overlap (shared significant words, e.g. `card` vs `cards`,
     `testimonial` vs `quotes`).
4. **Known synonyms** — check for these common Express naming gaps
   before giving up on a candidate:

   | Figma-side term | Likely code block(s) |
   |---|---|
   | Hero, banner, header | `ax-marquee`, `banner-bg` (`banner` is deprecated — see step 6) |
   | Testimonial, quote | `cards`, `quotes` (verify against folder list) |
   | Feature grid, benefits | `feature-grid`, `feature-list`, `ax-panels` |
   | FAQ, accordion | `faq`, `faqv2`, `ax-accordion`, `collapsible-rows` |
   | Comparison, pricing table | `comparison-table-v2` |

   **When candidates differ only by version suffix** (`faq` vs
   `faqv2`, `how-to-v2` vs `how-to-v3`), default to the **latest**
   version — not whichever one string-matches best, and not whichever
   one's structure happens to look closest to the Figma mock. The
   latest version is the one considered current for new authoring.
   Only use an older version when the Figma frame name **explicitly**
   names that version (e.g. a frame literally named "how-to-v2" →
   use `how-to-v2` even though `how-to-v3` exists).

5. **Cross-fixture disambiguation** — when two candidates seem
   equally plausible from name matching alone, check whether any
   nala `block.json` under `nala/blocks/` contains the *Figma*
   instance's exact name as a literal CSS selector fragment. This
   resolved a real ambiguity: a Figma instance named
   `ax-blog-posts-container` scored as a token-overlap tie between
   `blog-posts` and `blog-posts-v2` by name alone, but
   `blog-posts-v2.block.json` contained the literal selector
   `.ax-blog-posts-container .content a` in one of its variant
   entries — direct evidence that `blog-posts-v2`, not `blog-posts`,
   renders with that exact class name. Grep for the candidate's own
   Figma-side name across `nala/blocks/*/*.block.json` before falling
   back to a low-confidence guess.
6. **Check for deprecation before finalizing.** Once a candidate is
   chosen (from any step above), grep its JS file for a `@deprecated`
   JSDoc tag before presenting it for confirmation:
   ```bash
   grep -n "@deprecated" express/code/blocks/<candidate>/<candidate>.js
   ```
   If found, the comment names the replacement (e.g.
   `@deprecated Use \`banner-bg\` instead.`) — re-run the matching
   procedure against the replacement name instead, and tell the user
   both facts: the originally-matched block is deprecated, and what
   was substituted. Never author new content against a block carrying
   this tag, even if it's an exact name match — deprecation overrides
   match confidence. This is the only place `@deprecated` is checked;
   it isn't yet cross-referenced anywhere else in this codebase, so
   don't assume other tooling catches this.
7. **Never auto-select below an exact or high-confidence substring
   match.** Present the top 2–3 candidates with your reasoning.

## Confirmation (BLOCKING)

```
Figma frame:      "<frame name>"
Best match:       <block-name>  (reason: <figma annotation | cross-fixture selector | exact | substring | token overlap>)
Other candidates: <name-2>, <name-3>
[if applicable] Note: "<originally-matched-block>" is deprecated in favor of "<block-name>" — substituted automatically.

Confirm "<block-name>", or provide the correct block name?
```

> **STOP**: Do not proceed to structure resolution until the user
> confirms the block name. A wrong block name means every later
> phase (structure resolution, variant matching, upload) is wasted
> work against the wrong target.
