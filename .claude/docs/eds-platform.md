# AEM Edge Delivery Services (EDS) — Platform Reference

> How the platform this repo runs on actually works. Read this to understand why blocks, metadata, and URLs behave the way they do.

---

## What EDS Is

EDS is Adobe's serverless content delivery framework. It replaces the traditional AEM stack (Author → Publish → Dispatcher → CDN) with a simpler pipeline:

```
Content authored in DA (da.live)
  → stored in Adobe Author Bus
    → EDS fetches + renders to semantic HTML
      → served via CDN at *.aem.live / *.aem.page
```

There is **no AEM Publisher or Dispatcher**. EDS renders HTML at the edge on demand, with aggressive CDN caching. The result is near-100% Lighthouse scores with zero server infrastructure to manage.

This repo is **project type 1D** (DA/Author Bus native authoring): da.live is the authoring UI, content is stored in Adobe Author Bus, EDS handles delivery.

---

## The Two Pipelines

Every EDS site has two independent pipelines that merge at render time:

### Content Pipeline
```
Author edits page in DA (da.live)
  → clicks Preview in Sidekick
    → EDS fetches content from Author Bus
      → page available at *.aem.page (preview)
  → clicks Publish in Sidekick
      → page available at *.aem.live (production)
```

### Code Pipeline
```
Developer pushes to GitHub (adobecom/da-express-milo)
  → EDS code sync picks up changes
    → JS/CSS served directly from GitHub via EDS CDN
      → available immediately on *.aem.page and *.aem.live
```

Both pipelines converge when a browser loads a page: EDS serves the HTML (from content) and the browser loads the JS/CSS (from code).

---

## URL Structure

| Domain pattern | Environment |
|---|---|
| `https://<branch>--da-express-milo--adobecom.aem.page` | Preview — content staged, not public |
| `https://<branch>--da-express-milo--adobecom.aem.live` | Live — published content |
| `https://main--da-express-milo--adobecom.aem.live` | Production baseline |
| `http://localhost:3000` | Local dev via `aem up` |

The branch prefix in the URL corresponds directly to a GitHub branch. Pushing to a branch makes that code available at the matching `.aem.page`/`.aem.live` URL immediately.

---

## How a Page Renders

When a browser loads an EDS page:

1. **EDS fetches content** from Author Bus for this URL path
2. **EDS produces base HTML** — a flat document with `<div class="block-name">` containers
3. **`scripts.js` runs** — sets up Milo config, reads metadata, kicks off decoration
4. **`loadBlocks()` runs** — for each block div, dynamically imports `<block-name>.js`
5. **`decorate(block)` runs** — block JS reads authored content from the div's children, manipulates DOM, binds events
6. **CSS loads** — `<block-name>.css` auto-loaded alongside the JS

The key insight: **all authored content arrives as nested `<div>` elements**. A Word table row becomes `<div><div>key</div><div>value</div></div>`. Block JS reads this structure, not any structured data format.

---

## How Authored Content Becomes Block DOM

In DA, an author creates a block by adding a table. The table name becomes the block class. Each row becomes a nested div pair.

**Authored in DA (as a table):**

| hero-animation | |
|---|---|
| Title | Create anything |
| Background | /media/bg.mp4 |

**Rendered by EDS as HTML:**
```html
<div class="hero-animation">
  <div><div>Title</div><div>Create anything</div></div>
  <div><div>Background</div><div><a href="/media/bg.mp4">...</a></div></div>
</div>
```

**Block JS reads via `readBlockConfig()`:**
```javascript
const config = readBlockConfig(block);
// config = { title: 'Create anything', background: '/media/bg.mp4' }
```

Variant classes are added by the author in the table header cell (e.g., "hero-animation light standout"). These appear as CSS classes on the block div and block JS uses `block.classList.contains('variant')` to branch behaviour.

---

## Page Metadata

Metadata authored in DA (via a `metadata` table at the bottom of the page) becomes `<meta>` tags in `<head>`. Block JS and scripts read them via:

```javascript
getMetadata('key-name')        // single value
getCachedMetadata('key-name')  // memoized, prefer this in loops
```

Metadata drives almost all dynamic page behaviour: which floating CTA to show, whether frictionless mode is on, page template type, Jarvis config, etc.

---

## Local Development

```bash
aem up        # starts local proxy at localhost:3000
              # code served from local filesystem
              # content proxied from *.aem.page (preview)
```

Changes to JS/CSS are reflected immediately. Content changes require a preview via Sidekick first.

---

## Sidekick Workflow

The Sidekick browser extension is the author's publish tool:

1. Author edits in DA
2. Opens the live `.aem.page` preview URL
3. Clicks **Preview** → pulls latest content from Author Bus to preview CDN
4. Clicks **Publish** → promotes content from preview to production (`.aem.live`)

Code does not go through Sidekick. It goes through GitHub → EDS code sync.

---

## Caching Model

EDS uses two caching tiers:

1. **EDS CDN** — caches rendered HTML, JS, CSS at the edge globally
2. **Adobe Managed CDN** — sits in front for production (`adobe.com` domains)

Cache is invalidated per-path when Sidekick publishes. Code changes (GitHub pushes) invalidate automatically via code sync. There is no manual cache purge step in normal workflows.

---

## Key Helix/EDS Config Files

| File | Purpose |
|---|---|
| `helix-version.txt` | EDS version — currently `v7` |
| `.hlxignore` | Paths excluded from publication (`.md`, `.*`, `*.json` except sidekick config) |
| `.hlx/` | Helix CLI local config directory |
| `.hlx-token` | Site token for `aem up` authentication |
