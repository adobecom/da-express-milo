# Agent Guide: Plugin Generation

> **Context directive:** This file is auto-injected. Keep reads minimal — only open linked files if the current task requires that specific knowledge.

## Architecture Summary

Event-driven plugin system. Plugins extend `BasePlugin` (logic) or `BaseApiService` (HTTP). Actions are operations triggered by Topics. Action Groups organize related actions.

Reference docs (read only when needed):
- [ARCHITECTURE.md](./ARCHITECTURE.md) — layers, file structure, available services
- [CONFIG.md](./CONFIG.md) — feature flags, service config, environments
- [PLUGINS.md](./PLUGINS.md) — BasePlugin/BaseApiService API, ServiceManager lifecycle
- [EXAMPLES.md](./EXAMPLES.md) — full code templates for every step below

## Plugin Generation Steps

1. **Define Topics** — Create `plugins/{name}/topics.js` with topic constants and action group identifiers. See [TOPICS.md](./TOPICS.md).
2. **Configure Service** (if API) — Add `baseUrl`, `apiKey`, `endpoints` to `config.js` services object. Add `ENABLE_{NAME}: true` to features. See [CONFIG.md](./CONFIG.md).
3. **Create Plugin Class** — Extend `BaseApiService` (API) or `BasePlugin` (logic-only). For < 5 operations, use simple plugin. For more, use action groups in a single file (`actions/{Name}Actions.js`, named exports). See [EXAMPLES.md](./EXAMPLES.md).
4. **Add Manifest** — Create `plugins/{name}/index.js` exporting `{ name, featureFlag, loader, providerLoader? }`.
5. **Create Provider** (optional) — Extend `BaseProvider`, use `useAction` pattern to cache action refs in constructor. See [PROVIDERS.md](./PROVIDERS.md).
6. **Create Plugin README** — Document config, topics, and usage examples. See template in [EXAMPLES.md](./EXAMPLES.md).

## Validation Checklist

- [ ] Plugin extends `BaseApiService` or `BasePlugin`
- [ ] Constructor accepts `{ serviceConfig, appConfig }`, calls `super()`
- [ ] `isActivated()` checks feature flag from `appConfig`
- [ ] Action groups extend `BaseActionGroup`, implement `getHandlers()`, single file as named exports
- [ ] `registerActionGroup` receives an instance (`new ActionGroup(this)`), not a class
- [ ] Topics defined in `plugins/{name}/topics.js`
- [ ] Service config + feature flag in `config.js`
- [ ] Manifest in `plugins/{name}/index.js`
- [ ] Provider uses `useAction` with cached actions in constructor
- [ ] Action methods use `ValidationError` for input validation
- [ ] Plugin README.md created
- [ ] `CHECKLIST.md` updated when any test is added, modified, or removed

## Quick Reference

### `dispatch` vs `useAction`

| Use Case | Use | Why |
|----------|-----|-----|
| Provider methods | `useAction` | Cache once, reuse |
| Action handlers | `dispatch` | Direct plugin access |
| Dynamic/one-time calls | `dispatch` | Topic varies at runtime |
| Passing to components | `useAction` | Clean function ref |

### URL Building

- Relative: `this.get(\`${this.endpoints.data}/${id}\`)`
- Absolute: `this.fetchWithFullUrl(fullUrl)`

### Error Types

| Type | When |
|------|------|
| `ValidationError` | Input validation in actions |
| `ApiError` | HTTP failures (auto from `handleResponse`) |
| `AuthenticationError` | Auth required (auto from auth middleware) |
| `NotFoundError` | Missing handler |
| `ConfigError` | Configuration/bootstrap failures |
| `StorageFullError` | Storage quota exceeded (507, extends `ApiError`) |
| `PluginRegistrationError` | Duplicate plugin registration |
| `ProviderRegistrationError` | Duplicate provider registration |
| `ServiceError` | Generic failures |

See [ERRORS.md](./ERRORS.md) for full list. See [MIDDLEWARES.md](./MIDDLEWARES.md) for middleware patterns.

### JSDoc Conventions

- Only add JSDoc type definitions at function-level comments
- Use `@typedef` for object types
- No text descriptions on `@param` / `@returns` tags

```javascript
/**
 * @typedef {Object} GetDataOptions
 * @property {number} limit
 * @property {string} sort
 */

/** @param {string} id  @param {GetDataOptions} options  @returns {Promise<Object>} */
```

### Plugin Patterns

| Pattern | When | Dispatch |
|---------|------|----------|
| **A — Action Groups** | Many operations, distinct areas | Topic-based via `BaseActionGroup` |
| **B — Direct Handlers** | < 5 operations with topic routing | Topic-based via `registerHandlers` |
| **C — Direct Methods** | Simple API wrappers, no dispatch | Methods called directly on plugin |

For Pattern C: skip topics and action groups — expose methods directly on the plugin class.

### Testing Philosophy

- New functionality must have dedicated tests
- Tests validate functionality, not mocks — stubs set up the environment, assertions verify real logic
