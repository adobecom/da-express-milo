# Service Layer Architecture

> Comprehensive guide to the color-explorer service layer architecture.

## Quick Start

Plugins and providers are loaded on demand — just ask for what you need:

```javascript
import { serviceManager } from './services/index.js';
const kulerProvider = await serviceManager.getProvider('kuler');
const themes = await kulerProvider.searchThemes('sunset', { page: 1 });
```

For batch preloading multiple plugins at once, use `serviceManager.init()` — see [CONFIG.md](./CONFIG.md).

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

Standalone providers are registered directly (no backing plugin) for cross-cutting concerns.

| Provider | Description |
|----------|-------------|
| authState | Authentication state observation & subscribe API (bridges IMS events) |

```javascript
const auth = await serviceManager.getProvider('authState');
auth.isLoggedIn;                          // current status
auth.subscribe(({ isLoggedIn }) => {});   // react to changes
```

---

## Architecture Overview

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
│   - Runtime env resolved from Milo getConfig()                   │
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

## Using Plugins Directly

Use `loadPlugin()` for async on-demand loading. Use `getPlugin()` for synchronous access to an already-loaded instance (returns `undefined` if not yet loaded).

## Using Topics

Topics allow direct `plugin.dispatch(topic, args)` access to plugin actions. See [TOPICS.md](./TOPICS.md) for definitions and namespacing.

## Creating New Plugins

See [AGENTS.md](./AGENTS.md) for plugin generation steps.

## Creating New Providers

See [AGENTS.md](./AGENTS.md) and [PROVIDERS.md](./PROVIDERS.md) for the `useAction` pattern.

## Creating New Middleware

See [MIDDLEWARES.md](./MIDDLEWARES.md) for middleware signatures, context builders, and conditional topic scoping.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Plugin not loading | Verify feature flag in `config.js`, manifest in `plugins/{name}/index.js`, and check console for import errors. |
| Provider returns null | Plugin may have failed to load, `isActivated()` returned false, or manifest is missing `providerLoader`. |
| Middleware not running | Ensure it's listed in `config.middleware` array with correct function signature and feature flag enabled. |
| Error handling | All errors extend `ServiceError` with `code`, `serviceName`, `topic`, and `timestamp` — see [ERRORS.md](./ERRORS.md). |

---

**Document Version:** 3.0  
**Last Updated:** February 2026
