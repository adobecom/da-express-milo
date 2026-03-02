# Stock — Test Coverage Checklist

> Comprehensive list of all test cases covered for the **Stock** plugin
> and its children (action groups, providers). Update this file whenever tests
> are added, modified, or removed.

---

## Plugin: `StockPlugin`

**Test file:** `StockPlugin.test.js`

### Feature Flag Gating (`isActivated`)

- [x] Returns `true` when feature flag is not set
- [x] Returns `true` when feature flag is explicitly `true`
- [x] Returns `false` when feature flag is explicitly `false`
- [x] Returns `true` when `features` key is missing entirely

### Handler Registration

- [x] Registers handlers on construction (`topicRegistry.size > 0`)
- [x] Registers a handler for every expected topic
- [x] Contains no unexpected topic keys
- [x] Registered values are callable functions
- [x] Registers action groups on construction

### Static Properties

- [x] `serviceName` returns `"Stock"`

### Header Behavior (`getHeaders`)

- [x] Includes `x-product` header for Stock
- [x] Includes base headers (`Content-Type`, `Accept`)
- [x] Includes `x-api-key` from config

---

## Action Group: `StockActions`

**Test file:** `actions/StockActions.test.js`

### Structural Correctness (`getHandlers`)

- [x] `SearchActions` returns handlers for all `StockTopics.SEARCH` topics
- [x] `GalleryActions` returns handlers for all `StockTopics.GALLERY` topics
- [x] `DataActions` returns handlers for all `StockTopics.DATA` topics
- [x] `RedirectActions` returns handlers for all `StockTopics.REDIRECT` topics
- [x] No action group contains unexpected topic keys

### Delegation Wiring

| Action Method | Delegates to Plugin | Passes Args Correctly |
|---------------|:---:|:---:|
| `searchFiles()` | [x] | [x] |
| `getByName()` | [x] | [x] |
| `checkAvailability()` | [x] | [x] |

### Query Alias

- [x] `searchFiles` accepts `criteria.query` as alternative to `criteria.main`

### `buildSearchParams`

- [x] Defaults to page 1 offset 0
- [x] Calculates offset for page 3
- [x] Sets locale to `en-US`
- [x] Sets `content_type:photo` filter to `1`
- [x] Sets premium filter to `false`

### Validation

| Action Method | Invalid Inputs | Error Metadata |
|---------------|:---:|:---:|
| `searchFiles(criteria)` | [x] | [x] |
| `getFileUrl(fileId)` | [x] | [x] |
| `getContributorUrl(creatorId)` | [x] | [x] |

### Data Transformation

| Action Method | Correct Results | Edge Cases (empty/missing) |
|---------------|:---:|:---:|
| `searchFiles()` (`files` -> `themes`) | [x] | [x] |
| `searchFiles()` (preserves `nb_results`) | [x] | — |
| `getCuratedList()` (titles -> theme objects) | [x] | — |

### Defensive Data Handling

| Action Method | Non-OK Response | Network Failure | Missing Properties |
|---------------|:---:|:---:|:---:|
| `checkAvailability()` | [x] | [x] | [x] |
| `searchFiles()` | [ ] | [ ] | [x] |

### `getByName` — Behavior

- [x] Returns search results for a valid curated name
- [x] Returns `undefined` for a non-curated gallery name
- [x] Accepts `criteria.query` as alias for `main`
- [x] Returns `undefined` when criteria is empty
- [x] Returns `undefined` when criteria is null

### `checkAvailability` — Behavior

- [x] Returns `true` when response has files
- [x] Returns `false` when response has empty files
- [x] Calls fetch with plugin headers

### `getFileUrl` — Behavior

- [x] Returns correct URL for a numeric file ID
- [x] Returns correct URL for a string file ID
- [x] Throws `ConfigError` when `endpoints.redirect` is missing

### `getContributorUrl` — Behavior

- [x] Returns correct URL for a numeric creator ID
- [x] Returns correct URL for a string creator ID
- [x] Throws `ConfigError` when `endpoints.redirect` is missing
- [x] Throws `ConfigError` when `endpoints.contributor` is missing

---

## Provider: `StockProvider`

**Test file:** `providers/StockProvider.test.js`

### Delegation Wiring

| Provider Method | Returns Data | Passes Args Correctly |
|-----------------|:---:|:---:|
| `searchThemes(query, options)` | [x] | [x] |
| `getCuratedGalleries()` | [x] | [x] |
| `getGalleryByName(name, options)` | [x] | [x] |
| `getGalleryByName` — unknown gallery | [x] (`undefined`) | — |
| `checkDataAvailability(endpoint)` | [x] | [x] |
| `getFileRedirectUrl(fileId)` | [x] | [x] |
| `getContributorUrl(creatorId)` | [x] | [x] |

### Error Boundary (`safeExecute`)

| Provider Method | Returns `null` on Plugin Error | Returns `null` on Validation Error |
|-----------------|:---:|:---:|
| `searchThemes()` | [x] | [ ] |
| `checkDataAvailability()` | [ ] | [ ] |
| `getFileRedirectUrl()` | [ ] | [x] |
| `getContributorUrl()` | [ ] | [x] |

### Factory Functions

- [x] `createStockProvider()` returns correct instance

---

## Coverage Gaps

- [ ] `searchFiles()` propagation behavior for plugin-level request failures is not explicitly asserted
- [ ] `getByName()` does not validate error-message quality for invalid names (currently returns `undefined`)
- [ ] `searchThemes()` invalid-input path via provider (`null`/empty query) is not explicitly covered

---

**Last Updated:** February 2026
