import { getLibs } from '../../utils.js';

export const DEFAULT_PLACEHOLDERS = Object.freeze({
  closeAria: 'Close modal',
  defaultTitle: 'Modal',
  noContent: 'No content provided',
  announceClosed: '{title} modal closed',
  announceOpened: '{title} modal opened',
  gradientTagsAria: 'Palette tags',
  gradientActionsAria: 'Palette actions',
  gradientCta: 'Open gradient in Adobe Express',
  gradientCopyHex: 'Copy #{hex}',
  gradientPaletteAria: 'Selected color palette, {count} colors',
  gradientPreviewAria: 'Gradient preview, {count} colors',
});

const PLACEHOLDER_KEY_MAP = Object.freeze({
  closeAria: 'color-modal-close-aria',
  defaultTitle: 'color-modal-default-title',
  noContent: 'color-modal-no-content',
  announceClosed: 'color-modal-announce-closed',
  announceOpened: 'color-modal-announce-opened',
  gradientTagsAria: 'color-modal-gradient-tags-aria',
  gradientActionsAria: 'color-modal-gradient-actions-aria',
  gradientCta: 'color-modal-gradient-cta',
  gradientCopyHex: 'color-modal-gradient-copy-hex',
  gradientPaletteAria: 'color-modal-gradient-palette-aria',
  gradientPreviewAria: 'color-modal-gradient-preview-aria',
});

function isResolvedPlaceholder(value, key) {
  return value && value !== key.replaceAll('-', ' ');
}

export function createColorModalPlaceholders(overrides = {}) {
  return { ...DEFAULT_PLACEHOLDERS, ...overrides };
}

export default async function loadColorModalPlaceholders() {
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

    return createColorModalPlaceholders(overrides);
  } catch {
    return createColorModalPlaceholders();
  }
}
