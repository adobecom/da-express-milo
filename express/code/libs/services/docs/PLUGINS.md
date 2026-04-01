## Plugins

Plugins are the core service implementations — they define actions, register topic handlers, and optionally expose HTTP capabilities.

### BasePlugin Responsibilities

`BasePlugin` provides:
- `topicRegistry` for mapping topics to handlers.
- `middlewares` and `use(middleware)` for interception.
- `dispatch(topic, ...args)` to run the middleware + handler pipeline.
- `registerHandlers(actionGroup)` to load action maps.
- `registerActionGroup(name, group)` and `useAction(name, topic)` helpers.
- `isActivated(appConfig)` to opt out based on feature flags or auth.

### BaseApiService

`BaseApiService` extends `BasePlugin` with HTTP capabilities for API-backed plugins.

| Method | Description |
|--------|-------------|
| `getAuthState()` | Returns `{ isLoggedIn, token }` via `window.adobeIMS`. Override for custom auth. |
| `getHeaders(options)` | Builds headers with Content-Type, Accept, API key, and bearer token. Supports `options.headers` and `options.skipAuth`. |
| `get(path, options)` | GET request. Supports `options.params` for query parameters. |
| `post(path, body, options)` | POST request. Auto-handles `FormData` (removes Content-Type for multipart boundary). |
| `put(path, body, options)` | PUT request with JSON body. |
| `delete(path, options)` | DELETE request. |
| `fetchWithFullUrl(fullUrl, method, body, options)` | Request to an absolute URL, bypassing `baseUrl`. Handles `FormData` like `post()`. |
| `handleResponse(response)` | Parses fetch `Response`. Throws `ApiError` for non-OK; returns `{}` for 204. |
| `static buildQueryString(params)` | Builds URL-encoded query string, filtering `undefined`/`null` values. |

### ServiceManager Lifecycle

`ServiceManager`:
- Lazy-loads plugins on demand via `getProvider(name)` or `loadPlugin(name)`.
- Deduplicates concurrent requests for the same plugin.
- Applies middleware from `config.middleware` or per-plugin config.
- Resolves runtime environment from Milo `getConfig()` once and caches it.
- Supports additive `init(options)` for batch preloading.
- `getPlugin(name)` (sync) returns cached instance; `loadPlugin(name)` (async) lazy-loads.
- Plugins receive `serviceConfig` (baseUrl, apiKey, endpoints) and `appConfig` (environment, features).

For on-demand loading and batch preloading details, see [ARCHITECTURE.md](./ARCHITECTURE.md).

### Adding a Plugin

See [AGENTS.md](./AGENTS.md) for step-by-step plugin generation.

### Plugin Manifest Signature

Each plugin folder exports a manifest from `plugins/<name>/index.js`:

```javascript
export default {
  name: 'kuler',
  featureFlag: 'ENABLE_KULER',
  loader: () => import('./KulerPlugin.js'),
  providerLoader: () => import('../../providers/KulerProvider.js'),
};
```

### Middleware Context Transformation

Plugins can enrich or redact middleware context by overriding `middlewareContextTransform`:

```javascript
middlewareContextTransform(context, meta) {
  return {
    ...context,
    features: this.appConfig.features,
  };
}
```

This runs after `middleware.buildContext()` and before the middleware executes.
