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

// Random preset color pairs in HSV format [h, s, v]
// Picked on initial load to provide variety
export const CONTRAST_PRESETS = [
  { bg: [16, 81, 86], fg: [0, 0, 100] },
  { bg: [326, 52, 90], fg: [192, 100, 29] },
  { bg: [176, 100, 75], fg: [219, 79, 54] },
  { bg: [210, 36, 77], fg: [215, 71, 36] },
  { bg: [179, 100, 48], fg: [42, 73, 100] },
];
