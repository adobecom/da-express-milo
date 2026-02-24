## Providers

Providers provide the consumer-facing API on top of plugins, translating `plugin.dispatch()` calls into stable methods with consistent error logging.

### Purpose
- Offer a friendly, typed-ish surface for UI code.
- Hide action topic strings from consumers.
- Provide safe execution and centralized error logging.

### Base Provider
`BaseProvider` wraps a plugin instance and provides:
- `isAvailable` — check whether the backing plugin exists.
- `safeExecute(action, ...args)` — returns `null` on failure.
- `safeExecuteSync(action, ...args)` — synchronous variant for local data builders (e.g. URL builders).
- `logError(operation, error)` — reports `ServiceError` codes to `lana`.

### The `useAction` Pattern

Cache action functions in the constructor for single-lookup performance:

```javascript
#actions = {};

constructor(plugin) {
  super(plugin);
  this.#actions = {
    searchThemes: this.plugin.useAction('search', KulerTopics.SEARCH.THEMES),
    getTheme: this.plugin.useAction('theme', KulerTopics.THEME.GET),
  };
}

async searchThemes(query) {
  return this.safeExecute(() => this.#actions.searchThemes(query));
}

getThemeEditUrl(themeId) {
  return this.safeExecuteSync(() => this.#actions.getThemeEditUrl(themeId));
}
```

**Benefits**: action lookup happens once; cleaner method bodies; all topic mappings centralized in constructor.

### Provider Loading
Providers are loaded lazily via the manifest's `providerLoader`. They receive a plugin instance from `serviceManager.getPlugin(name)` or `serviceManager.getProvider(name)` — they never create plugins. Only plugins needing a richer API surface should have providers.

### Standalone Providers

Cross-cutting concerns (e.g. auth state) can be standalone providers — extend `BaseProvider` with `null` as the plugin.

```javascript
class AuthStateProvider extends BaseProvider {
  #state = { isLoggedIn: false };
  constructor() { super(null); }
  getState() { return { ...this.#state }; }
}
```

```javascript
// Registration (app bootstrap)
serviceManager.registerProvider('authState', new AuthStateProvider());

// Consumption (same getProvider pattern)
const auth = await serviceManager.getProvider('authState');
```

| Difference from plugin-backed | Detail |
|-------------------------------|--------|
| `isAvailable` | Returns `false` — `safeExecute` not used |
| No `useAction` | Standalone providers expose their own API directly |
| Registration | `registerProvider(name, provider)` instead of manifest `providerLoader` |
| Duplicate guard | Throws `ProviderRegistrationError` (same as plugins) |

### Cleanup with `destroy()`

`AuthStateProvider` registers event listeners on both `window` (for the
`service:ims:ready` event from the auth middleware) and the IMS SDK instance
(for `onAccessToken`, `onAccessTokenHasExpired`, `onLogout`). Call `destroy()`
when the provider is no longer needed to remove all listeners and clear
subscribers, preventing memory leaks:

```javascript
const auth = await serviceManager.getProvider('authState');
const unsub = auth.subscribe(handleStateChange);

// When done (e.g. block cleanup):
unsub();        // remove individual subscriber
auth.destroy(); // remove all listeners + clear all subscribers
```

`destroy()` is safe to call multiple times and handles missing
`removeEventListener` on the IMS SDK gracefully.

### Transforms
Common transforms from `services/providers/transforms.js`:
- `searchTransform(query, options)` — search criteria.
- `stockTransform(params)` — Stock pagination defaults.
- `identityTransform(value)` and `namedTransform(key)` — simple wrapping.
