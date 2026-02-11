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
`BaseApiService` extends `BasePlugin` with HTTP helpers:
- `getHeaders()` merges API keys and auth headers.
- `get`, `post`, `put`, `delete` convenience methods.
- `handleResponse()` throws `ApiError` for non-OK responses.
- `buildQueryString(params)` for query serialization.

### ServiceManager Lifecycle
`ServiceManager`:
- Lazy-loads plugins and providers based on plugin manifests + feature flags.
- Applies middleware from `config.middleware` or per-plugin config.
- Ensures single initialization via `init(options)`.
- Supports `getPlugin(name)` and `getProvider(name)`.

#### Runtime Plugin Selection
Pass options to `init()` to control which plugins load:

```javascript
// Load only specific plugins
await serviceManager.init({ plugins: ['kuler', 'curated'] });

// Override feature flags
await serviceManager.init({ features: { ENABLE_STOCK: false } });
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
6. Add a feature flag and service config in `services/integration/config.js`.

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
