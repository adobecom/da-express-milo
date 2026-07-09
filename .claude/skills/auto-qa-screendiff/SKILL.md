---
name: auto-qa-screendiff
description: >
  Visual-QA a local branch end to end. Resolves changed Express blocks from the
  git diff (direct + reverse import graph), finds affected live pages (curated
  critical set + auto-included kitchen-sink demo pages, plus an opt-in
  single-block DA crawl) across the da-express-milo and express-color
  projects, captures stable-vs-branch screenshots with a size-tolerant pixel
  diff, probes each render for blocks that failed to load, and renders a
  ranked local HTML report from a customizable template.
---

# Auto-QA Screen-Diff

Full pipeline for `.claude/docs/auto-qa-screendiff-architecture.md`:

```
git diff → changed blocks → affected pages (curated + kitchen-sink
        + optional single-block crawl) → worklist
        → capture A/B + pixel diff + broken-block probe → ranked HTML report
```

**Default scope is deliberately small:** curated critical pages + the
kitchen-sink demo page for each affected block (zero crawling). A DA-wide
crawl is opt-in and scoped to exactly one block at a time via `--crawl-block`
— see [Notes / limits](#notes--limits) for why.

## Prerequisites
- Run from the repo root of `da-express-milo`.
- **DA MCP** authenticated (`AEM DA - Prod`) OR a `da-auth-helper` token — the
  scripts use `admin.da.live` (the MCP's backend) with the token for direct,
  faithful-to-disk fetches.
- **Node ≥ 20**; **Playwright** (resolved from the repo root) with Chromium.
- **Skill-local deps** (pixelmatch, pngjs) for the diff — install once:
  ```bash
  ( cd .claude/skills/auto-qa-screendiff && npm install )
  ```

All output goes to `.qa-screendiff/` (gitignored) at repo root.

## One-shot

```bash
# default: curated + kitchen-sink pages only, no crawl (needs branch previewed on EDS for real B)
.claude/skills/auto-qa-screendiff/run.sh --open

# opt in to a DA-wide crawl, scoped to one block, batched to avoid throttling:
.claude/skills/auto-qa-screendiff/run.sh --crawl-block wayfinder --open

# smoke test with no branch preview (B captured from A), fast:
.claude/skills/auto-qa-screendiff/run.sh --self --limit 8 --viewports chrome

# discovery only, no browser:
.claude/skills/auto-qa-screendiff/run.sh --no-capture
```
`run.sh` chains all six steps below and grabs the DA token itself. Options:
`--base <b>` · `--head <ref>` · `--crawl-block <name> [repos]` (opt-in, scoped
to one block; default repos `express-color,da-express-milo`) ·
`--crawl-batch-size N` (default 50) · `--crawl-batch-delay-ms N` (default
8000) · `--no-capture` · `--self` · `--limit N` · `--viewports v1,v2` ·
`--concurrency N` · `--open`.

The individual steps below are what `run.sh` runs — use them when iterating on
one stage.

## Pipeline

Let `SKILL = .claude/skills/auto-qa-screendiff`. Export a token once:
`export DA_TOKEN=$(da-auth-helper token)`.

### 1. Resolve changed blocks (C2)
```bash
mkdir -p .qa-screendiff
node $SKILL/scripts/resolve-changed-blocks.mjs --base stage > .qa-screendiff/changed-blocks.json
```
Direct block edits + transitive dependents via the reverse import graph; sets
`globalChange` when a change fans out too widely.

### 2. Fetch critical pages + select affected + kitchen-sink pages (C1, C3, C4)
```bash
# fetch each manifest page's DA source to .qa-screendiff/pages/<key>.html
node $SKILL/scripts/select-affected.mjs --mode plan --manifest $SKILL/config/critical-pages.json \
  --pages-dir .qa-screendiff/pages > .qa-screendiff/plan.json
jq -c '.[]' .qa-screendiff/plan.json | while read -r r; do
  org=$(jq -r .org <<<"$r"); repo=$(jq -r .repo <<<"$r"); dp=$(jq -r .daPath <<<"$r"); f=$(jq -r .file <<<"$r")
  curl -s -o "$f" "https://admin.da.live/source/${org}/${repo}${dp}" -H "Authorization: Bearer $DA_TOKEN"
done
# intersect page blocks with changed blocks; also auto-adds the kitchen-sink
# demo page (source: "kitchen-sink") for any affected block listed in the
# manifest's kitchenSinkBlocks, with zero extra fetching
node $SKILL/scripts/select-affected.mjs --mode select --manifest $SKILL/config/critical-pages.json \
  --pages-dir .qa-screendiff/pages --changed .qa-screendiff/changed-blocks.json \
  --branch "$(git rev-parse --abbrev-ref HEAD)" --out .qa-screendiff/affected-pages.json
```
> The DA MCP `da_get_source({org,repo,path})` is the canonical fetch; the `curl`
> to `admin.da.live/source` is its backend and writes straight to disk.

### 3. (Opt-in) Single-block DA crawl (C5)
Off by default. When curated + kitchen-sink coverage isn't enough for a
specific block, crawl for that ONE block only — never the whole affected set —
across bounded repos. The fetch phase is chunked (`--batch-size`, default 50)
with a delay between chunks (`--batch-delay-ms`, default 8000ms) and prints
progress per batch, because a full-speed crawl combined with the capture
step's own request volume has been observed to trip origin-side throttling
partway through a run (captures silently degrade to blank screenshots — see
Notes below). `da-express-milo` is thousands of pages, so it's also crawled
English-only (`--skip-locales`) even when scoped to one block.
```bash
node $SKILL/scripts/crawl-affected.mjs --org adobecom --repo express-color --block wayfinder \
  --changed .qa-screendiff/changed-blocks.json --manifest $SKILL/config/critical-pages.json \
  --out .qa-screendiff/crawl-express-color.json --exclude drafts --concurrency 10 \
  --batch-size 50 --batch-delay-ms 8000
```

### 4. Build the capture worklist (C6)
```bash
node $SKILL/scripts/build-worklist.mjs --manifest $SKILL/config/critical-pages.json \
  --affected .qa-screendiff/affected-pages.json \
  --crawl .qa-screendiff/crawl-express-color.json \
  --branch "$(git rev-parse --abbrev-ref HEAD)" --out .qa-screendiff/worklist.json
```
Merges curated + discovered, dedupes, pairs A/B URLs.

### 5. Capture + diff + broken-block probe (C7, C8)
```bash
node $SKILL/scripts/capture.mjs --worklist .qa-screendiff/worklist.json \
  --out-dir .qa-screendiff/report --concurrency 3
#   --self         B captured from A's url (smoke test when no branch preview)
#   --limit N      cap pages    --viewports chrome,ipad   --timeout 45000
```
Writes `a.png`/`b.png`/`diff.png` per page×viewport and `report/results.json`.
Status per cell: `a-failed`/`b-failed` (nav error OR HTTP ≥400 — an unpreviewed
branch's 404 is treated as a failure, not screenshotted as a normal page) ·
`broken` (B has a broken block whose identity — block name / resource path —
wasn't already broken on A; a like-for-like failure on both sides doesn't
count) · `diff` (pixels changed) · `ok`.

### 6. Render the report (C9)
```bash
node $SKILL/scripts/report.mjs --results .qa-screendiff/report/results.json
#   --template <file>   use a custom template (default templates/report.html)
open .qa-screendiff/report/index.html
```

## Customizable report template
`templates/report.html` is yours to edit. The renderer supports:
- `{{key}}` (escaped), `{{{key}}}` (raw HTML)
- a row block between the `BEGIN row` / `END row` HTML-comment markers, repeated
  per result cell.
Top-level tokens: `title, branch, base, generatedAt, summary, selfCheckBanner`.
Row tokens: `project, edsPath, viewport, status, statusClass, source,
matchedBlocks, diffPct, diffRatio, sizeChanged, aUrl, bUrl, aImg, bImg, diffImg,
brokenList, noteHtml`. Point `report.mjs --template` at any file with these.

## Testing
```bash
DA_TOKEN=$(da-auth-helper token) node $SKILL/test/crawl-affected.integration.mjs
```
Self-consistency check: each kitchen-sink / block-library demo page must render
its own namesake block. Baseline: 169 passed, 18 skipped (verified non-1:1), 0
failed. Sabotaging the detection regex fails all rows (verified).

## Notes / limits
- **Branch (B) URLs** need the branch previewed on EDS for that project, else B
  fails (`b-failed`). Use `--self` to validate the machinery meanwhile.
- **Diff is size-tolerant**: screenshots are padded to a common canvas, so height
  changes register (Playwright's `getComparator` silently ignores size diffs —
  we use pixelmatch/pngjs instead).
- **Broken-block probe** reads `data-block-status` + console errors + failed
  `blocks/*.js|css` requests. `broken` fires when B has a broken block *not
  already broken on A* (compared by identity — block name or resource path —
  not just count, so a different block breaking on B isn't masked by an
  equal-or-lower total count).
- **HTTP failures are real failures**: `page.goto()` only throws on navigation
  errors, not on 404/500 responses, so an unpreviewed branch or a dead page is
  explicitly checked for `status >= 400` and marked `a-failed`/`b-failed`
  rather than screenshotted and scored as `ok`/`diff`.
- **Rate limiting / origin throttling**: sustained request volume (a large
  crawl immediately followed by a large capture run) has been observed to
  progressively degrade captures — not random flakes, but a near-permanent
  collapse to blank/undecorated screenshots partway through a run (verify by
  checking screenshot file size; a blank full-page capture is a few KB). This
  is why crawling defaults to off, and why the opt-in crawl is scoped to one
  block and batched with delays. If you see many suspiciously small
  screenshots or `ok (0.00%)` runs stacking up late in a large worklist,
  distrust those results and re-run with a smaller scope rather than trusting
  them at face value. Lower `--concurrency` in the capture step too.
- **Dynamic content** (carousels, MEP, personalization) causes small non-zero
  diffs even in self-check; add masking/stabilizing params for signal.
- **CSS/asset-only shared changes** aren't traced through the JS import graph.
