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

### Standalone Providers

Not all providers need a backing plugin. Cross-cutting concerns like
authentication state can be implemented as **standalone providers** —
they extend `BaseProvider` with `null` as the plugin and are registered
directly via `serviceManager.registerProvider()`.

```javascript
import BaseProvider from './BaseProvider.js';

export default class AuthStateProvider extends BaseProvider {
  #state = { isLoggedIn: false };
  #listeners = new Set();

  constructor() {
    super(null); // no backing plugin
    // ... internal bridging logic
  }

  getState() { return { ...this.#state }; }

  subscribe(callback) {
    this.#listeners.add(callback);
    return () => this.#listeners.delete(callback);
  }
}
```

**Registration** (during app bootstrap, not inside ServiceManager):

```javascript
import AuthStateProvider from './providers/AuthStateProvider.js';

serviceManager.registerProvider('authState', new AuthStateProvider());
```

**Consumption** (same `getProvider` pattern as plugin-backed providers):

```javascript
const auth = await serviceManager.getProvider('authState');
const { isLoggedIn } = auth.getState();

// React to state changes
const unsubscribe = auth.subscribe(({ isLoggedIn, token }) => {
  saveButton.disabled = !isLoggedIn;
});
```

Key differences from plugin-backed providers:
- `isAvailable` returns `false` (no plugin), so `safeExecute` is not used
- No `useAction` pattern — standalone providers expose their own API directly
- Registered via `registerProvider(name, provider)` instead of manifest `providerLoader`
- Duplicate registration throws `ProviderRegistrationError` (same as plugins)

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
Providers can use common transforms from
`services/providers/transforms.js` to normalize inputs:
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

