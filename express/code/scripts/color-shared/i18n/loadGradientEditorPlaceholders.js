import { getLibs } from '../../utils.js';

export const DEFAULT_PLACEHOLDERS = Object.freeze({
  ariaLabel: 'Gradient editor',
  announceEnter: 'Gradient editor. Use arrow keys to move stops. Press Escape to exit.',
  announceLeft: 'Left gradient editor.',
  announceAdjust: 'Gradient editor. Press Enter to adjust color stops.',
  copySuccessSr: 'Color copied',
  copySuccessToast: 'Copied to clipboard',
  copyFailedSr: 'Copy failed',
  copyFailedToast: 'Copy failed',
  handleAria: 'Color handle for {hex}',
  copyHandleAria: 'Copy {hex}',
  copyLabel: 'Copy #{hex}',
  stopBetweenAria: 'Gradient stop between {leftHex} and {rightHex}',
  handlePosition: 'Color handle at {pct}%',
  stopPosition: 'Gradient stop at {pct}%',
});

const PLACEHOLDER_KEY_MAP = Object.freeze({
  ariaLabel: 'gradient-editor-aria-label',
  announceEnter: 'gradient-editor-announce-enter',
  announceLeft: 'gradient-editor-announce-left',
  announceAdjust: 'gradient-editor-announce-adjust',
  copySuccessSr: 'gradient-editor-copy-success-sr',
  copySuccessToast: 'gradient-editor-copy-success-toast',
  copyFailedSr: 'gradient-editor-copy-failed-sr',
  copyFailedToast: 'gradient-editor-copy-failed-toast',
  handleAria: 'gradient-editor-handle-aria',
  copyHandleAria: 'gradient-editor-copy-handle-aria',
  copyLabel: 'gradient-editor-copy-label',
  stopBetweenAria: 'gradient-editor-stop-between-aria',
  handlePosition: 'gradient-editor-handle-position',
  stopPosition: 'gradient-editor-stop-position',
});

function isResolvedPlaceholder(value, key) {
  return value && value !== key.replaceAll('-', ' ');
}

export function createGradientEditorPlaceholders(overrides = {}) {
  return { ...DEFAULT_PLACEHOLDERS, ...overrides };
}

export default async function loadGradientEditorPlaceholders() {
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

    return createGradientEditorPlaceholders(overrides);
  } catch {
    return createGradientEditorPlaceholders();
  }
}
