## Testing

Guidelines for testing service layer components.

**Stack:** Web Test Runner + Mocha (`describe`/`it`) + Chai (`expect`) + Sinon (`stub`/`spy`)

**Framework Approach:** This document provides a **testing framework** with core patterns that apply across all plugins, providers, and action groups. Adapt these patterns to your specific plugin's functionality. The examples use generic placeholders - replace them with your actual method names, data structures, and validation logic. See `test/libs/services/plugins/curated/` for examples of this framework applied to specific plugins.

### ServiceManager Test Utilities

The `ServiceManager` provides methods specifically for testing scenarios:

```javascript
import { serviceManager } from './services/integration/index.js';

beforeEach(() => {
  serviceManager.reset(); // Clears plugins, providers, and init state
});
```

#### `reset()`

Clears all internal state:
- Removes all registered plugins
- Clears provider cache
- Resets initialization promise (allows `init()` to run again)
- Clears runtime configuration (plugin selection options)

#### Testing with Selective Plugin Loading

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

#### `registerPlugin(name, plugin)`

Dynamically register a plugin (useful for mocking). Throws `PluginRegistrationError` if a plugin with the same name already exists:

```javascript
const mockPlugin = {
  dispatch: sinon.stub().resolves({ /* mock data */ }),
  constructor: { serviceName: 'Mock[ServiceName]' },
};

serviceManager.registerPlugin('[pluginName]', mockPlugin);
const plugin = serviceManager.getPlugin('[pluginName]'); // Returns your mock
```

#### `unregisterPlugin(name)` / `hasPlugin(name)` / `hasProvider(name)`

Remove a plugin or check registration status:

```javascript
const wasRemoved = serviceManager.unregisterPlugin('[pluginName]'); // true or false
if (serviceManager.hasPlugin('[pluginName]')) { /* Plugin is registered */ }
if (serviceManager.hasProvider('[pluginName]')) { /* Provider loader exists */ }
```

### Testing Providers

#### Core Testing Framework

Providers must be tested for three core aspects:

1. **Action Wiring** - Verify provider methods correctly call plugin actions
2. **Error Boundary** - Verify `safeExecute` prevents exceptions from leaking
3. **Factory Functions** - Verify factory functions (if present) work correctly

#### Setup Pattern

```javascript
import BaseProvider from './providers/BaseProvider.js';
import MyPlugin from '../plugins/myPlugin/MyPlugin.js';

describe('MyProvider', () => {
  let plugin;
  let provider;

  beforeEach(() => {
    plugin = new MyPlugin({
      serviceConfig: { baseUrl: 'https://test.com' },
      appConfig: { features: {} },
    });
    // Stub plugin methods that will be called
    sinon.stub(plugin, 'methodName').resolves(mockData);
    provider = new MyProvider(plugin);
  });

  afterEach(() => sinon.restore());
});
```

#### 1. Action Wiring (End-to-End)

**Purpose:** Verify provider methods correctly wire through to plugin actions.

**Pattern:**
- Test each provider method calls the correct plugin method
- Verify arguments are passed correctly and return values match expected structure
- Use `expect(plugin.method.calledOnce).to.be.true` to verify calls

```javascript
describe('action wiring', () => {
  it('[providerMethod] returns data from plugin', async () => {
    const mockData = { /* expected structure */ };
    plugin.methodName.resolves(mockData);
    
    const result = await provider.providerMethod();
    
    expect(result).to.deep.equal(mockData);
    expect(plugin.methodName.calledOnce).to.be.true;
  });

  it('[providerMethod] passes args correctly', async () => {
    const result = await provider.providerMethod('arg1', 'arg2');
    
    expect(plugin.methodName.calledWith('arg1', 'arg2')).to.be.true;
    expect(result).to.have.property('expectedProperty');
  });
});
```

#### 2. Error Boundary (`safeExecute`)

**Purpose:** Verify all provider methods use `safeExecute` and return `null` on errors.

