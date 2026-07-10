import { getLibs } from '../../scripts/utils.js';

// English fallback copy, used until each row exists in the placeholders sheet.
export const DEFAULT_PLACEHOLDERS = Object.freeze({
  filterTrigger: 'Filter',
  closeFilters: 'Close',
  categories: 'Categories',
  tryThese: 'Try these:',
  previewPlaceholder: 'Type the preview text you want to get started...',
  allCategory: 'All',
});

// Authored placeholder keys — namespaced to avoid collisions with other
// blocks sharing the same placeholders sheet (mirrors the convention in
// color-contrast-checker/utils/placeholders.js).
const PLACEHOLDER_KEY_MAP = Object.freeze({
  filterTrigger: 'font-generator-filter',
  closeFilters: 'font-generator-close',
  categories: 'font-generator-categories',
  tryThese: 'font-generator-try-these',
  previewPlaceholder: 'font-generator-placeholder',
  allCategory: 'font-generator-all',
});

// replaceKey()/replaceKeyArray() echo the humanized key back (e.g.
// "font-generator-close" -> "font generator close") rather than a falsy
// value when no placeholder is authored for it yet, so truthiness alone
// can't detect a miss.
function isResolvedPlaceholder(value, key) {
  return value && value !== key.replaceAll('-', ' ');
}

/**
 * Resolves every font-generator placeholder string in a single batched
 * lookup, falling back to DEFAULT_PLACEHOLDERS for any key not yet authored
 * into the placeholders sheet.
 *
 * @returns {Promise<typeof DEFAULT_PLACEHOLDERS>}
 */
export default async function loadFontGeneratorPlaceholders() {
  try {
    const [{ getConfig }, { replaceKeyArray }] = await Promise.all([
      import(`${getLibs()}/utils/utils.js`),
      import(`${getLibs()}/features/placeholders.js`),
    ]);

    const keys = Object.values(PLACEHOLDER_KEY_MAP);
    const values = await replaceKeyArray(keys, getConfig());
    const strings = { ...DEFAULT_PLACEHOLDERS };

    Object.entries(PLACEHOLDER_KEY_MAP).forEach(([prop, key], index) => {
      const value = values[index];
      if (isResolvedPlaceholder(value, key)) strings[prop] = value;
    });

    return strings;
  } catch {
    return { ...DEFAULT_PLACEHOLDERS };
  }
}
