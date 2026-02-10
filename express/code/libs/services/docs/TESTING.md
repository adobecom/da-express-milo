## Testing

Guidelines for testing service layer components.

### ServiceManager Test Utilities

The `ServiceManager` provides methods specifically for testing scenarios:

```javascript
import { serviceManager } from './services/integration/index.js';

// Reset all state between tests
beforeEach(() => {
  serviceManager.reset(); // Clears plugins, providers, and init state
});
```

### `reset()`

Clears all internal state:
- Removes all registered plugins
- Clears provider cache
- Resets initialization promise (allows `init()` to run again)
- Clears runtime configuration (plugin selection options)

```javascript
serviceManager.reset();
```

### Testing with Selective Plugin Loading

Use `init(options)` to load only specific plugins during tests:

```javascript
beforeEach(() => {
  serviceManager.reset();
});

test('loads only required plugins', async () => {
  // Load only kuler for this test
  await serviceManager.init({ plugins: ['kuler'] });
  
  expect(serviceManager.hasPlugin('kuler')).toBe(true);
  expect(serviceManager.hasPlugin('stock')).toBe(false);
});

test('overrides feature flags', async () => {
  await serviceManager.init({ features: { ENABLE_STOCK: false } });
  
  expect(serviceManager.hasPlugin('stock')).toBe(false);
});
```

### `registerPlugin(name, plugin)`

Dynamically register a plugin (useful for mocking):

```javascript
const mockPlugin = {
  dispatch: jest.fn().mockResolvedValue({ themes: [] }),
  constructor: { serviceName: 'MockKuler' },
};

serviceManager.registerPlugin('kuler', mockPlugin);

// Now getPlugin('kuler') returns your mock
const plugin = serviceManager.getPlugin('kuler');
```

Throws `PluginRegistrationError` if a plugin with the same name already exists.

### `unregisterPlugin(name)`

Remove a plugin (also clears its provider cache):

```javascript
const wasRemoved = serviceManager.unregisterPlugin('kuler'); // true or false
```

### `hasPlugin(name)` / `hasProvider(name)`

Check registration status:

```javascript
if (serviceManager.hasPlugin('kuler')) {
  // Plugin is registered
}

if (serviceManager.hasProvider('kuler')) {
  // Provider loader exists for this plugin
}
```

### Testing Providers

```javascript
import BaseProvider from './providers/BaseProvider.js';

class TestProvider extends BaseProvider {
  async doSomething() {
    return this.safeExecute(() => this.plugin.dispatch('test.action'));
  }
}

// Create with mock plugin
const mockPlugin = {
  dispatch: jest.fn().mockResolvedValue({ data: 'test' }),
  constructor: { serviceName: 'TestPlugin' },
};

const provider = new TestProvider(mockPlugin);

// Test safeExecute returns null on error
mockPlugin.dispatch.mockRejectedValue(new Error('fail'));
const result = await provider.doSomething();
expect(result).toBeNull();
```

### Testing `safeExecute` Error Handling

```javascript
const failingAction = jest.fn().mockRejectedValue(new Error('Network error'));

const result = await provider.safeExecute(failingAction);

expect(result).toBeNull();
// Error was logged via logError()
```

### Testing Middleware

Middleware follows a specific signature that's easy to test:

```javascript
import myMiddleware from './middlewares/my.middleware.js';

test('middleware calls next and returns result', async () => {
  const mockNext = jest.fn().mockResolvedValue('handler result');
  const context = { serviceName: 'TestService', topic: 'test.action' };

  const result = await myMiddleware('test.action', ['arg1'], mockNext, context);

  expect(mockNext).toHaveBeenCalled();
  expect(result).toBe('handler result');
});

test('middleware handles errors', async () => {
  const mockNext = jest.fn().mockRejectedValue(new Error('Handler failed'));

  await expect(
    myMiddleware('test.action', [], mockNext, {})
  ).rejects.toThrow();
});
```

### Testing `buildContext`

```javascript
import errorMiddleware from './middlewares/error.middleware.js';

test('buildContext extracts serviceName and topic', () => {
  const meta = {
    plugin: {},
    serviceName: 'Kuler',
    topic: 'search.themes',
    args: [{ query: 'test' }],
  };

  const context = errorMiddleware.buildContext(meta);

  expect(context).toEqual({
    serviceName: 'Kuler',
    topic: 'search.themes',
  });
});
```

### Testing Action Groups

```javascript
import SearchActions from './plugins/kuler/actions/SearchActions.js';

test('getHandlers returns topic-to-handler map', () => {
  const mockPlugin = {
    get: jest.fn().mockResolvedValue({ themes: [] }),
    endpoints: { search: '/search' },
  };

  const actions = new SearchActions(mockPlugin);
  const handlers = actions.getHandlers();

  expect(handlers['search.themes']).toBeInstanceOf(Function);
});

test('handler calls plugin methods correctly', async () => {
  const mockPlugin = {
    get: jest.fn().mockResolvedValue({ themes: [] }),
    endpoints: { search: '/search' },
  };

  const actions = new SearchActions(mockPlugin);
  const handlers = actions.getHandlers();

  await handlers['search.themes']({ main: 'sunset', typeOfQuery: 'term' });

  expect(mockPlugin.get).toHaveBeenCalled();
});
```

### Testing Plugins

```javascript
import MyPlugin from './plugins/myPlugin/MyPlugin.js';

test('plugin registers handlers on construction', () => {
  const plugin = new MyPlugin({
    serviceConfig: { baseUrl: 'https://test.com' },
    appConfig: { features: {} },
  });

  expect(plugin.topicRegistry.size).toBeGreaterThan(0);
});

test('isActivated respects feature flags', () => {
  const plugin = new MyPlugin({});

  expect(plugin.isActivated({ features: { ENABLE_MYPLUGIN: true } })).toBe(true);
  expect(plugin.isActivated({ features: { ENABLE_MYPLUGIN: false } })).toBe(false);
});
```

### Mocking `window.adobeIMS`

For auth-dependent tests:

```javascript
beforeEach(() => {
  window.adobeIMS = {
    isSignedInUser: jest.fn().mockReturnValue(true),
    getAccessToken: jest.fn().mockReturnValue({ token: 'mock-token' }),
  };
});

afterEach(() => {
  delete window.adobeIMS;
});
```

### Mocking `window.lana`

For error logging tests:

```javascript
beforeEach(() => {
  window.lana = {
    log: jest.fn(),
  };
});

afterEach(() => {
  delete window.lana;
});

test('errors are logged to lana', async () => {
  // Trigger an error...

  expect(window.lana.log).toHaveBeenCalledWith(
    expect.stringContaining('error'),
    expect.objectContaining({ tags: expect.any(String) })
  );
});
```
