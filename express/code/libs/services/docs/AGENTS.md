# Agent Guide: Generating Color Explorer Plugins

This guide provides instructions for AI agents (and developers) on how to generate new plugins for the Color Explorer Service Layer.

## 1. Context

The Service Layer is a modular, event-driven architecture where "Plugins" handle specific domains (e.g., Kuler, Stock, UserFeedback).
- **Plugins** extend `BasePlugin` (for logic) or `BaseApiService` (for HTTP).
- **Actions** are discrete operations (e.g., "getTheme") triggered by **Topics**.
- **Action Groups** organize related actions into separate files.

## 2. Generation Workflow

Follow these steps to create a new plugin.

### Step 0: Research & Prerequisites
Before generating any code, consult the following documentation to understand the existing patterns and configurations:

1.  **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Comprehensive guide to the service layer architecture, providers, and plugin creation.
2.  **[CONFIG.md](./CONFIG.md)**: Configuration and feature flag documentation.
3.  **[PLUGINS.md](./PLUGINS.md)**: Plugin architecture details.

**Action**: Read these files to verify if your proposed plugin duplicates existing functionality and to align with the established architectural patterns.

### Step 1: Define Topics
Create a new topics file in `plugins/{pluginName}/topics.js`.

```javascript
// Example: plugins/library/topics.js
export const LibraryTopics = {
  GET_ASSET: 'library.getAsset',
  CREATE_ASSET: 'library.createAsset',
};

export const LibraryActionGroups = {
  ASSETS: 'assets',
};
```

See [TOPICS.md](./TOPICS.md) for topic naming conventions.

### Step 2: Configure Service (If API)
Update `config.js` with the service configuration.

```javascript
// In services object
library: {
  baseUrl: 'https://api.library.adobe.io/v1',
  apiKey: 'YourApiKey',
  endpoints: {
    assets: '/assets',
  },
},

// In features object
features: {
  ENABLE_LIBRARY: true,
}
```

See [CONFIG.md](./CONFIG.md) for configuration details.

### Step 3: Generate Plugin Files
Create the plugin directory: `plugins/{pluginName}/`.

#### A. Simple Plugin (No Action Groups)
Use this if the plugin has < 5 operations.

**File:** `plugins/{pluginName}/{PluginName}Plugin.js`

```javascript
import BaseApiService from '../../core/BaseApiService.js';
import { LibraryTopics } from './topics.js';

export default class LibraryPlugin extends BaseApiService {
  static get serviceName() { return 'LibraryPlugin'; }

  constructor({ serviceConfig = {}, appConfig = {} } = {}) {
    super({ serviceConfig, appConfig });
    this.registerHandlers({
      [LibraryTopics.GET_ASSET]: this.getAsset.bind(this),
    });
  }

  isActivated(appConfigParam) {
    return appConfigParam?.features?.ENABLE_LIBRARY !== false;
  }

  async getAsset(id) {
    return this.get(`${this.endpoints.assets}/${id}`);
  }
}
```

#### B. Complex Plugin (With Action Groups)
Use this if the plugin has many operations or distinct functional areas.

> **Single-file convention:** All action group classes for a plugin live in a
> single file — `plugins/{pluginName}/actions/{PluginName}Actions.js`. This
> avoids request waterfalls that occur when the browser must fetch multiple
> small modules in sequence. Each class is a **named export**.

**File:** `plugins/{pluginName}/actions/{PluginName}Actions.js`

```javascript
import BaseActionGroup from '../../../core/BaseActionGroup.js';
import { ValidationError } from '../../../core/Errors.js';
import { LibraryTopics } from '../topics.js';

export class AssetActions extends BaseActionGroup {
  getHandlers() {
    return {
      [LibraryTopics.GET_ASSET]: this.getAsset.bind(this),
      [LibraryTopics.CREATE_ASSET]: this.createAsset.bind(this),
    };
  }

  async getAsset(id) {
    if (!id) {
      throw new ValidationError('Asset ID is required', {
        field: 'id',
        serviceName: 'Library',
        topic: 'GET_ASSET',
      });
    }
    return this.plugin.get(`${this.plugin.endpoints.assets}/${id}`);
  }

  async createAsset(data) {
    if (!data?.name) {
      throw new ValidationError('Asset name is required', {
        field: 'data.name',
        serviceName: 'Library',
        topic: 'CREATE_ASSET',
      });
    }
    return this.plugin.post(this.plugin.endpoints.assets, data);
  }
}

export class SearchActions extends BaseActionGroup {
  getHandlers() {
    return {
      [LibraryTopics.SEARCH_ASSETS]: this.searchAssets.bind(this),
    };
  }

  async searchAssets(criteria) {
    return this.plugin.get(this.plugin.endpoints.search, { params: criteria });
  }
}
```

See [ACTIONS.md](./ACTIONS.md) for action group patterns.

**File:** `plugins/{pluginName}/{PluginName}Plugin.js`

```javascript
import BaseApiService from '../../core/BaseApiService.js';
import { AssetActions, SearchActions } from './actions/LibraryActions.js';
import { LibraryActionGroups } from './topics.js';

export default class LibraryPlugin extends BaseApiService {
  static get serviceName() { return 'LibraryPlugin'; }

  constructor({ serviceConfig = {}, appConfig = {} } = {}) {
    super({ serviceConfig, appConfig });
    this.registerActionGroups();
  }

  isActivated(appConfigParam) {
    return appConfigParam?.features?.ENABLE_LIBRARY !== false;
  }

  registerActionGroups() {
    this.registerActionGroup(LibraryActionGroups.ASSETS, new AssetActions(this));
    this.registerActionGroup(LibraryActionGroups.SEARCH, new SearchActions(this));
  }
}
```

