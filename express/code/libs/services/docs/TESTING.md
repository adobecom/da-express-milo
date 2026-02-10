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

### Testing Guides

| Guide | Applies To | Description |
|-------|-----------|-------------|
| [Test Providers](./testing/test-providers.md) | Pattern A (kuler, stock) | Delegation wiring, `safeExecute` error boundary, factory functions |
| [Test Action Groups](./testing/test-action-groups.md) | Pattern A (kuler, stock) | Structural correctness, validation, data transformation, defensive handling |
| [Test Plugins](./testing/test-plugins.md) | All patterns | Feature flag gating, handler registration, direct-method HTTP testing, middleware |
| [Test Helpers](./testing/test-helpers.md) | All patterns | `ServiceManager` utilities, `createTestPlugin`, `expectValidationError`, mocking, Sinon+Chai reference |
