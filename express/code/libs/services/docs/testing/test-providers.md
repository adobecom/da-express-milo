## Testing Providers

> **Applies to:** Pattern A plugins with providers (currently kuler, stock)

### Core Testing Framework

Providers must be tested for three core aspects:

1. **Delegation Wiring** — Verify provider methods correctly call plugin actions (see [Delegation Wiring Pattern](./test-helpers.md#delegation-wiring-pattern))
2. **Error Boundary** — Verify `safeExecute` prevents exceptions from leaking
3. **Factory Functions** — Verify factory functions (if present) work correctly

### Setup Pattern

Use the shared `createTestPlugin` helper (see [Shared Test Helpers](./test-helpers.md#shared-test-helpers)):

```javascript
// express/test/services/myPlugin/providers/MyProvider.test.js
import MyProvider from '../../../../code/libs/services/providers/MyProvider.js';
import MyPlugin from '../../../../code/libs/services/plugins/myPlugin/MyPlugin.js';

describe('MyProvider', () => {
  let plugin;
  let provider;

  beforeEach(() => {
    plugin = createTestPlugin(MyPlugin);
    // Stub plugin methods that will be called
    sinon.stub(plugin, 'methodName').resolves(mockData);
    provider = new MyProvider(plugin);
  });

  afterEach(() => sinon.restore());
});
```

### 1. Delegation Wiring

See [Delegation Wiring Pattern](./test-helpers.md#delegation-wiring-pattern) for the reusable pattern. Apply it to each provider method:

```javascript
describe('delegation wiring', () => {
  it('[providerMethod] returns data from plugin', async () => {
    const mockData = { /* expected structure */ };
    plugin.methodName.resolves(mockData);

    const result = await provider.providerMethod();

    expect(result).to.deep.equal(mockData);
    expect(plugin.methodName.calledOnce).to.be.true;
  });

  it('[providerMethod] passes args correctly', async () => {
    await provider.providerMethod('arg1', 'arg2');

    expect(plugin.methodName.calledWith('arg1', 'arg2')).to.be.true;
  });
});
```

### 2. Error Boundary (`safeExecute`)

**Purpose:** Verify all provider methods use `safeExecute` and return `null` on errors.

**Critical:** All provider methods must return `null` on errors, never throw. This is the **outermost** error boundary — it catches errors thrown at every layer below it, including `ValidationError` from action groups and `ApiError` from HTTP calls.

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

### 3. Factory Functions

**Purpose:** Verify factory functions (if present) return correct instances.

```javascript
describe('createMyProvider factory', () => {
  it('should return a MyProvider instance', () => {
    const instance = createMyProvider(plugin);
    expect(instance).to.be.instanceOf(MyProvider);
  });
});
```