**Critical:** All provider methods must return `null` on errors, never throw.

**Pattern:**
- Test plugin throwing errors (network, API errors) and validation errors being caught
- Verify errors don't propagate (use `expect(result).to.be.null`)

```javascript
describe('error boundary (safeExecute)', () => {
  it('[providerMethod] returns null when plugin throws', async () => {
    plugin.methodName.rejects(new Error('Network error'));
    const result = await provider.providerMethod();
    expect(result).to.be.null;
  });

  it('[providerMethod] returns null for invalid input', async () => {
    // If action throws ValidationError, provider should catch and return null
    const result = await provider.providerMethod('INVALID');
    expect(result).to.be.null;
  });
});
```

#### 3. Factory Functions

**Purpose:** Verify factory functions (if present) return correct instances.

```javascript
describe('createMyProvider factory', () => {
  it('should return a MyProvider instance', () => {
    const instance = createMyProvider(plugin);
    expect(instance).to.be.instanceOf(MyProvider);
  });
});
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

### Testing Action Groups

#### Core Testing Framework

Action groups must be tested for these core aspects (apply as relevant):

1. **Structural Correctness** - Verify `getHandlers()` returns all expected topics
2. **Basic Functionality** - Verify actions call plugin methods correctly
3. **Validation** - Verify input validation (if actions accept parameters)
4. **Data Transformation** - Verify transformation logic (filtering, grouping, sorting, mapping, etc. if applicable)
5. **Defensive Handling** - Verify handling of malformed API responses

#### Setup Pattern

```javascript
import MyActions from './plugins/myPlugin/actions/MyActions.js';
import { MyTopics } from './plugins/myPlugin/topics.js';
import { ValidationError } from '../core/Errors.js';

// Define mock data matching actual API response structure
const mockData = {
  /* structure matching your API response */
};

