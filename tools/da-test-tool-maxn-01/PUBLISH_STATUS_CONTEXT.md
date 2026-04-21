# Context: Fetching DA Document Publish Status from a Browser Tool

## What we're building

An internal multi-page browser tool (no build step, plain ES modules) that runs inside a DA (Document Authoring) iframe hosted at:

```
https://da.live/app/adobecom/da-express-milo/tools/da-test-tool-maxn-01/dist/index
```

The tool scans the DA content tree at `/adobecom/da-express-milo/express` (~2,735 `.html` documents) using the DA Admin API (`https://admin.da.live`) and displays a Block Index — which blocks appear in which documents. It stores results as JSON in DA drafts.

**What we want to add**: for each document found during the scan, we want to know whether it is currently **published** (live on the public site). We want to display this as a small indicator in the UI.

---

## Constraints

- **Pure browser / client-side only** — no server, no build step, no Node.js. All calls happen from `fetch()` inside an ES module running in the DA iframe.
- **Auth available**: the DA SDK provides an IMS bearer token (`const { token } = await DA_SDK`) valid for `admin.da.live`. This same token may or may not be valid for other internal APIs.
- **Scale**: ~2,735 documents to check per full scan (Block Index tool). The Block Finder tool returns a much smaller subset (typically 10–500 matches).
- **Environment**: runs from `https://da.live` in production; tested locally via `http://localhost:3000` (a local dev server).

---

## What has been tried

### Attempt 1: AEM Admin API (`admin.hlx.page`)

```
GET https://admin.hlx.page/status/adobecom/da-express-milo/main/express/foo/bar
```

Response shape (from docs):
```json
{
  "publishLastModified": "2026-03-01T12:00:00.000Z"  // null if not published
}
```

**Problem**: CORS errors. The browser blocks the request from `http://localhost:3000` (and possibly from `https://da.live` too — not yet verified from production). The server doesn't return `Access-Control-Allow-Origin` for these origins. Rate limit: 10 req/sec.

### Attempt 2: `aem.live` public CDN HEAD requests (current implementation)

```
HEAD https://main--da-express-milo--adobecom.aem.live/express/foo/bar
```

A 200 response = published; 404 = not published. No auth needed. Rate limit: 200 req/sec.
Throttled to 10 concurrent / 500ms per batch (~20 req/sec). Custom header `X-DA-Tool: da-test-tool-maxn-01` is sent for log identifiability.

**Status**: Not yet tested in the browser — CORS behavior of `aem.live` for cross-origin HEAD requests from `https://da.live` is unconfirmed. HEAD requests return no body so no analytics JS fires.

---

## The question for you

We need the most appropriate way to check whether a DA document is published, from a **browser-based fetch() call** (no server-side code). Specifically:

1. Is there an internal API or endpoint (accessible from browser JS, either public or authenticated via IMS bearer token) that reliably returns publish status for a given DA content path, without CORS restrictions from `https://da.live`?

2. Does `admin.hlx.page/status/...` allow CORS from `https://da.live`? If so, our current implementation likely works fine in production and the errors were only a localhost dev issue.

3. Does `aem.live` set `Access-Control-Allow-Origin: *` on responses, making HEAD requests viable from a browser at `https://da.live`?

4. Is there a DA-specific or internal Adobe mechanism for checking publish status that is designed to work from browser-based tooling at `da.live`?

---

## Relevant code

**Current implementation (using aem.live HEAD requests):**

```js
// da-express-milo/tools/da-test-tool-maxn-01/dist/shared/da-api.js

function daPathToLiveUrl(daPath) {
  // /adobecom/da-express-milo/express/foo/bar.html
  // → https://main--da-express-milo--adobecom.aem.live/express/foo/bar
  const parts = daPath.split('/').filter(Boolean);
  const [org, repo, ...rest] = parts;
  const contentPath = `/${rest.join('/').replace(/\.html$/, '')}`;
  return `https://main--${repo}--${org}.aem.live${contentPath}`;
}

export async function fetchPublishedPaths(paths, _token, onProgress) {
  // Batches of 20 concurrent HEAD requests, 200ms minimum per batch (~100 req/sec)
  ...
}
```

**DA SDK token acquisition (available on every page):**

```js
import DA_SDK from 'https://da.live/nx/utils/sdk.js';
const { token } = await DA_SDK; // IMS bearer token for admin.da.live
```

---

## Repo

`adobecom/da-express-milo` — tool lives at `tools/da-test-tool-maxn-01/dist/`
