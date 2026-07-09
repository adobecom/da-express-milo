# Auto‑QA Screenshot Diff — Architecture (Prototype)

**Status:** Draft / design only. No implementation yet.
**Scope of this doc:** the *local‑branch* prototype. PR integration, S3, and
full site-wide reverse indexing are explicitly **out of scope** (see §11).
**Owner:** (TBD)   **Branch this was drafted on:** `claude-auto-qa`

---

## 1. Purpose

Automate the repetitive part of visual QA before a release: given the changes
on the **current local branch**, figure out **which live pages could be
visually affected**, capture **stable vs. branch** screenshots for those pages,
and produce a **local report** ranked by diff size — with pages whose blocks
**failed to load** flagged separately.

This prototype covers only the **front half** — going from *branch changes* to a
*list of affected pages + A/B URL pairs*. The capture/diff/report back half
already exists in Milo (`nala/utils/screenshot-diff/`, `screenshot-diff` branch)
and is treated as a downstream integration (§C7–C9), not something we rebuild.

## 2. Goals / Non‑goals

**Goals**
- Deterministic, explainable mapping: *changed files → affected blocks → affected pages*.
- Use a **curated critical-pages manifest** as the reliable base set.
- Use the **DA MCP** to fetch each critical page's authored source and extract
  the blocks it uses, so page↔block matching is driven by real content.
- Emit a machine-readable **affected-pages list** (+ A/B URLs) for the capture step.

**Non‑goals (for the prototype)**
- No PR/GitHub-Actions integration (local branch only).
- No S3 upload (local output only).
- No guarantee of *complete* site-wide coverage. Site-wide discovery (§C5) is a
  **spike**, gated behind validating that DA crawl/grep is good enough.

## 3. Inputs & preconditions

| Input | Source | Notes |
|---|---|---|
| Current branch name | `git rev-parse --abbrev-ref HEAD` | Used to build the "B" (branch) preview URL. |
| Base branch | config (default `stage`) | Diff base for changed files. |
| Changed files | `git diff --name-only <base>...HEAD` | Committed changes; optionally include working tree. |
| Critical pages | `config/critical-pages.yaml` (new) | Curated list, keyed by EDS path. |
| DA coordinates | config | `org: adobecom`, `repo: da-express-milo`. |

**Preconditions**
- DA MCP authenticated (`AEM DA - Prod`).
- For capture (later phase): the branch must be **previewed/published on EDS** so
  `https://<branch>--da-express-milo--adobecom.aem.live/<path>` resolves.

## 4. Terminology

- **Block** — an Express EDS block, dir `express/code/blocks/<block-name>/`.
  Rendered as `<div class="<block-name> block" data-block-name="<block-name>">`.
- **Variant** — modifier authored in the block header row, e.g. `marquee (dark, small)`.
- **Critical page** — a hand-picked representative page URL in the manifest.
- **Affected page** — a page that uses at least one block changed on this branch.
- **A/B pair** — stable URL (main) vs. branch URL (branch preview) for one page.

## 5. High‑level flow

```
                 ┌─────────────────────────────┐
  git diff ─────▶│ C2 Changed-blocks resolver   │─── changedBlocks[] ──┐
 (base...HEAD)   └─────────────────────────────┘                      │
                                                                       ▼
 critical-pages.yaml ─▶ C3 Page→blocks (DA MCP) ─▶ pageBlocks{} ─▶ C4 Intersect
                          da_get_source + parse                      │
                                                                     ▼
                                                        affectedPages[] (+ which blocks)
                                                                     │
                                    ┌────────────────────────────────┤
                                    ▼                                 ▼
                    C5 [SPIKE] DA-wide discovery         C6 A/B URL pairing
                    (crawl da_list_sources +             main vs <branch> preview
                     da_get_source + grep)                        │
                                    │                             ▼
                                    └────▶ extraPages[] ─────▶ affected-pages.json
                                                                     │
                                                (downstream, existing Milo tool)
                                                                     ▼
                                              C7 capture+diff · C8 broken-block · C9 report
```

## 6. Components

### C1 — Critical-pages manifest  *(new, Phase 1)*
A curated YAML list of representative pages. This is the **reliable floor** for
coverage and the fallback set when a change has global blast radius (§C2).

```yaml
# config/critical-pages.yaml
site:
  org: adobecom
  repo: da-express-milo
  stableBase: https://main--da-express-milo--adobecom.aem.live
  # branchBase is derived at runtime: https://<branch>--da-express-milo--adobecom.aem.live
pages:
  - path: /express/                       # EDS path (also the report key)
    daPath: /express/index               # DA source path (see §8 mapping note)
    label: Home
  - path: /express/feature/image/remove-background
    label: Remove Background (SEO QA)
  - path: /express/pricing
    label: Pricing
viewports: [chrome, ipad, iphone]         # reuse Milo's viewport presets
```

