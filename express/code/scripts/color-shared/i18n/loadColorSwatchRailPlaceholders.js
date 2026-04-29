import loadPlaceholders from './utils.js';

export const DEFAULT_PLACEHOLDERS = Object.freeze({
  // Toasts + screen-reader announcements
  copiedToast: 'Copied to clipboard',
  copyFailedToast: 'Failed to copy',
  colorRemovedToast: 'Color removed',
  colorAddedToast: 'Color added',
  reorderedToast: 'Reordered',
  colorLockedToast: 'Color locked',
  colorUnlockedToast: 'Color unlocked',
  baseColorSetToast: 'Base color set',
  baseColorClearedToast: 'Base color cleared',
  // Button aria-label + title
  copyHex: 'Copy hex',
  editColor: 'Edit color',
  editTint: 'Edit tint',
  lockColor: 'Lock color',
  unlockColor: 'Unlock color',
  deleteColor: 'Delete color',
  addColor: 'Add color',
  addColorLeft: 'Add color left',
  addColorRight: 'Add color right',
  dragToReorder: 'Drag to reorder',
  // Aria labels (non-button)
  baseColor: 'Base color',
  baseColorActiveAria: 'Base color is the basis for color harmony rules',
  setAsBaseColor: 'Set as base color',
  simulatedColor: 'Simulated color',
  conflictDetected: 'Conflict detected',
  colorPaletteAria: 'Color palette',
  // Templates use {{token}} placeholders; translators must keep tokens intact
  colorStripAria: '{{hex}} color strip',
  colorPositionAria: 'Color {{index}}, {{hex}}',
  tintAndShadeAria: 'Tint and shade options for color {{index}}',
  // Tone names + tint-band tooltip template
  toneBase: 'Base color',
  toneTint: 'Tint',
  toneShade: 'Shade',
  tintBandAria: '{{tone}}, {{index}} of {{total}}, {{hex}}',
});

const PLACEHOLDER_KEY_MAP = Object.freeze({
  copiedToast: 'color-swatch-copied-toast',
  copyFailedToast: 'color-swatch-copy-failed-toast',
  colorRemovedToast: 'color-swatch-removed-toast',
  colorAddedToast: 'color-swatch-added-toast',
  reorderedToast: 'color-swatch-reordered-toast',
  copyHex: 'color-swatch-copy-hex',
  editColor: 'color-swatch-edit-color',
  editTint: 'color-swatch-edit-tint',
  lockColor: 'color-swatch-lock-color',
  unlockColor: 'color-swatch-unlock-color',
  deleteColor: 'color-swatch-delete-color',
  addColor: 'color-swatch-add-color',
  addColorLeft: 'color-swatch-add-color-left',
  addColorRight: 'color-swatch-add-color-right',
  dragToReorder: 'color-swatch-drag-to-reorder',
  baseColor: 'color-swatch-base-color',
  baseColorActiveAria: 'color-swatch-base-color-active-aria',
  setAsBaseColor: 'color-swatch-set-as-base-color',
  simulatedColor: 'color-swatch-simulated-color',
  conflictDetected: 'color-swatch-conflict-detected',
  colorPaletteAria: 'color-swatch-palette-aria',
  colorStripAria: 'color-swatch-strip-aria',
  colorPositionAria: 'color-swatch-position-aria',
  tintAndShadeAria: 'color-swatch-tint-shade-aria',
  toneBase: 'color-swatch-tone-base',
  toneTint: 'color-swatch-tone-tint',
  toneShade: 'color-swatch-tone-shade',
  tintBandAria: 'color-swatch-tint-band-aria',
});

export function createColorSwatchRailPlaceholders(overrides = {}) {
  return { ...DEFAULT_PLACEHOLDERS, ...overrides };
}

export default function loadColorSwatchRailPlaceholders() {
  return loadPlaceholders(PLACEHOLDER_KEY_MAP, createColorSwatchRailPlaceholders);
}
