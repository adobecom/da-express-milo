# Kitchen Sink Reference

## What Is the Kitchen Sink?

The kitchen sink is a collection of HTML documentation pages — one per block — that live at `/docs/library/kitchen-sink/` in the da-express-milo content repository. Each file serves as the canonical reference for a single block: it shows what the block looks like, lists its variants, and explains how to author it in a document.

The kitchen sink is surfaced inside the document authoring environment (DA / AEM Sidekick Library plugin) as a browseable component library. Authors use it to:

1. Preview what a block looks like before adding it to a page.
2. Understand which variants exist and what each one does.
3. Copy a working block table structure from the example.

---

## Structure of a Kitchen Sink File

Each file is a plain HTML document following the standard AEM block authoring output format. A well-formed KS file has this structure:

```
<body>
  <header></header>
  <main>
    <!-- Section 1: Description -->
    <div>
      <h1>Block Name</h1>
      <p>What this block does.</p>
      <ul>
        <li>variant-name – What this variant does.</li>
        ...
      </ul>
      [optional screenshots of authoring table]
    </div>

    <!-- Section 2+: One section per variant -->
    <div>
      <h2>Default / Variant name</h2>
    </div>
    <div>
      <div class="block-name [variant]">
        <!-- block content rows -->
      </div>
    </div>

    ...

    <div><p>End of page</p></div>
  </main>
  <footer></footer>
</body>
```

The description section typically uses `section-metadata` with `style: Long-form` to tell the renderer to display that section in a readable text layout rather than as a rendered block.

---

## How Variants Are Authored

Block variants are added as extra CSS class names on the block table. In the source document, the block table's first cell in the header row contains the block name plus any variant modifiers, separated by spaces or parentheses depending on the editor:

```
| Marquee (dark, narrow) |
|------------------------|
| ...content rows...     |
```

This produces the HTML class `marquee dark narrow` on the outer block div.

In the kitchen sink HTML files this appears as:
```html
<div class="marquee dark narrow">
  ...
</div>
```

---

## File Naming Convention

Kitchen sink files are named after the block they document, with a `.html` extension:

```
/content/docs/library/kitchen-sink/banner.html
/content/docs/library/kitchen-sink/ax-marquee.html
/content/docs/library/kitchen-sink/pricing-cards.html
```

The filename must match the block's CSS class name exactly (e.g., the block loaded from `express/code/blocks/ax-marquee/` uses class `ax-marquee`, so the KS file is `ax-marquee.html`).

---

## How Files Are Created and Updated

The kitchen sink files are HTML exports produced by the DA (Document Authoring) tool. The `tools/docs-update/init.sh` script clones the latest state from the live content source:

```sh
aem content clone --path /docs/library/kitchen-sink --force
```

After cloning, files land in `content/docs/library/kitchen-sink/`. They should be treated as source-of-truth snapshots. Changes should be made in the authoring environment and re-cloned, not edited directly in this repository.

---

## Relationship to the Block Library

The kitchen sink is one part of a broader block documentation ecosystem:

| Resource | Purpose |
|---|---|
| Kitchen sink (`/docs/library/kitchen-sink/`) | Live visual examples + authoring guide per block |
| Block source code (`express/code/blocks/`) | JS + CSS implementation |
| Test mocks (`test/blocks/*/mocks/`) | Automated test fixtures — not authoring docs |
| Nala drafts (`drafts/nala/blocks/`) | Visual regression / QA pages |

The kitchen sink is the only resource intended for content authors. The others are for developers.

---

## Coverage as of April 2026

| Metric | Count |
|---|---|
| Blocks in `express/code/blocks/` | 115 |
| Kitchen sink files | 112 |
| Blocks with a matching kitchen sink | 84 |
| Blocks missing a kitchen sink | 31 |
| Kitchen sink files with no matching block | 28 |

See `report-block-completeness.md` for the full breakdown.

---

## What Makes a Good Kitchen Sink Entry

A high-quality kitchen sink file should:

1. **Have a correct H1 title** that matches the block name (e.g., "Banner (Desktop & Mobile)").
2. **List all authored variants** in bullet form with a one-line description of what each variant does.
3. **Include at least one live example** of each variant so authors can see the rendered output.
4. **Explain the row/column structure** — how many rows, what goes in each cell, which fields are optional.
5. **Note any special authoring rules** — e.g., button ordering, use of bold/italic to control CTA style, required metadata rows.
6. **Include screenshots** of the authoring table where the layout is non-obvious.

See `wayfinder.html` as a reference example of a well-formed kitchen sink entry.

---

## Known Issues

- Several files have incorrect H1 titles (live page content, foreign language strings, or wrong block names).
- Many files exist for blocks that are no longer in the codebase, or are duplicates.
- ~35% of matched kitchen sink files have no written authoring instructions.
- Variant coverage is inconsistent — some blocks have zero variant examples, others document stale variants that may have been removed.

See `report-block-completeness.md`, `report-variant-completeness.md`, and `report-authoring-instruction-quality.md` for detailed findings and recommendations.
