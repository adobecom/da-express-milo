# Curated — Test Coverage Checklist

> Comprehensive list of all test cases covered for the **Curated** plugin
> and its children (action groups, providers). Update this file whenever tests
> are added, modified, or removed.

---

## Plugin: `CuratedPlugin`

**Test file:** `CuratedPlugin.test.js`

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

### Header Behavior (`getHeaders`)

- [x] Returns minimal public headers by default (`Accept: application/json`)
- [x] Merges caller-provided headers without dropping defaults

---

## Action Group: `CuratedDataActions`

**Test file:** `actions/CuratedDataActions.test.js`

### Structural Correctness (`getHandlers`)

- [x] Returns a handler for every expected topic
- [x] Contains no unexpected topic keys

### Delegation Wiring

| Action Method | Delegates to Plugin | Passes Args Correctly |
|---------------|:---:|:---:|
| `fetchCuratedData()` | [x] | N/A |
| `fetchBySource(source)` | [x] | [x] |
| `fetchGroupedBySource()` | [x] | N/A |

### Validation

| Action Method | Invalid Inputs | Error Message Quality | Error Metadata | All Valid Inputs |
|---------------|:---:|:---:|:---:|:---:|
| `fetchBySource(source)` | [x] | [x] | [x] | [x] |

### Data Transformation

| Action Method | Correct Results | No Data Leakage | Edge Cases (empty/missing) |
|---------------|:---:|:---:|:---:|
| `fetchBySource()` | [x] | [x] | [x] |
| `fetchGroupedBySource()` | [x] | [x] | [x] |

### Defensive Data Handling

| Action Method | Null Response | Empty Object | Missing Properties |
|---------------|:---:|:---:|:---:|
| `fetchBySource()` | [x] | [x] | [x] |
| `fetchGroupedBySource()` | N/A | [x] | [x] |

---

## Provider: `CuratedProvider`

**Test file:** `providers/CuratedProvider.test.js`

### Delegation Wiring

| Provider Method | Returns Data | Passes Args Correctly |
|-----------------|:---:|:---:|
| `fetchCuratedData()` | [x] | N/A |
| `fetchBySource(source)` | [x] | [x] |
| `fetchGroupedBySource()` | [x] | N/A |

### Error Boundary (`safeExecute`)

| Provider Method | Returns `null` on Plugin Error | Returns `null` on Validation Error |
|-----------------|:---:|:---:|
| `fetchCuratedData()` | [x] | N/A |
| `fetchBySource(source)` | N/A | [x] |
| `fetchGroupedBySource()` | [x] | N/A |

### Factory Functions

- [x] `createCuratedProvider()` returns correct instance

---

## Coverage Gaps

- [x] No known curated plugin-owned gaps at this time.

---

**Last Updated:** February 2026
