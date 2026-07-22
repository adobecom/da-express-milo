import { getLibs } from '../../utils.js';

export const DEFAULT_SHARED_PLACEHOLDERS = Object.freeze({
  typeTritan: 'Tritanopia',
  typeProtan: 'Protanopia',
  typeDeutan: 'Deuteranopia',
  typeDescTritan: 'Blue-yellow color blindness',
  typeDescProtan: 'Red-green color blindness',
  typeDescDeutan: 'Red-green color blindness',
  tooltip: 'The conflicts between colors are shown with a caution symbol.',
  summary: 'Potential color blind conflicts',
  statusNone: 'None',
  statusNoConflicts: 'No conflicts',
  statusConflictsFound: 'Conflicts found',
  mobilePaletteHeader: 'Palette',
  conflictIconAria: 'Conflict',
  badgeNoneAria: 'No color blind conflicts',
  badgeConflictsAria: 'Color blind conflicts found',
});

export const DEFAULT_BLOCK_PLACEHOLDERS = Object.freeze({
  sectionAria: 'Color blindness simulator',
  navCreatePalette: 'Create palette',
  navContrastChecker: 'Contrast Checker',
  navColorBlindness: 'Color Blindness Simulator',
  controlUndo: 'Undo',
  controlRedo: 'Redo',
  wheelAria: 'Color wheel',
  wheelFocusAnnouncement: 'Color wheel',
  conflictsFocusAnnouncement: 'The conflicts between colors are shown with a caution symbol.',
  blockError: 'Failed to load Color Blindness.',
  markerAriaTemplate: '{hex}, use arrow keys to move',
});

const SHARED_KEY_MAP = Object.freeze({
  typeTritan: 'color-blindness-type-tritan',
  typeProtan: 'color-blindness-type-protan',
  typeDeutan: 'color-blindness-type-deutan',
  typeDescTritan: 'color-blindness-type-desc-tritan',
  typeDescProtan: 'color-blindness-type-desc-protan',
  typeDescDeutan: 'color-blindness-type-desc-deutan',
  tooltip: 'color-blindness-tooltip',
  summary: 'color-blindness-summary',
  statusNone: 'color-blindness-status-none',
  statusNoConflicts: 'color-blindness-status-no-conflicts',
  statusConflictsFound: 'color-blindness-status-conflicts-found',
  mobilePaletteHeader: 'color-blindness-mobile-palette-header',
  conflictIconAria: 'color-blindness-conflict-icon-aria',
  badgeNoneAria: 'color-blindness-badge-none-aria',
  badgeConflictsAria: 'color-blindness-badge-conflicts-aria',
});

const BLOCK_KEY_MAP = Object.freeze({
  sectionAria: 'color-blindness-section-aria',
  navCreatePalette: 'color-blindness-nav-create-palette',
  navContrastChecker: 'color-blindness-nav-contrast-checker',
  navColorBlindness: 'color-blindness-nav-color-blindness',
  controlUndo: 'color-blindness-control-undo',
  controlRedo: 'color-blindness-control-redo',
  wheelAria: 'color-blindness-wheel-aria',
  wheelFocusAnnouncement: 'color-blindness-wheel-focus-announcement',
  conflictsFocusAnnouncement: 'color-blindness-conflicts-focus-announcement',
  blockError: 'color-blindness-block-error',
  markerAriaTemplate: 'color-wheel-marker-aria',
});

function isResolvedPlaceholder(value, key) {
  return value && value !== key && value !== key.replaceAll('-', ' ');
}

function resolveMap(keyMap, values, startIndex) {
  const overrides = {};
  Object.entries(keyMap).forEach(([prop, key], index) => {
    const value = values[startIndex + index];
    if (isResolvedPlaceholder(value, key)) {
      overrides[prop] = value;
    }
  });
  return overrides;
}

export function createColorBlindnessSharedPlaceholders(overrides = {}) {
  return { ...DEFAULT_SHARED_PLACEHOLDERS, ...overrides };
}

export function createColorBlindnessBlockPlaceholders(overrides = {}) {
  return { ...DEFAULT_BLOCK_PLACEHOLDERS, ...overrides };
}

export default async function loadColorBlindnessPlaceholders() {
  try {
    const [{ getConfig }, { replaceKeyArray }] = await Promise.all([
      import(`${getLibs()}/utils/utils.js`),
      import(`${getLibs()}/features/placeholders.js`),
    ]);

    const sharedKeys = Object.values(SHARED_KEY_MAP);
    const blockKeys = Object.values(BLOCK_KEY_MAP);
    const values = await replaceKeyArray([...sharedKeys, ...blockKeys], getConfig());

    const sharedOverrides = resolveMap(SHARED_KEY_MAP, values, 0);
    const blockOverrides = resolveMap(BLOCK_KEY_MAP, values, sharedKeys.length);

    return {
      shared: createColorBlindnessSharedPlaceholders(sharedOverrides),
      block: createColorBlindnessBlockPlaceholders(blockOverrides),
    };
  } catch {
    return {
      shared: createColorBlindnessSharedPlaceholders(),
      block: createColorBlindnessBlockPlaceholders(),
    };
  }
}
