import loadPlaceholders from './utils.js';

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
  paletteCta: 'Create with color palette',
  addFavorite: 'Add to favorites',
  removeFavorite: 'Remove from favorites',
  colorModeLabel: 'Color mode',
  codesToggleLabel: 'Copy as code',
  codesDisabledTooltip: 'Copying to code requires RGB, HEX, or Lab',
  noTagsText: 'This color palette has no tags',
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
  paletteCta: 'color-modal-palette-cta',
  addFavorite: 'color-modal-add-favorite',
  removeFavorite: 'color-modal-remove-favorite',
  colorModeLabel: 'color-modal-color-mode-label',
  codesToggleLabel: 'color-modal-codes-toggle-label',
  codesDisabledTooltip: 'color-modal-codes-disabled-tooltip',
  noTagsText: 'color-modal-no-tags-text',
});

export function createColorModalPlaceholders(overrides = {}) {
  return { ...DEFAULT_PLACEHOLDERS, ...overrides };
}

export default function loadColorModalPlaceholders() {
  return loadPlaceholders(PLACEHOLDER_KEY_MAP, createColorModalPlaceholders);
}
