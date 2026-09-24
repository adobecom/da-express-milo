# da-express-milo Internals — Content Layer vs Code Layer

> Reference for splitting any Express Milo feature into its correct sub-layer.
> For generic EDS page construction (how tables become divs, block lifecycle) see [eds-platform.md](eds-platform.md).

---

## The Two Sub-Layers

| | AEM Content Layer | Code Layer |
|---|---|---|
| Owned by | Content authors | Developers |
| Tooling | DA (da.live) + Sidekick | VS Code + GitHub |
| Deployed via | Sidekick Preview → Publish | GitHub push → EDS code sync |
| Scope of change | Single page or section | All pages using that block/script |
| Rollback | Re-publish previous version in DA | Revert commit + push |

**AEM Content Layer owns:**
- Page structure, block order, section layout
- Block content (what's in each table row)
- Block variant classes (e.g. `remove-background`, `light`, `mobile`)
- Page-level metadata table
- URL slug / page path
- Draft and test pages (`/drafts/nala/...`)

**Code Layer owns:**
- Block JS (`/express/code/blocks/<name>/<name>.js`) — `decorate(block)` function
- Block CSS
- `scripts.js` — page entry point, CONFIG, `buildAutoBlocks()`
- `frictionless-utils.js` — SDK loading, `QA_CONFIGS`, quick action orchestration
- `floating-cta.js` — floating button widget
- Analytics instrumentation (`daa-lh`/`daa-im` attributes, `sendFrictionlessEventToAdobeAnalytics`)
- Nala E2E tests (`/nala/blocks/`)

---

## Metadata Sources (Important — Three Layers)

A page's effective metadata is NOT just what's in its page document. It comes from three sources that stack on top of each other:

### 1. Inherited / bulk metadata (shared Excel spreadsheet)
A `metadata.xlsx` file at the path level applies to **all pages under that path**. This is maintained separately from any individual page — content authors update it in SharePoint/DA and it applies across the whole section.

```
/express/metadata.xlsx           → applies to ALL /express/* pages
/express/feature/metadata.xlsx   → applies to all /express/feature/* pages
```

Common keys set here: `template`, `gnav-source`, `footer-source`, `show-free-plan`, and other site-wide defaults. **If a metadata value can't be found in the page document, look here first.**

### 2. Page-level metadata table
The `metadata` block at the bottom of the individual DA page. Overrides inherited values for that page only. This is where page-specific keys live: `show-floating-cta`, `mobile-floating-cta`, `frictionless-safari`, `jarvis-surface-id`, etc.

### 3. Programmatic injection (`buildAutoBlocks` / `scripts.js`)
Some behaviour is injected by code at runtime based on metadata it reads. For example, `buildAutoBlocks()` reads metadata to decide which floating CTA block to inject — the block doesn't need to be authored on the page.

**When a metadata key is missing or not behaving as expected:**
1. Check the page document metadata table (DA)
2. Check the path-level `metadata.xlsx`
3. Check `buildAutoBlocks()` and `scripts.js` for programmatic overrides

### Draft-path exception (testing gotcha)

`metadata.xlsx` inheritance applies by **path prefix**. Pages outside the `/express/...` hierarchy do NOT inherit it:

```
/express/feature/image/compress/jpg          → inherits /express/feature/metadata.xlsx ✓
/drafts/nala/test-gen/.../fqa-image-compress → inherits nothing ✗
/drafts/<anything>                           → inherits nothing ✗
```

**Consequence for testing:** when an author copies a feature page to `/drafts/...` for Nala test runs, branch previews, or staging, every xlsx-inherited key becomes missing. This typically silently breaks:

- **Page chrome** — `gnav-source` / `footer-source` missing → no global nav, no footer, or wrong ones
- **Template-level behavior** — `template`, `theme` fallbacks missing → page renders against EDS defaults
- **Floating CTA defaults** — per-path fallbacks for `show-floating-cta`, `desktop-floating-cta`, etc. missing
- **Locale / GeoRouting** — `georouting` missing → users may not be redirected to the correct locale page

**How to compensate when authoring a draft-path page:**
1. Audit the live parent-path page (e.g. fetch HTML of the closest production sibling) and enumerate every `<meta name="…">` tag it exposes.
2. Add the inherited-but-critical keys directly into the draft page's `metadata` block. The emitted `page.docx` from the Implementation Agent's `build.py` should include the full set for a feature page — not just the charter-specified keys — to keep drafts test-able standalone.
3. Alternatively, upload the authored docx directly to the production path (overwriting the live page) — inheritance then applies. Only viable when the feature is actually ready to ship.

**Symptom → likely cause mapping:**
| Symptom on a draft page | Most likely missing keys (usually inherited) |
|---|---|
| No global nav / footer | `gnav-source`, `footer-source` |
| Fallback hero showing on a frictionless page instead of the upload block | Page is not inheriting but also missing `fqa-qualified-*` meta injection because `frictionless-safari` isn't being read — verify that key is present on the draft |
| CTA redirects to Express app instead of opening a file picker | `main-cta-text` / `main-cta-link` / fork-cta copy keys missing, OR section-metadata `showwith` gating failed and the `columns (fullsize)` fallback hero is visible |
| Floating CTA doesn't appear | `show-floating-cta`, `desktop-floating-cta`, `mobile-floating-cta`, and their `-text`/`-link` companions all need to be authored on the draft |
| Wrong locale behavior | `georouting` missing |

Always note which path the test was run against when reporting failures — draft-path symptoms can look identical to genuine bugs.

---

## Express-Specific Block Patterns

### Frictionless Quick Action — Content vs Code Split

The most complex block. Content layer sets WHAT action, code layer handles HOW.

**Content Layer (authored in DA):**
- Block name: `frictionless-quick-action` (desktop) or `frictionless-quick-action-mobile`
- Variant class on the table header sets the action type: `remove-background`, `resize-image`, `crop-image`, `convert-to-jpg`, etc.
- Page metadata drives mode: `frictionless-safari=on`, `mobile-floating-cta=mobile-fork-button-frictionless`

**Code Layer (`frictionless-quick-action.js` + `frictionless-utils.js`):**
- `decorate()` reads the variant class → sets `data-frictionlesstype` attribute
- Renders upload button (desktop: `<a role="link">`, mobile: `<button #mobile-fqa-upload>`)
- `frictionless-utils.js` validates file against `QA_CONFIGS`, loads CCEverywhere SDK
- Calls `ccEverywhere.quickAction.<actionType>()`, handles result/error events
- Applies analytics attributes

### meta-powered Blocks
Some blocks are never authored on the page — they are injected by `buildAutoBlocks()` from metadata. These blocks guard against running when not injected this way:

```javascript
if (!block.classList.contains('meta-powered')) return;
```

All floating CTA blocks (`floating-button`, `multifunction-button`, `mobile-fork-button*`) work this way. The content layer controls them via metadata keys, not by placing the block on the page.

---

## Discovery: What to Investigate

When the discovery agent encounters a feature, these are the things to look up — not document ahead of time.

### For any new page or feature area
- [ ] Does a `metadata.xlsx` exist at the path level? What keys does it set?
- [ ] What metadata keys are on the page itself? Are any missing vs what the code expects?
- [ ] Which blocks are on the page? Do their JS files exist in `/express/code/blocks/`?
- [ ] Are any blocks `meta-powered` (injected from metadata, not authored)?

### For frictionless / quick action work
- [ ] Which `data-frictionlesstype` value does this action map to?
- [ ] Is the action in `QA_CONFIGS` in `frictionless-utils.js`?
- [ ] Desktop or mobile block variant (or both)?
- [ ] Does a Nala draft test page exist for this action at `/drafts/nala/test-gen/...`?

### For metadata-driven behaviour
- [ ] Is the key set at page level, path level (`metadata.xlsx`), or injected by `scripts.js`?
- [ ] Which `buildAutoBlocks()` branch handles this? (check `scripts.js`)
- [ ] Is the key documented in architecture.md Section 5?

### For floating CTA / fork button work
- [ ] Which CTA variant does `desktop-floating-cta` / `mobile-floating-cta` metadata point to?
- [ ] Is `fork-eligibility-check=on`? (Android-only gate)
- [ ] Is `frictionless-safari=on`? (iOS unlock)
