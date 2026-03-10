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
