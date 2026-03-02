# Plugin Code Templates

> **Context directive:** Read this file ONLY when generating a new plugin. Do not load for other tasks.

## Topics File

`plugins/{pluginName}/topics.js`:

```javascript
export const LibraryTopics = {
  GET_ASSET: 'library.getAsset',
  CREATE_ASSET: 'library.createAsset',
};

export const LibraryActionGroups = {
  ASSETS: 'assets',
};
```

## Config Entry

Add to `config.js` `services` and `features` objects:

```javascript
library: {
  baseUrl: 'https://api.library.adobe.io/v1',
  apiKey: 'YourApiKey',
  endpoints: { assets: '/assets' },
},

features: { ENABLE_LIBRARY: true }
```

## Simple Plugin (< 5 operations)

`plugins/{pluginName}/{PluginName}Plugin.js`:

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

## Complex Plugin (Action Groups)

> All action group classes live in a single file as named exports to avoid request waterfalls.

`plugins/{pluginName}/actions/{PluginName}Actions.js`:

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
    if (!id) throw new ValidationError('Asset ID is required', { field: 'id', serviceName: 'Library', topic: 'GET_ASSET' });
    return this.plugin.get(`${this.plugin.endpoints.assets}/${id}`);
  }

  async createAsset(data) {
    if (!data?.name) throw new ValidationError('Asset name is required', { field: 'data.name', serviceName: 'Library', topic: 'CREATE_ASSET' });
    return this.plugin.post(this.plugin.endpoints.assets, data);
  }
}
```

`plugins/{pluginName}/{PluginName}Plugin.js` (with action groups):

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

## Plugin Manifest

`plugins/{name}/index.js`:

```javascript
export default {
  name: 'library',
  featureFlag: 'ENABLE_LIBRARY',
  loader: () => import('./LibraryPlugin.js'),
  providerLoader: () => import('../../providers/LibraryProvider.js'),
};
```

## Provider

`providers/{PluginName}Provider.js`:

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

  async getAsset(id) { return this.safeExecute(() => this.#actions.getAsset(id)); }
  async createAsset(data) { return this.safeExecute(() => this.#actions.createAsset(data)); }
}
```

## Plugin README Template

`plugins/{pluginName}/README.md`:

```markdown
# {PluginName} Plugin

> Brief description.

## Configuration

- **Feature Flag:** `ENABLE_{PLUGIN_NAME}`
- **Base URL:** `https://api.example.com`

## Topics

| Topic | Description |
|-------|-------------|
| `{plugin}.action1` | Description |

## Usage

### Via Provider

\```javascript
const provider = await serviceManager.getProvider('{pluginName}');
const result = await provider.someMethod(params);
\```

### Via Plugin

\```javascript
const plugin = await serviceManager.loadPlugin('{pluginName}');
const result = await plugin.dispatch({PluginName}Topics.ACTION, params);
\```
```