describe('MyActions', () => {
  let actions;
  let mockPlugin;

  beforeEach(() => {
    // Create mock plugin with stubbed methods
    mockPlugin = { 
      methodName: sinon.stub().resolves(mockData) 
    };
    actions = new MyActions(mockPlugin);
  });

  afterEach(() => sinon.restore());
});
```

#### 1. Structural Correctness (`getHandlers`)

**Purpose:** Verify `getHandlers()` returns handler for every expected topic.

**Pattern:**
- Verify all topics from `Topics.[GROUP]` have handlers (and are functions)
- Verify no unexpected topic keys exist

```javascript
describe('getHandlers - action routing', () => {
  it('should return a handler for every MyTopics.[GROUP] topic', () => {
    const handlers = actions.getHandlers();
    const expectedTopics = Object.values(MyTopics.[GROUP]);

    expectedTopics.forEach((topic) => {
      expect(handlers).to.have.property(topic).that.is.a('function');
    });
  });

  it('should not contain any unexpected topic keys', () => {
    const handlers = actions.getHandlers();
    const handlerKeys = Object.keys(handlers);
    const expectedTopics = Object.values(MyTopics.[GROUP]);

    expect(handlerKeys).to.have.lengthOf(expectedTopics.length);
    handlerKeys.forEach((key) => {
      expect(expectedTopics).to.include(key);
    });
  });
});
```

#### 2. Basic Action Functionality

**Purpose:** Verify actions call plugin methods correctly and return expected data.

**Pattern:**
- Test each action method returns expected data and plugin methods are called correctly
- Test with various input scenarios

```javascript
describe('[actionMethod]', () => {
  it('should return data from plugin', async () => {
    const result = await actions.actionMethod();
    expect(result).to.deep.equal(mockData);
    expect(mockPlugin.methodName.calledOnce).to.be.true;
  });

  it('should pass arguments correctly', async () => {
    await actions.actionMethod('arg1', 'arg2');
    expect(mockPlugin.methodName.calledWith('arg1', 'arg2')).to.be.true;
  });
});
```

#### 3. Validation Testing

**Purpose:** Verify input validation for actions that accept parameters.

**Pattern:**
- Test invalid inputs throw `ValidationError` with helpful messages (include invalid value and valid options)
- Test error metadata (field, serviceName, topic) and verify all valid inputs don't throw

```javascript
/**
 * Helper: assert that `fn` throws a ValidationError
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

describe('[actionMethod] - validation', () => {
  // Test invalid inputs
  [
    { label: 'completely invalid input', input: 'INVALID' },
    { label: 'empty string', input: '' },
    { label: 'wrong type', input: 123 },
    // Add more invalid cases specific to your action
  ].forEach(({ label, input }) => {
    it(`should throw ValidationError for ${label}`, async () => {
      await expectValidationError(() => actions.actionMethod(input));
    });
  });

  // Test error message includes helpful information
  it('should include invalid value and valid options in error message', async () => {
    await expectValidationError(
      () => actions.actionMethod('INVALID'),
      (err) => {
        expect(err.message).to.include('INVALID');
        // Verify valid options are mentioned
        Object.values(ValidOptions).forEach((option) => {
          expect(err.message).to.include(option);
        });
      },
    );
  });

  // Test error metadata
  it('should set correct error metadata on ValidationError', async () => {
    await expectValidationError(
      () => actions.actionMethod('BAD'),
      (err) => {
        expect(err.field).to.equal('[fieldName]');
        expect(err.serviceName).to.equal('[ServiceName]');
        expect(err.topic).to.equal(MyTopics.[GROUP].[TOPIC]);
      },
    );
  });

  // Test all valid inputs
  it('should NOT throw for every valid input value', async () => {
    for (const value of Object.values(ValidOptions)) {
      const result = await actions.actionMethod(value);
      expect(result).to.have.property('[expectedProperty]');
    }
  });
});
```

#### 4. Data Transformation

**Purpose:** Verify data transformation logic works correctly (if applicable). Common patterns include filtering, grouping, sorting, mapping, or other transformations.

**Pattern:**
- Test transformation returns correct results (filtered subset, grouped buckets, sorted order, etc.)
- Test no data leakage between groups/filters and edge cases (empty results, missing data)

```javascript
// Example: Filtering pattern
describe('[actionMethod] - filtering', () => {
  // Test each filter value
  [
    { filter: '[FILTER_VALUE_A]', expectedCount: 2 },
    { filter: '[FILTER_VALUE_B]', expectedCount: 1 },
  ].forEach(({ filter, expectedCount }) => {
    it(`should return correct items (${expectedCount}) when filtered by ${filter}`, async () => {
      const result = await actions.actionMethod(filter);
      expect(result.items).to.have.lengthOf(expectedCount);
      // Verify all items match the filter criteria
      result.items.forEach((item) => {
        expect(item.[filterProperty]).to.equal(filter);
      });
    });
  });

  // Test empty results
  it('should return empty array when filter has no matches', async () => {
    mockPlugin.methodName.resolves({ items: [{ [filterProperty]: '[OTHER_VALUE]' }] });
    const result = await actions.actionMethod('[FILTER_VALUE_A]');
    expect(result.items).to.deep.equal([]);
  });
});

// Example: Grouping pattern
describe('[actionMethod] - grouping', () => {
  it('should bucket all items into the correct groups', async () => {
    const result = await actions.actionMethod();
    expect(result.[groupKeyA].items).to.have.lengthOf(2);
    expect(result.[groupKeyB].items).to.have.lengthOf(1);
  });

  it('should not leak items between groups', async () => {
    const result = await actions.actionMethod();
    result.[groupKeyA].items.forEach((item) => {
      expect(item.[groupProperty]).to.equal('[GROUP_VALUE_A]');
    });
    result.[groupKeyB].items.forEach((item) => {
      expect(item.[groupProperty]).to.equal('[GROUP_VALUE_B]');
    });
  });

  // Test edge cases
  [
    { label: 'empty array', data: { items: [] } },
    { label: 'missing items property', data: {} },
  ].forEach(({ label, data }) => {
    it(`should return all group keys with empty items for ${label}`, async () => {
      mockPlugin.methodName.resolves(data);
      const result = await actions.actionMethod();
      expect(result).to.have.all.keys('[groupKeyA]', '[groupKeyB]');
      Object.values(result).forEach((group) => {
        expect(group.items).to.deep.equal([]);
      });
    });
  });
});

// Note: Adapt these examples to your specific transformation needs (sorting, mapping, etc.)
```

#### 5. Defensive Data Handling

**Purpose:** Verify handling of malformed API responses.

**Pattern:**
- Test handling of `null` responses, empty objects, missing properties, and malformed data structures

```javascript
describe('[actionMethod] - malformed API responses', () => {
  [
    { label: 'null', data: null },
    { label: 'empty object', data: {} },
    { label: 'null [dataArray]', data: { [dataArray]: null } },
    { label: 'missing expected property', data: { [otherProperty]: '[value]' } },
  ].forEach(({ label, data }) => {
    it(`should handle ${label} gracefully`, async () => {
      mockPlugin.methodName.resolves(data);
      const result = await actions.actionMethod();
      // Verify graceful handling - return empty array, default value, etc.
      expect(result.[dataArray]).to.deep.equal([]);
    });
  });
});
```

### Testing Plugins

#### Core Testing Framework

Plugins must be tested for:

1. **Feature Flag Gating** - Verify `isActivated()` respects feature flags
2. **Handler Registration** - Verify handlers are registered on construction (if applicable)

#### 1. Feature Flag Gating (`isActivated`)

**Purpose:** Verify plugin activation respects feature flags correctly.

**Pattern:**
- Test all feature flag scenarios systematically using parameterized tests with `forEach`
- Feature flag name should be `ENABLE_[PLUGIN_NAME_UPPERCASE]`

```javascript
import MyPlugin from './plugins/myPlugin/MyPlugin.js';

describe('MyPlugin', () => {
  let plugin;

  beforeEach(() => {
    plugin = new MyPlugin({
      serviceConfig: { baseUrl: 'https://test.com' },
      appConfig: { features: {} },
    });
  });

  describe('isActivated (feature flag)', () => {
    [
      { label: 'ENABLE_MYPLUGIN not set', config: { features: {} }, expected: true },
      { label: 'ENABLE_MYPLUGIN is true', config: { features: { ENABLE_MYPLUGIN: true } }, expected: true },
      { label: 'ENABLE_MYPLUGIN is explicitly false', config: { features: { ENABLE_MYPLUGIN: false } }, expected: false },
      { label: 'no features key', config: {}, expected: true },
    ].forEach(({ label, config, expected }) => {
      it(`should return ${expected} when ${label}`, () => {
        expect(plugin.isActivated(config)).to.equal(expected);
      });
    });
  });
});
```

#### 2. Handler Registration

**Purpose:** Verify handlers are registered on construction.

**Pattern:**
- Verify `topicRegistry` is populated and action groups are registered (if applicable)

```javascript
describe('handler registration', () => {
  it('plugin registers handlers on construction', () => {
    const plugin = new MyPlugin({
      serviceConfig: { baseUrl: 'https://test.com' },
      appConfig: { features: {} },
    });

    expect(plugin.topicRegistry.size).to.be.greaterThan(0);
  });

  // If using action groups
  it('plugin registers action groups on construction', () => {
    const plugin = new MyPlugin({
      serviceConfig: { baseUrl: 'https://test.com' },
      appConfig: { features: {} },
    });

    expect(plugin.getActionGroupNames()).to.have.length.greaterThan(0);
  });
});
```

### Mocking Utilities

#### `window.adobeIMS` (Auth-dependent tests)

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

#### `window.lana` (Error logging tests)

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
