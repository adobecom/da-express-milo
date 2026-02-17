# Service Layer Architecture

> Comprehensive guide to the color-explorer service layer architecture.

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Architecture Overview](#2-architecture-overview)
3. [Using Providers](#3-using-providers)
4. [Using Plugins Directly](#4-using-plugins-directly)
5. [Using Topics for Custom Access](#5-using-topics-for-custom-access)
6. [Creating New Plugins](#6-creating-new-plugins)
7. [Creating New Providers](#7-creating-new-providers)
8. [Creating New Middleware](#8-creating-new-middleware)
9. [Troubleshooting](#9-troubleshooting)

For quick reference guides on specific topics, see:
- [PLUGINS.md](./PLUGINS.md) - Plugin architecture details
- [PROVIDERS.md](./PROVIDERS.md) - Provider patterns and transforms
- [ACTIONS.md](./ACTIONS.md) - Action groups and handlers
- [TOPICS.md](./TOPICS.md) - Topic definitions and dispatch
- [MIDDLEWARES.md](./MIDDLEWARES.md) - Middleware chain and context
- [ERRORS.md](./ERRORS.md) - Error types and handling
- [CONFIG.md](./CONFIG.md) - Configuration and feature flags
- [TESTING.md](./TESTING.md) - Testing patterns and utilities

---

## 1. Quick Start

### Basic Usage (On-Demand Loading)

Plugins and providers are loaded **on demand** — just ask for what you need:

```javascript
import { serviceManager } from './services/index.js';

// Get a provider — plugin is lazy-loaded automatically
const kulerProvider = await serviceManager.getProvider('kuler');
const themes = await kulerProvider.searchThemes('sunset', { page: 1 });

// Or load a plugin directly on demand
const kulerPlugin = await serviceManager.loadPlugin('kuler');
```

No `init()` call required. Each block independently requests its plugins/providers
and the ServiceManager handles loading, middleware application, and deduplication.

### Batch Preloading (Optional)

Use `init()` when you want to preload multiple plugins at once. Calls are **additive** —
subsequent calls load new plugins without discarding existing ones:

```javascript
// Preload specific plugins
await serviceManager.init({ plugins: ['kuler', 'curated'] });

// Later, another block adds more plugins (kuler stays loaded)
await serviceManager.init({ plugins: ['cclibrary'] });

// Override feature flags
await serviceManager.init({ features: { ENABLE_KULER: true, ENABLE_STOCK: false } });
```

See [CONFIG.md](./CONFIG.md) for more details on runtime configuration.

### Available Services

| Service | Has Provider? | Description |
|---------|-------------|-------------|
| kuler | ✅ Yes | Adobe Color themes and gradients |
| stock | ✅ Yes | Adobe Stock images |
| behance | ❌ No | Behance projects |
| cclibrary | ❌ No | Creative Cloud Libraries |
| curated | ❌ No | Curated color data |
| reportAbuse | ❌ No | Report abusive content |
| universal | ❌ No | Universal search (image-based) |
| userFeedback | ❌ No | User feedback submission |
| userSettings | ❌ No | User settings management |

### Standalone Providers

Standalone providers are registered directly (no backing plugin).
They serve cross-cutting concerns that don't need topics, dispatch, or middleware.

| Provider | Description |
|----------|-------------|
| authState | Authentication state observation & subscribe API (bridges IMS events) |

```javascript
const auth = await serviceManager.getProvider('authState');
auth.isLoggedIn;                          // current status
auth.subscribe(({ isLoggedIn }) => {});   // react to changes
```

See [PROVIDERS.md](./PROVIDERS.md) for the standalone provider pattern.

---

## 2. Architecture Overview

The service layer uses a 5-layer architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│ Application (ColorDataService, Renderers)                        │
├──────────────────────────────┬──────────────────────────────────┤
│ Plugin-backed Providers      │ Standalone Providers              │
│ (KulerProvider, StockProvider)│ (AuthStateProvider)               │
│   - Clean consumer-facing API│   - No backing plugin             │
│   - Error handling           │   - Subscribe/getState API        │
├──────────────────────────────┴──────────────────────────────────┤
│ Plugin Layer (KulerPlugin, StockPlugin, etc.)                    │
│   - Action groups for organized operations                       │
│   - Topic-based dispatch                                         │
├─────────────────────────────────────────────────────────────────┤
│ Middleware Layer                                                 │
│   - Error handling, logging, auth                                │
├─────────────────────────────────────────────────────────────────┤
│ Core Layer                                                       │
│   - BasePlugin, BaseApiService (HTTP + auth), BaseActionGroup    │
│   - ServiceManager, errors                                       │
├─────────────────────────────────────────────────────────────────┤
│ Configuration (config.js)                                        │
│   - Service URLs, API keys, feature flags                        │
└─────────────────────────────────────────────────────────────────┘
```

### File Structure

```
services/
├── createColorDataService.js     # High-level data service
├── index.js                      # Public API entry point
├── config.js                     # Single configuration file
├── core/
│   ├── BasePlugin.js             # Base class for all plugins
│   ├── BaseApiService.js         # Base class for API plugins
│   ├── BaseActionGroup.js        # Base class for action groups
│   ├── ServiceManager.js         # Plugin initialization & management
│   └── Errors.js                 # Custom error definitions
├── providers/
│   ├── BaseProvider.js           # Base provider class
│   ├── AuthStateProvider.js      # Standalone auth state provider
│   ├── KulerProvider.js          # Kuler provider
│   ├── StockProvider.js          # Stock provider
│   └── index.js                  # Provider exports
├── middlewares/
│   ├── error.middleware.js       # Global error handling
│   ├── logging.middleware.js     # Request/response logging
│   ├── auth.middleware.js        # Authentication check
│   ├── guard.js                  # guardMiddleware() and matchTopic() utilities
│   └── index.js                  # Middleware exports
├── plugins/
│   ├── kuler/                    # Kuler plugin
│   │   ├── KulerPlugin.js
│   │   ├── topics.js
│   │   └── actions/              # Single file per plugin
│   ├── stock/                    # Stock plugin
│   │   ├── StockPlugin.js
│   │   ├── topics.js
│   │   └── actions/
│   │       └── StockActions.js   # All action groups in one file
│   ├── behance/                  # Behance plugin
│   └── ...                       # Other plugins
└── docs/
    ├── README.md                 # Documentation index
    ├── ARCHITECTURE.md           # This file
    ├── AGENTS.md                 # Agent generation guide
    └── ...                       # Topic-specific docs
```

---

## 3. Using Providers

Providers provide the cleanest API for consumers. They handle error cases gracefully and return `null` on failures.

> For detailed provider patterns, see [PROVIDERS.md](./PROVIDERS.md).

### Kuler Provider

```javascript
const kuler = await serviceManager.getProvider('kuler');

// Search themes
const themes = await kuler.searchThemes('ocean', {
  typeOfQuery: 'term',  // 'term' | 'tag' | 'hex' | 'similarHex'
  page: 1,
});

// Search gradients
const gradients = await kuler.searchGradients('sunset');

// Get specific theme
const theme = await kuler.getTheme('theme-id');

// Save/delete themes
await kuler.saveTheme(themeData, ccLibrariesResponse);
await kuler.deleteTheme({ id: 'theme-id', name: 'Theme Name' });

// Like/unlike
await kuler.updateLike({ id: 'theme-id', like: { user: null }, source: 'KULER' });
```

### Stock Provider

```javascript
const stock = await serviceManager.getProvider('stock');

// Search images
const images = await stock.searchThemes('nature', { page: 1 });

// Get curated galleries
const galleries = await stock.getCuratedGalleries();

// Get specific gallery
const gallery = await stock.getGalleryByName('Wilderness');
```

---

## 4. Using Plugins Directly

For services without providers or when you need more control:

> For detailed plugin patterns, see [PLUGINS.md](./PLUGINS.md).

```javascript
// loadPlugin() lazy-loads the plugin on demand
const behancePlugin = await serviceManager.loadPlugin('behance');

// Direct method call
const projects = await behancePlugin.searchProjects({
  query: 'color',
  sort: 'featured_date',
  page: 1,
});

// getPlugin() returns the cached instance (synchronous, undefined if not loaded)
const cached = serviceManager.getPlugin('behance');
```

---

## 5. Using Topics for Custom Access

Topics allow direct access to plugin actions via dispatch:

> For topic definitions and namespacing, see [TOPICS.md](./TOPICS.md).

```javascript
import { KulerTopics } from './services/plugins/kuler/topics.js';

const kulerPlugin = serviceManager.getPlugin('kuler');

// Dispatch an action
const result = await kulerPlugin.dispatch(
  KulerTopics.SEARCH.THEMES,
  { main: 'sunset', typeOfQuery: 'term', pageNumber: 1 }
);
```

---

## 6. Creating New Plugins

For comprehensive plugin generation instructions, see [AGENTS.md](./AGENTS.md).

New plugins require:
1. **Topics file** - Define action topics and groups in `plugins/{name}/topics.js`
2. **Plugin class** - Extend `BaseApiService` (for HTTP) or `BasePlugin` (for logic)
3. **Configuration** - Add service config and feature flag in `config.js`
4. **Manifest** - Add `plugins/{name}/index.js` with the plugin manifest

See [AGENTS.md](./AGENTS.md) for step-by-step instructions, code templates, and validation checklist.

---

## 7. Creating New Providers

> For the `useAction` pattern and provider best practices, see [PROVIDERS.md](./PROVIDERS.md).

```javascript
// providers/MyPluginProvider.js
import BaseProvider from './BaseProvider.js';
import { MyPluginTopics, MyPluginActionGroups } from '../plugins/myPlugin/topics.js';

export default class MyPluginProvider extends BaseProvider {
  #actions = {};

  constructor(plugin) {
    super(plugin);
    this.#initActions();
  }

  #initActions() {
    this.#actions = {
      fetchData: this.plugin.useAction(
        MyPluginActionGroups.DATA,
        MyPluginTopics.DATA.FETCH
      ),
    };
  }

  async fetchData(params) {
    return this.safeExecute(() => this.#actions.fetchData(params));
  }
}
```

---

## 8. Creating New Middleware

> For middleware patterns and context builders, see [MIDDLEWARES.md](./MIDDLEWARES.md).

```javascript
// middlewares/custom.middleware.js
export default async function customMiddleware(topic, args, next, context = {}) {
  // Pre-processing
  console.log('Before:', topic, context);

  const result = await next();

  // Post-processing
  console.log('After:', topic, context);

  return result;
}

// Optional: provide middleware-specific context
customMiddleware.buildContext = ({ serviceName, topic }) => ({
  serviceName,
  topic,
});
```

Add to global middleware in `config.js`:

```javascript
middleware: ['error', 'logging', 'custom'],
```

### Conditional Middleware

Middleware can be scoped to specific topics using the object config form.
This is useful when a plugin has both public and authenticated operations:

```javascript
// Only require auth for write operations in the kuler plugin
services: {
  kuler: {
    middleware: [
      'error',
      'logging',
      { name: 'auth', topics: ['theme.save', 'theme.delete', 'gradient.*', 'like.*'] },
    ],
  },
}
```

For programmatic composition, use `guardMiddleware()`:

```javascript
import { guardMiddleware, matchTopic } from './middlewares/guard.js';

const guardedAuth = guardMiddleware(
  (topic) => ['theme.*'].some((p) => matchTopic(p, topic)),
  authMiddleware,
);
plugin.use(guardedAuth);
```

See [MIDDLEWARES.md](./MIDDLEWARES.md) for full documentation on topic patterns and filtering.

---

## 9. Troubleshooting

> For testing utilities and mocking patterns, see [TESTING.md](./TESTING.md).

### Plugin not loading

1. Check feature flag is enabled in `config.js`
2. Verify plugin manifest exists in `plugins/{name}/index.js`
3. Check browser console for import errors
4. If using `init()` with a `plugins` whitelist, ensure the plugin name is included

### Provider returns null

1. Plugin may have failed to load — check browser console for errors
2. Plugin's `isActivated()` may have returned `false`
3. Verify service configuration in `config.js`
4. Verify the manifest has a `providerLoader` defined

### Middleware not running

1. Verify middleware is in `config.middleware` array
2. Check middleware feature flag is enabled
3. Ensure middleware function signature is correct

### Error handling

> For error types and handling patterns, see [ERRORS.md](./ERRORS.md).

All service layer errors extend `ServiceError` and include:
- `code` - Error code for categorization
- `serviceName` - Service where error occurred
- `topic` - Action topic that caused error
- `timestamp` - ISO timestamp

---

**Document Version:** 3.0  
**Last Updated:** February 2026
