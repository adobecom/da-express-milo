import { getLibs } from '../../scripts/utils.js';

export const DEFAULT_PLACEHOLDERS = Object.freeze({
  randomPresetName: 'Random Preset',
  customPaletteName: 'Custom Palette',
  errorMessage: 'Failed to load Contrast Checker.',
  summaryTabLabel: 'Summary',
  suggestionsTabLabel: 'Contrast suggestions',
  setRatioTabLabel: 'Set a contrast ratio',
  largeText: 'Large text',
  smallText: 'Small text',
  graphicsAndUi: 'Graphics and UI',
  largeTextTooltip: 'Refers to 18pt and above for regular font-weight,\nor 14pt and above for bold font-weight',
  smallTextTooltip: 'Refers to 17pt and below for regular font-weight,\nor 13pt and below for bold font-weight',
  graphicsAndUiTooltip: 'Refers to graphical objects or user interface components.',
  pass: 'Pass',
  fail: 'Fail',
  ratioUnitSuffix: ': 1',
  tintValueAriaLabel: 'Tint value',
  tintAdjustmentLabel: 'Tint adjustment',
  contrastRatioAnnouncement: 'Contrast ratio {ratio} to 1',
  contrastRatioLabel: 'Contrast ratio',
  compareEntirePalette: 'Compare entire palette',
  category: 'Category',
  levelAa: 'AA',
  levelAaa: 'AAA',
  foregroundColor: 'Foreground color',
  backgroundColor: 'Background color',
  swapColorsAriaLabel: 'Swap foreground and background colors',
  swap: 'Swap',
  preview: 'Preview',
  highContrastNoSuggestions: 'Your colors have a high contrast ratio. No contrast suggestions available.',
  noSuggestionsAvailable: 'No suggestions available for the current color pair.',
  apply: 'Apply',
  ratio: 'Ratio',
  refresh: 'Refresh',
  seePreview: 'See preview',
  setContrastRatio: 'Set contrast ratio',
  ratioInputHelpText: 'Enter a value between 1 and 20',
  noTargetRatioSuggestions: 'Could not find colors meeting the target ratio.',
  colorValueAriaLabel: 'Color value',
});

const PLACEHOLDER_KEY_MAP = Object.freeze({
  randomPresetName: 'contrast-checker-random-preset-name',
  customPaletteName: 'contrast-checker-custom-palette-name',
  errorMessage: 'contrast-checker-error-message',
  summaryTabLabel: 'contrast-checker-summary-tab-label',
  suggestionsTabLabel: 'contrast-checker-suggestions-tab-label',
  setRatioTabLabel: 'contrast-checker-set-ratio-tab-label',
  largeText: 'contrast-checker-large-text-label',
  smallText: 'contrast-checker-small-text-label',
  graphicsAndUi: 'contrast-checker-graphics-ui-label',
  largeTextTooltip: 'contrast-checker-large-text-tooltip',
  smallTextTooltip: 'contrast-checker-small-text-tooltip',
  graphicsAndUiTooltip: 'contrast-checker-graphics-ui-tooltip',
  pass: 'contrast-checker-pass-label',
  fail: 'contrast-checker-fail-label',
  ratioUnitSuffix: 'contrast-checker-ratio-unit-suffix',
  tintValueAriaLabel: 'contrast-checker-tint-value-aria-label',
  tintAdjustmentLabel: 'contrast-checker-tint-adjustment-label',
  contrastRatioAnnouncement: 'contrast-checker-contrast-ratio-announcement',
  contrastRatioLabel: 'contrast-checker-contrast-ratio-label',
  compareEntirePalette: 'contrast-checker-compare-entire-palette',
  category: 'contrast-checker-category-label',
  levelAa: 'contrast-checker-level-aa',
  levelAaa: 'contrast-checker-level-aaa',
  foregroundColor: 'contrast-checker-foreground-color-label',
  backgroundColor: 'contrast-checker-background-color-label',
  swapColorsAriaLabel: 'contrast-checker-swap-colors-aria-label',
  swap: 'contrast-checker-swap-label',
  preview: 'contrast-checker-preview-label',
  highContrastNoSuggestions: 'contrast-checker-high-contrast-no-suggestions',
  noSuggestionsAvailable: 'contrast-checker-no-suggestions-available',
  apply: 'contrast-checker-apply-label',
  ratio: 'contrast-checker-ratio-label',
  refresh: 'contrast-checker-refresh-label',
  seePreview: 'contrast-checker-see-preview-label',
  setContrastRatio: 'contrast-checker-set-contrast-ratio-label',
  ratioInputHelpText: 'contrast-checker-ratio-input-help-text',
  noTargetRatioSuggestions: 'contrast-checker-no-target-ratio-suggestions',
  colorValueAriaLabel: 'contrast-checker-color-value-aria-label',
});

function isResolvedPlaceholder(value, key) {
  return value && value !== key.replaceAll('-', ' ');
}

export function createContrastCheckerPlaceholders(overrides = {}) {
  const strings = {
    ...DEFAULT_PLACEHOLDERS,
    ...overrides,
  };

  return {
    ...strings,
    tabs: [
      { label: strings.summaryTabLabel, value: 'summary' },
      { label: strings.suggestionsTabLabel, value: 'suggestions' },
      { label: strings.setRatioTabLabel, value: 'set-ratio' },
    ],
  };
}

export default async function loadContrastCheckerPlaceholders() {
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

    return createContrastCheckerPlaceholders(overrides);
  } catch {
    return createContrastCheckerPlaceholders();
  }
}
