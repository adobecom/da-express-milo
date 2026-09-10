---
name: qa-worktree
description: >
  Given a block name, spins up a disposable git worktree (checked out from
  stage or a given ref, no upstream tracking), finds every page that
  references the block, boots a local dev server against that ref's code
  with live content, and screenshots every affected page (concurrently). Use
  for a quick visual sweep of how a block currently renders across its whole
  blast radius — before a change (baseline), or to eyeball a branch's
  rendering without setting up a local dev environment by hand. For A vs B
  diffing (e.g. "did my branch change anything?"), use the /comparison skill
  instead, which wraps this same tool twice (in parallel) and diffs the
  results.
---

# QA Worktree Skill

Backed by `.claude/tools/qa-worktree/qa-worktree.mjs` (lives in this repo,
not globally), which is independently invokable by any skill/agent.

## Workflow

1. **Get the block name** from the invocation args (e.g. `/qa-worktree
   grid-marquee`). If nothing was passed, ask for one.

2. **Get the ref** (optional). Default is `stage`. If the user names a branch
   ("QA this on my branch", "check it on <branch-name>"), pass that as
   `--ref`. The branch must already exist on `origin` — this tool checks out
   `origin/<ref>` into a scratch worktree; it does not push or create remote
   branches.

3. **Run the tool** (resolve the repo root first — this tool lives inside the
   checkout, so don't assume cwd is the repo root):

   ```bash
   ROOT="$(git rev-parse --show-toplevel)"
   node "$ROOT/.claude/tools/qa-worktree/qa-worktree.mjs" --block="<name>" --ref="<ref>"
   ```

   Options worth knowing about:
   - `--selector="<css>"` — capture an element crop *in addition to* the full
     page (default mode becomes `both` once a selector is given). Useful when
     the page has a lot of noisy unrelated content.
   - `--mode=<full|element|both>` — force a specific mode. Default is `full`
     unless `--selector` is given. Use `--mode=element` to skip the full-page
     screenshot entirely for speed (this is what `/comparison` does by
     default, since block comparisons rarely need the whole page).
   - `--concurrency=<n>` — pages captured in parallel (each in its own
     browser context). Default 6. Bump it for a large affected-page count if
     the machine can take it; drop it if `aem up` starts choking.
   - `--timeout=<seconds>` — dev-server readiness window. Default 60; raise
     it on a slower machine or a cold first `aem up`.
   - `--locale=<key>` (repeatable) / `--all-locales` — QA other locales, not
     just `en` (the default). A locale requested explicitly via `--locale`
     that has no local content checkout is an error; `--all-locales` skips
     it instead (see `localesSkipped` in the output) and syncing locales is
     a separate step — `node sync-locale-content.mjs --list` shows what's
     synced, `--locale=<key>`/`--all` syncs more.

4. **Parse the JSON.** Key fields: `pagesFound`, `outDir`, `mode`, `locales`
   (which locales were actually scanned), `localesSkipped`, and
   `screenshots` (each entry has `path`, `locale`, and depending on mode:
   `file` and/or `elementFile`, plus `status`). `status` is one of:
   - `ok` — rendered normally.
   - `not-found-on-stage` — the page 404'd (or otherwise ≥400'd) against the
     given ref's live content. **Always call this out** — it means the page
     the local content mirror thinks uses this block doesn't actually exist
     on that ref, which is a real finding, not a tool failure.
   - `error` — Playwright itself failed (timeout, crash). Report the message.

5. **Report to the user:**
   - Total pages found and where the screenshots landed (`outDir`).
   - Any `not-found-on-stage` or `error` pages, called out explicitly — don't
     bury these in a wall of "ok"s.
   - Offer to open/show specific screenshots (via the Read tool) rather than
     dumping every image unprompted.

## Notes

- Every run tears down its own worktree/branch afterward (branches are named
  `qa-<block-slug>-<ref-slug>`, truncated to fit the repo's 20-char branch
  name limit, and the tool refuses to touch anything not starting with
  `qa-`) — safe to run repeatedly without leaving clutter. Pass
  `--keep-worktree` only if the user explicitly wants to poke around the
  checkout afterward.
- Content is proxied live from `https://<ref>--da-express-milo--adobecom.aem.live`,
  not from the local content mirror(s) — those are only used to *enumerate*
  affected pages, not to render them. One live domain serves every locale
  (locale is a URL path prefix, e.g. `/de/express/...`), so locale support
  needed no change to how pages are fetched, only to how they're enumerated.
- Screenshots use `localhost` (not `127.0.0.1`) deliberately — the app's
  milo-libs resolver only switches off production `/libs` paths when the
  hostname contains `"local"`.
- This tool is checked out from this repo, so a sibling checkout (e.g.
  `da-express-milo-mwpw-200020`) won't have it unless these `.claude/`
  changes have been synced/merged there too.
- `.qa-screendiff/` output accumulates across runs with no automatic cleanup.
  Prune it with `node .claude/tools/clean-screendiffs.mjs --older-than=<days>`
  (or `--block=<name>` to scope to one block, `--all` to wipe everything,
  `--dry-run` to preview first).
