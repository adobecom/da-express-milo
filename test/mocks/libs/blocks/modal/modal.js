/* global globalThis */

/**
 * Mock modal module for tests that trigger getModal via getLibs().
 */
// eslint-disable-next-line import/prefer-default-export
export function getModal(opts) {
  globalThis.mockGetModalCalls = globalThis.mockGetModalCalls || [];
  globalThis.mockGetModalCalls.push(opts);
  return Promise.resolve();
}
