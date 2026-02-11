# CCLibrary — Test Coverage Checklist

> Comprehensive list of all test cases covered for the `CCLibrary` plugin
> and its children (action groups, provider). Update this file whenever tests
> are added, modified, or removed.

---

## Plugin: `CCLibraryPlugin`

**Test file:** `CCLibraryPlugin.test.js`

### Service Name

- [x] Returns `"CCLibrary"`

### Feature Flag Gating (`isActivated`)

- [x] Returns `true` when feature flag is not set
- [x] Returns `true` when feature flag is explicitly `true`
- [x] Returns `false` when feature flag is explicitly `false`
- [x] Returns `true` when `features` key is missing entirely
- [x] Returns `true` for `null` and `undefined` config inputs

### Handler Registration

- [x] Registers handlers on construction (`topicRegistry.size > 0`)
- [x] Registers action groups on construction
- [x] Registers `library` action group
- [x] Registers `theme` action group
- [x] Registers exactly 2 action groups
- [x] Registers expected handler count (`8` topics total)

### Config Resolution

- [x] Resolves `baseUrl` from `melvilleBasePath`
- [x] Falls back to `serviceConfig.baseUrl` when `melvilleBasePath` is missing

### Response Handling (`handleResponse`)

- [x] Throws `StorageFullError` when status is `507`
- [x] Includes response body in `StorageFullError`
- [x] Throws `ApiError` for non-507 error responses (delegates to super)
- [x] Returns parsed JSON for `200 OK` responses (delegates to super)
- [x] Returns empty object for `204 No Content` (delegates to super)

---

## Action Group: `LibraryActions`

**Test file:** `actions/LibraryActions.test.js`

### Structural Correctness (`getHandlers`)

- [x] Returns a handler for every expected `CCLibraryTopics.LIBRARY` topic
- [x] Contains no unexpected topic keys

### Delegation Wiring

| Action Method | Delegates to Plugin | Passes Args Correctly | Returns Result |
|---------------|:---:|:---:|:---:|
| `createLibrary(name)` | [x] | [x] | [x] |
| `fetchLibraries(params)` | [x] | [x] | [x] |
| `fetchLibraryElements(libraryId, params)` | [x] | [x] | [x] |

### Validation

| Action Method | Invalid Inputs | Error Metadata | Valid Inputs |
|---------------|:---:|:---:|:---:|
| `createLibrary(name)` | [x] | [x] | [x] |
| `fetchLibraryElements(libraryId, params)` | [x] | [x] | [x] |

### Default Parameter Behavior

- [x] `fetchLibraries()` uses documented defaults
- [x] `fetchLibraries(params)` preserves non-overridden defaults
- [x] `fetchLibraryElements()` uses documented defaults (including `ALL_COLOR_ELEMENT_TYPES`)
- [x] `fetchLibraryElements(params)` allows overriding `type` param
- [x] `fetchLibraryElements(params)` allows overriding `start`, `limit`, `selector`

---

## Action Group: `LibraryThemeActions`

**Test file:** `actions/LibraryThemeActions.test.js`

### Structural Correctness (`getHandlers`)

- [x] Returns a handler for every expected `CCLibraryTopics.THEME` topic
- [x] Contains no unexpected topic keys

### Delegation Wiring

| Action Method | Delegates to Plugin | Passes Args Correctly | Returns Result |
|---------------|:---:|:---:|:---:|
| `saveTheme(libraryId, themeData)` | [x] | [x] | [x] |
| `saveGradient(libraryId, gradientData)` | [x] | [x] | [x] |
| `deleteTheme(libraryId, elementId)` | [x] | [x] | [x] |
| `updateTheme(libraryId, elementId, payload)` | [x] | [x] | [x] |
| `updateElementMetadata(libraryId, elements)` | [x] | [x] | [x] |

### Validation

| Action Method | Invalid Inputs | Error Metadata | Valid Inputs |
|---------------|:---:|:---:|:---:|
| `saveTheme(...)` | [x] | [x] | [x] |
| `saveGradient(...)` | [x] | [x] | [x] |
| `deleteTheme(...)` | [x] | [x] | [x] |
| `updateTheme(...)` | [x] | [x] | [x] |
| `updateElementMetadata(...)` | [x] | [x] | [x] |