> `daPath` may be omittable if the EDS→DA path mapping is mechanical
> (confirm during Phase 1 — see §8).

### C2 — Changed-blocks resolver  *(new, Phase 1)*
`git diff --name-only <base>...HEAD` → classify each path:

| Path pattern | Result |
|---|---|
| `express/code/blocks/<name>/**` | block `<name>` is changed |
| `express/code/scripts/**`, `express/code/styles/**` | **global** (high blast radius) |
| `express/code/scripts/utils/**` shared modules | **traced** — see note |
| tests, mocks, docs, `.md` | ignored |

Output: `changedBlocks: Set<string>` and `globalChange: boolean`.

> **Import-graph note.** A change to a shared module (e.g.
> `scripts/utils/easy-upload-utils.js`) affects every block that imports it, not
> a block of the same name. Phase 1 handles this conservatively: shared-module
> changes → treat as `globalChange` (fall back to the full critical set). A later
> refinement can trace the import graph to narrow it to the real dependents.

### C3 — Page→blocks resolver via DA MCP  *(new, Phase 1 — core)*
For each critical page, fetch its authored source and extract the blocks it uses.

```
da_get_source({ org, repo, path: <daPath> })
  → authored HTML (DA block tables/divs)
  → parse block containers → [{ name, variants[] }]
```

- **Primary signal (authored):** DA source. Each block is a container whose
  header identifies the block, e.g. `marquee (dark)` → name `marquee`,
  variants `[dark]`. This is what the author placed on the page.
- **Optional cross-check (rendered):** fetch `stableBase + path` and read
  `[data-block-name]` from the rendered HTML — the ground truth of what actually
  loaded. Useful to catch auto-blocks / dynamically inserted blocks the authored
  source doesn't name. Kept optional to avoid coupling Phase 1 to live rendering.

Output: `pageBlocks: { [path]: Set<blockName> }`.

### C4 — Affected-page selection  *(new, Phase 1)*
```
affectedPages = criticalPages.filter(p =>
  globalChange || intersects(pageBlocks[p.path], changedBlocks))
```
Each entry records **why** it was selected (which changed blocks it contains) so
the report can explain itself.

### C5 — DA-wide discovery for additional pages  *(SPIKE — do NOT build yet)*
Goal: beyond the curated list, find *other* pages that use the changed blocks.

**Reality of the DA MCP:** there is **no component/full-text search**. The only
primitives are:
- `da_list_sources({ org, repo, path })` — list a folder (recurse manually).
- `da_get_source(...)` — fetch one doc.
- `da_lookup_fragment({ org, repo, fragmentPath })` — reverse-lookup for a
  **fragment** (only helps when a block is authored as a reusable fragment).
- `da_lookup_media(...)` — reverse-lookup for a **media asset**.

So "find pages using block X" = **crawl**: walk the tree with `da_list_sources`,
`da_get_source` each doc, grep for the block name. This is the part we are
**unsure about** and must validate before committing:

**Open questions to answer in the spike**
1. How large is the tree? Is a full crawl minutes or hours?
2. Rate limits / pagination on `da_list_sources`?
3. Can we scope to likely subtrees (e.g. by locale or section) to cut cost?
4. Does grepping authored source reliably detect a block, given variants,
   nested blocks, and auto-blocks that never appear in source?
5. Can `da_lookup_fragment` shortcut discovery for fragment-based blocks?
6. Caching: build a `blockName → [pages]` index once and refresh on a schedule?

**Gate:** only build C5 if the spike shows crawl+grep is accurate and affordable.
Until then, the prototype ships with C1–C4 only.

### C6 — A/B URL pairing  *(new, Phase 1)*
For each affected page:
- **A (stable):** `stableBase + path`
- **B (branch):** `https://<branch>--da-express-milo--adobecom.aem.live + path`

Emit `affected-pages.json` (see §7) — the handoff artifact to the capture step.

### C7 — Capture + diff  *(downstream — reuse Milo, later phase)*
Reuse `nala/utils/screenshot-diff/` (Playwright + `getComparator`,
`reducedMotion`, viewport presets, sharding). Only change: write artifacts to a
**local dir** instead of S3. Driven by `affected-pages.json`.

