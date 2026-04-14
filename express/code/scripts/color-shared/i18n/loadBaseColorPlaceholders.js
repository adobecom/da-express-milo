import { getLibs } from '../../utils.js';

export const DEFAULT_PLACEHOLDERS = Object.freeze({
  title: 'Base color',
  modeLabel: 'Color mode',
  fieldLabel: 'Base color',
  lockedAria: 'Color locked',
  unlockedAria: 'Color unlocked',
  hexError: 'Please enter a valid 6-character HEX code',
  brightnessContrast: 'Brightness/Contrast',
  channelRed: 'Red',
  channelGreen: 'Green',
  channelBlue: 'Blue',
  channelHue: 'Hue',
  channelSaturation: 'Saturation',
  channelBrightness: 'Brightness',
  channelLightness: 'Lightness',
  channelLabA: 'a (green-red)',
  channelLabB: 'b (blue-yellow)',
});

const PLACEHOLDER_KEY_MAP = Object.freeze({
  title: 'base-color-title',
  modeLabel: 'base-color-mode-label',
  fieldLabel: 'base-color-field-label',
  lockedAria: 'base-color-locked',
  unlockedAria: 'base-color-unlocked',
  hexError: 'base-color-hex-error',
  brightnessContrast: 'base-color-brightness-contrast',
  channelRed: 'base-color-channel-red',
  channelGreen: 'base-color-channel-green',
  channelBlue: 'base-color-channel-blue',
  channelHue: 'base-color-channel-hue',
  channelSaturation: 'base-color-channel-saturation',
  channelBrightness: 'base-color-channel-brightness',
  channelLightness: 'base-color-channel-lightness',
  channelLabA: 'base-color-channel-lab-a',
  channelLabB: 'base-color-channel-lab-b',
});

function isResolvedPlaceholder(value, key) {
  return value && value !== key.replaceAll('-', ' ');
}

export function createBaseColorPlaceholders(overrides = {}) {
  return { ...DEFAULT_PLACEHOLDERS, ...overrides };
}

export default async function loadBaseColorPlaceholders() {
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

    return createBaseColorPlaceholders(overrides);
  } catch {
    return createBaseColorPlaceholders();
  }
}
