import loadPlaceholders from './utils.js';

export const DEFAULT_PLACEHOLDERS = Object.freeze({
  sliderAria: 'Before and after comparison',
  sliderValueText: '{original}% original, {effect}% {effectName}',
  tablistAria: 'Image sandbox controls',
  tabEffects: 'Image effects',
  tabImages: 'Change image',
  effectsTitle: 'Add an image effect',
  imagesTitle: 'Try a different image',
  effectGrayscale: 'Greyscale',
  effectColorPunch: 'Color punch',
  effectDuotone: 'Duotone',
  effectApplied: '{effectName} effect applied',
  imageSelected: '{imageName} image selected',
});

const PLACEHOLDER_KEY_MAP = Object.freeze({
  sliderAria: 'image-reveal-slider-aria',
  sliderValueText: 'image-reveal-slider-value-text',
  tablistAria: 'image-reveal-tablist-aria',
  tabEffects: 'image-reveal-tab-effects',
  tabImages: 'image-reveal-tab-images',
  effectsTitle: 'image-reveal-effects-title',
  imagesTitle: 'image-reveal-images-title',
  effectGrayscale: 'image-reveal-effect-grayscale',
  effectColorPunch: 'image-reveal-effect-color-punch',
  effectDuotone: 'image-reveal-effect-duotone',
  effectApplied: 'image-reveal-effect-applied',
  imageSelected: 'image-reveal-image-selected',
});

export function createImageRevealPlaceholders(overrides = {}) {
  return { ...DEFAULT_PLACEHOLDERS, ...overrides };
}

export default function loadImageRevealPlaceholders() {
  return loadPlaceholders(PLACEHOLDER_KEY_MAP, createImageRevealPlaceholders);
}
