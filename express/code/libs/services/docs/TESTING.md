## Testing

Guidelines for testing service layer components.

**Stack:** Web Test Runner + Mocha (`describe`/`it`) + Chai (`expect`) + Sinon (`stub`/`spy`)

**Framework Approach:** This document provides a **testing framework** with core patterns that apply across all plugins, providers, and action groups. Adapt these patterns to your specific plugin's functionality. The examples use generic placeholders — replace them with your actual method names, data structures, and validation logic.

### Plugin Architecture Overview

The service layer has three distinct plugin patterns. Each guide below notes which patterns it applies to.

| Pattern | Base Class | Dispatch | Plugins | Has Provider |
|---------|-----------|----------|---------|--------------|
| **A — Action Groups** | `BaseApiService` | Topic-based via `BaseActionGroup` | kuler, stock | Yes |
| **B — Direct Handlers** | `BaseApiService` | Topic-based via `registerHandlers` | curated | No |
| **C — Direct Methods** | `BaseApiService` | No dispatch; methods called directly | behance, cclibrary, reportAbuse, universal, userFeedback, userSettings | No |

- **Providers** exist only for Pattern A plugins (kuler, stock).
- **Action Groups** (`getHandlers()`) exist only for Pattern A plugins.
- **Feature Flag Gating** (`isActivated`) applies to all plugins.

---

### Test File Structure

Tests live under `test/services/` and mirror the plugin directory tree. Each plugin gets its own folder, with `actions/` and `providers/` subdirectories as needed.

```
test/services/
  stock/
    StockPlugin.test.js
    actions/
      StockActions.test.js
    providers/
      StockProvider.test.js
  kuler/
    KulerPlugin.test.js
    actions/
      GradientActions.test.js
      LikeActions.test.js
      SearchActions.test.js
      ThemeActions.test.js
    providers/
      KulerProvider.test.js
  curated/
    CuratedPlugin.test.js
  behance/
    BehancePlugin.test.js
  cclibrary/
    CCLibraryPlugin.test.js
  reportAbuse/
    ReportAbusePlugin.test.js
  universal/
    UniversalSearchPlugin.test.js
  userFeedback/
    UserFeedbackPlugin.test.js
  userSettings/
    UserSettingsPlugin.test.js
```

**Naming conventions:**
- Plugin tests: `{PluginName}.test.js` directly inside `test/services/{plugin}/`
- Action group tests: `{ActionGroupName}.test.js` inside `test/services/{plugin}/actions/`
- Provider tests: `{ProviderName}.test.js` inside `test/services/{plugin}/providers/`

> **Note:** Even though providers live in `services/providers/` in source, their tests are co-located under the plugin they serve (`test/services/{plugin}/providers/`). This groups all related tests for a plugin in one place.

---

### Which Guides to Read

Read the plugin source, then match what you see:

| If you see... | Read |
|---------------|------|
| Plugin has action groups (`registerActionGroup`, `getActionGroupNames`) | [Test Action Groups](./testing/test-action-groups.md) |
| Plugin has a provider class (`extends BaseProvider`, `safeExecute`) | [Test Providers](./testing/test-providers.md) |
| Plugin calls `this.get()` / `this.post()` directly (no dispatch) | [Test Plugins → Direct-Method Plugins](./testing/test-plugins.md#testing-direct-method-plugins) |
| Plugin uses `registerHandlers` with topic map | [Test Plugins](./testing/test-plugins.md) |
| **Always** | [Test Plugins](./testing/test-plugins.md) (feature flags, handler reg), [Test Helpers](./testing/test-helpers.md) (utilities, mocking, Sinon+Chai ref) |
