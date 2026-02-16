## Configuration

The service layer uses a centralized configuration in `services/config.js`.

### On-Demand Plugin Loading (Recommended)

Plugins are loaded **on demand** when first requested. No `init()` call is required:

```javascript
import { serviceManager } from './services/index.js';

// Plugin is lazy-loaded automatically
const kuler = await serviceManager.getProvider('kuler');
const plugin = await serviceManager.loadPlugin('behance');
```

### Batch Preloading (Optional)

Use `init()` to preload multiple plugins at once. Calls are **additive** — each
call loads new plugins without discarding existing ones:

```javascript
import { serviceManager, initApiService } from './services/index.js';

// Preload specific plugins
await serviceManager.init({ plugins: ['kuler', 'curated'] });

// Later, another block adds more (kuler stays loaded)
await serviceManager.init({ plugins: ['cclibrary'] });

// Override feature flags
await serviceManager.init({ 
  features: { ENABLE_KULER: true, ENABLE_STOCK: false } 
});

// Using initApiService helper
await initApiService({ plugins: ['kuler', 'curated'] });
```

| Option | Type | Description |
|--------|------|-------------|
| `plugins` | `string[]` | Plugin names to load (merged additively across calls) |
| `features` | `object` | Feature flag overrides merged with `config.features` |

**Note:** When `plugins` array is provided, it takes precedence over feature flags — only the listed plugins will load via `init()`. However, `getProvider()` and `loadPlugin()` can still lazy-load any plugin regardless of the whitelist.

### Environment Detection

Environments are detected from `window.location.hostname`:
- `localhost` / `127.0.0.1` → `development` (uses stage config)
- `*stage*` / `*staging*` → `stage` (uses stage config)
- Everything else → `production`

```javascript
// Access current environment
import config from './services/config.js';
console.log(config.environment); // 'production' | 'stage' | 'development'
```

### Feature Flags

Feature flags control plugin and middleware activation:

```javascript
features: {
  ENABLE_KULER: true,      // Plugin flag
  ENABLE_STOCK: true,      // Plugin flag
  ENABLE_LOGGING: true,    // Middleware flag
  ENABLE_ERROR: true,      // Middleware flag
  ENABLE_AUTH: true,       // Middleware flag
}
```

**Naming Convention**: `ENABLE_{NAME}` where `{NAME}` is the uppercase plugin or middleware name.

Flags default to `false` if not explicitly set to `true`. This means plugins only load when explicitly enabled.

### Service Configuration

Each service entry contains:

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

Plugins access these via inherited getters from `BasePlugin`:
- `this.baseUrl` - Base URL for API calls
- `this.apiKey` - API key for authentication
- `this.endpoints` - Endpoint paths object

### Per-Plugin Middleware

Override global middleware for specific plugins by adding a `middleware` array to the service config:

```javascript
services: {
  kuler: {
    baseUrl: '...',
    apiKey: '...',
    middleware: ['error', 'logging', 'auth'], // Custom chain for this plugin
  },
  stock: {
    baseUrl: '...',
    // No middleware key = uses global config.middleware
  },
}
```

If no `middleware` array is specified, the global `config.middleware` is used.

### Conditional Middleware (Topic Filtering)

Middleware entries can be strings (apply to all topics) or objects with topic filters:

```javascript
services: {
  kuler: {
    baseUrl: '...',
    apiKey: '...',
    middleware: [
      'error',                                    // All topics
      'logging',                                  // All topics
      { name: 'auth', topics: ['theme.*', 'gradient.*', 'like.*'] },  // Only matching topics
    ],
  },
}
```

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Middleware identifier (required) |
| `topics` | `string[]` | Whitelist — middleware runs only for matching topics |
| `excludeTopics` | `string[]` | Blacklist — middleware runs for all topics except matching |

Topic patterns support exact matches (`'theme.save'`) and wildcard suffixes (`'theme.*'`).

See [MIDDLEWARES.md](./MIDDLEWARES.md) for detailed examples and the `when()` programmatic API.

### Global Middleware Order

```javascript
middleware: ['error', 'logging'],
```

Order matters: middleware executes in array order, with the first middleware wrapping outermost. Error middleware should typically be first to catch all errors from inner middleware and handlers.

### Stage vs Production

Stage configuration overrides specific service URLs for testing:

```javascript
// Stage overrides
kuler.baseUrl: 'https://search-stage.adobe.io/api/v2'
kuler.endpoints.themeBaseUrl: 'https://themes-stage.adobe.io'
behance.baseUrl: 'https://cc-api-behance-stage.adobe.io/v2'
```

### Adding New Service Configuration

1. Add the service entry to `PROD_CONFIG.services`:

```javascript
myService: {
  baseUrl: 'https://api.myservice.com',
  apiKey: 'MyServiceApiKey',
  endpoints: {
    data: '/data',
  },
},
```

2. Add feature flag to `config.features`:

```javascript
features: {
  ENABLE_MYSERVICE: true,
}
```

3. If stage URLs differ, add overrides to `STAGE_CONFIG.services`.

