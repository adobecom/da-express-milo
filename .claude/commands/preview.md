---
description: Preview a page on the current branch's Edge Delivery Services URL — pass a URL, or default to the frontmost Chrome tab.
---

# preview

Takes a page URL (prod, `.aem.page`, `.aem.live`, or anything else), strips it down to its path, and re-attaches that path to the **current git branch's** feature-branch preview origin — so you can see what your in-progress branch does to a specific page.

Argument: `$ARGUMENTS` — optional. A full URL, or a bare path (e.g. `/express/font-generator`). If omitted, use the URL of the active tab in the frontmost Chrome window.

---

## Step 1 — Resolve the source URL

1. If `$ARGUMENTS` is non-empty:
   - If it looks like a full URL (`http(s)://...`), use it as-is.
   - If it looks like a bare path (starts with `/`, no host), skip straight to Step 2 with that path.
2. If `$ARGUMENTS` is empty, get the active tab of the frontmost Chrome window:
   ```
   osascript -e 'tell application "Google Chrome" to get URL of active tab of front window'
   ```
   - If Chrome isn't running or the call errors, tell the user and ask for a URL instead of guessing.

---

## Step 2 — Extract the path

Strip the scheme and host, keep everything else (path + query + hash) verbatim — e.g.:
- `https://www.adobe.com/express/font-generator?foo=bar` → `/express/font-generator?foo=bar`
- `https://main--da-express-milo--adobecom.aem.page/express/font-generator` → `/express/font-generator`
- `https://stage--da-express-milo--adobecom.aem.live/drafts/echen/font-generator` → `/drafts/echen/font-generator`

If the input has no path (bare domain), use `/`.

---

## Step 3 — Determine branch + repo/org

1. Current branch: `git branch --show-current`.
2. Repo/org: parse from `git remote get-url origin` (expects a GitHub URL like `github.com/<org>/<repo>`). Fall back to `adobecom`/`da-express-milo` if parsing fails.
3. AEM/Edge Delivery subdomains can't contain `/` — if the branch name has slashes, replace them with `-` for the URL (matches EDS convention).

---

## Step 4 — Build and open the preview URL

Construct:
```
https://<branch>--<repo>--<org>.aem.page<path>
```

Open it: `open "<url>"`. Print the constructed URL back to the user.

If the current branch is `main` or `stage`, still build the URL normally (no special-casing) — just note it in the output since that's not really a "feature branch" preview.
