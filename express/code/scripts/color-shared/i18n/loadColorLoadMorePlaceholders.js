import { getLibs } from '../../utils.js';

export const DEFAULT_PLACEHOLDERS = Object.freeze({
  label: 'Load more',
  ariaLabel: 'Load {remaining} more items',
});

const PLACEHOLDER_KEY_MAP = Object.freeze({
  label: 'color-load-more-label',
  ariaLabel: 'color-load-more-aria',
});

function isResolvedPlaceholder(value, key) {
  return value && value !== key.replaceAll('-', ' ');
}

export function createColorLoadMorePlaceholders(overrides = {}) {
  return { ...DEFAULT_PLACEHOLDERS, ...overrides };
}

export default async function loadColorLoadMorePlaceholders() {
  try {
    const [{ getConfig }, { replaceKeyArray }] = await Promise.all([
      import(`${getLibs()}/utils/utils.js`),
      import(`${getLibs()}/features/placeholders.js`),
    ]);

    const keys = Object.values(PLACEHOLDER_KEY_MAP);
    const values = await replaceKeyArray(keys, getConfig());
    const overrides = {};

    Object.entries(PLACEHOLDER_KEY_MAP).forEach(([prop, key], index) => {
      const value = values[index];
      if (isResolvedPlaceholder(value, key)) {
        overrides[prop] = value;
      }
    });

    return createColorLoadMorePlaceholders(overrides);
  } catch {
    return createColorLoadMorePlaceholders();
  }
}
