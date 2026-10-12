import { getLibs } from '../../utils.js';
import loadPlaceholders, { isResolvedPlaceholder } from './utils.js';
import {
  createImageUploadPlaceholders,
  PLACEHOLDER_KEY_MAP as UPLOAD_PLACEHOLDER_KEY_MAP,
} from './loadImageUploadPlaceholders.js';

const PROPERTIES = [
  'landingAria', 'analyzingImage', 'dropOverlayText', 'noImageTryOurs', 'useThisImage',
  'toolbarAria', 'colorSpace', 'colorSpaceHelp', 'srgb', 'p3', 'replaceImage', 'savePng',
  'expand', 'minimize', 'fit', 'fill', 'comparison', 'original', 'analysis', 'dimensions',
  'legend', 'largeText', 'largeTextHelp', 'smallText', 'smallTextHelp', 'green', 'passes',
  'greenLarge', 'greenSmall', 'blue', 'partial', 'blueLarge', 'blueSmall', 'dark', 'fails',
  'darkDescription', 'darkSize', 'unsupportedFile', 'fileTooLarge', 'imageTooLarge',
  'unsupportedProfile', 'p3Unavailable', 'analysisError', 'saveError', 'saved',
];

export const PLACEHOLDER_KEY_MAP = Object.freeze(Object.fromEntries(PROPERTIES.map((property) => [
  property, `color-image-contrast-checker-${property.replace(/[A-Z]/g, '-$&').toLowerCase()}`,
])));

export function validatePlaceholders(strings) {
  const missing = PROPERTIES.filter((property) => typeof strings[property] !== 'string'
    || !strings[property].trim());
  if (missing.length) {
    throw new Error(`Missing image contrast placeholders: ${missing.map((key) => PLACEHOLDER_KEY_MAP[key]).join(', ')}`);
  }
  return strings;
}

async function loadWithMetadata(keyMap) {
  const { getMetadata } = await import(`${getLibs()}/utils/utils.js`);
  return loadPlaceholders(keyMap, (overrides = {}) => {
    const strings = { ...overrides };
    Object.entries(keyMap).forEach(([property, key]) => {
      if (property in strings
        && (typeof strings[property] !== 'string'
          || (strings[property].trim() && isResolvedPlaceholder(strings[property], key)))) return;
      delete strings[property];
      const value = getMetadata(key);
      if (typeof value === 'string' && value.trim() && isResolvedPlaceholder(value, key)) {
        strings[property] = value;
      }
    });
    return strings;
  });
}

export async function loadColorImageContrastUploadPlaceholders() {
  return createImageUploadPlaceholders(await loadWithMetadata(UPLOAD_PLACEHOLDER_KEY_MAP));
}

export default async function loadColorImageContrastCheckerPlaceholders() {
  const strings = await loadWithMetadata(PLACEHOLDER_KEY_MAP);
  return validatePlaceholders(strings);
}
