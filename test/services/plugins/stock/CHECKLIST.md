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
| `getCuratedList()` (titles -> theme objects) | [x] | [x] |

### Defensive Data Handling

| Action Method | Non-OK Response | Network Failure | Missing Properties |
|---------------|:---:|:---:|:---:|
| `checkAvailability()` | [x] | [x] | [x] |
| `searchFiles()` | [ ] | [ ] | [x] |

---

## Provider: `StockProvider`

**Test file:** `providers/StockProvider.test.js`

### Delegation Wiring

| Provider Method | Returns Data | Passes Args Correctly |
|-----------------|:---:|:---:|
| `searchThemes(query, options)` | [x] | [x] |
| `getCuratedGalleries()` | [x] | [x] |
| `getGalleryByName(name, options)` | [x] | [x] |
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
