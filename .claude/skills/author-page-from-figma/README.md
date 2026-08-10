# author-page-from-figma

Authors a DA page from a Figma design for a block that **already
exists in code**. Unlike `build-content-from-figma`, this skill never
defines the authoring structure — it resolves the block's real
authoring pattern and known variants from an existing example
(preferring nala test fixtures, then the kitchen sink library, then
code as a last resort), matches the Figma frame to the correct block
name, extracts content, and produces an authored HTML document
uploaded to DA.

---

## Why this exists

`build-content-from-figma` assembles a generic Express authoring
table because it's typically used alongside `build-block-from-figma`
to stand up a brand-new block. This skill is for the common case
where the block is already built and tested — the authoring shape,
column layout, and variant class names are already fixed by the
code, and guessing at them (or reusing the generic pattern) risks
producing HTML that doesn't match how the block actually expects to
be authored.

## Structure resolution cascade

1. **Nala test fixtures** (`nala/blocks/<block>/<block>.block.json`)
   — preferred, because each entry pairs a variant name/selector with
   a live page, giving both the exact markup and a rendered example
   to visually confirm variants against.
2. **Kitchen sink** (`docs/library/kitchen-sink/<block>`) — used when
   no nala fixture exists for the block.
3. **Code inference** (`express/code/blocks/<block>/`) — last resort
   when neither example exists; flagged as low confidence since there
   is no rendered output to verify variants against.

## Variant handling

Variant class names (`dark`, `large`, `no-background`, …) are matched
against the block's real known variants (from the resolved fixture or
kitchen sink page), never invented from the Figma visual alone. See
`references/variant-matching.md`.

## Placeholder-sourced text

Some blocks pull UI chrome text (button labels, a11y strings, etc.)
from the shared `/express/placeholders.json` sheet at runtime instead
of authored DOM content. The skill greps the block's JS for
`replaceKey`/`replaceKeyArray` calls and excludes any matching Figma
text from authoring — flagging a mismatch instead of silently baking
stale or duplicate copy into the page. See
`references/placeholder-detection.md`.

---

## Prerequisites

### MCPs

| MCP | Notes |
|-----|-------|
| Figma | Official Figma MCP. Requires Figma Dev Mode access. |

```sh
claude mcp add --transport http figma https://mcp.figma.com/mcp --scope user
# Then in Claude: /mcp → choose figma → authenticate
```

### da-auth-helper

```sh
npm install -g github:adobe-rnd/da-auth-helper
da-auth-helper login  # choose the Skyline profile
```

The token is cached at `~/.aem/da-token.json` and refreshed
automatically.

---

## Run

```
/author-page-from-figma
```

The skill will prompt for:

| Input | Required | Example |
|-------|----------|---------|
| Figma URL(s) | At least one | One URL per viewport (mobile / tablet / desktop) |
| DA organization | Yes | `adobecom` |
| DA repository | Yes | `da-express-milo` |
| DA file path | Yes | `drafts/methomas/my-page.html` |

It will also ask you to confirm:
- The matched block name (if the Figma frame name doesn't map
  cleanly to a block folder in `express/code/blocks/`).
- Which known variant(s), if any, apply.

## Output

An HTML document uploaded to DA, media assets in the shadow folder
(`content.da.live`), and optionally a previewed and published page at
`https://main--da-express-milo--adobecom.aem.live/<path>`. The DA
edit link and the structure-resolution source/confidence are reported
in the final summary.
