## Testing

Guidelines for testing service layer components.

**Stack:** Web Test Runner + Mocha (`describe`/`it`) + Chai (`expect`) + Sinon (`stub`/`spy`)

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

it('loads only required plugins', async () => {
  await serviceManager.init({ plugins: ['kuler'] });

  expect(serviceManager.hasPlugin('kuler')).to.be.true;
  expect(serviceManager.hasPlugin('stock')).to.be.false;
});

it('overrides feature flags', async () => {
  await serviceManager.init({ features: { ENABLE_STOCK: false } });

  expect(serviceManager.hasPlugin('stock')).to.be.false;
});
```

### `registerPlugin(name, plugin)`

Dynamically register a plugin (useful for mocking):

```javascript
const mockPlugin = {
  dispatch: sinon.stub().resolves({ themes: [] }),
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
  dispatch: sinon.stub().resolves({ data: 'test' }),
  constructor: { serviceName: 'TestPlugin' },
};

const provider = new TestProvider(mockPlugin);

// Test safeExecute returns null on error
mockPlugin.dispatch.rejects(new Error('fail'));
const result = await provider.doSomething();
expect(result).to.be.null;
```

### Testing `safeExecute` Error Handling

```javascript
const failingAction = sinon.stub().rejects(new Error('Network error'));

const result = await provider.safeExecute(failingAction);

expect(result).to.be.null;
// Error was logged via logError()
```

### Testing Middleware

Middleware follows a specific signature that's easy to test:

```javascript
import myMiddleware from './middlewares/my.middleware.js';

it('middleware calls next and returns result', async () => {
  const mockNext = sinon.stub().resolves('handler result');
  const context = { serviceName: 'TestService', topic: 'test.action' };

  const result = await myMiddleware('test.action', ['arg1'], mockNext, context);

  expect(mockNext.calledOnce).to.be.true;
  expect(result).to.equal('handler result');
});

it('middleware handles errors', async () => {
  const mockNext = sinon.stub().rejects(new Error('Handler failed'));

  try {
    await myMiddleware('test.action', [], mockNext, {});
    expect.fail('Should have thrown');
  } catch (err) {
    expect(err.message).to.equal('Handler failed');
  }
});
```

### Testing `buildContext`

```javascript
import errorMiddleware from './middlewares/error.middleware.js';

it('buildContext extracts serviceName and topic', () => {
  const meta = {
    plugin: {},
    serviceName: 'Kuler',
    topic: 'search.themes',
    args: [{ query: 'test' }],
  };

  const context = errorMiddleware.buildContext(meta);

  expect(context).to.deep.equal({
    serviceName: 'Kuler',
    topic: 'search.themes',
  });
});
```

### Testing Action Groups

```javascript
import SearchActions from './plugins/kuler/actions/SearchActions.js';

it('getHandlers returns topic-to-handler map', () => {
  const mockPlugin = {
    get: sinon.stub().resolves({ themes: [] }),
    endpoints: { search: '/search' },
  };

  const actions = new SearchActions(mockPlugin);
  const handlers = actions.getHandlers();

  expect(handlers['search.themes']).to.be.a('function');
});

it('handler calls plugin methods correctly', async () => {
  const mockPlugin = {
    get: sinon.stub().resolves({ themes: [] }),
    endpoints: { search: '/search' },
  };

  const actions = new SearchActions(mockPlugin);
  const handlers = actions.getHandlers();

  await handlers['search.themes']({ main: 'sunset', typeOfQuery: 'term' });

  expect(mockPlugin.get.calledOnce).to.be.true;
});
```

### Testing Plugins

```javascript
import MyPlugin from './plugins/myPlugin/MyPlugin.js';

it('plugin registers handlers on construction', () => {
  const plugin = new MyPlugin({
    serviceConfig: { baseUrl: 'https://test.com' },
    appConfig: { features: {} },
  });

  expect(plugin.topicRegistry.size).to.be.greaterThan(0);
});

it('isActivated respects feature flags', () => {
  const plugin = new MyPlugin({});

  expect(plugin.isActivated({ features: { ENABLE_MYPLUGIN: true } })).to.be.true;
  expect(plugin.isActivated({ features: { ENABLE_MYPLUGIN: false } })).to.be.false;
});
```

### Mocking `window.adobeIMS`

For auth-dependent tests:

```javascript
beforeEach(() => {
  window.adobeIMS = {
    isSignedInUser: sinon.stub().returns(true),
    getAccessToken: sinon.stub().returns({ token: 'mock-token' }),
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
    log: sinon.stub(),
  };
});

afterEach(() => {
  delete window.lana;
});

it('errors are logged to lana', async () => {
  // Trigger an error...

  expect(window.lana.log.calledOnce).to.be.true;
  expect(window.lana.log.firstCall.args[0]).to.include('error');
});
```

### Sinon + Chai Quick Reference

Common patterns used in this codebase (replacing Jest equivalents):

| Jest | Sinon + Chai |
|------|-------------|
| `jest.fn()` | `sinon.stub()` or `sinon.spy()` |
| `jest.fn().mockResolvedValue(x)` | `sinon.stub().resolves(x)` |
| `jest.fn().mockRejectedValue(e)` | `sinon.stub().rejects(e)` |
| `jest.fn().mockReturnValue(x)` | `sinon.stub().returns(x)` |
| `expect(x).toBe(y)` | `expect(x).to.equal(y)` |
| `expect(x).toBeNull()` | `expect(x).to.be.null` |
| `expect(x).toBe(true)` | `expect(x).to.be.true` |
| `expect(fn).toHaveBeenCalled()` | `expect(fn.calledOnce).to.be.true` |
| `expect(x).toEqual(y)` | `expect(x).to.deep.equal(y)` |
| `expect(x).toBeInstanceOf(F)` | `expect(x).to.be.instanceOf(F)` |
| `expect(x).toBeGreaterThan(0)` | `expect(x).to.be.greaterThan(0)` |
| `test('name', fn)` | `it('name', fn)` |
| `expect(...).rejects.toThrow()` | `try { ... expect.fail() } catch (e) { ... }` |
