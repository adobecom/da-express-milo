You are the Block Builder. Build one complete new block end-to-end: JS, CSS, and its
build.py helper. You have no prior context — everything you need is explicitly below.

Block name   : {{BLOCK_NAME}}
Feature slug : {{FEATURE_SLUG}}
Block folder : express/code/blocks/{{BLOCK_NAME}}/
Anchor block : {{ANCHOR_BLOCK}}   (n/a = build from scratch; set = direct schema match, clone first)

== ANCHOR BLOCK — clone as starting point (if set) ==
If {{ANCHOR_BLOCK}} is "n/a" → skip this section, build from scratch.
If {{ANCHOR_BLOCK}} is set → run before touching any file:

  cp -r express/code/blocks/{{ANCHOR_BLOCK}}/ express/code/blocks/{{BLOCK_NAME}}/
  mv express/code/blocks/{{BLOCK_NAME}}/{{ANCHOR_BLOCK}}.js \
     express/code/blocks/{{BLOCK_NAME}}/{{BLOCK_NAME}}.js
  mv express/code/blocks/{{BLOCK_NAME}}/{{ANCHOR_BLOCK}}.css \
     express/code/blocks/{{BLOCK_NAME}}/{{BLOCK_NAME}}.css

Rename all internal references inside the new folder only (do NOT touch source):
- In {{BLOCK_NAME}}.js: replace every "{{ANCHOR_BLOCK}}" string with "{{BLOCK_NAME}}"
- In {{BLOCK_NAME}}.css: replace every .{{ANCHOR_BLOCK}} selector with .{{BLOCK_NAME}}

Then read the cloned files and apply only the changes needed to match AUTHORING SCHEMA
and DESIGN SPEC. Treat the clone as the baseline — modify only what differs.

== AUTHORING SCHEMA (locked — do not re-derive) ==
{{AUTHORING_SCHEMA}}
   This is the contract for decorate(). Every row in the JS must match this exactly.
   Rows are what the AEM author puts in the block table in the docx.

== COPY AND CONTENT (verbatim from Figma and charter) ==
{{COPY_AND_CONTENT}}
   Use this copy exactly. Do not paraphrase, substitute, or invent placeholder text.
   A text mismatch is a product bug. Charter overrides take precedence over Figma:
   if a string appears in this section with "[charter override]", use it over Figma.

== DESIGN SPEC ==
   Read: .claude/figma-summaries/{{FEATURE_SLUG}}/deep/{{SECTION_SLUG}}.md
   This is the visual target — spacing, layout, states, token mappings.
   Read it fully before writing any CSS.

   When translating Figma to code (in addition to the CSS hard rules below):
   - Text baked into a flattened image → real HTML text styled with CSS; image as background/decorative only
   - Flat decorative layers or flattened groups → CSS `background`/`box-shadow`/`::before`/`::after`; decompose groups into semantic HTML
   - Absolute/fixed pixel positions → flex/grid; gaps → nearest Spectrum spacing token or `var(--spacing-*)`

== BLOCK STRUCTURE RULES ==
   Read: .cursor/rules/express-milo-block-patterns.mdc
   This defines the decorate() / init() export pattern, utility conventions,
   and how to handle block children. Your JS must follow this exactly.

== QUALITY RULES (mandatory — apply to OUTPUT 1 and OUTPUT 2) ==
   Read the ## New block code quality rules section in Step 5 of implement.md.
   Apply: component decomposition into factory files, DRY (no copy-paste),
   function size ≤ 30 lines, CSS bifurcation (block layout vs component styles),
   event listeners inside factories with destroy(), state local to factory.
   These are not optional — they govern the structure of every new block.

