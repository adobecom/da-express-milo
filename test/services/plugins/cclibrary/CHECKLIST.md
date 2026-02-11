# CCLibrary — Test Coverage Checklist

> Comprehensive list of all test cases covered for the `CCLibrary` plugin
> and its children (action groups, provider). Update this file whenever tests
> are added, modified, or removed.

---

## Plugin: `CCLibraryPlugin`

**Test file:** `CCLibraryPlugin.test.js`

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
- [x] Registers expected handler count (`8` topics total)

### Config Resolution

- [x] Resolves `baseUrl` from `melvilleBasePath`
- [x] Falls back to `serviceConfig.baseUrl` when `melvilleBasePath` is missing

---

## Action Group: `LibraryActions`

**Test file:** `actions/CCLibraryActions.test.js`

### Structural Correctness (`getHandlers`)

- [x] Returns a handler for every expected `CCLibraryTopics.LIBRARY` topic
- [x] Contains no unexpected topic keys

### Delegation Wiring

| Action Method | Delegates to Plugin | Passes Args Correctly |
|---------------|:---:|:---:|
| `createLibrary(name)` | [x] | [x] |
| `fetchLibraries(params)` | [x] | [x] |
| `fetchLibraryElements(libraryId, params)` | [x] | [x] |

### Validation

| Action Method | Invalid Inputs | Error Metadata | Valid Inputs |
|---------------|:---:|:---:|:---:|
| `createLibrary(name)` | [x] | [x] | [x] |
| `fetchLibraryElements(libraryId, params)` | [x] | [x] | [x] |

### Default Parameter Behavior

- [x] `fetchLibraries()` uses documented defaults
- [x] `fetchLibraries(params)` preserves non-overridden defaults
- [x] `fetchLibraryElements()` uses documented defaults
- [x] `fetchLibraryElements(params)` includes optional `type` only when present

---

## Action Group: `LibraryThemeActions`

**Test file:** `actions/CCLibraryActions.test.js`

### Structural Correctness (`getHandlers`)

- [x] Returns a handler for every expected `CCLibraryTopics.THEME` topic
- [x] Contains no unexpected topic keys

### Delegation Wiring

| Action Method | Delegates to Plugin | Passes Args Correctly |
|---------------|:---:|:---:|
| `saveTheme(libraryId, themeData)` | [x] | [x] |
| `saveGradient(libraryId, gradientData)` | [x] | [x] |
| `deleteTheme(libraryId, elementId)` | [x] | [x] |
| `updateTheme(libraryId, elementId, payload)` | [x] | [x] |
| `updateElementMetadata(libraryId, elements)` | [x] | [x] |

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

**Test file:** `providers/CCLibraryProvider.test.js`

### Delegation Wiring

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

### Error Boundary (`safeExecute`)

| Provider Method | Returns `null` on Plugin/API Error | Returns `null` on Validation Error |
|-----------------|:---:|:---:|
| `createLibrary(...)` | [x] | [ ] |
| `fetchLibraries(...)` | [x] | [ ] |
| `fetchLibraryElements(...)` | [x] | [x] |
| `saveTheme(...)` | [x] | [ ] |
| `saveGradient(...)` | [x] | [ ] |
| `deleteTheme(...)` | [x] | [ ] |
| `updateTheme(...)` | [x] | [ ] |
| `updateElementMetadata(...)` | [x] | [ ] |

### Factory Functions

- [x] `createCCLibraryProvider()` returns correct instance

### Availability

- [x] `isAvailable` is `true` when plugin instance exists

---

## Coverage Gaps

- [ ] Add provider-level validation-edge tests for all provider methods (not only `fetchLibraryElements`)
- [ ] Add provider tests that verify `useAction` wiring directly (instead of mostly `fetch` internals)
- [ ] Add middleware coverage if plugin-specific middleware is introduced later

---

**Last Updated:** February 2026
