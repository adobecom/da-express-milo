## Plugins

Plugins are the core service implementations. They define actions, register
handlers for topics, and optionally expose HTTP capabilities.

### BasePlugin Responsibilities
`BasePlugin` provides:
- `topicRegistry` for mapping topics to handlers.
- `middlewares` and `use(middleware)` for interception.
- `dispatch(topic, ...args)` to run middleware + handler pipeline.
- `registerHandlers(actionGroup)` to load action maps.
- `registerActionGroup(name, group)` and `useAction(name, topic)` helpers.
- `isActivated(appConfig)` to opt out based on feature flags or auth.

### BaseApiService

`BaseApiService` extends `BasePlugin` to add HTTP capabilities for all API-backed plugins.

#### Authentication

- **`getAuthState()`** — Returns `{ isLoggedIn, token }` by reading `window.adobeIMS`.
  Override in subclasses for custom auth sources. Used internally by `getHeaders()`.

#### Headers

- **`getHeaders(options)`** — Builds request headers with `Content-Type`, `Accept`,
  API key (if configured), and `Authorization` bearer token (if authenticated).
  - `options.headers` — Additional headers to merge.
  - `options.skipAuth` — When `true`, omits the Authorization header.

#### HTTP Methods

- **`get(path, options)`** — GET request. Supports `options.params` for query parameters.
- **`post(path, body, options)`** — POST request. Automatically handles `FormData` bodies
  by removing the `Content-Type` header so the browser sets the multipart boundary.
- **`put(path, body, options)`** — PUT request with JSON body.
- **`delete(path, options)`** — DELETE request.
- **`fetchWithFullUrl(fullUrl, method, body, options)`** — Makes a request to an **absolute URL**,
  bypassing `baseUrl`. Useful when action groups need to call different base URLs
  (e.g., explore vs search vs gradient endpoints). Handles `FormData` the same as `post()`.

#### Response & Query Helpers

- **`handleResponse(response)`** — Parses the fetch `Response`. Throws `ApiError` for non-OK
  status codes. Returns an empty object `{}` for `204 No Content` responses.
- **`static buildQueryString(params)`** — Builds a URL-encoded query string from a parameters
  object. Filters out `undefined` and `null` values. Note: this is a **static** method.

### ServiceManager Lifecycle
`ServiceManager`:
- Lazy-loads plugins **on demand** via `getProvider(name)` or `loadPlugin(name)`.
- Deduplicates concurrent requests for the same plugin.
- Applies middleware from `config.middleware` or per-plugin config.
- Resolves runtime environment from Milo `getConfig()` once and caches it.
- Supports additive `init(options)` for batch preloading.
- `getPlugin(name)` (sync) returns cached instance; `loadPlugin(name)` (async) lazy-loads.

#### On-Demand Loading (Recommended)

```javascript
// Plugin loaded automatically when provider is requested
const kuler = await serviceManager.getProvider('kuler');

// Or load plugin directly
const plugin = await serviceManager.loadPlugin('behance');
```

#### Batch Preloading (Optional)

Additive — subsequent calls load new plugins without discarding existing ones:

```javascript
await serviceManager.init({ plugins: ['kuler', 'curated'] });
await serviceManager.init({ plugins: ['cclibrary'] }); // adds cclibrary, keeps kuler
```

See [CONFIG.md](./CONFIG.md) for details.

### Configuration Flow
Plugins receive two config objects:
- `serviceConfig` for the plugin itself (baseUrl, apiKey, endpoints).
- `appConfig` for environment, features, and cross-service config.

### Middleware Context Transformation

Plugins can enrich or redact middleware context by overriding `middlewareContextTransform`:

```javascript
middlewareContextTransform(context, meta) {
  // Add feature flags to context for middleware use
  return {
    ...context,
    features: this.appConfig.features,
  };
}
```

This runs after `middleware.buildContext()` and before the middleware executes.

### Adding a Plugin
1. Create the plugin class (extend `BasePlugin` or `BaseApiService`).
2. Define topics and action groups in `plugins/<name>/`.
3. Place all action group classes in a single file —
   `plugins/<name>/actions/<PluginName>Actions.js` — using named exports to
   avoid request waterfalls from multiple small module fetches.
4. Register action groups in the plugin constructor.
5. Add a plugin manifest in `plugins/<name>/index.js`.
6. Add a feature flag and service config in `services/config.js`.

### Plugin Manifest Signature
Each plugin folder exports a manifest from `plugins/<name>/index.js`:

```javascript
export default {
  name: 'kuler',
  featureFlag: 'ENABLE_KULER',
  loader: () => import('./KulerPlugin.js'),
  // Optional when plugin has a provider
  providerLoader: () => import('../../providers/KulerProvider.js'),
};
```
