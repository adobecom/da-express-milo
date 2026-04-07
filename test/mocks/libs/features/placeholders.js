/**
 * Mock of milo's libs/features/placeholders.js for unit tests.
 */
export async function replaceKeyArray(keys) {
  return keys.reduce((acc, k) => { acc[k] = k; return acc; }, {});
}

export function replaceKey(key) {
  return Promise.resolve(key);
}
