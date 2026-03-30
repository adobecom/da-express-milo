import { getLibs } from '../../../scripts/utils.js';

export const DEFAULT_PLACEHOLDERS = Object.freeze({
  randomPresetName: 'Random Preset',
  customPaletteName: 'Custom Palette',
  errorMessage: 'Failed to load Contrast Checker.',
  summaryTabLabel: 'Summary',
  suggestionsTabLabel: 'Contrast suggestions',
  setRatioTabLabel: 'Set a contrast ratio',
  colorPaletteLabel: 'Color palette',
  contrastCheckerLabel: 'Contrast checker',
  colorBlindnessLabel: 'Color blindness',
  undoLabel: 'Undo',
  redoLabel: 'Redo',
  largeText: 'Large text',
  smallText: 'Small text',
  graphicsAndUi: 'Graphics and UI',
  largeTextTooltip: 'Refers to 18pt and above for regular font-weight,\nor 14pt and above for bold font-weight',
  smallTextTooltip: 'Refers to 17pt and below for regular font-weight,\nor 13pt and below for bold font-weight',
  graphicsAndUiTooltip: 'Refers to graphical objects or user interface components.',
  pass: 'Pass',
  fail: 'Fail',
  ratioUnitSuffix: ': 1',
  contrastRatioTooltip: 'Ensure your color choices meet WCAG compliance',
  tintValueAriaLabel: 'Tint value',
  tintAdjustmentLabel: 'Tint adjustment',
  contrastRatioAnnouncement: 'Contrast ratio {ratio} to 1',
  contrastRatioLabel: 'Contrast ratio',
  compareEntirePalette: 'Compare entire palette',
  category: 'Category',
  levelAa: 'AA',
  levelAaa: 'AAA',
  levelAaTooltip: 'Must meet a ratio of 3:1',
  levelAaaTooltip: 'Must meet a ratio of 4.5:1',
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
  randomPresetName: 'color-contrast-checker-random-preset-name',
  customPaletteName: 'color-contrast-checker-custom-palette-name',
  errorMessage: 'color-contrast-checker-error-message',
  summaryTabLabel: 'color-contrast-checker-summary-tab-label',
  suggestionsTabLabel: 'color-contrast-checker-suggestions-tab-label',
  setRatioTabLabel: 'color-contrast-checker-set-ratio-tab-label',
  colorPaletteLabel: 'color-contrast-checker-color-palette-label',
  contrastCheckerLabel: 'color-contrast-checker-label',
  colorBlindnessLabel: 'color-contrast-checker-color-blindness-label',
  undoLabel: 'color-contrast-checker-undo-label',
  redoLabel: 'color-contrast-checker-redo-label',
  largeText: 'color-contrast-checker-large-text-label',
  smallText: 'color-contrast-checker-small-text-label',
  graphicsAndUi: 'color-contrast-checker-graphics-ui-label',
  largeTextTooltip: 'color-contrast-checker-large-text-tooltip',
  smallTextTooltip: 'color-contrast-checker-small-text-tooltip',
  graphicsAndUiTooltip: 'color-contrast-checker-graphics-ui-tooltip',
  pass: 'color-contrast-checker-pass-label',
  fail: 'color-contrast-checker-fail-label',
  ratioUnitSuffix: 'color-contrast-checker-ratio-unit-suffix',
  contrastRatioTooltip: 'color-contrast-checker-contrast-ratio-tooltip',
  tintValueAriaLabel: 'color-contrast-checker-tint-value-aria-label',
  tintAdjustmentLabel: 'color-contrast-checker-tint-adjustment-label',
  contrastRatioAnnouncement: 'color-contrast-checker-contrast-ratio-announcement',
  contrastRatioLabel: 'color-contrast-checker-contrast-ratio-label',
  compareEntirePalette: 'color-contrast-checker-compare-entire-palette',
  category: 'color-contrast-checker-category-label',
  levelAa: 'color-contrast-checker-level-aa',
  levelAaa: 'color-contrast-checker-level-aaa',
  levelAaTooltip: 'color-contrast-checker-level-aa-tooltip',
  levelAaaTooltip: 'color-contrast-checker-level-aaa-tooltip',
  foregroundColor: 'color-contrast-checker-foreground-color-label',
  backgroundColor: 'color-contrast-checker-background-color-label',
  swapColorsAriaLabel: 'color-contrast-checker-swap-colors-aria-label',
  swap: 'color-contrast-checker-swap-label',
  preview: 'color-contrast-checker-preview-label',
  highContrastNoSuggestions: 'color-contrast-checker-high-contrast-no-suggestions',
  noSuggestionsAvailable: 'color-contrast-checker-no-suggestions-available',
  apply: 'color-contrast-checker-apply-label',
  ratio: 'color-contrast-checker-ratio-label',
  refresh: 'color-contrast-checker-refresh-label',
  seePreview: 'color-contrast-checker-see-preview-label',
  setContrastRatio: 'color-contrast-checker-set-contrast-ratio-label',
  ratioInputHelpText: 'color-contrast-checker-ratio-input-help-text',
  noTargetRatioSuggestions: 'color-contrast-checker-no-target-ratio-suggestions',
  colorValueAriaLabel: 'color-contrast-checker-color-value-aria-label',
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