### Step 4: Add Plugin Manifest
Create `plugins/{name}/index.js` with the manifest signature.

```javascript
export default {
  name: 'library',
  featureFlag: 'ENABLE_LIBRARY',
  loader: () => import('./LibraryPlugin.js'),
  // Optional when plugin has a provider
  providerLoader: () => import('../../providers/LibraryProvider.js'),
};
```

### Step 5: Create Provider (Optional)
If consumers need a simplified API, create a provider using the `useAction` pattern.

**File:** `providers/{PluginName}Provider.js`

```javascript
import BaseProvider from './BaseProvider.js';
import { LibraryTopics, LibraryActionGroups } from '../plugins/library/topics.js';

export default class LibraryProvider extends BaseProvider {
  #actions = {};

  constructor(plugin) {
    super(plugin);
    this.#initActions();
  }

  #initActions() {
    const { ASSETS } = LibraryActionGroups;

    this.#actions = {
      getAsset: this.plugin.useAction(ASSETS, LibraryTopics.GET_ASSET),
      createAsset: this.plugin.useAction(ASSETS, LibraryTopics.CREATE_ASSET),
    };
  }

  async getAsset(id) {
    return this.safeExecute(() => this.#actions.getAsset(id));
  }

  async createAsset(data) {
    return this.safeExecute(() => this.#actions.createAsset(data));
  }
}
```

See [PROVIDERS.md](./PROVIDERS.md) for the `useAction` pattern details.

### Step 6: Create Plugin README
Create a `README.md` in the plugin directory documenting its purpose and API.

**File:** `plugins/{pluginName}/README.md`

```markdown
# {PluginName} Plugin

> Brief description of what the plugin does.

## Overview

Detailed description of the plugin's purpose and capabilities.

## Features

- 🔍 **Feature 1** - Description
- 🎨 **Feature 2** - Description

## Configuration

**Feature Flag:** `ENABLE_{PLUGIN_NAME}`

**Service Config:**

\```javascript
{pluginName}: {
  baseUrl: 'https://api.example.com',
  apiKey: 'YourApiKey',
  endpoints: { ... },
}
\```

## Topics

| Topic | Description |
|-------|-------------|
| `{plugin}.action1` | Description |
| `{plugin}.action2` | Description |

## Usage

### Via Provider (if available)

\```javascript
const provider = await serviceManager.getProvider('{pluginName}');
const result = await provider.someMethod(params);
\```

### Via Plugin Dispatch

\```javascript
import { {PluginName}Topics } from './plugins/{pluginName}/topics.js';
const plugin = serviceManager.getPlugin('{pluginName}');
const result = await plugin.dispatch({PluginName}Topics.ACTION, params);
\```

## Authentication

Describe authentication requirements (none, optional, required).

## Related Files

- `{PluginName}Plugin.js` - Main plugin class
- `topics.js` - Topic definitions
- `actions/` - Action groups (if applicable)

---

**Version:** 1.0  
**Last Updated:** {Month} {Year}
```

**README Requirements:**
- Overview and features list
- Configuration details (feature flag, service config)
- Topics table with descriptions
- Usage examples (provider and/or dispatch)
- Authentication requirements
- Response structure examples (for complex APIs)
- Related files list

## 3. Validation Checklist

Before finishing, verify:

1.  [ ] **Inheritance**: Plugin extends `BaseApiService` (if API) or `BasePlugin`.
2.  [ ] **Constructor**: Accepts `{ serviceConfig, appConfig }` and calls `super()`.
3.  [ ] **isActivated**: Method checks feature flag from `appConfig`.
4.  [ ] **Action Groups**: Extend `BaseActionGroup`, implement `getHandlers()`, and live in a single file as named exports.
5.  [ ] **Registration**: `registerActionGroup` receives an **instance** (`new ActionGroup(this)`), not a class.
6.  [ ] **Topics**: All topics defined in `plugins/{name}/topics.js`.
7.  [ ] **Config**: Service config exists in `config.js`.
8.  [ ] **Manifest**: Plugin manifest added in `plugins/{name}/index.js`.
9.  [ ] **Providers**: Use `useAction` pattern with cached actions in constructor.
10. [ ] **Error Handling**: Action methods use `ValidationError` for input validation.
11. [ ] **README**: Plugin README.md created with usage documentation.

## 4. Common Patterns

### Action Dispatching: `dispatch` vs `useAction`

The plugin system provides two ways to execute actions. See [PROVIDERS.md](./PROVIDERS.md) for detailed guidance.

| Use Case | Recommended | Reason |
|----------|-------------|--------|
| Provider methods | `useAction` | Cache once, reuse everywhere |
| Action group handlers | `dispatch` | Direct plugin access |
| One-time/dynamic calls | `dispatch` | Topic varies at runtime |
| Passing to components | `useAction` | Clean function reference |

### URL Building
Use `this.endpoints` from inherited config:

```javascript
async fetchData(id) {
  return this.get(`${this.endpoints.data}/${id}`);
}
```

### Error Handling

See [ERRORS.md](./ERRORS.md) for available error types:

| Error Type | When to Use |
|------------|-------------|
| `ValidationError` | Input validation failures in action methods |
| `ApiError` | HTTP failures (auto-thrown by `handleResponse`) |
| `AuthenticationError` | User needs to log in (auto-thrown by auth middleware) |
| `NotFoundError` | Resource/handler not found |
| `ServiceError` | Generic service failures |
| `PluginRegistrationError` | Plugin registration issues |

### Middleware

See [MIDDLEWARES.md](./MIDDLEWARES.md) for middleware patterns.

---

**Version:** 2.0  
**Last Updated:** January 2026
