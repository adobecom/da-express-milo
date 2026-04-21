# Agent Context — DA Test Tool (da-test-tool-maxn-01)

> Drop this file into a new session when continuing work on this tool.
> Last updated: 2026-04-21

---

## What this project is

A multi-page DA (Document Authoring) iframe tool built for internal use at Adobe. It lives inside the `da-express-milo` GitHub repo and is served as an iframe via the DA platform at:

```
https://da.live/app/adobecom/da-express-milo/tools/da-test-tool-maxn-01/dist/index?ref=<branch>
```

All files under `dist/` are plain browser ES modules — no build step, served directly. The tool uses the DA Admin REST API for reading/writing content and the DA SDK for auth token retrieval.

---

## File structure

```
tools/da-test-tool-maxn-01/
└── dist/
    ├── index.html               ← Homepage — card nav to all tools
    ├── shared/
    │   └── da-api.js            ← Shared utilities (ls, cat, readJson, writeJson, collectDocs)
    ├── search/
    │   ├── index.html           ← Block Finder UI
    │   └── index.js             ← Block Finder logic
    ├── counter/
    │   ├── index.html           ← Document Counter UI
    │   └── index.js             ← Document Counter logic
    └── audit/
        ├── index.html           ← Block Index UI
        └── index.js             ← Block Index logic
```

---

## The three tools

### 1. Homepage (`dist/index.html`)
Static HTML. Three fully-clickable card links (`<a class="card">`) with tool name, description, and a `›` chevron. No JS.

### 2. Block Finder (`dist/search/`)
- Input: block name (e.g. `hero`)
- BFS-traverses `/adobecom/da-express-milo/express`, scans every `.html` document
- Reports every document path that contains that block
- Block detection uses `main > div > div[class]` — first class token is the block name
- Table fallback for older Word/Google Docs content

### 3. Document Counter (`dist/counter/`)
- Input: any DA content path (default: `/adobecom/da-express-milo/express`)
- Traverses and counts all `.html` documents under that path
- Live counter updates during traversal
- Useful for estimating scan time before running the full audit

### 4. Block Index (`dist/audit/`)
- Scans the entire `/express` tree, collects every block name found in content
- Cross-references against two GitHub repos to classify each block
- Saves results as JSON to DA drafts area
- Loads cached results on page load; "Rescan" button re-runs the full scan
- Results displayed as expandable accordion cards with color coding and a legend

---

## Shared utilities (`dist/shared/da-api.js`)

Key exports:

```js
DA_ADMIN = 'https://admin.da.live'

safeFetch(url, options)       // GET-only guard (throws on non-GET)
ls(path, token)               // GET /list{path} — returns array of { path, ext }
cat(path, token)              // GET /source{path} — returns HTML text
readJson(path, token)         // GET /source{path} — returns parsed JSON or null
writeJson(path, data, token)  // POST /source{path} — writes JSON via FormData/Blob

collectDocs(rootDir, token, onProgress?)
// BFS traversal. Items with ext='html' are docs; items with no ext are dirs.
// Batches ls() calls in groups of 10 (LS_CONCURRENCY) to avoid API overload.
// onProgress(count) called after each batch with running doc count.
// Returns string[] of all .html paths found.
```

**Important:** The `/tools/` path in DA is source-code and read-only via the API. Writes must go to `/drafts/` or other content paths. A write to `/tools/` returns 403.

---

## DA SDK

```js
import DA_SDK from 'https://da.live/nx/utils/sdk.js';
const { token } = await DA_SDK;
```

Required on every page that makes authenticated API calls. Communicates via PostMessage with the DA parent frame to obtain the bearer token.

---

## Block Index — implementation details

### GitHub API calls (unauthenticated, public repos, 60 req/hr limit)

```js
// da-express-milo blocks
GET https://api.github.com/repos/adobecom/da-express-milo/contents/express/code/blocks?ref=stage

// milo blocks (inherited by da-express-milo)
GET https://api.github.com/repos/adobecom/milo/contents/libs/blocks?ref=stage
```

Both return arrays of `{ name, type, ... }`. Filter for `type === 'dir'` to get block names. Both fetches fire in parallel at the start of `runScan()` so they don't add latency.

### Color coding (applied as CSS class on `<details>` element)

| Class | Color | Meaning |
|-------|-------|---------|
| `repo-express` | Translucent yellow | Block directory exists in `da-express-milo` |
| `repo-milo` | Translucent pink | Block directory exists in `milo` only |
| *(none)* | Gray `#fafafa` | Not found in either repo — likely misspelled or test name |

If a block exists in **both** repos (da-express-milo overrides milo): yellow card + a small pink `↑ milo` badge next to the block name.

### Stored JSON format (`/adobecom/da-express-milo/drafts/da-test-tool-maxn-01/audit-results.json`)

```json
{
  "scannedAt": "2026-04-21T...",
  "docCount": 2735,
  "scanErrors": 0,
  "repoBlocks": {
    "express": ["hero", "marquee", ...],
    "milo": ["columns", "accordion", ...]
  },
  "blocks": {
    "hero": ["/adobecom/da-express-milo/express/path/to/doc.html", ...],
    "some-block": []
  }
}
```

Note: `blocks` includes zero-use entries for any block that exists in a repo but had no content hits. Zero-use blocks are added client-side in `renderResults()` (not stored), then sorted to the bottom of the list.

### `repoBlocksFromStored(stored)` helper

Handles backward-compat with the old flat-array format (single-repo era):
```js
if (Array.isArray(stored)) return { express: new Set(stored), milo: new Set() };
```

### Block detection selector

```js
doc.querySelectorAll('main > div > div[class]')
// First class token = block name
// This targets block-level divs without picking up interior utility class names
```

---

## Navigation / URL behavior

The tools use standard multi-page navigation (separate HTML files at `/search/`, `/counter/`, `/audit/`). Each page has a `‹ All Tools` back link pointing to `../`. The DA shell iframe doesn't update its own URL when the iframe navigates — this is a known DA limitation. Hash-based SPA routing was explored and rejected due to performance concerns.

---

## ESLint notes

- CDN imports (`https://...`) require `/* eslint-disable import/no-unresolved */` wrappers
- Batched async loops use `// eslint-disable-next-line no-await-in-loop` before each `await` inside a `for` loop

---

## Styling conventions

- Body margin: `1rem 2rem` on tool pages, `2rem` on homepage
- Back button: `.back` with CSS `::before` for the `‹` chevron at `1.5em` size, `inline-flex` for alignment
- Accordion cards: native `<details>`/`<summary>` with `summary::after` for `▸`/`▾` chevron
- Homepage cards: `<a class="card">` with `display:flex; justify-content:space-between`, hover shadow

---

## Known / pending items

- **Rescan required after latest changes**: cached results from before the two-repo GitHub API integration won't have `repoBlocks.milo` populated. The `repoBlocksFromStored` helper degrades gracefully (no milo badges), but a fresh scan is needed to get the full color-coded view.
- **GitHub API rate limit**: 60 unauthenticated requests/hour. The tool makes exactly 2 API calls per scan. Not an issue in practice unless testing very rapidly.
- **Scan scope**: Block Index is intentionally limited to `/express` (~2,735 documents). The full repo has ~25,000+ documents — root traversal works (batching fix is in place) but would take much longer.
