---
name: build-block-from-figma
description: >
  Builds a new Express block component from Figma designs using the Figma MCP,
  validates visually with Playwright MCP, then runs accessibility and
  performance audits.  Provide a preview URL (localhost or DA preview/published)
  and one or more Figma frame URLs for different device sizes.  For DA published
  pages (.aem.live), code is pushed to a feature branch and tested via the
  branch-prefixed EDS URL.
---

# Build Block Skill

You are building a new block component for **adobe.com/express** inside
the `adobecom/da-express-milo` repository.  Components are plain HTML
blocks styled with plain CSS and initialised by an `async function decorate(block)`
exported as the module default — you never add self-initialisation logic.

> **Critical path rules**
>
> - Block code lives exclusively in `express/code/blocks/<name>/`.
>   Read 2–3 existing blocks from there before writing any code.
> - Shared utilities come from `express/code/scripts/utils.js`
>   (`getLibs`, `decorateButtonsDeprecated`, `getIconElementDeprecated`,
>   `fixIcons`, `toClassName`) and from milo loaded lazily via `getLibs()`
>   (`createTag` from `${getLibs()}/utils/utils.js`).
>   Re-use these; do not duplicate their logic.
> - Design tokens live in `express/code/styles/styles.css`.
> - **Never use `.innerHTML`** — it destroys Preact/Lit components.
>   Use `.append()`, `cloneNode`, or `createTag` instead.
> - The platform is **Adobe EDS**.  Use the **Fluffyjaws MCP** to look
>   up any EDS conventions you are unsure about.

## Bundled resources

Do **not** load these upfront.  Each phase below tells you which file
to read at the point it becomes relevant.

### references/
| File | Purpose |
|------|---------|
| `design-tokens.md` | Express token system + the Figma→token **mapping algorithm** (exact name match → in-category value match → new token / hardcoded), semantic-category guardrails, and the token-mapping report format. |
| `grid-system.md` | Breakpoints, column counts, container variants, n-up layouts. |
| `eds-patterns.md` | EDS block anatomy, Express utilities, CTA patterns, icon helpers, placeholder text. |
| `acceptance-criteria.md` | JS/CSS rules, quality checklists, media-query syntax, token usage. |
| `remote-branch-workflow.md` | Branch creation, push procedure, CDN refresh, iteration batching for `.aem.live` URLs. |

### agents/
| File | Purpose |
|------|---------|
| `visual-comparison.md` | Playwright screenshot loop — layout, spacing, colour, media fidelity checks. |
| `accessibility-check.md` | axe-core WCAG 2.2 AA audit scoped to the block. |
| `performance-check.md` | Lighthouse CLI audit — LCP, CLS, INP, TBT, overall score. |

---

## Inputs

Ask the user to provide the following before proceeding:

| Input | Required | Example |
|---|---|---|
| **Preview URL** | Yes | `http://localhost:3000/...`, `https://main--da-express-milo--adobecom.aem.page/path`, or `https://main--da-express-milo--adobecom.aem.live/path` |
| **Figma URL — Mobile** (up to 599 px) | At least one Figma URL | frame link |
| **Figma URL — Small Tablet** (600–899 px) | | frame link |
| **Figma URL — Large Tablet** (900–1199 px) | | frame link |
| **Figma URL — Desktop** (≥ 1200 px) | | frame link |
| **Figma URL — Widescreen** (≥ 1680 px) | | frame link |
| **Base branch** | No (default: `stage`) | `my-feature`, `methomas/experiment` |

Do not proceed until you have the preview URL and at least one Figma URL.

---

## Phase 0 — Preview URL resolution

After collecting the preview URL, determine its type and resolve it
to a usable URL before proceeding.

### Localhost (`http://localhost:...`)

No special handling. Proceed directly to Phase 1.

### DA preview (`.aem.page`)

A `.aem.page` URL is a preview and its content may not be fully published.
Inform the user and offer two options:
- Provide a published (`.aem.live`) URL themselves.
- Let Claude publish the page via the EDS admin API.

