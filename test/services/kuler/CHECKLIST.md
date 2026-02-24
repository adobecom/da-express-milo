# Kuler — Test Coverage Checklist

> Comprehensive list of all test cases covered for the **Kuler** plugin
> and its children (action groups, providers). Update this file whenever tests
> are added, modified, or removed.
>
> Core lifecycle behavior (`ServiceManager` reset/init/registration),
> `BaseApiService` methods (`get`/`post`/`handleResponse`/`getHeaders`),
> `BaseActionGroup` base class, and `BaseProvider.safeExecute` are validated
> by core framework tests and are **not** duplicated here.

---

## Plugin: `KulerPlugin`

**Test file:** `KulerPlugin.test.js`

### Feature Flag Gating (`isActivated`)

- [x] Returns `true` when feature flag is not set
- [x] Returns `true` when feature flag is explicitly `true`
- [x] Returns `false` when feature flag is explicitly `false`
- [x] Returns `true` when `features` key is missing entirely
- [x] Returns `true` when `appConfig` is `null`
- [x] Returns `true` when `appConfig` is `undefined`
- [x] Returns `true` when `features` is `null`

### Action Group Registration

- [x] Registers exactly the five expected action groups (search, explore, theme, gradient, like)
- [x] Registers a callable handler for every topic across all groups (including EXPLORE)
- [x] Does not register unhandled `THEME.NAMES` topic
- [x] Has exactly the right number of registered topics (11)

### Service Name

- [x] `serviceName` returns `"Kuler"`

---

## Action Group: `SearchActions`

**Test file:** `actions/SearchActions.test.js`

### Structural Correctness (`getHandlers`)

- [x] Returns a handler for every `KulerTopics.SEARCH` topic
- [x] Contains no unexpected topic keys

### `buildKulerQuery` (static)

- [x] Defaults to `"term"` when `typeOfQuery` is absent
- [x] Uses each query type correctly (`term`, `tag`, `hex`, `similarHex`)
- [x] Handles empty string query
- [x] Handles special characters in query

### `buildPublishedCheckUrl`

- [x] Constructs base URL from `plugin.baseUrl` + `endpoints.search`
- [x] Encodes `asset_id` as a JSON query parameter
- [x] Defaults `assetType` to `GRADIENT`
- [x] Accepts `THEME` assetType
- [x] Includes `maxNumber=1`

### `buildSearchUrl`

- [x] Constructs base URL from `plugin.baseUrl` + `endpoints.search`
- [x] Encodes query parameter
- [x] Defaults `assetType` to `THEME`
- [x] Accepts `GRADIENT` assetType
- [x] Includes `maxNumber=72`
- [x] Computes `startIndex=0` for page 1
- [x] Computes `startIndex=72` for page 2
- [x] Computes `startIndex=144` for page 3
- [x] Defaults to page 1 when `pageNumber` is missing
- [x] Defaults to page 1 when `pageNumber` is `null`
- [x] Handles string `pageNumber` via `parseInt`
- [x] Includes `metadata=all` when user is logged in with a valid token
- [x] Omits `metadata=all` when user is logged out
- [x] Omits `metadata=all` when logged in but token is missing
- [x] Places `metadata=all` before `startIndex` in URL order

### `fetchThemeList`

- [x] Calls fetch with built URL and GET method
- [x] Returns parsed response via `handleResponse`

### `fetchGradientList`

- [x] Delegates to `fetchThemeList` with `GRADIENT` assetType

### `makeRequestWithFullUrl`

- [x] Sends headers from `plugin.getHeaders()`
- [x] Does not attach body for GET
- [x] Does not attach body for DELETE
- [x] JSON.stringifies body for POST
- [x] JSON.stringifies body for PUT
- [x] Sends FormData as-is and removes Content-Type
- [x] Does not attach body when body is `null` for POST
- [x] Delegates response to `plugin.handleResponse`

### `searchPublishedTheme`

- [x] Prepends `baseUrl` for relative paths
- [x] Uses full URL as-is for `https://` URLs
- [x] Uses full URL as-is for `http://` URLs
- [x] Uses GET method
- [x] Uses `buildPublishedCheckUrl` when passed `{ assetId }` object
- [x] Respects `assetType` from `{ assetId, assetType }` object
- [x] Uses GET method for `{ assetId }` path

---

## Action Group: `ExploreActions`

**Test file:** `actions/ExploreActions.test.js`

### Structural Correctness (`getHandlers`)

- [x] Returns a handler for every `KulerTopics.EXPLORE` topic
- [x] Contains no unexpected topic keys

