export const PASS = 'PASS';
export const FAIL = 'FAIL';

export const CONTRAST_LEVELS = ['AAA', 'AA'];

export const MAX_RECOMMENDATION = 3;

export const HISTORY_LIMIT = 200;

export const WCAG_THRESHOLDS = {
  NORMAL_AA: 4.5,
  LARGE_AA: 3,
  NORMAL_AAA: 7,
  LARGE_AAA: 4.5,
  UI_AA: 3,
};

export function createDefaultActionMenuConfig(placeholders = {}) {
  return {
    navLinks: [
      { id: 'palette', href: '/express/colors/color-wheel', label: placeholders.colorPaletteLabel || 'Color palette' },
      { id: 'contrast', href: '/express/colors/contrast-checker', label: placeholders.contrastCheckerLabel || 'Contrast checker' },
      { id: 'color-blindness', href: '/express/colors/color-blindness', label: placeholders.colorBlindnessLabel || 'Color blindness' },
    ],
    controls: [
      { id: 'undo', label: placeholders.undoLabel || 'Undo' },
      { id: 'redo', label: placeholders.redoLabel || 'Redo' },
    ],
    enableState: true,
  };
}
