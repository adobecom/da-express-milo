import { getLibs } from '../../scripts/utils.js';

// English fallback copy, used until each row exists in the placeholders sheet.
// Scoped to strings owned by the toolbar, card grid, and input; the filter
// accordion and drawer own their own copy ('fg-all', 'fg-categories',
// 'fg-cool', 'fg-glitch', 'fg-symbol', 'fg-filters', 'fg-close-filters',
// 'fg-promo-title', 'fg-promo-cta') via filters.js/panel.js fetchStrings() —
export const DEFAULT_PLACEHOLDERS = Object.freeze({
  // Input panel
  previewPlaceholder: 'Type the preview text you want to get started...',
  inputLabel: 'Preview text input',
  tryThese: 'Try these:',
  // Comma-separated preview suggestions rendered as pills.
  suggestions: 'The quick brown fox jumps over the lazy dog,ABCDEFGHIJKLMNOPQRSTUVWXYZ,Realigned equestrian fez bewilders picky monarch',
  // Max characters allowed in the preview text input.
  maxLength: 200,
  // Toolbar
  filterTrigger: 'Filter',
  layoutGroupLabel: 'Card layout',
  gridViewLabel: 'Grid view',
  rowViewLabel: 'Row view',
  fontSizeLabel: 'Preview font size',
  fontCountLabel: 'unicode fonts',
  // Card grid / card
  loadMore: 'Load more',
  copyLabel: 'Copy text',
  copiedLabel: 'Copied!',
  copiedMessage: 'Text Copied!',
  sampleText: 'Hello',
  cardCtaText: 'Design With Style',
});

// Authored placeholder keys — namespaced to avoid collisions with other
// blocks sharing the same placeholders sheet (mirrors the convention in
// color-contrast-checker/utils/placeholders.js).
const PLACEHOLDER_KEY_MAP = Object.freeze({
  previewPlaceholder: 'font-generator-placeholder',
  inputLabel: 'font-generator-input-label',
  tryThese: 'font-generator-try-these',
  suggestions: 'font-generator-suggestions',
  maxLength: 'font-generator-max-length',
  filterTrigger: 'font-generator-filter',
  layoutGroupLabel: 'font-generator-layout-group',
  gridViewLabel: 'font-generator-grid-view',
  rowViewLabel: 'font-generator-row-view',
  fontSizeLabel: 'font-generator-font-size',
  fontCountLabel: 'font-generator-font-count',
  loadMore: 'font-generator-load-more',
  copyLabel: 'font-generator-copy',
  copiedLabel: 'font-generator-copied',
  copiedMessage: 'font-generator-copied-message',
  sampleText: 'font-generator-sample-text',
  cardCtaText: 'font-generator-card-cta',
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
      if (!isResolvedPlaceholder(value, key)) return;
      // maxLength is authored as a plain number string; every other
      // placeholder is used verbatim as display copy.
      strings[prop] = prop === 'maxLength' ? (parseInt(value, 10) || DEFAULT_PLACEHOLDERS.maxLength) : value;
    });

    return strings;
  } catch {
    return { ...DEFAULT_PLACEHOLDERS };
  }
}
