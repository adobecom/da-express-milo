import loadPlaceholders from './utils.js';

export const DEFAULT_PLACEHOLDERS = Object.freeze({
  title: 'Edit color',
  dialogAria: 'Edit color',
  modeLabel: 'Color mode',
  paletteColors: 'Palette colors',
  hexLabel: 'HEX',
  hexFieldLabel: 'HEX color value',
  editColorAria: 'Edit color',
  editColorWithHexAria: 'Edit color {{hex}}',
});

const PLACEHOLDER_KEY_MAP = Object.freeze({
  title: 'color-edit-title',
  dialogAria: 'color-edit-dialog-aria',
  modeLabel: 'color-edit-mode-label',
  paletteColors: 'color-edit-palette-colors',
  hexLabel: 'color-edit-hex-label',
  hexFieldLabel: 'color-edit-hex-field-label',
  editColorAria: 'color-edit-dialog-aria',
  editColorWithHexAria: 'color-strip-mobile-edit-color-aria',
});

export function createColorEditPlaceholders(overrides = {}) {
  return { ...DEFAULT_PLACEHOLDERS, ...overrides };
}

export default function loadColorEditPlaceholders() {
  return loadPlaceholders(PLACEHOLDER_KEY_MAP, createColorEditPlaceholders);
}
