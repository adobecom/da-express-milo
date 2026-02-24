# Behance — Test Coverage Checklist

> Comprehensive list of all test cases covered for the **Behance** plugin
> and its children (action groups, provider). Update this file whenever tests
> are added, modified, or removed.

---

## Plugin: `BehancePlugin`

**Test file:** `BehancePlugin.test.js`

### Feature Flag Gating (`isActivated`)

- [x] Returns `true` when feature flag is not set
- [x] Returns `true` when feature flag is explicitly `true`
- [x] Returns `false` when feature flag is explicitly `false`
- [x] Returns `true` when `features` key is missing entirely
- [x] Returns `true` when config is undefined
- [x] Returns `true` when config is null

### Handler Registration

- [x] Registers handlers on construction (`topicRegistry.size > 0`)
- [x] Registers action groups on construction
- [x] Registers all three expected action groups (projects, galleries, graphql)
- [x] Contains no unexpected action groups
- [x] Registers a handler for every Behance topic
- [x] Contains no unexpected topics registered
- [x] Registered handlers are callable functions

### Static Properties

- [x] `serviceName` is "Behance"

---

## Action Group: `ProjectActions`

**Test file:** `actions/ProjectActions.test.js`

### Structural Correctness (`getHandlers`)

- [x] Returns a handler for every `BehanceTopics.PROJECTS` topic
- [x] Contains no unexpected topic keys

### Delegation Wiring

| Action Method | Delegates to Plugin | Passes Args Correctly |
|---------------|:---:|:---:|
| `searchProjects()` | [x] | [x] |

### Default Parameters

| Action Method | Uses Defaults | Override Works |
|---------------|:---:|:---:|
| `searchProjects()` | [x] | [x] |

### Validation

| Action Method | Invalid Inputs | Error Message Quality | Error Metadata |
|---------------|:---:|:---:|:---:|
| `searchProjects(criteria)` | [x] | [x] | [x] |

---

## Action Group: `GalleryActions`

**Test file:** `actions/GalleryActions.test.js`

### Structural Correctness (`getHandlers`)

- [x] Returns a handler for every `BehanceTopics.GALLERIES` topic
- [x] Contains no unexpected topic keys

### Delegation Wiring

| Action Method | Delegates to Plugin | Passes Args Correctly |
|---------------|:---:|:---:|
| `getGalleryList()` | [x] | [x] |
| `getGalleryProjects()` | [x] | [x] |

### Default Parameters

| Action Method | Uses Defaults | Override Works |
|---------------|:---:|:---:|
| `getGalleryList()` | [x] | [x] |
| `getGalleryProjects()` | [x] | [ ] |

### Ordinal Calculation

- [x] Correctly calculates ordinal for multiple page/perPage combinations

### Validation

| Action Method | Invalid Inputs | Error Metadata | Valid Inputs Pass |
|---------------|:---:|:---:|:---:|
| `getGalleryProjects(criteria)` | [x] | [x] | [x] |

---

## Action Group: `GraphQLActions`

**Test file:** `actions/GraphQLActions.test.js`

### Structural Correctness (`getHandlers`)

- [x] Returns a handler for every `BehanceTopics.GRAPHQL` topic
- [x] Contains no unexpected topic keys

### `getGraphQLUrl`

- [x] Builds URL from serviceConfig.graphqlBaseUrl + endpoints.graphql
- [x] Falls back to default graphql path when endpoints.graphql is missing
- [x] Uses custom graphqlBaseUrl when provided

### `postGraphQL`

- [x] Calls fetch with POST method and JSON-stringified body
- [x] Uses headers from plugin.getHeaders()
- [x] Passes response through plugin.handleResponse

### Delegation Wiring

| Action Method | Returns Correct Data | Uses Correct Query/Variables | Custom Options |
|---------------|:---:|:---:|:---:|
| `getGraphicDesignList()` | [x] | [x] | [x] |

### Defensive Data Handling

| Scenario | Handled |
|----------|:---:|
| `data.gallery` missing | [x] |
| `data` key missing | [x] |
| Null response | [x] |

---

## Provider: `BehanceProvider`

**Test file:** `providers/BehanceProvider.test.js`

### Delegation Wiring

| Provider Method | Returns Data | Passes Args Correctly | Uses Defaults |
|-----------------|:---:|:---:|:---:|
| `searchProjects()` | [x] | [x] | [x] |
| `getGalleryList()` | [x] | [x] | [ ] |
| `getGalleryProjects()` | [x] | [x] | [ ] |
| `getGraphicDesignList()` | [x] | [x] | [ ] |

### Error Boundary (`safeExecute`)

| Provider Method | Returns `null` on Plugin Error | Returns `null` on Validation Error |
|-----------------|:---:|:---:|
| `searchProjects()` | [x] | [x] |
| `getGalleryList()` | [x] | N/A |
| `getGalleryProjects()` | [x] | [x] |
| `getGraphicDesignList()` | [x] | N/A |

### Factory Functions

- [x] `createBehanceProvider()` returns correct instance

---

## Coverage Gaps

_None currently identified._

---

**Last Updated:** February 2026
