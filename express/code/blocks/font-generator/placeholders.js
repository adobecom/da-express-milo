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

function applyResolvedValue(strings, prop, value) {
  strings[prop] = prop === 'maxLength' ? (parseInt(value, 10) || strings.maxLength) : value;
}

// replaceKey()/replaceKeyArray() only ever fetch the default placeholders.json
// — the placeholders-stage metadata flag is wired solely into Milo's {{key}}
// DOM-token flow (decoratePlaceholders/getPlaceholderPaths in utils.js), which
// font-generator doesn't use. Mirror that flag here so authors can stage
// unreleased font-generator copy on non-prod environments the same way.
async function loadStageOverlay(config, fetchPlaceholders, getMetadata) {
  if (config.env?.name === 'prod' || getMetadata('placeholders-stage') !== 'on') return null;
  const placeholderPath = `${config.locale.contentRoot}/placeholders-stage.json`;
  return fetchPlaceholders({ config, placeholderPath });
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
    const [{ getConfig, getMetadata }, { replaceKeyArray, fetchPlaceholders }] = await Promise.all([
      import(`${getLibs()}/utils/utils.js`),
      import(`${getLibs()}/features/placeholders.js`),
    ]);

    const config = getConfig();
    const keys = Object.values(PLACEHOLDER_KEY_MAP);
    const values = await replaceKeyArray(keys, config);
    const strings = { ...DEFAULT_PLACEHOLDERS };

    Object.entries(PLACEHOLDER_KEY_MAP).forEach(([prop, key], index) => {
      const value = values[index];
      if (!isResolvedPlaceholder(value, key)) return;
      applyResolvedValue(strings, prop, value);
    });

    const stagePlaceholders = await loadStageOverlay(config, fetchPlaceholders, getMetadata)
      .catch(() => null);
    if (stagePlaceholders) {
      Object.entries(PLACEHOLDER_KEY_MAP).forEach(([prop, key]) => {
        const value = stagePlaceholders[key];
        if (value !== undefined) applyResolvedValue(strings, prop, value);
      });
    }

    return strings;
  } catch {
    return { ...DEFAULT_PLACEHOLDERS };
  }
}
