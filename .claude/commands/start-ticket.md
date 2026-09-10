---
description: Given a ticket ID or description, open its Jira, the relevant draft/primary content page, check out the branch, ensure the local AEM server is up, and open any linked Figma and PR.
---

# start-ticket

Orchestrates the "get set up for this ticket" ritual: resolve the Jira issue, open its content and design links, switch to its branch, make sure the local dev server is actually usable, and surface the latest PR.

Argument: `$ARGUMENTS` — a Jira ticket ID (e.g. `MWPW-123456`) or a free-text description of the ticket.

---

## Configuration (defaults — adjust inline if the user says otherwise)

| Setting | Default |
|---|---|
| Jira base URL | `https://jira.corp.adobe.com/browse/` |
| Default Jira project (when a bare description is given, no project prefix) | `MWPW` |
| GitHub repo | `adobecom/da-express-milo` |
| AEM dev server port | `3000` |
| Browser open command | `open <url>` (macOS default-app open; swap for `open -na "Google Chrome" --args --new-window <url>` if the user wants forced new windows in a specific browser) |
| DA org/repo for drafts | `adobecom` / `da-express-milo`, path prefix `drafts/` |

---

## Phase A — Resolve the Jira ticket

1. If `$ARGUMENTS` matches a ticket-key pattern (`[A-Z]+-[0-9]+`), use it directly.
2. Otherwise treat it as free text: use the `mcp__corp-jira__search_jira_issues` tool with a JQL query scoped to the default project first (e.g. `project = MWPW AND text ~ "<keywords>" ORDER BY updated DESC`), and widen the search (drop the project filter) if nothing relevant comes back. Confirm the match with the user if more than one issue looks plausible — don't guess silently between two unrelated tickets.
3. Pull the full issue: summary, description, and comments (`mcp__corp-jira__get_jira_comments`) — the description/PR/Figma links are often only in a comment, not the description field.
4. Open the ticket: `open "https://jira.corp.adobe.com/browse/<KEY>"`.

Keep the resolved key (`<KEY>`) and the collected description + comment text handy for the rest of the phases — you'll scan that text for URLs repeatedly below.

---

## Phase B — Open the draft or primary content page

Scan the description + comments for URLs and classify them:
- **Draft page**: a DA/edit link or preview URL whose path contains `/drafts/` (e.g. `da.live/edit#/adobecom/da-express-milo/drafts/...` or `*.aem.page/drafts/...`).
- **Primary page**: any other content URL being modified (e.g. `main--da-express-milo--adobecom.aem.live/express/...` or a `adobe.com/express/...` prod URL).

Logic:
1. If a draft URL is explicitly linked in the ticket → open it directly.
2. If no draft URL is linked, search the DA drafts folder instead: use `mcp__claude_ai_AEM_DA_-_Prod__da_list_sources` on org `adobecom`, repo `da-express-milo`, path `drafts/`, and look for a source whose name matches the ticket's author (ldap) or keywords from the summary. Open its edit URL if found.
3. If neither yields a draft, fall back to the **primary page** URL found in the ticket text and open that instead.
4. If nothing at all is found, tell the user no content page could be identified — don't fabricate a URL.

---

## Phase C — Check out the branch

1. `git fetch origin` (never fetch/checkout against `upstream` for this — see the branch-safety note below).
2. Look for a branch named exactly `<KEY>` (matches this repo's convention, e.g. `MWPW-199560`): `git ls-remote --heads origin <KEY>` and `git branch -a | grep <KEY>`.
3. If it exists remotely and not yet locally: `git checkout <KEY>` (git will set upstream to `origin/<KEY>` automatically since the branch already exists there — that's fine, it's not `stage`).
4. If it exists locally already: `git checkout <KEY>` and `git pull --ff-only`.
5. If no branch exists at all: tell the user and ask whether to create one — do not silently invent a branch off `stage`.

**Branch safety (non-negotiable):** never check out or set upstream to `origin/stage` directly, and never branch/checkout against the `upstream` remote. If a new branch must be cut, use `git switch -c <KEY> --no-track origin/stage` so it never tracks `stage`.

Before running any of this, run `git status` — if there are uncommitted changes on the current branch, stash them (`git stash push -u`) or ask the user first rather than switching branches over them.

---

## Phase D — AEM dev server: only touch it if it's stale

1. Check whether something is listening on port `3000` and whether it actually responds: `curl -s -o /dev/null -w "%{http_code}" --max-time 2 http://localhost:3000/`.
2. **Responsive** (server answers, any reasonable HTTP status) → leave it alone. Do not restart it just because the branch changed; the CLI live-reloads from disk.
3. **Not listening, or listening but not responding within the timeout** (stale/hung process) → start it fresh: `aem up` (run in the background — it's a long-lived dev server, not a one-shot command). `aem up`'s own `--stop-other` default will clean up any dead process on the port.

---

## Phase E — Open Figma, if linked

Scan the same description + comments text for `figma.com/(file|design)/...` links.
- If found, open the URL(s) directly (`open "<figma-url>"`). No need to go through the Figma MCP for this — it's just a browser open.
- If none found, skip silently (don't ask the user to hunt for one unless they bring it up).

---

## Phase F — Open the most recent linked PR, if any

1. Scan the ticket text for `github.com/adobecom/*/pull/<n>` links. If multiple appear (e.g. the ticket was reused across revisions), open the one with the highest PR number / most recent comment timestamp.
2. If none are linked in the ticket text, fall back to querying GitHub directly: `gh pr list --repo adobecom/da-express-milo --search "<KEY>" --state all --json number,url,createdAt --limit 5`, sorted descending by `createdAt`, and open the top result.
3. If no PR exists anywhere, skip silently — not every ticket has one yet.

---

## Phase G — Summary

Report back concisely what was opened/done: Jira key + title, which content page (draft vs. primary, and why), the branch now checked out, whether the AEM server was left alone or restarted, and whether a Figma/PR link was found and opened. Flag anything that couldn't be resolved (no branch, no content link, no PR) rather than staying silent about gaps.
