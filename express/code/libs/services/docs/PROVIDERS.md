## Providers

Providers provide the consumer-facing API on top of plugins. They translate
the lower-level `plugin.dispatch()` calls into clear, stable methods and
handle error logging consistently.

### Purpose
- Offer a friendly, typed-ish surface for UI code.
- Hide the action topic strings from consumers.
- Provide safe execution and centralized error logging.

### Base Provider
`BaseProvider` wraps a plugin instance and provides:
- `isAvailable` to quickly check whether the backing plugin exists.
- `safeExecute(action, ...args)` which returns `null` on failure.
- `safeExecuteSync(action, ...args)` which works like `safeExecute` but runs synchronously — ideal for actions that build data locally (e.g. URL builders) and should never return a Promise.
- `logError(operation, error)` that reports `ServiceError` codes to `lana`.

### Usage Pattern
- Create providers only for complex consumer APIs.
- Use providers instead of calling `plugin.dispatch()` in UI code.
- Get a provider from `serviceManager.getProvider(name)`.

### The `useAction` Pattern

Providers should cache action functions in the constructor for better performance:

```javascript
#actions = {};

constructor(plugin) {
  super(plugin);
  this.#actions = {
    searchThemes: this.plugin.useAction('search', KulerTopics.SEARCH.THEMES),
    getTheme: this.plugin.useAction('theme', KulerTopics.THEME.GET),
  };
}

// Async action
async searchThemes(query) {
  return this.safeExecute(() => this.#actions.searchThemes(query));
}

// Synchronous action (e.g. URL builder)
getThemeEditUrl(themeId) {
  return this.safeExecuteSync(() => this.#actions.getThemeEditUrl(themeId));
}
```

**Benefits**:
- Action lookup happens once, not on every call
- Cleaner method bodies
- All topic mappings centralized in constructor

### Provider Loading
Providers are loaded lazily by `ServiceManager` using the plugin manifest's
`providerLoader`. Providers never create plugins; they receive a plugin instance
from `serviceManager.getPlugin(name)` or `serviceManager.getProvider(name)`.
Only plugins that need a richer API surface should have providers.

### Transforms
Providers can use common transforms from
`services/integration/providers/transforms.js` to normalize inputs:
- `searchTransform(query, options)` for search criteria.
- `stockTransform(params)` for Stock pagination defaults.
- `identityTransform(value)` and `namedTransform(key)` for simple wrapping.

### Example (Conceptual)
```
const kuler = await serviceManager.getProvider('kuler');
if (kuler?.isAvailable) {
  // Async
  const result = await kuler.safeExecute(kuler.searchThemes, criteria);
  // Sync (no await needed)
  const editUrl = kuler.safeExecuteSync(kuler.getThemeEditUrl, themeId);
}
```

