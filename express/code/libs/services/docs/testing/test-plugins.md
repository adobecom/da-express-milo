## Testing Plugins

> **Applies to:** All plugin patterns (A, B, and C)

### Core Testing Framework

Plugins must be tested for:

1. **Feature Flag Gating** — Verify `isActivated()` respects feature flags *(all plugins)*
2. **Handler Registration** — Verify handlers are registered on construction *(Pattern A and B only)*

### 1. Feature Flag Gating (`isActivated`)

**Purpose:** Verify plugin activation respects feature flags correctly.

**Pattern:**
- Test all feature flag scenarios systematically using parameterized tests with `forEach`
- Feature flag name should be `ENABLE_[PLUGIN_NAME_UPPERCASE]`

```javascript
// express/test/services/myPlugin/MyPlugin.test.js
import MyPlugin from '../../../code/libs/services/plugins/myPlugin/MyPlugin.js';

describe('MyPlugin', () => {
  let plugin;

  beforeEach(() => {
    plugin = createTestPlugin(MyPlugin);
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

### 2. Handler Registration

> **Applies to:** Pattern A (action groups) and Pattern B (direct handlers) only

**Purpose:** Verify handlers are registered on construction.

**Pattern:**
- Verify `topicRegistry` is populated
- For Pattern A: also verify action groups are registered via `getActionGroupNames()`

```javascript
describe('handler registration', () => {
  it('plugin registers handlers on construction', () => {
    const plugin = createTestPlugin(MyPlugin);
    expect(plugin.topicRegistry.size).to.be.greaterThan(0);
  });

  // Pattern A only (action groups)
  it('plugin registers action groups on construction', () => {
    const plugin = createTestPlugin(MyPlugin);
    expect(plugin.getActionGroupNames()).to.have.length.greaterThan(0);
  });
});
```

---

## Testing Direct-Method Plugins

> **Applies to:** Pattern C plugins that extend `BaseApiService` and expose methods directly without topic dispatch (currently behance, cclibrary, reportAbuse, universal, userFeedback, userSettings)

These plugins call HTTP endpoints via inherited `get()` / `post()` / `put()` / `delete()` methods from `BaseApiService`. Testing focuses on HTTP interactions rather than topic routing.

### Core Testing Framework

Direct-method plugins must be tested for these core aspects:

1. **HTTP Request Correctness** — Verify correct URL, method, headers, and body
2. **Response Handling** — Verify success parsing and `ApiError` on failure
3. **Auth Behavior** — Verify auth headers are included when user is signed in
4. **Default Parameters** — Verify defaults for optional arguments
5. **Config Resolution** — Verify `baseUrl` / `apiKey` resolve correctly (if overridden)

### Setup Pattern

Mock `window.fetch` at the global level rather than stubbing plugin internals:

```javascript
// express/test/services/myPlugin/MyPlugin.test.js
import MyPlugin from '../../../code/libs/services/plugins/myPlugin/MyPlugin.js';
import { ApiError } from '../../../code/libs/services/core/Errors.js';