If the user wants Claude to publish, **load
`references/remote-branch-workflow.md` section 1 now** and follow
the publishing procedure (path safety check, API calls).

After obtaining the `.aem.live` URL (whether user-provided or just
published), **fall through to the DA published section below** to
parse it and set `remote-branch-mode`.

### DA published (`.aem.live`)

Parse the URL to extract org, repo, and page path:
```
https://main--<repo>--<org>.aem.live/<path>
```

Store these values — they are needed in Phase 1 for branch creation
and in Phase 5 for the branch-prefixed Playwright URL.

Set an internal flag: **`remote-branch-mode = true`**.

> **STOP**: Do NOT proceed to Phase 1 until you have either a
> localhost URL or a resolved `.aem.live` URL. From this point
> forward, the resolved URL is referred to as the **page URL**.

---

## Phase 1 — Validate environment & infer component name

Use Playwright MCP to navigate to the page URL.

### Infer component name

Inspect the DOM inside `<main>` only — ignore header, footer, and nav.
Look for the block identifier (a distinctive class name, e.g.
`class="ax-marquee hero"`).  Derive the component name in **kebab-case**.
Confirm the inferred name with the user before continuing.

### Create feature branch (remote-branch-mode only)

Skip this section if `remote-branch-mode` is `false` (localhost).

**Load `references/remote-branch-workflow.md` section 2 now** and
follow the branch creation procedure.  Do NOT proceed to Phase 2
until the user confirms the branch.

---

## Phase 2 — Read existing patterns

Before writing any code:

1. **List the directory `express/code/blocks/`** to see available blocks,
   then read **2–3 blocks from that listing**.  For each block you read, study:
   - Folder structure: `block-name/block-name.js` + `block-name.css`
   - How `async function decorate(block)` is structured and exported
   - How utilities from `../../scripts/utils.js` are imported
   - How milo utilities (`createTag`, etc.) are lazy-loaded via `getLibs()`
   - CSS class namespacing conventions
2. **Load `references/eds-patterns.md` now** — it covers EDS block
   anatomy, Express utilities, CTA patterns, and icon helpers.
3. Read `express/code/styles/styles.css` and note all CSS custom
   properties — `--color-*`, `--spacing-*`, `--body-font-size-*`,
   `--heading-font-size-*`, `--body-font-family`, `--heading-font-weight`, etc.
   **Load `references/design-tokens.md` now** for the full mapping rules.
4. Read `express/code/scripts/utils.js` to understand the available
   utilities: `getLibs`, `decorateButtonsDeprecated`, `getIconElementDeprecated`,
   `fixIcons`, `toClassName`, and any others relevant to the block.
5. Read `express/code/scripts/utils/decorate.js` for `normalizeHeadings`
   and any other block-decoration helpers.
6. **Load `references/grid-system.md` now.**

---

## Phase 3 — Read Figma designs

For each provided frame URL, call **all three** tools:

1. **`get_screenshot`** — captures the visual appearance.
2. **`get_design_context`** — extracts exact computed values (padding,
   gap, max-width, aspect-ratio, flex direction, font sizes, border-radius).
   Screenshots alone miss these values; `get_design_context` is the
   source of truth for any numeric property.
3. **`get_variable_defs`** — returns the **named design-system variables**
   Figma bound to each layer (e.g. `Palette/gray-100 → #E9E9E9`,
   `Corner-radius/corner-radius-100 → 8px`). The variable **name** is what
   lets you match against Express tokens by name rather than guessing from
   the raw value. `get_design_context` gives value + property;
   `get_variable_defs` gives the name — you need both to map tokens.

> **Do not skip `get_design_context` or `get_variable_defs`.** Visual
> estimation from screenshots is the leading cause of incorrect padding,
> wrong breakpoints, wrong aspect-ratios, and mismatched max-widths. Mapping
> from raw values without the Figma variable names is the leading cause of
> picking the wrong same-valued token (e.g. a spacing token on a radius).

