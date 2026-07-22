/* global globalThis */

/**
 * Mock modal module for auth middleware tests.
 * Tracks calls via globalThis.mockGetModalCalls so tests can assert
 * the SUSI-light modal was opened with the expected parameters.
 */
// eslint-disable-next-line import/prefer-default-export
export function getModal(opts) {
  globalThis.mockGetModalCalls = globalThis.mockGetModalCalls || [];
  globalThis.mockGetModalCalls.push(opts);
  return Promise.resolve();
}