describe('MyPlugin', () => {
  let plugin;
  let fetchStub;

  beforeEach(() => {
    plugin = createTestPlugin(MyPlugin, {
      serviceConfig: {
        baseUrl: 'https://api.example.com',
        apiKey: 'test-key',
        endpoints: { items: '/v1/items' },
      },
    });

    fetchStub = sinon.stub(window, 'fetch').resolves({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ items: [] }),
    });

    // Auth mock (see test-helpers.md)
    window.adobeIMS = {
      isSignedInUser: sinon.stub().returns(true),
      getAccessToken: sinon.stub().returns({ token: 'mock-token' }),
    };
  });

  afterEach(() => {
    sinon.restore();
    delete window.adobeIMS;
  });
});
```

### 1. HTTP Request Correctness

**Purpose:** Verify the plugin builds the correct URL, method, headers, and body for each API call.

```javascript
describe('[pluginMethod] - HTTP request', () => {
  it('should call correct endpoint with expected method', async () => {
    await plugin.pluginMethod({ query: 'test' });

    expect(fetchStub.calledOnce).to.be.true;
    const [url, opts] = fetchStub.firstCall.args;
    expect(url).to.include('/v1/items');
    expect(url).to.include('q=test');
    expect(opts.method).to.equal('GET');
  });

  it('should include API key in headers', async () => {
    await plugin.pluginMethod();

    const [, opts] = fetchStub.firstCall.args;
    expect(opts.headers['x-api-key']).to.equal('test-key');
  });

  // For POST methods with body
  it('should send correct request body', async () => {
    const payload = { name: 'test' };
    await plugin.pluginMethod(payload);

    const [, opts] = fetchStub.firstCall.args;
    expect(JSON.parse(opts.body)).to.deep.equal(payload);
    expect(opts.headers['Content-Type']).to.equal('application/json');
  });

  // For methods that send FormData
  it('should send FormData for file uploads', async () => {
    await plugin.pluginMethod({ file: new Blob(['data']) });

    const [, opts] = fetchStub.firstCall.args;
    expect(opts.body).to.be.instanceOf(FormData);
  });
});
```

### 2. Response Handling

**Purpose:** Verify success and error responses are handled correctly. Successful responses should return parsed JSON. Non-OK responses should throw `ApiError`.

```javascript
describe('[pluginMethod] - response handling', () => {
  it('should return parsed JSON on success', async () => {
    const mockResponse = { items: [{ id: 1 }] };
    fetchStub.resolves({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await plugin.pluginMethod();
    expect(result).to.deep.equal(mockResponse);
  });

  it('should throw ApiError on non-OK response', async () => {
    fetchStub.resolves({
      ok: false,
      status: 404,
      text: () => Promise.resolve('Not found'),
    });

    try {
      await plugin.pluginMethod();
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).to.be.instanceOf(ApiError);
    }
  });

  it('should throw on network failure', async () => {
    fetchStub.rejects(new TypeError('Failed to fetch'));

    try {
      await plugin.pluginMethod();
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).to.be.instanceOf(TypeError);
    }
  });
});
```

### 3. Auth Behavior

**Purpose:** Verify auth headers are present when the user is signed in and absent when not.

```javascript
describe('[pluginMethod] - auth', () => {
  it('should include Authorization header when signed in', async () => {
    window.adobeIMS.isSignedInUser.returns(true);
    await plugin.pluginMethod();

    const [, opts] = fetchStub.firstCall.args;
    expect(opts.headers.Authorization).to.include('mock-token');
  });

  it('should omit Authorization header when not signed in', async () => {
    window.adobeIMS.isSignedInUser.returns(false);
    window.adobeIMS.getAccessToken.returns(null);
    await plugin.pluginMethod();

    const [, opts] = fetchStub.firstCall.args;
    expect(opts.headers.Authorization).to.be.undefined;
  });
});
```

### 4. Default Parameters

**Purpose:** Verify optional parameters fall back to sensible defaults.

```javascript
describe('[pluginMethod] - defaults', () => {
  it('should use default sort and page when not provided', async () => {
    await plugin.pluginMethod({ query: 'test' });

    const [url] = fetchStub.firstCall.args;
    expect(url).to.include('sort=featured_date');
    expect(url).to.include('page=1');
  });

  it('should allow overriding defaults', async () => {
    await plugin.pluginMethod({ query: 'test', sort: 'popular', page: 3 });

    const [url] = fetchStub.firstCall.args;
    expect(url).to.include('sort=popular');
    expect(url).to.include('page=3');
  });
});
```

### 5. Config Resolution

**Purpose:** Verify plugins that resolve `baseUrl` or `apiKey` from non-standard config paths do so correctly. Some plugins pull these from nested `appConfig` properties rather than `serviceConfig`.

```javascript
describe('config resolution', () => {
  it('should resolve baseUrl from appConfig override', () => {
    const plugin = createTestPlugin(MyPlugin, {
      appConfig: { services: { myService: { baseUrl: 'https://override.com' } } },
    });
    expect(plugin.baseUrl).to.equal('https://override.com');
  });

  it('should fall back to serviceConfig baseUrl', () => {
    const plugin = createTestPlugin(MyPlugin);
    expect(plugin.baseUrl).to.equal('https://test.com');
  });
});
```

---

## Testing Middleware

> **Applies to:** All plugin patterns (middleware runs in the dispatch pipeline)

Middleware follows a specific signature that's easy to test:

```javascript
import myMiddleware from '../../../code/libs/services/middlewares/my.middleware.js';

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
