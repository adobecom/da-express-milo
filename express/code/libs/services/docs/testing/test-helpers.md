## ServiceManager Test Utilities

The `ServiceManager` provides methods specifically for testing scenarios:

```javascript
import { serviceManager } from './services/integration/index.js';

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

### Testing with Selective Plugin Loading

Use `init(options)` to load only specific plugins during tests:

```javascript
beforeEach(() => {
  serviceManager.reset();
});

it('loads only required plugins', async () => {
  await serviceManager.init({ plugins: ['[pluginName]'] });

  expect(serviceManager.hasPlugin('[pluginName]')).to.be.true;
  expect(serviceManager.hasPlugin('[otherPlugin]')).to.be.false;
});

it('overrides feature flags', async () => {
  await serviceManager.init({ features: { ENABLE_[PLUGIN_NAME]: false } });

  expect(serviceManager.hasPlugin('[pluginName]')).to.be.false;
});
```

### `registerPlugin(name, plugin)`

Dynamically register a plugin (useful for mocking). Throws `PluginRegistrationError` if a plugin with the same name already exists:

```javascript
const mockPlugin = {
  dispatch: sinon.stub().resolves({ /* mock data */ }),
  constructor: { serviceName: 'Mock[ServiceName]' },
};

serviceManager.registerPlugin('[pluginName]', mockPlugin);
const plugin = serviceManager.getPlugin('[pluginName]'); // Returns your mock
```

### `unregisterPlugin(name)` / `hasPlugin(name)` / `hasProvider(name)`

Remove a plugin or check registration status:

```javascript
const wasRemoved = serviceManager.unregisterPlugin('[pluginName]'); // true or false
if (serviceManager.hasPlugin('[pluginName]')) { /* Plugin is registered */ }
if (serviceManager.hasProvider('[pluginName]')) { /* Provider loader exists */ }
```

---

## Shared Test Helpers

Reusable utilities to reduce boilerplate across all test files.

### `createTestPlugin` (Plugin Fixture Factory)

Creates a plugin instance with sensible test defaults. Use in every test file instead of duplicating constructor boilerplate.

```javascript
/**
 * Create a plugin instance with test defaults.
 * @param {Function} PluginClass - The plugin constructor
 * @param {object} [overrides] - Override serviceConfig or appConfig
 */
function createTestPlugin(PluginClass, overrides = {}) {
  return new PluginClass({
    serviceConfig: {
      baseUrl: 'https://test.com',
      apiKey: 'test-key',
      endpoints: {},
      ...overrides.serviceConfig,
    },
    appConfig: {
      features: {},
      ...overrides.appConfig,
    },
  });
}
```

### `expectValidationError`

Assert that an async function throws a `ValidationError`. Used in action group validation tests and anywhere input validation is tested.

```javascript
import { ValidationError } from '../core/Errors.js';

/**
 * Assert that `fn` throws a ValidationError, then run optional extra assertions.
 */
async function expectValidationError(fn, extraAssertions = () => {}) {
  try {
    await fn();
    expect.fail('Should have thrown');
  } catch (err) {
    expect(err).to.be.instanceOf(ValidationError);
    extraAssertions(err);
  }
}
```

### Delegation Wiring Pattern

A common pattern used in both **Provider** and **Action Group** tests. Verifies that a method correctly delegates to an underlying dependency and returns expected data.

```javascript
/**
 * Generic delegation wiring test pattern.
 *
 * @example Provider: provider.getThemes() → plugin.dispatch('search.themes')
 * @example Action:   actions.searchThemes() → mockPlugin.get('/themes')
 */
describe('delegation wiring', () => {
  it('[callerMethod] delegates to [targetMethod]', async () => {
    const mockData = { /* expected structure */ };
    target.targetMethod.resolves(mockData);

    const result = await caller.callerMethod();

    expect(result).to.deep.equal(mockData);
    expect(target.targetMethod.calledOnce).to.be.true;
  });

  it('[callerMethod] passes arguments through', async () => {
    await caller.callerMethod('arg1', 'arg2');
    expect(target.targetMethod.calledWith('arg1', 'arg2')).to.be.true;
  });
});
```

---

## Mocking Utilities

### `window.adobeIMS` (Auth-dependent tests)

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

### `window.lana` (Error logging tests)

```javascript
beforeEach(() => {
  window.lana = { log: sinon.stub() };
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

### `window.fetch` (HTTP-dependent tests)

```javascript
let fetchStub;

beforeEach(() => {
  fetchStub = sinon.stub(window, 'fetch').resolves({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
  });
});

afterEach(() => {
  fetchStub.restore();
});
```

---

## Sinon + Chai Quick Reference

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
