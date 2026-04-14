import { getLibs } from '../../utils.js';

export const DEFAULT_PLACEHOLDERS = Object.freeze({
  title: 'Edit color',
  dialogAria: 'Edit color',
  modeLabel: 'Color mode',
  paletteColors: 'Palette colors',
  hexLabel: 'HEX',
  hexFieldLabel: 'HEX color value',
});

const PLACEHOLDER_KEY_MAP = Object.freeze({
  title: 'color-edit-title',
  dialogAria: 'color-edit-dialog-aria',
  modeLabel: 'color-edit-mode-label',
  paletteColors: 'color-edit-palette-colors',
  hexLabel: 'color-edit-hex-label',
  hexFieldLabel: 'color-edit-hex-field-label',
});

function isResolvedPlaceholder(value, key) {
  return value && value !== key.replaceAll('-', ' ');
}

export function createColorEditPlaceholders(overrides = {}) {
  return { ...DEFAULT_PLACEHOLDERS, ...overrides };
}

export default async function loadColorEditPlaceholders() {
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

    return createColorEditPlaceholders(overrides);
  } catch {
    return createColorEditPlaceholders();
  }
}