### `buildExploreUrl`

- [x] Constructs base URL from `exploreBaseUrl` + `api` + `assetPath`
- [x] Defaults to `https://themesb3.adobe.io` when `exploreBaseUrl` is absent
- [x] Defaults `api` to `/api/v2` when endpoint is absent
- [x] Defaults `filter` to `"public"`
- [x] Defaults `sort` to `"create_time"`
- [x] Defaults `time` to `"month"`
- [x] Accepts custom `filter`, `sort`, and `time` criteria
- [x] Omits `sort` and `time` when filter is `"my_themes"`
- [x] Computes `startIndex=0` for page 1
- [x] Computes `startIndex=72` for page 2
- [x] Computes `startIndex=144` for page 3
- [x] Defaults to page 1 when `pageNumber` is missing
- [x] Includes `maxNumber=72`
- [x] Handles string `pageNumber` via `parseInt`
- [x] Includes `metadata=all` when user is logged in with a valid token
- [x] Omits `metadata=all` when user is logged out
- [x] Omits `metadata=all` when logged in but token is missing
- [x] Places `metadata=all` before `startIndex` in URL order

### `fetchExploreThemes`

- [x] Calls `fetchWithFullUrl` with built URL and GET method
- [x] Uses configured `themePath`
- [x] Defaults `themePath` to `/themes` when endpoint is absent
- [x] Returns parsed response via `handleResponse`

### `fetchExploreGradients`

- [x] Calls `fetchWithFullUrl` with gradient path and GET method
- [x] Uses configured `gradientPath`
- [x] Defaults `gradientPath` to `/gradient` when endpoint is absent
- [x] Returns parsed response via `handleResponse`

---

## Action Group: `ThemeActions`

**Test file:** `actions/ThemeActions.test.js`

### Structural Correctness (`getHandlers`)

- [x] Maps GET, SAVE, DELETE topics to functions
- [x] Has exactly 3 handlers

### URL Builders

| Method | Configured Endpoints | Default Fallback | Piecemeal Fallback |
|--------|:---:|:---:|:---:|
| `buildThemeUrl()` | [x] | [x] | [x] |
| `buildThemeSaveUrl()` | [x] | [x] | — |
| `buildThemeDeleteUrl()` | [x] (delegates) | — | — |

### `convertSwatchesToKulerFormat` (static)

- [x] Converts RGB swatches
- [x] Converts CMYK swatches
- [x] Converts HSV swatches
- [x] Converts LAB swatches
- [x] Detects color mode from FIRST swatch only
- [x] Produces empty values when swatch lacks detected mode data
- [x] Defaults to RGB when first swatch has no recognized mode key
- [x] Includes `swatchLabel` from themeData when present
- [x] Omits `swatchLabel` when themeData has no label at that index
- [x] Omits `swatchLabel` when `themeData.swatches` is undefined
- [x] Returns empty array for empty swatches input
- [x] Handles swatches with zero values correctly
- [x] Converts all 5 swatches in a realistic multi-swatch RGB theme _(colorWeb parity)_

### `buildThemePostData` (static)

- [x] Builds complete post data with all fields
- [x] Defaults `name` to `"My Color Theme"`
- [x] Defaults `tags` to empty array
- [x] Defaults `harmony.rule` to `"custom"`
- [x] Defaults `harmony.baseSwatchIndex` to `0`
- [x] Defaults `harmony.sourceURL` to empty string
- [x] Lowercases `harmony.mood`
- [x] Handles undefined `harmony.mood` gracefully
- [x] Lowercases `harmony.rule`
- [x] Includes `accessibilityData` when present
- [x] Omits `accessibilityData` when absent
- [x] Treats `null` swatches as empty via fallback
- [x] Treats `undefined` swatches as empty via fallback
- [x] Does not include unrecognized theme properties in post data (author, source, href, etc.) _(colorWeb parity)_

### Validation

| Action Method | Invalid Inputs | Error Metadata |
|---------------|:---:|:---:|
| `fetchTheme(themeId)` — null, undefined, empty string, zero | [x] | [x] |
| `saveTheme(themeData, ccResponse)` — null/undefined themeData, empty swatches, missing ccResponse fields | [x] | [x] |
| `deleteTheme(payload)` — null, undefined, missing id, empty id | [x] | [x] |

### saveTheme Integration

- [x] Includes all swatches in POST body for a multi-swatch theme _(colorWeb parity)_

### Edge Cases

- [x] `deleteTheme` returns response wrapped with `themeName`
- [x] `deleteTheme` handles missing `name` gracefully (undefined `themeName`)