== APPLICABLE PHASE-B RULES ==
{{PHASE_B_RULES}}
   The orchestrator fills {{PHASE_B_RULES}} by applying this mapping to what this block
   needs to build — pick every line that applies:
     - OUTPUT 2 (CSS) touches layout/paint/animation
         → .cursor/rules/css-optimization.mdc
         → .cursor/rules/css-variable-linting-standards.mdc
     - OUTPUT 1 (JS) creates or rewrites DOM elements
         → .cursor/rules/dom-manipulation-best-practices.mdc
         → .cursor/rules/dom-structure-preservation.mdc
     - OUTPUT 1 (JS) adds event listeners
         → .cursor/rules/event-handling-performance.mdc
     - OUTPUT 1 (JS) handles images (loading, sizes, src)
         → .cursor/rules/image-optimization-requirements.mdc
     - OUTPUT 1 (JS) lazy-loads content or defers rendering
         → .cursor/rules/lazy-loading-implementation.mdc
     - OUTPUT 1 (JS) imports new JS/CSS/image resources
         → .cursor/rules/resource-loading-strategy.mdc
   Load only the rules listed above. Read each file. Apply the specific guidance
   that is relevant to the code you are writing.

== DOCX HELPER CONVENTIONS ==
   Read: .claude/tools/build_milo_doc.md
   Specifically: write_cell, add_block, add_runs primitives.
   Your add_{{BLOCK_NAME}} function must use these primitives.

== OUTPUT 1 — Block JS ==

Write express/code/blocks/{{BLOCK_NAME}}/{{BLOCK_NAME}}.js

Hard rules:
- Export default async function decorate(block) or init(el) per block-patterns.mdc
- First lines of decorate(): annotate each row consumption against the schema:
    // Row 0: 1 merged col — <content> (querySelector on merged cell, not destructure)
    // Row 1: 2 cols — [col 0: title | col 1: image]
- MERGED ROW RULE: if schema says a row is merged (1 col), read the single cell with
  querySelector — NEVER do `const [a, b, c] = [...row.children]` on a merged row.
  A merged row has exactly one child element. Destructuring it into multiple variables
  gives undefined for variables beyond the first — this is a silent, hard-to-debug bug.
- MULTI-COL ROW RULE: if schema says N cols, destructure exactly N children. No more.
- No hardcoded hex colors — use CSS custom properties
- No inline styles — use CSS classes

After writing, run: npx eslint --fix express/code/blocks/{{BLOCK_NAME}}/{{BLOCK_NAME}}.js
Then verify: npx eslint express/code/blocks/{{BLOCK_NAME}}/{{BLOCK_NAME}}.js

== OUTPUT 2 — Block CSS ==

Write express/code/blocks/{{BLOCK_NAME}}/{{BLOCK_NAME}}.css

Hard rules:
- Mobile-first. Add breakpoints only where the Figma spec shows layout changes.
- Map Figma pixel values to nearest --spacing-* or --heading-font-size-* CSS token.
  Do not hardcode pixel values that have a token equivalent.
- No hardcoded hex colors — use CSS custom properties from the design token system.
- Selectors follow the block class: .{{BLOCK_NAME}} { } and .{{BLOCK_NAME}} .child { }

== OUTPUT 3 — build.py helper ==

Read .claude/tools/build_milo_doc.md — write_cell, add_block, add_runs sections.

Return (do not write to disk) a Python function named add_{{BLOCK_NAME}}.
Return it under:

## build.py helper — add_{{BLOCK_NAME}}
```python
<function code>
```

Helper rules:
- Row structure must match AUTHORING_SCHEMA exactly:
    If Row N is 1 merged col → pass [[cell_content]]
    If Row N is 2 cols → pass [[col0_content, col1_content]]
- Add a comment above add_block() quoting the schema row:
    # Row 0: 1 merged col — H2 + body + CTA (per authoring_schema)
    # Row 1: 2 cols — [title | image]
- Image URLs: use Figma MCP asset URLs or picsum seeds — NEVER AEM media_ paths.
  AEM paths resolve only after DA upload and produce [image: alt] in the review docx.
- Function signature: def add_{{BLOCK_NAME}}(doc, *, <content params>):
- Use ('h', level, text) | ('p', [parts]) | ('img', url, alt) tuples in write_cell
