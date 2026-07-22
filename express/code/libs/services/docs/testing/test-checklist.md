## Test Coverage Checklist (`CHECKLIST.md`)

Full template and structural guidance for plugin test coverage checklists.

---

### Structure

The checklist is broken down by scope to clearly differentiate what is being tested at each layer:

| Section | Scope | Applicable Patterns |
|---------|-------|---------------------|
| **Plugin** | Feature flags, handler registration, direct methods | All (A, B, C) |
| **Action Group** | Structural correctness, delegation, validation, transformation, defensive handling | A only |
| **Provider** | Delegation wiring, error boundary, factory functions | A only |
| **Middleware** | next() behavior, context propagation, error propagation | All (if custom middleware exists) |
| **Coverage Gaps** | Known missing test cases | All |

Each plugin's `CHECKLIST.md` should only include the sections relevant to its pattern (e.g., Pattern C plugins omit Action Group and Provider sections).

`ServiceManager` lifecycle behavior is validated by core framework tests and should not be included as a required plugin-level checklist section.

> **Tip:** When creating a new plugin, generate the `CHECKLIST.md` skeleton first with all items marked `[ ]`, then check them off as you write each test.

---

### Template

````markdown
# {PluginName} — Test Coverage Checklist

> Comprehensive list of all test cases covered for the **{PluginName}** plugin
> and its children (action groups, providers). Update this file whenever tests
> are added, modified, or removed.

---

## Plugin: `{PluginName}Plugin`

**Test file:** `{PluginName}Plugin.test.js`

### Feature Flag Gating (`isActivated`)

- [ ] Returns `true` when feature flag is not set
- [ ] Returns `true` when feature flag is explicitly `true`
- [ ] Returns `false` when feature flag is explicitly `false`
- [ ] Returns `true` when `features` key is missing entirely

### Handler Registration

- [ ] Registers handlers on construction (`topicRegistry.size > 0`)
- [ ] Registers a handler for every expected topic
- [ ] Contains no unexpected topic keys
- [ ] Registered values are callable functions
- [ ] Registers action groups on construction _(Pattern A only)_

### Direct Methods _(Pattern C only — omit for Pattern A/B)_

| Method | HTTP Correctness | Response Handling | Malformed Payload Handling | Auth Behavior | Default Params | Config Resolution |
|--------|:---:|:---:|:---:|:---:|:---:|:---:|
| `methodA()` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| `methodB()` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |

#### Auth Edge Cases _(Pattern C only)_

- [ ] Handles missing `window.adobeIMS` without throwing
- [ ] Omits auth header when access token is `null`/missing
- [ ] Handles unexpected token shape without crashing

#### Observability / Logging _(Pattern C only, if logging exists)_

- [ ] Logs expected failures to `window.lana` (or equivalent logger)
- [ ] Avoids duplicate/over-logging for a single failure path

#### Response Error Paths _(Pattern C only)_

- [ ] Throws/handles expected error for non-OK HTTP status
- [ ] Throws/handles expected error on network rejection (no response object)
- [ ] Handles non-JSON or malformed response payload gracefully

---

## Middleware: `{middlewareName}` _(All patterns, if custom middleware exists)_

**Test file:** `{middlewareName}.test.js`

### Core Behavior

- [ ] Calls `next()` exactly once and returns its result on success
- [ ] Preserves expected context/topic/args behavior
- [ ] Propagates or transforms errors as designed when `next()` rejects

---

## Action Group: `{ActionGroupName}Actions` _(Pattern A only — omit for Pattern B/C)_

**Test file:** `actions/{ActionGroupName}Actions.test.js`

### Structural Correctness (`getHandlers`)

- [ ] Returns a handler for every expected topic
- [ ] Contains no unexpected topic keys

### Delegation Wiring

| Action Method | Delegates to Plugin | Passes Args Correctly |
|---------------|:---:|:---:|
| `actionMethodA()` | [ ] | [ ] |
| `actionMethodB()` | [ ] | [ ] |

### Validation

| Action Method | Invalid Inputs | Error Message Quality | Error Metadata | All Valid Inputs |
|---------------|:---:|:---:|:---:|:---:|
| `actionMethodA(param)` | [ ] | [ ] | [ ] | [ ] |

### Data Transformation

| Action Method | Correct Results | No Data Leakage | Edge Cases (empty/missing) |
|---------------|:---:|:---:|:---:|
| `actionMethodA()` | [ ] | [ ] | [ ] |

### Defensive Data Handling

| Action Method | Null Response | Empty Object | Missing Properties |
|---------------|:---:|:---:|:---:|
| `actionMethodA()` | [ ] | [ ] | [ ] |

---

## Provider: `{ProviderName}Provider` _(Pattern A only — omit for Pattern B/C)_

**Test file:** `providers/{ProviderName}Provider.test.js`

### Delegation Wiring

| Provider Method | Returns Data | Passes Args Correctly |
|-----------------|:---:|:---:|
| `providerMethodA()` | [ ] | [ ] |
| `providerMethodB()` | [ ] | [ ] |

### Error Boundary (`safeExecute`)

| Provider Method | Returns `null` on Plugin Error | Returns `null` on Validation Error |
|-----------------|:---:|:---:|
| `providerMethodA()` | [ ] | [ ] |
| `providerMethodB()` | [ ] | [ ] |

### Factory Functions

- [ ] `create{ProviderName}()` returns correct instance

---

## Coverage Gaps

_List any known areas that still need test coverage:_

- [ ] _Example: `actionMethodC()` — validation tests not yet written_
- [ ] _Example: Error boundary test for edge case X_

---

**Last Updated:** {Month} {Year}
````