---

## Action Group: `GradientActions`

**Test file:** `actions/GradientActions.test.js`

### Structural Correctness (`getHandlers`)

- [x] Returns a handler for every `KulerTopics.GRADIENT` topic
- [x] Has exactly 2 handlers

### URL Builders

| Method | Configured Endpoints | Default Fallback | Piecemeal Fallback |
|--------|:---:|:---:|:---:|
| `buildGradientSaveUrl()` | [x] | [x] | [x] |
| `buildGradientDeleteUrl()` | [x] | [x] | — |

### Validation

| Action Method | Invalid Inputs | Error Metadata |
|---------------|:---:|:---:|
| `saveGradient(gradientData)` — null, undefined | [x] | [x] |
| `saveGradient({})` — does NOT throw (truthy) | [x] | — |
| `deleteGradient(payload)` — null, undefined, missing id, empty id | [x] | [x] |

### saveGradient Integration

- [x] POSTs full gradient structure with multiple stops intact _(colorWeb parity)_

### Edge Cases

- [x] `deleteGradient` returns response wrapped with `gradientName`
- [x] `deleteGradient` handles missing `name` gracefully (undefined `gradientName`)

---

## Action Group: `LikeActions`

**Test file:** `actions/LikeActions.test.js`

### Structural Correctness (`getHandlers`)

- [x] Maps `KulerTopics.LIKE.UPDATE` to a function
- [x] Has exactly 1 handler

### URL Builders

| Method | Configured Endpoints | Default Fallback |
|--------|:---:|:---:|
| `buildThemeLikeUrl()` | [x] | [x] |
| `buildThemeUnlikeUrl()` | [x] | [x] |

### Validation

| Action Method | Invalid Inputs | Error Metadata |
|---------------|:---:|:---:|
| `updateLikeStatus(payload)` — null, undefined, missing id, empty id | [x] | [x] |

### Like/Unlike Branching

- [x] POSTs to `/likeDuplicate` when user has NOT liked (no `like.user`)
- [x] POSTs to `/likeDuplicate` when `like` is undefined
- [x] POSTs with empty object body when liking
- [x] DELETEs to `/like` when user HAS liked (`like.user` exists)
- [x] POSTs when `like.user` is `null`
- [x] POSTs when `like.user` is `undefined`
- [x] POSTs when `like.user` is boolean `false` _(colorWeb parity)_
- [x] Returns `undefined` (void)

---

## Provider: `KulerProvider`

**Test file:** `providers/KulerProvider.test.js`

### Delegation Wiring

| Provider Method | Returns Data | Passes Args Correctly |
|-----------------|:---:|:---:|
| `searchThemes()` | [x] | [x] |
| `searchGradients()` | [x] | [x] |
| `getTheme()` | [x] | [x] |
| `saveTheme()` | [x] | [x] |
| `deleteTheme()` | [x] | [x] |
| `saveGradient()` | [x] | [x] |
| `deleteGradient()` | [x] | [x] |
| `updateLike()` | [x] | [x] |
| `searchPublished()` | [x] | [x] |
| `exploreThemes()` | [x] | [x] |
| `exploreGradients()` | [x] | [x] |
| `checkIfPublished()` | [x] | [x] |

### Param Transformation (`#transformSearchParams`)

- [x] Defaults to page 1 and typeOfQuery `"term"`
- [x] Passes custom page and typeOfQuery through

### Error Boundary (`safeExecute`)

| Provider Method | Returns `null` on Network Error | Returns `null` on Validation Error |
|-----------------|:---:|:---:|
| `searchThemes()` | [x] | — |
| `searchGradients()` | [x] | — |
| `getTheme()` | [x] | [x] |
| `saveTheme()` | — | [x] (null data + empty swatches) |
| `deleteTheme()` | [x] | [x] |
| `saveGradient()` | [x] | [x] |
| `deleteGradient()` | — | [x] |
| `updateLike()` | [x] | [x] |
| `searchPublished()` | [x] | — |
| `exploreThemes()` | [x] | — |
| `exploreGradients()` | [x] | — |
| `checkIfPublished()` | [x] | — |

### Logging

- [x] Errors are logged to `window.lana`

### Factory Functions

- [x] `createKulerProvider()` returns `KulerProvider` instance
- [x] `createKulerProvider()` returns a new instance each call

---

## Coverage Gaps

_No known gaps — ExploreActions, buildPublishedCheckUrl, and provider explore/checkIfPublished tests added February 2026._

---

**Last Updated:** February 2026
