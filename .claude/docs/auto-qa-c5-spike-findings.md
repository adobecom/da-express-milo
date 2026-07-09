# C5 Spike — DA-wide page discovery: findings

**Date:** 2026-07-09   **Branch tested:** `claude-auto-qa` (MWPW-199560 merge)
**Verdict:** ✅ Viable for bounded repos (e.g. `express-color`). Promote with the
refinements below. Scope/alternatives needed before crawling `da-express-milo`.

## What was tested
Recursively crawl a DA repo via `admin.da.live/list` (scriptable with the
`da-auth-helper` token — no MCP round-trips), fetch every `.html` source via
`admin.da.live/source`, extract block classes, and report pages using any of the
branch's affected blocks — beyond the curated critical set.

Script: `.claude/skills/auto-qa-screendiff/scripts/crawl-affected.mjs`.

## Results (express-color, drafts excluded)

```
crawl: 156 html pages | 71 list calls | 156 fetches
time:  list 7.1s + fetch 2.1s = ~9.2s (concurrency 10)
affected pages: 114  (curated 6 + NEW 108)

per block:  color-extract 32 · color-blindness 17 · color-wheel 17
            color-explore 16 · color-search-marquee 16 · color-contrast-checker 16
            susi-light 16
```

The 108 new pages are almost entirely **localized variants** of the 6 curated
English pages (`/br/create/color-wheel`, `/cn/create/image`, `/de/explore`, …) —
exactly the pages a release check should cover.

## Open questions — answered

1. **Crawl cost?** ~60 ms/page end-to-end. A bounded repo (express-color, 156
   pages) is ~9 s. Fully tractable. `da-express-milo` is thousands of pages →
   minutes; needs scoping (see below).
2. **Rate limits?** None hit at concurrency 10 on either endpoint.
3. **Scoping to cut cost?** Yes — `--skip-locales` (English only) and
   `--exclude <segments>` both work.
4. **Grep accuracy?** Verified. Authored-source block classes match reality;
   spot-checked `/cn/create/color-wheel` really contains `<div class="color-wheel">`.
   No false positives observed. (Caveat: auto-blocks that never appear in
   authored source won't be detected here — same limitation noted in C3.)
5. **`da_lookup_fragment` shortcut?** Fragments surface naturally in the crawl
   (e.g. `.../fragments/susi-modals/...`). Reverse fragment-lookup could be a
   complementary accelerator but isn't required — the crawl already finds usage.
6. **Caching?** The crawl output IS a `block → [pages]` index. Cache it and
   refresh on a schedule rather than per-run.

## Actionable findings / refinements
- **Exclude `/drafts/`** (personal sandboxes): 28 of the raw 136 new pages were
  drafts. Added `--exclude drafts` (default). Confirmed clean afterward.
- **Fragments policy (open):** fragment docs (e.g. `susi-modals`) are matched.
  They aren't standalone pages you'd screen-diff directly — decide whether to
  exclude `fragments` too, or resolve them to the pages that embed them.
- **Localized-variant explosion:** 6 English pages → ~114 with locales. For a
  release check, consider a `--skip-locales` fast pass (English canary) plus a
  scheduled full-locale pass, rather than diffing every locale every time.

## Recommendation
- **Promote C5 for bounded, per-project repos** (express-color) with drafts
  excluded and the block→pages index cached.
- **Do NOT full-crawl `da-express-milo`** per run. Instead prefer, in order:
  1. **Kitchen-sink pages** (`/docs/library/kitchen-sink/<block>`) — a canonical
     one-page-per-block demo set (see `kitchen-sink-pages.md`). For any changed
     express block, `kitchen-sink/<block>` is a near-perfect, low-noise target
     and needs no crawl.
  2. **Curated critical set** for real-world composition coverage.
  3. **Scoped crawl** (by section, e.g. `/express/feature/image/…`) only when
     broader coverage is needed.
- Keep the full DA crawl as the **authoritative fallback** and for smaller repos.

## Integration shape (when built)
Add a `--discover` flag to the skill: after C4 selects curated affected pages,
run `crawl-affected.mjs` for each affected project, merge `newPages` into
`affected-pages.json` (tagged `source: "discovered"`), then hand the union to the
capture step. Gate `da-express-milo` behind kitchen-sink/scoping, not a full crawl.