### Figma tool error fallbacks

These three errors are common with `?m=dev` links and large frames. Handle
them rather than stalling; never guess a node ID to work around them.

- **"Invalid node" / "node was not found"** — the node was moved, renamed,
  or deleted (dev links go stale). Call `get_metadata` **without** a
  `nodeId` to list the file's pages, drill in to locate the target, and if
  it no longer exists ask the user for a fresh **Copy link to selection**
  URL (or the correct file / branch).
- **"You currently have nothing selected"** — the server is using the Figma
  **desktop-app bridge** (live selection) instead of resolving the node
  remotely, typically because the file isn't reachable via the MCP
  account's remote API. Ask the user to open the file in the Figma
  **desktop app** and select the target layer, then retry.
- **`get_design_context` output exceeds the token limit** — the frame is
  large. The token-mapping workflow only needs `get_variable_defs` (which
  pairs each variable's name with its value) plus the screenshot, so
  proceed with those. If you need specific computed values from the
  oversized context, read the saved result file in chunks (or re-run
  `get_design_context` on a smaller child node) rather than the whole frame.

From `get_design_context` for each frame, extract and record:

- **Flex / grid direction** and whether layout is stacked or side-by-side
- **Container hierarchy** — note every named container layer (e.g.
  `Main-container > Text-content + CTA-container`). The DOM structure
  you build in Phase 4 must mirror this hierarchy, not flatten it.
- **Exact padding values** — distinguish block-level padding from
  column-level padding (a block may have `py-0` while its text column
  has `py-80px`).
- **Max-width** on individual text/CTA containers, not just on the block.
- **Image aspect-ratio** and whether `border-radius` is `0` or non-zero.
- **Gap values** between each level of nesting (block gap vs column gap
  vs element gap within a column).
- Typography (font-size, weight, line-height), colours, spacing, and
  radius — for each, capture **both** the Figma variable name (from
  `get_variable_defs`) and the raw value (from `get_design_context`), then
  resolve to an Express token using the mapping algorithm in
  `references/design-tokens.md` (exact name match → in-category value match
  → new token / hardcoded). Always prefer a token over a hardcoded value.

If multiple frames are provided, explicitly note layout differences
between breakpoints — these drive your CSS overrides. Pay particular
attention to whether the **side-by-side layout breakpoint** matches the
generic 600 px tablet grid or fires later (e.g. 900 px).

### Cache Figma frames to disk

After retrieving each frame, **save the Figma frame image** to a local
cache directory so it remains available during Phase 5 even if the
Figma MCP session expires:

```
/tmp/build-block-figma/
  mobile.png
  tablet.png
  desktop.png
  hd.png
```

Use Playwright MCP or shell commands to write the images.  Phase 5
should read from this cache instead of re-fetching from Figma.

### Build a per-breakpoint element inventory

After reading all Figma frames, compile a **comparison table** that
lists every visible element at each breakpoint.  Example format:

```
Element         | Mobile | Tablet | Desktop | HD
─────────────────────────────────────────────────
Heading         | ✓      | ✓      | ✓       | ✓
Body text       | ✓      | ✓      | ✓       | ✓
CTA button      | ✓      | ✓      | ✓       | ✓
Hero image      | ✓      | ✓      | ✓       | ✓
Background      | solid  | gradient| gradient| gradient
```

If an element (especially media — images, video, icons) appears in
**any** Figma frame, explicitly flag which breakpoints include it and
which do not.  Carry this inventory forward into Phase 4 as a
checklist — the implementation must match element presence per
breakpoint exactly.

### Build the token-mapping table

Using the Figma variable names (`get_variable_defs`) and raw values
(`get_design_context`) gathered above, resolve every styled value to an
Express token **now**, following the algorithm in
`references/design-tokens.md`. Read `express/code/styles/styles.css` first
if you have not already (Phase 2 step 3).

Record each resolution so the Phase 9 token-mapping report writes itself.
Carry forward in particular:

- Every value that did **not** resolve via an exact name match.
- Any proposed **new `:root` token** — these require user confirmation
  before commit; raise them as soon as the table is built rather than at the
  end.
- Any value you had to **hardcode**, or any value-match you are unsure is
  semantically correct (mark `review`).

---

## Phase 4 — Build the component

### Check out the working branch (remote-branch-mode only)

Skip this section if `remote-branch-mode` is `false` (localhost).

**Load `references/remote-branch-workflow.md` section 3 now** and
follow steps 1-2 only (fetch and check out the temporary local
branch from the upstream feature branch). Do **not** commit or push
yet. All file creation and editing below happens on this temporary
branch.

### Create block files

Create files at:
- `express/code/blocks/<name>/<name>.js`
- `express/code/blocks/<name>/<name>.css`

### JS and CSS rules + acceptance criteria

**Load `references/acceptance-criteria.md` now.** It contains all JS
rules (decorate pattern, utility imports, CTA and icon handling, media
parity), CSS rules (mobile-first, media-query syntax, token usage), and
both quality checklists. Follow every item during implementation.

### Lint and fix

Run ESLint on the newly created files before proceeding:

```bash
npx eslint express/code/blocks/<name>/<name>.js --fix
```

If errors remain after `--fix`, resolve them manually.  Do not
move to the unit test section until the block's JS passes ESLint
with zero errors.

### Unit tests

Create unit tests under `test/blocks/<name>/` using the
`@web/test-runner-commands` + `@esm-bundle/chai` framework (mocha
describe/it syntax) used throughout this repo.

#### 1. Mock HTML files

Create at least one mock HTML file that mirrors the **authored
(pre-decoration) markup** — i.e. the EDS table row structure the
block receives when `decorate(block)` is called, not the decorated
DOM.  Pattern from existing blocks:

```html
<!-- test/blocks/<name>/mocks/default.html -->
<main>
  <div class="<block-name>">
    <div>
      <div>
        <h2>Test heading</h2>
        <p>Test body paragraph.</p>
        <p><strong><a href="https://example.com">Primary CTA</a></strong></p>
        <p><em><a href="https://example.com">Secondary CTA</a></em></p>
        <p>Disclaimer text</p>
      </div>
      <div>
        <picture><img src="/test-image.jpg" alt="test"></picture>
      </div>
    </div>
  </div>
</main>
```

Add a second mock `inject-logo.html` if the block supports logo
injection via the `marquee-inject-logo` meta tag.

#### 2. Test file

```js
// test/blocks/<name>/<name>.test.js
import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const locales = { '': { ietf: 'en-US', tk: 'hah7vzn.css' } };
window.isTestEnv = true;

const imports = await Promise.all([
  import('../../../express/code/scripts/utils.js'),
  import('../../../express/code/scripts/scripts.js'),
]);
const { getLibs } = imports[0];

await import(`${getLibs()}/utils/utils.js`).then((mod) => {
  mod.setConfig({ locales });
});

const { default: decorate } = await import('../../../express/code/blocks/<name>/<name>.js');

async function prepBlock(filePath) {
  document.body.innerHTML = await readFile({ path: filePath });
  const block = document.querySelector('.<block-name>');
  await decorate(block);
  return block;
}

describe('<block-name>', () => {
  it('decorates successfully', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block).to.exist;
    expect(block.dataset.blockStatus).to.not.equal('failed');
  });

  it('builds foreground and image-container', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block.querySelector('.foreground')).to.exist;
    expect(block.querySelector('.image-container')).to.exist;
  });

  it('marks last non-CTA paragraph as disclaimer', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block.querySelector('.disclaimer')).to.exist;
  });

  // Add tests for any other structural invariants the block produces —
  // e.g. text-content / cta-container split, logo injection, etc.
  // Model tests on what decorate() actually does, not on CSS values.
});

// If the block supports marquee-inject-logo, add a describe block:
describe('<block-name> logo injection', () => {
  function addMeta(name, content) {
    const meta = document.createElement('meta');
    meta.name = name;
    meta.content = content;
    document.head.appendChild(meta);
  }

  afterEach(() => {
    document.head.querySelectorAll('meta[name^="marquee-inject"]').forEach((m) => m.remove());
  });

  it('injects logo when marquee-inject-logo is on', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/inject-logo.html' });
    addMeta('marquee-inject-logo', 'on');
    const block = document.querySelector('.<block-name>');
    await decorate(block);
    expect(block.querySelector('.express-logo')).to.exist;
  });
});
```

#### 3. Run tests

```bash
npx wtr test/blocks/<name>/<name>.test.js --node-resolve
```

All tests must pass before committing. Fix any failures before
proceeding to Phase 5.

### Commit and push (remote-branch-mode only)

Skip this section if `remote-branch-mode` is `false` (localhost).

Complete the remaining steps from `remote-branch-workflow.md`
section 3 (steps 3-4): commit the block JS, CSS, and test files,
push to the feature branch, then clean up the temporary local branch.

---

## Phase 5 — Visual comparison loop

### 5a. Refresh DA preview (localhost only)

Skip this section if `remote-branch-mode` is `true`.

If you modified the DA HTML at any point (e.g. adding a block to the
page in Phase 1), force-refresh the preview so the dev server picks
up the new content:

```bash
curl -s -X POST \
  "https://admin.hlx.page/preview/adobecom/da-express-milo/main/<page-path>"
```

### 5b. Construct the Playwright URL

**Localhost mode:** use the page URL as-is.

**Remote-branch-mode:** replace `main` with the feature branch name
in the page URL:

```
https://<branch>--da-express-milo--adobecom.aem.live/<page-path>
```

Example:
```
https://methomas-ax-hero-autogenerated--da-express-milo--adobecom.aem.live/drafts/methomas/test-page
```

This URL is referred to as the **Playwright URL** in all subsequent
steps and agents.

### 5c. Force-refresh after code push (remote-branch-mode only)

Skip this section if `remote-branch-mode` is `false`.

Follow the CDN force-refresh procedure in
`references/remote-branch-workflow.md` section 4.

### 5d. Pre-flight check

Before taking any screenshots, navigate to the Playwright URL
(constructed in 5b) and verify the block actually loaded.  Run a JS
evaluation on the page:

1. Check that `document.querySelector('.<block-name>')` exists.
2. Check `data-block-status` equals `"loaded"`.
3. Check that any expected decorated classes are present.
4. Check browser console for block-loading errors (403/404 on the
   block's JS or CSS files).

**Common failures and fixes:**
- **Block JS 404/403**: check that the file path is correct and the
  branch has been pushed with the file at
  `express/code/blocks/<name>/<name>.js`.
- **`data-block-status` is null**: the block JS was never fetched.
  Check the network/console for the root cause before proceeding.
- **(Remote-branch-mode) 404 on feature branch files**: the CDN
  may not have indexed the new files yet.  Trigger per-file code
  preview as described in `remote-branch-workflow.md` section 4a,
  wait 10-15 seconds, then reload.

Do **not** proceed to screenshots until the pre-flight check passes.

### 5e. Visual comparison

**Load `agents/visual-comparison.md` now** — it defines what to
assess (layout, spacing, colour, media) and how to identify fixes.

For each provided breakpoint, screenshot the component and compare
against the cached Figma frame.  Maximum **5 passes** total across
all breakpoints. Stop early if fidelity is high.

**What counts as one pass:**

- **Localhost mode**: identify issues → fix locally → reload →
  re-screenshot.
- **Remote-branch-mode**: identify issues → fix locally → batch
  with other fixes until high-confidence → push (section 3) →
  force-refresh (section 4) → re-screenshot. A single pass may
  contain multiple fixes but counts as one pass toward the limit.
  See `references/remote-branch-workflow.md` section 5 for the
  batching criteria.

**Important**: only after the visual loop is complete, proceed to
Phase 6 and Phase 7.  Do not run accessibility or performance checks
during visual iteration.

---

## Phase 6 — Accessibility audit

**Load `agents/accessibility-check.md` now** and follow its procedure.

Run axe-core against the block's container element.  Fix any WCAG 2.2 AA
violations found.  If fixes require code changes **and
`remote-branch-mode` is `true`**, push via
`references/remote-branch-workflow.md` section 3, then
force-refresh per section 4.
Report the subagent's **Obstacles Encountered** section in the
final summary.

---

## Phase 7 — Performance audit

**Load `agents/performance-check.md` now** and follow its procedure.

Run a Lighthouse audit against the Playwright URL.  Assess LCP
impact and flag any regressions.  If fixes require code changes
**and `remote-branch-mode` is `true`**, push via
`references/remote-branch-workflow.md` section 3, then
force-refresh per section 4.
Report the subagent's **Obstacles Encountered** section in the
final summary.

---

## Phase 8 — Nala E2E tests

Invoke the `nala-test-generation` skill to generate the Nala test suite
for this block.

Provide:
- **Block name**: the kebab-case block name (e.g. `transparent-img-marquee`)
- **Test page path**: the DA page path used throughout this skill run
  (e.g. `/drafts/methomas/transparent-img-marquee`)
- **What to test**: list the key elements and behaviours visible in the
  Playwright screenshots taken during Phase 5 — e.g. "logo, heading,
  body text, primary and secondary CTAs, image, disclaimer text, side-by-side
  layout at desktop"

The nala skill will create:
```
nala/blocks/<block-name>/
  <block-name>.spec.js
  <block-name>.test.js
  <block-name>.page.js
```

Include the page object locators for every element confirmed visible
during the visual comparison phase.  Push the nala files to the feature
branch in the same commit workflow as the block files
(`remote-branch-workflow.md` section 3).

---

## Phase 9 — Summary

Output:

1. **Component name** and file paths created (JS, CSS, unit tests, nala tests).
2. **Feature branch** (remote-branch-mode only) — branch name, repo,
   and number of commits pushed.
3. **Breakpoints implemented** and which Figma frames they correspond to.
4. **Token-mapping report** — the table defined in
   `references/design-tokens.md`. Note the count of clean exact-name
   matches, then list every Figma variable/value that did **not** resolve
   via an exact name match, with: Figma variable name, raw value, CSS
   property, resolution (value-match → which token / new token / hardcoded),
   and a **Needs decision?** column. Call out every `YES` and `review` row
   explicitly — these are the items the user must adjudicate.
5. **New tokens & hardcoded values** — any `:root` token you propose to add
   (with name, value, and where added) and any Figma value left hardcoded
   (with the explanatory CSS comment). New `:root` tokens must have been
   confirmed with the user before commit.
6. **Acceptance criteria checklist** — confirm each criterion from
   Phase 4 passes (or note exceptions with reasoning).
7. **Unit test results** — number of tests, pass/fail, any skipped.
8. **Accessibility results** — axe-core summary + any remaining issues.
9. **Performance results** — Lighthouse score, LCP, CLS, INP, TBT.
10. **Nala tests** — file paths created, test IDs, what each covers.
11. **Obstacles Encountered** — aggregated from all subagents, including
    visual discrepancies the user should review manually.

### Next steps (remote-branch-mode only)

After presenting the summary, suggest the user's likely next actions:
- **Open a PR** from `<branch-name>` into `stage` for code review.
- **Test in context** at `https://<branch-name>--da-express-milo--adobecom.aem.live/<page-path>`.
- **Run Nala locally** with `npm run nala stage @<block-name>` to validate the E2E tests against the feature branch URL.
- **Delete the feature branch** if the code was exploratory.

### Cleanup

After presenting the summary, ask the user whether to remove the
`.playwright-mcp` folder and the `/tmp/build-block-figma/` cache
created during the run.  If the user confirms, delete both:

```bash
rm -rf .playwright-mcp /tmp/build-block-figma
```

If the user declines, leave them in place.
