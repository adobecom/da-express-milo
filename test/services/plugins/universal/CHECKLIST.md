# UniversalSearch — Test Coverage Checklist

> Comprehensive list of all test cases covered for the **UniversalSearch** plugin
> and its children (action groups, providers). Update this file whenever tests
> are added, modified, or removed.

---

## Plugin: `UniversalSearchPlugin`

**Test file:** `UniversalSearchPlugin.test.js`

### Feature Flag Gating (`isActivated`)

- [x] Returns `true` when feature flag is not set
- [x] Returns `true` when feature flag is explicitly `true`
- [x] Returns `false` when feature flag is explicitly `false`
- [x] Returns `true` when `features` key is missing entirely

### Handler Registration

- [x] Registers handlers on construction (`topicRegistry.size > 0`)
- [x] Registers action groups on construction
- [x] Registers all expected action groups (search, url)
- [x] Contains no unexpected action groups

### Static Properties

- [x] `serviceName` returns `"UniversalSearch"`

---

## Action Group: `SearchActions`

**Test file:** `actions/SearchActions.test.js`

### Structural Correctness (`getHandlers`)

- [x] Returns a handler for every `SEARCH` topic
- [x] Contains no unexpected topic keys

### Validation

| Action Method | Invalid Inputs | Error Message Quality | Error Metadata | All Valid Inputs |
|---------------|:---:|:---:|:---:|:---:|
| `searchByImage(criteria)` | [x] | [x] | [x] | [x] |
| `checkDataAvailability(criteria)` | [x] | [x] | — | — |

### Delegation Wiring

| Action Method | Calls Correct Endpoint | Sends Correct Body | Auth Headers | Custom Headers | Calls handleResponse |
|---------------|:---:|:---:|:---:|:---:|:---:|
| `searchByImage` | [x] | [x] | [x] | [x] | [x] |

### Pagination / Defaults

- [x] Defaults to page 1 and batch size 20
- [x] Respects custom `batchSize`
- [x] Respects `limit` as alias for `batchSize`
- [x] Prefers `batchSize` over `limit`
- [x] Uses explicit `startIndex` when provided
- [x] Calculates `startIndex` from `pageNumber` when absent

### Data Transformation

| Action Method | Correct Results | Edge Cases (empty/missing) |
|---------------|:---:|:---:|
| `searchByImage` | [x] | [x] |

### Defensive Data Handling

| Action Method | Empty Object | Null result_sets | Empty result_sets | Missing items |
|---------------|:---:|:---:|:---:|:---:|
| `searchByImage` | [x] | [x] | [x] | [x] |

### checkDataAvailability — Behavior

- [x] Returns `true` when results exist
- [x] Returns `false` when results are empty
- [x] Uses `AVAILABILITY_CHECK_BATCH_SIZE` (1) for probe
- [x] Returns `false` on network error
- [x] Returns `false` on API error

---

## Action Group: `UrlActions`

**Test file:** `actions/UrlActions.test.js`

### Structural Correctness (`getHandlers`)

- [x] Returns a handler for every `URL` topic
- [x] Contains no unexpected topic keys

### `getSearchUrl` — Auth-Aware Routing

- [x] Returns authenticated URL parts when `isLoggedIn` is `true`
- [x] Strips trailing slash from baseUrl
- [x] Returns anonymous URL parts when `isLoggedIn` is `false`
- [x] Falls back to plugin auth state when argument omitted
- [x] Defaults to anonymous when auth state is null
- [x] Defaults to anonymous when auth state has no `isLoggedIn`

### `getSearchUrl` — Config Edge Cases

- [x] Falls back to default similarity path when missing
- [x] Handles missing baseUrl (empty basePath)
- [x] Handles completely empty serviceConfig
- [x] Handles undefined serviceConfig

---

## Exported Utility Functions

**Test file:** `actions/utilityFunctions.test.js`

### `buildUniversalSearchFormData`

- [x] Returns a FormData instance
- [x] Includes `request` field with correct JSON structure
- [x] Includes the image file in form data
- [x] Calculates `start_index` from pageNumber and batchSize
- [x] Uses defaults when pageNumber and batchSize omitted
- [x] Handles page 1 with start_index 0
- [x] Always includes scope and asset_type arrays

### `parseUniversalSearchData`

- [x] Extracts themes from `result_sets[0].items`
- [x] Returns empty themes when `result_sets` is missing
- [x] Returns empty themes when `result_sets[0].items` is missing
- [x] Defaults `total_results` to 0 when missing
- [x] Preserves other raw fields from the response
- [x] Handles null `result_sets`
- [x] Handles empty `result_sets` array
- [x] Handles `result_sets` with total_results but no items
- [x] Does not mutate the original data object

---

## Provider: `UniversalSearchProvider`

**Test file:** `providers/UniversalSearchProvider.test.js`

### Delegation Wiring

| Provider Method | Returns Data | Passes Args Correctly |
|-----------------|:---:|:---:|
| `searchByImage()` | [x] | [x] |
| `checkDataAvailability()` | [x] | — |
| `getSearchUrl()` | [x] | [x] |

### Error Boundary (`safeExecute`)

| Provider Method | Returns `null`/`false` on Network Error | Returns `null`/`false` on API Error | Returns `null`/`false` on Invalid Input |
|-----------------|:---:|:---:|:---:|
| `searchByImage()` | [x] | [x] | — |
| `checkDataAvailability()` | [x] | — | [x] |

### Factory Functions

- [x] `createUniversalSearchProvider()` returns correct instance

### Error Logging

- [x] Logs to `window.lana` when `searchByImage` fails
- [x] Includes service name in log message
- [x] Does not log when operation succeeds

---

## Coverage Gaps

- [ ] `getSearchUrl` — error boundary test for edge case where `useAction` itself throws at provider level
- [ ] Middleware integration tests (no custom middleware for universal)

---

**Last Updated:** February 2026