### C8 — Broken-block probe  *(downstream — later phase)*
During capture, classify load failures using DOM + console signals (more
reliable than pixels):
- Milo's `loadBlock` sets `block.dataset.blockStatus = 'loaded'` **only on
  success** (`libs/utils/utils.js:1116`); on failure it logs `Failed loading
  <name>`. So flag any `.block` **missing** `[data-block-status="loaded"]`.
- Capture console errors matching `Failed loading`, plus failed block JS/CSS
  network requests, plus zero-height/unstyled blocks (FOUC heuristic).
- Result per page: `broken` (load failure) vs. `changed` (pixel diff only).

### C9 — Report  *(downstream — later phase)*
Self-contained `report/index.html`: rows sorted worst-first by mismatch %, A|B|diff
thumbnails, 🔴 broken badge from C8, filters (viewport, broken-only, threshold).

## 7. On-disk layout / data model

```
.qa-screendiff/                     # gitignored working dir
  affected-pages.json               # handoff artifact (Phase 1 output)
  cache/da-block-index.json         # optional: blockName -> [pages] (Phase 2)
  report/                           # capture output (later phase)
    <path>/<viewport>/{a,b,diff}.png
    index.html
```

`affected-pages.json` (Phase 1 deliverable):
```json
{
  "branch": "claude-auto-qa",
  "base": "stage",
  "changedBlocks": ["frictionless-quick-action"],
  "globalChange": false,
  "pages": [
    {
      "path": "/express/feature/image/remove-background",
      "label": "Remove Background (SEO QA)",
      "matchedBlocks": ["frictionless-quick-action"],
      "source": "critical",                     // or "discovered" (C5)
      "a": "https://main--da-express-milo--adobecom.aem.live/express/feature/image/remove-background",
      "b": "https://claude-auto-qa--da-express-milo--adobecom.aem.live/express/feature/image/remove-background",
      "viewports": ["chrome", "ipad", "iphone"]
    }
  ]
}
```

## 8. External interfaces

**Git (C2)**
```bash
git rev-parse --abbrev-ref HEAD
git diff --name-only <base>...HEAD          # committed changes vs base
git diff --name-only                        # (optional) working-tree changes
```

**DA MCP (C3, C5)** — org `adobecom`, repo `da-express-milo`:
- `da_get_source({ org, repo, path })` → authored HTML for one page.
- `da_list_sources({ org, repo, path })` → folder listing (spike/crawl only).
- `da_lookup_fragment({ org, repo, fragmentPath })` → fragment reverse-lookup (spike).

**EDS URL scheme (C6)**
- Stable: `https://main--da-express-milo--adobecom.aem.live/<path>`
- Branch: `https://<branch>--da-express-milo--adobecom.aem.live/<path>`
- Preview host variant: `.aem.page` (if live isn't published for the branch).

> **EDS↔DA path mapping (confirm in Phase 1).** Need to nail how an EDS path
> (`/express/pricing`) maps to a DA `da_get_source` path (content root prefix,
> `.html`/no-extension, index docs). Until confirmed, the manifest carries an
> explicit `daPath` per page.

## 9. Open questions & risks

- **[HIGH] DA document search (C5)** — no native search; crawl+grep cost and
  accuracy unknown. This is the reason the rest is not being built yet.
- **EDS↔DA path mapping** — must be confirmed to auto-derive `daPath` (§8).
- **Auto-blocks / dynamic blocks** — not present in authored source; only the
  rendered cross-check (C3 optional) or C8 sees them.
- **Shared-module blast radius** — import-graph tracing vs. global fallback (C2).
- **Dynamic content noise** (downstream) — carousels, MEP/experiments,
  personalization, timestamps cause false diffs; needs masking + stabilizing
  params. (Owned by the capture phase, flagged here for completeness.)
- **Branch readiness** (downstream) — B URLs 404 if the branch isn't previewed.

## 10. Phased plan

- **Phase 1 (build first):** C1 manifest, C2 changed-blocks, C3 DA page→blocks,
  C4 intersect, C6 pairing → emit `affected-pages.json`. Confident, low-risk.
- **Phase 2 (spike, gated):** C5 DA-wide discovery. Answer §9 open questions on a
  small subtree before generalizing. **Do not build until validated.**
- **Phase 3 (integrate):** wire `affected-pages.json` into Milo's capture/diff
  (C7), add broken-block probe (C8) and local report (C9).

## 11. Prototype boundary (explicitly out for now)

- PR / GitHub-Actions triggers (local branch only).
- S3 upload (local output only).
- Site-wide reverse index as a *guaranteed* feature (it's a gated spike).
- Anything downstream of `affected-pages.json` until Phase 1 proves out.
