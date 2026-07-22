## Configuration

The service layer uses a centralized configuration in `services/config.js`.

### On-Demand Plugin Loading

Plugins load on demand via `getProvider(name)` or `loadPlugin(name)`. See [ARCHITECTURE.md](./ARCHITECTURE.md).

### Batch Preloading

Use `init()` to preload multiple plugins at once; calls are **additive**.

| Option | Type | Description |
|--------|------|-------------|
| `plugins` | `string[]` | Plugin names to load (merged additively across calls) |
| `features` | `object` | Feature flag overrides merged with `config.features` |

When `plugins` is provided it takes precedence over feature flags for `init()`, but `getProvider()`/`loadPlugin()` can still lazy-load any plugin.

### Environment Detection

Environment is resolved from Milo's `getConfig().env.name` (`'prod'` | `'stage'`). Stage config is used when env is `'stage'`; otherwise production config applies.

```javascript
import { getResolvedConfig } from './services/config.js';
const resolved = await getResolvedConfig();
console.log(resolved.environment); // 'prod' | 'stage'
```

### Feature Flags

```javascript
features: {
  ENABLE_KULER: true,      // Plugin flag
  ENABLE_STOCK: true,      // Plugin flag
  ENABLE_LOGGING: true,    // Middleware flag
  ENABLE_ERROR: true,      // Middleware flag
  ENABLE_AUTH: true,        // Middleware flag
}
```

**Naming convention:** `ENABLE_{NAME}` — flags default to `false` if not explicitly set.

### Service Configuration

```javascript
serviceName: {
  baseUrl: 'https://api.example.com',
  apiKey: 'YourApiKey',
  endpoints: {
    search: '/search',
    detail: '/detail',
  },
}
```

Plugins access these via `BasePlugin` getters: `this.baseUrl`, `this.apiKey`, `this.endpoints`.

### Per-Plugin Middleware

Override global middleware for a specific plugin by adding a `middleware` array to its service config:

```javascript
services: {
  kuler: {
    baseUrl: '...',
    apiKey: '...',
    middleware: ['error', 'logging', 'auth'],
  },
  stock: {
    baseUrl: '...',
    // No middleware key = uses global config.middleware
  },
}
```

### Conditional Middleware

See [MIDDLEWARES.md](./MIDDLEWARES.md) for topic filtering, `when()` API, and conditional middleware examples.

### Global Middleware Order

Order matters: middleware executes in array order with the first entry wrapping outermost; place `error` first to catch all inner errors.

### Stage vs Production

Stage configuration overrides specific service URLs for testing:

| Service | Property | Stage URL |
|---------|----------|-----------|
| kuler | `baseUrl` | `https://search-stage.adobe.io/api/v2` |
| kuler | `endpoints.themeBaseUrl` | `https://themes-stage.adobe.io` |
| behance | `baseUrl` | `https://cc-api-behance-stage.adobe.io/v2` |

### Adding New Service Configuration

1. Add the service entry to `PROD_CONFIG.services`:

```javascript
myService: {
  baseUrl: 'https://api.myservice.com',
  apiKey: 'MyServiceApiKey',
  endpoints: { data: '/data' },
},
```

2. Add feature flag: `ENABLE_MYSERVICE: true` in `config.features`.
3. If stage URLs differ, add overrides to `STAGE_CONFIG.services`.
