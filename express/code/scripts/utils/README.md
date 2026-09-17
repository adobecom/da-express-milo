# Utils

## Analytics (`analytics.js`)

Milo analytics DOM helpers — generic for any block or component. Use these when setting `daa-ll` / `data-ll` on links and buttons per [Milo analytics review](https://milo.adobe.com/docs/authoring/analytics-review).

### `getAnalyticsHeaderFromDom(container, options?)`

Get "last header before link" text from the DOM for `daa-ll` (Milo analytics). Use when the block has a heading that should be the header for all links in that scope.

- **container** (Element) — Scope to look in (e.g. block root or section)
- **options.selector** (string) — CSS selector for the header element (default: `[data-analytics-header], h1, h2, h3`)
- **options.fallback** (string) — Used when no element found or empty text (default: `'Section'`)
- **Returns** — Sanitized header text, max 20 chars

Example:
```js
getAnalyticsHeaderFromDom(block, { selector: '.my-block-title', fallback: 'Gallery' });
getAnalyticsHeaderFromDom(section);  // uses first [data-analytics-header], h1, h2, or h3
```

### `getNextLinkIndexInContainer(container, options?)`

Count interactive elements in a container to get the next 1-based link index. Use for "Load more", "Show all", or any control that comes after a list of links/buttons.

- **container** (Element) — Scope to count in (e.g. grid, card list, or block root)
- **options.selector** (string) — What counts as a link (default: `a[href], button`)
- **Returns** — Next link index (count + 1), or 1 if none found

Example:
```js
const nextIndex = getNextLinkIndexInContainer(gridEl);  // for Load more after N cards
```

## Download (`download-utils.js`)

Generic "capture an HTMLElement and download it as an image" utility — works on any element, not tied to a specific block's DOM shape. Lazily loads a vendored copy of `html2canvas` (see `express/code/libs/deps/README.md`) on first use; nothing loads until a consumer actually calls one of these functions. html2canvas was chosen over a `foreignObject`-based screenshot technique because it doesn't depend on `<foreignObject>`-to-canvas rendering, which is unreliable on Safari 15 (this repo's minimum supported browser per `.browserslistrc`).

### `captureElementAsImage(element, options?)`

Capture the current rendered appearance of `element` as an image `Blob`, without triggering a download. Use this when you need the image data itself (e.g. to upload it) rather than saving a file.

- **element** (HTMLElement) — Must be connected to the document with a non-zero rendered size
- **options.scale** (number) — Output resolution multiplier (default: `Math.max(devicePixelRatio, 2)`)
- **options.format** (`'png'|'jpeg'`) — default `'png'`
- **options.quality** (number) — JPEG quality 0-1, ignored for png (default: `0.92`)
- **options.backgroundColor** (string|null) — default `null` for png (transparent), `'#ffffff'` for jpeg
- **options.useCORS** (boolean) — fetch cross-origin images in CORS mode (default: `true`)
- **options.isolate** (boolean) — render an off-screen `cloneNode()` copy instead of the live node, to avoid capturing transient `:hover`/`:focus`/caret state (default: `false`)
- **options.timeoutMs** (number) — default `15000`
- **options.html2canvasOptions** (Object) — escape hatch spread into the underlying `html2canvas()` call; `foreignObjectRendering` is always forced `false`
- **Returns** — `Promise<Blob>`

**Known limitation (CORS):** a cross-origin `<img>`/`background-image` in `element` must either be served with `Access-Control-Allow-Origin`, or have `crossorigin="anonymous"` set on the `<img>` tag, or the resulting canvas is tainted and the promise rejects with a descriptive error.

Example:
```js
const blob = await captureElementAsImage(document.querySelector('.card'));
```

### `downloadElementAsImage(element, options?)`

Same as `captureElementAsImage`, plus immediately triggers a browser "Save As" download of the result.

- **options.filename** (string) — extension appended automatically if omitted (default: `` `screenshot-${Date.now()}.<ext>` ``)
- **Returns** — `Promise<{ blob: Blob, filename: string }>`

Example:
```js
await downloadElementAsImage(document.querySelector('.card'), { filename: 'my-card' });
```

This utility is headless and never shows UI text itself, so the `Error`s it throws/rejects with are developer-facing (console/`lana` logging), not subject to the no-hardcoded-text rule. To surface a failure to a user, catch the rejection and resolve a user-visible message via `replaceKey` in the calling block.

Manual end-to-end verification (no automated test exercises the real `html2canvas` render or real Safari 15 behavior):
```js
const { downloadElementAsImage } = await import('/express/code/scripts/utils/download-utils.js');
await downloadElementAsImage(document.querySelector('header'), { filename: 'manual-test' });
```
