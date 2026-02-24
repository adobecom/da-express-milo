import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { ValidationError } from '../../../../express/code/libs/services/core/Errors.js';

/**
 * Assert that `fn` throws a ValidationError, then run optional extra checks.
 */
export async function expectValidationError(fn, extraAssertions = () => {}) {
  try {
    await fn();
    expect.fail('Should have thrown ValidationError');
  } catch (err) {
    expect(err).to.be.instanceOf(ValidationError);
    extraAssertions(err);
  }
}

/**
 * Build a mock KulerPlugin with sensible defaults that can be overridden.
 */
export function createMockPlugin(overrides = {}) {
  return {
    baseUrl: 'https://test-kuler.com',
    serviceConfig: {
      themeBaseUrl: 'https://themes.test.io',
      gradientBaseUrl: 'https://gradient.test.io',
      likeBaseUrl: 'https://asset.test.io',
      ...overrides.serviceConfig,
    },
    endpoints: {
      search: '/search',
      api: '/api/v2',
      themePath: '/themes',
      gradientPath: '/gradient',
      ...overrides.endpoints,
    },
    getAuthState: sinon.stub().returns({ isLoggedIn: false }),
    getHeaders: sinon.stub().returns({
      'Content-Type': 'application/json',
      'x-api-key': 'test-key',
    }),
    handleResponse: sinon.stub().callsFake((resp) => resp.json()),
    ...overrides,
  };
}

/**
 * Stub `window.fetch` to resolve with a JSON-serialisable `responseData`.
 */
export function stubFetch(responseData = {}) {
  return sinon.stub(window, 'fetch').resolves({
    ok: true,
    status: 200,
    json: () => Promise.resolve(responseData),
  });
}
