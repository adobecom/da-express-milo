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
| **C — Direct Methods** | `BaseApiService` | No dispatch; methods called directly | behance, reportAbuse, universal, userFeedback, userSettings | No |

- **Providers** exist only for Pattern A plugins (kuler, stock).
- **Action Groups** (`getHandlers()`) exist only for Pattern A plugins.
- **Feature Flag Gating** (`isActivated`) applies to all plugins.

---

### Test File Structure

Tests live under **`test/services/`** (relative to the repo root) and mirror the plugin directory tree under `express/code/libs/services/plugins/`. Each plugin gets its own folder, with `actions/` and `providers/` subdirectories as needed.

```
test/services/
  {pluginName}/
    CHECKLIST.md
    {PluginName}Plugin.test.js
    actions/                              ← Pattern A only
      {ActionGroupName}Actions.test.js
    providers/                            ← Pattern A only
      {ProviderName}Provider.test.js
```

**Naming conventions:**
- Plugin tests: `{PluginName}.test.js` directly inside `test/services/{plugin}/`
- Action group tests: `{ActionGroupName}.test.js` inside `test/services/{plugin}/actions/`
- Provider tests: `{ProviderName}.test.js` inside `test/services/{plugin}/providers/`
- Coverage checklist: `CHECKLIST.md` inside `test/services/{plugin}/`

> **Note:** Even though providers live in `express/code/libs/services/providers/` in source, their tests are co-located under the plugin they serve (`test/services/{plugin}/providers/`). This groups all related tests for a plugin in one place.

---

### Which Guides to Read

Read the plugin source, then match what you see:

| If you see... | Read |
|---------------|------|
| Plugin has action groups (`registerActionGroup`, `getActionGroupNames`) | [Test Action Groups](./testing/test-action-groups.md) |
| Plugin has a provider class (`extends BaseProvider`, `safeExecute`) | [Test Providers](./testing/test-providers.md) |
| Plugin calls `this.get()` / `this.post()` directly (no dispatch) | [Test Plugins → Direct-Method Plugins](./testing/test-plugins.md#testing-direct-method-plugins) |
| Plugin uses `registerHandlers` with topic map | [Test Plugins](./testing/test-plugins.md) |
| Plugin/middleware behavior depends on dispatch pipeline | [Test Plugins → Testing Middleware](./testing/test-plugins.md#testing-middleware) |
| Updating core/framework lifecycle tests (`serviceManager` init/reset/registration) | [Test Helpers](./testing/test-helpers.md#servicemanager-test-utilities) |
| **Always** | [Test Plugins](./testing/test-plugins.md) (feature flags, handler reg, direct-method error paths), [Test Helpers](./testing/test-helpers.md) (utilities, mocking, Sinon+Chai ref) |

---

### Test Coverage Checklist (`CHECKLIST.md`)

Every plugin must maintain a `CHECKLIST.md` file inside its test directory (`test/services/{plugin}/CHECKLIST.md`). This file is a comprehensive record of all test cases covered for plugin-owned surfaces (plugin, action groups/providers when applicable, and middleware).

**Checklist scope should include (as applicable to the plugin pattern):**

- Plugin feature flags and handler registration robustness (expected topics, no extras, callable handlers)
- Direct-method resilience for Pattern C plugins (auth edge cases, malformed payload handling, response error paths, observability/logging checks)
- Middleware behavior (next flow, context propagation, error propagation/transform behavior)
- Plugin-owned behavior only; do not duplicate core ServiceManager lifecycle assertions

**Rule:** Whenever tests associated with a plugin are added, modified, or removed, the corresponding `CHECKLIST.md` **must** be updated in the same commit. This includes:

- Adding new `[x]` entries when new test cases are written
- Changing `[x]` to `[ ]` if test cases are removed or disabled
- Adding new method rows to tables when new action/provider methods are created
- Updating the **Coverage Gaps** section to reflect current known gaps
- Updating the **Last Updated** date

> See [Test Checklist](./testing/test-checklist.md) for the full template, section breakdown, and usage guidance.
>
> Core lifecycle behavior (`ServiceManager` reset/init/registration) is covered by core framework tests and should not be tracked in plugin-level `CHECKLIST.md` files.
