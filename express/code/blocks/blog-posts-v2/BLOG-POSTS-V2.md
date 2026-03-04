# blog-posts-v2.js documentation

## Block purpose

The `blog-posts-v2` block fetches blog index data, filters posts by block configuration (featured links, tags, author, category, and page size), and renders cards (including hero-card and grid-compatible behavior) with localized strings and progressive loading.

It also supports:
- include-heading layout extraction and rendering
- content-toggle-based tag updates
- debug helpers for filter inspection

## Function summaries and JSDoc annotations

### `resetBlogCache()`
Resets module-level cached blog data used across block instances and tests.

```js
/**
 * @returns {void}
 */
```

### `getTagFilterDebugReport(config, index)`
Builds a detailed report showing which posts match configured filters, including tag-match status and failed filter keys.

```js
/**
 * @param {object} config
 * @param {{ data?: Array<object> }} index
 * @returns {{
 *   filters: object,
 *   tagFilters: string[],
 *   totalPosts: number,
 *   matchedCount: number,
 *   matchedPaths: string[],
 *   evaluatedPosts: Array<{
 *     path: string,
 *     title: string,
 *     tags: string,
 *     category: string,
 *     tagMatched: boolean,
 *     matchedAllFilters: boolean,
 *     failedFilters: string[]
 *   }>
 * }}
 */
```

### `getCurrentPageTagFilterDebugReport()`
Generates tag-filter debug reports for each `blog-posts-v2` block on the current page using current loaded index/config state.

```js
/**
 * @returns {Promise<Array<object>>}
 */
```

### `decorate(block)` (default export)
Initializes and decorates a `blog-posts-v2` block: loads dependencies, reads config, handles heading/link localization, renders cards, applies load-more behavior, and registers toggle observers.

```js
/**
 * @param {HTMLElement} block
 * @returns {Promise<void>}
 */
```
