---
name: affected-pages
description: >
  Given a block name (or a CSS pattern), finds which live da-express-milo
  pages under content/express reference it, using the query-content-blocks
  tool. Shows the first 10 matching pages, and offers to copy the full list
  to the clipboard if there are more. Use before touching shared block code
  (CSS/JS) to scope the regression/QA surface, or to answer "what pages use
  block X?".
---

# Affected Pages Skill

Answers "what pages does this block/pattern touch?" by scanning the authored
content tree directly, instead of guessing from block usage examples or
asking the user to grep manually.

Backed by the standalone tool `.claude/tools/query-content-blocks.mjs` (lives
in this repo, not globally), which is reusable by any skill/agent — it walks
`content/express/**/*.html`, matches a block name or pattern, and prints JSON
to stdout.

## Workflow

1. **Get the block name or pattern** from the invocation args (e.g.
   `/affected-pages grid-marquee`). If nothing was passed, ask for one.

2. **Find the repo root.** This tool lives inside this checkout
   (`.claude/tools/`), so resolve the path relative to `git rev-parse
   --show-toplevel` rather than assuming cwd is the repo root. The tool
   itself also auto-detects `--root` from its own cwd if invoked from a
   subdirectory — only pass `--root` explicitly if that fails or the user
   names a different checkout (e.g. `da-express-milo-mwpw-200020`, which is a
   separate clone and won't have this tool unless it's been synced there too).

3. **Run the tool:**

   ```bash
   ROOT="$(git rev-parse --show-toplevel)"
   node "$ROOT/.claude/tools/query-content-blocks.mjs" --pattern="<name>"
   ```

   Default `--type` is `block` (exact class-token match — `marquee` won't
   spuriously match `grid-marquee`). If the user is asking about a CSS custom
   property, data attribute, or other non-block pattern, pass `--type css`
   instead. If the pattern itself starts with `-` (e.g. a CSS var like
   `--spacing-900`), it must be passed as `--pattern=--spacing-900` (Node's
   arg parser otherwise treats it as a flag).

   By default this only scans the `en` locale's content (`content/express`).
   To check other locales too, add `--locale=<key>` (repeatable, e.g.
   `--locale=de --locale=fr`) or `--all-locales` for every locale that has a
   local checkout — see `sync-locale-content.mjs --list` to check which
   locales are synced, and `sync-locale-content.mjs --locale=<key>` (or
   `--all`) to sync ones that aren't. A locale requested explicitly via
   `--locale` that isn't synced yet is an error; `--all-locales` just skips
   it and reports it in `localesSkipped`.

4. **Parse the JSON.** If it has an `error` key, surface that to the user
   (usually means the repo root couldn't be found — ask which checkout to
   use). Otherwise you get `{ matchingFiles, totalMatches, pages: [...] }`
   where `pages` is sorted by path (multi-locale: sorted by locale, then
   path), each with `{ file, path, matches, context, locale }`. Multi-locale
   runs also include `locales` (which ones were actually scanned) and, for
   `--all-locales`, `localesSkipped` (locales with no local checkout).

5. **Report to the user:**
   - One line: total pages found (e.g. "14 pages reference `grid-marquee`").
   - A list of the **first 10** `path` values only (not file paths, not JSON).
     Include the match count per page if any page has more than 1.
   - If `matchingFiles > 10`, say how many more there are and offer: *"Want
     me to copy the remaining N page paths to your clipboard?"*

6. **If the user asks to copy** (now or in a later turn — "copy the rest",
   "yes", "copy them all"): take the full `pages` list (or just the pages
   beyond the first 10, matching what was offered), join their `path` values
   with newlines, and pipe to the clipboard:

   ```bash
   printf '%s\n' "/express/foo" "/express/bar" | pbcopy
   ```

   Confirm with a one-line message once copied (e.g. "Copied 4 more page
   paths to your clipboard."). Don't copy unless asked — this is presented as
   an offer, not done automatically.

## Notes

- This is read-only and safe to run anytime — it only reads locale content
  checkouts (`content/express/*.html` for `en`; other locales live outside
  the repo under `~/.aem-content-cache/da-express-milo/<key>/`, see
  `lib/locales.mjs`), never modifies anything.
- Match counts can exceed page count when a block/fragment is reused more
  than once on the same page (e.g. via `.fragment` includes).
- If the user wants pages affected by a *code* change rather than a block
  class (e.g. "what uses this JS util"), this tool doesn't help — that's a
  code-search question, not a content-authoring one.