---

## Provider: `CCLibraryProvider`

### Delegation & Errors

**Test file:** `providers/CCLibraryProvider.delegation.test.js`

#### Delegation Wiring

| Provider Method | Returns Data | Passes Args Correctly |
|-----------------|:---:|:---:|
| `createLibrary(name)` | [x] | [x] |
| `fetchLibraries(params)` | [x] | [x] |
| `fetchLibraryElements(libraryId, params)` | [x] | [x] |
| `saveTheme(libraryId, themeData)` | [x] | [x] |
| `saveGradient(libraryId, gradientData)` | [x] | [x] |
| `deleteTheme(libraryId, themeId)` | [x] | [x] |
| `updateTheme(libraryId, elementId, payload)` | [x] | [x] |
| `updateElementMetadata(libraryId, elements)` | [x] | [x] |

#### Error Boundary (`safeExecute`)

| Provider Method | Returns `null` on Fetch Error | Returns `null` on API Error |
|-----------------|:---:|:---:|
| `createLibrary(...)` | [x] | [x] |
| `fetchLibraries(...)` | [x] | [x] |
| `fetchLibraryElements(...)` | [x] | [x] |
| `saveTheme(...)` | [x] | [x] |
| `saveGradient(...)` | [x] | [x] |
| `deleteTheme(...)` | [x] | [x] |
| `updateTheme(...)` | [x] | [x] |
| `updateElementMetadata(...)` | [x] | [x] |

- [x] Returns `null` for validation errors (e.g. missing `libraryId`)
- [x] Returns `null` when API returns non-OK response (e.g. `500`)

#### StorageFullError through `safeExecute`

- [x] Returns `null` when API returns `507` (storage full)
- [x] Logs `StorageFullError` with correct `errorType`

#### Factory Functions

- [x] `createCCLibraryProvider()` returns correct instance

#### Availability

- [x] `isAvailable` is `true` when plugin instance exists

---

### Color Conversion

**Test file:** `providers/CCLibraryProvider.colorConversion.test.js`

#### `convertSwatchToCCFormat`

- [x] Returns a single RGB entry for RGB color mode
- [x] Scales RGB 0–1 floats to 0–255 integers
- [x] Returns CMYK entry + RGB entry for CMYK color mode
- [x] Returns HSB entry + RGB entry for HSB color mode
- [x] Returns LAB entry + RGB entry for LAB color mode
- [x] Rounds CMYK values to integers
- [x] Falls back to only RGB entry when CMYK mode but `cmyk` data is missing
- [x] Falls back to only RGB entry when HSB mode but `hsb` data is missing
- [x] Falls back to only RGB entry when LAB mode but `lab` data is missing
- [x] Adds Pantone spot color info to RGB entry
- [x] Adds Pantone process color info to RGB entry
- [x] Does not add Pantone info when pantone is absent
- [x] Includes Pantone info on RGB entry even in non-RGB color modes

#### `convertSwatchesToCCFormat`

- [x] Returns empty array for `null` input
- [x] Returns empty array for `undefined` input
- [x] Returns empty array for non-array input
- [x] Handles empty array
- [x] Converts an array of swatches
- [x] Produces multi-entry arrays for non-RGB color mode

---

### Permissions

**Test file:** `providers/CCLibraryProvider.permissions.test.js`

#### `isLibraryWritable`

- [x] Returns `false` for `null`
- [x] Returns `false` for `undefined`
- [x] Returns `true` for private ownership
- [x] Returns `true` when bookmark role is editor
- [x] Returns `true` when `asset_acl.directory_access` includes `write`
- [x] Returns `false` for shared ownership with viewer role
- [x] Returns `false` for shared ownership with no bookmark or ACL
- [x] Returns `false` when `asset_acl.directory_access` has only `read`
- [x] Returns `false` for an empty object

#### `filterWritableLibraries`

- [x] Returns empty array for `null` input
- [x] Returns empty array for `undefined` input
- [x] Returns empty array for non-array input
- [x] Returns empty array when no libraries are writable
- [x] Returns only writable libraries
- [x] Returns all libraries when all are writable
- [x] Handles empty array

---

## Coverage Gaps

- [ ] Add middleware coverage if plugin-specific middleware is introduced later

---

**Last Updated:** February 2026
