/**
 * Mock of milo's libs/features/placeholders.js for unit tests.
 * Falls back to the key name when no placeholder is registered,
 * matching the behaviour of the real milo implementation.
 */
export async function replaceKeyArray(keys) {
  return keys.map((k) => window.placeholders?.[k] ?? k);
}

export function replaceKey(key) {
  return Promise.resolve(window.placeholders?.[key] ?? key);
}
