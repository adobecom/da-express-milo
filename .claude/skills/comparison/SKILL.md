---
name: comparison
description: >
  Compares how a block renders on stage (or any baseline ref) vs. a given
  branch, across every page that references it. Captures screenshots on both
  sides via the qa-worktree tool (in parallel, and just the block element by
  default — not the whole page), pixel-diffs matching pages, and writes a
  JSON log plus a natural-language summary. Use before merging/reviewing a
  branch that touches a shared block, to answer "what did this actually
  change, visually, and where?" — the QA/regression-scoping question CLAUDE.md
  calls out under "Regression awareness for shared code".
---

# Comparison Skill

Backed by `.claude/tools/comparison/compare-branches.mjs` (lives in this
repo, not globally), which is independently invokable by any skill/agent. It
calls `.claude/tools/qa-worktree/qa-worktree.mjs` twice — once per ref, run
CONCURRENTLY (distinct worktree names and ports; both refs are fetched once
up front so the two calls never race on `git fetch`) — then diffs the
results.

## Workflow

1. **Get the block name and branch** from the invocation args (e.g.
   `/comparison grid-marquee my-feature-branch`). Both are required — ask if
   either is missing. The branch must already exist on `origin`.

   Watch for swapped/misordered args: if the named "block" produces zero
   matches when checked (the tool will report `pagesFound: 0`), but the named
   "branch" happens to be a real block name (or vice versa), the user likely
   gave them in the wrong order — infer the correct assignment rather than
   failing, and say so.

2. **Get the baseline** (optional). Default is `stage`. Override with `--base`
   only if the user wants to compare two feature branches instead of
   branch-vs-stage. `--base` and `--branch` must differ.

3. **Run the tool** (resolve the repo root first — this tool lives inside the
   checkout, so don't assume cwd is the repo root):

   ```bash
   ROOT="$(git rev-parse --show-toplevel)"
   node "$ROOT/.claude/tools/comparison/compare-branches.mjs" \
     --block="<name>" --branch="<branch>" [--base="<base>"]
   ```

   Options worth knowing about:
   - `--mode=<element|full|both>` — default `element` (just the block, not
     the whole page — full-page screenshots of a long page are slow to
     render/encode/write and mostly irrelevant to "did this block change").
     Use `--mode=full` or `--mode=both` only when the user specifically wants
     to see how the block affected surrounding page layout.
   - `--selector="<css>"` — override the auto-derived `.<block-slug>`
     selector, e.g. when the block's root class doesn't match its name.
   - `--concurrency=<n>` — pages captured in parallel, per side. Default 6.
   - `--timeout=<seconds>` — dev-server readiness window per side.

   Even with element-mode + parallel capture this still takes real time for
   a widely-used block (two dev-server boots plus N page loads on each side).
   Let the user know before running it if the affected-page count looks large
   — check with `/affected-pages` first if you want to set expectations —
   and prefer running it in the background (it can run well past a single
   foreground command's timeout for a block used on 100+ pages).

4. **Parse the JSON.** It's written both to stdout and to
   `.qa-screendiff/<block-slug>/comparison-<base>-vs-<branch-slug>.json`.
   Key fields:
   - `narrative` — a ready-made human-readable summary. Lead with this.
   - `mode` — which capture mode was actually used.
   - `stats` — counts by bucket: `identical` (<0.5% mismatch), `minor`
     (0.5–3%), `major` (>3%), `baselineOnly404`, `branchOnly404`,
     `bothErrored`, `missing`.
   - `pages[]` — per-page detail. Every entry has `baseUrl`/`branchUrl` (the
     live `<ref>--da-express-milo--adobecom.aem.live<path>` URL for each
     side, so a human can open both and look for themselves). Has `fullPage`
     when mode is `full`/`both`, and/or `element` when mode is
     `element`/`both`: each is either
     `{ mismatchPct, diffImage, heightDeltaPx }` or `{ skipped: "<reason>" }`.

5. **Report to the user:**
   - Start with the `narrative` text — it already lists `baseUrl`/`branchUrl`
     for every major diff and the top minor diffs (capped at 15; the rest are
     in the JSON's `pages[]` array if needed), so you don't have to hand-build
     these lists.
   - Call out `branchOnly404`/`bothErrored` pages explicitly — these are
     regressions the branch introduced, not just visual drift.
   - **Minor diffs are still worth surfacing, not just major ones** — a real,
     consistent design change (e.g. a button restyle) can register as a small
     percentage when it's a small fraction of the diffed element/page, even
     though it's the actual finding the user cares about. Don't dismiss the
     minor bucket as noise by default.
   - For pages flagged with a large `heightDeltaPx` alongside a high
     `mismatchPct`: **don't take the percentage at face value.** The diff
     canvas is padded (not stretched) to the taller image's height, so a
     genuine length difference (dynamic/personalized content, an accordion
     open by default, an extra card) shows up as a big mismatch % even when
     nothing is actually broken. Open the `diffImage` before calling
     something a regression — solid blocks confined to the bottom/edges
     usually mean "different length," not "different content."
   - Offer to open specific `diffImage` files (via Read) or the `baseUrl`/
     `branchUrl` pair rather than dumping every image unprompted.

## Notes

- Same page list is queried for both sides from the same local
  `content/express` mirror, so page sets match between runs by construction
  — a page missing from the branch capture (`missing` bucket) means the
  branch run itself failed partway through for that page, not a genuine
  content difference.
- Threshold for "does a pixel count as different" is `--threshold` (default
  0.1, same default as the `screenshot-diff` skill's Figma-comparison tool —
  raise it if font-rendering antialiasing noise dominates small diffs).
- This is a coarse signal, not a pixel-perfect regression gate: live content
  (personalization, rotating carousels, ads) means re-running the same
  comparison twice won't always produce identical numbers. Treat `major`
  diffs as "go look," not "definitely broken."
- This tool is checked out from this repo, so a sibling checkout (e.g.
  `da-express-milo-mwpw-200020`) won't have it unless these `.claude/`
  changes have been synced/merged there too.
