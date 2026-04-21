/**
 * Mock of milo's libs/features/placeholders.js for unit tests.
 */
export async function replaceKeyArray(keys) {
  const acc = {};
  keys.forEach((k) => { acc[k] = k; });
  return acc;
}

export function replaceKey(key) {
  return Promise.resolve(key);
}
