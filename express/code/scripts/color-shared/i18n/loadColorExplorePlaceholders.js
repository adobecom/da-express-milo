import { getLibs } from '../../utils.js';

export const DEFAULT_PLACEHOLDERS = Object.freeze({
  loadMore: 'Load more',
  loadMoreAria: 'Load more gradients',
  modalDefaultGradientTitle: 'Gradient',
  modalDefaultPaletteTitle: 'Palette',
  blockError: 'Failed to load Color Explore',
  gridTitle: 'Color gradients',
  gridAria: 'Color gradients, {count} gradients available',
  gridRoleDesc: 'gradient grid',
  gridLiveRegion: 'Gradient updates',
  gridInvalidData: 'Invalid gradient data',
  gridCardAria: 'View {name} gradient',
  gridShowingPartial: 'Showing {displayed} of {total} gradients. {remaining} more available.',
  gridShowingAll: 'Showing all {total} gradients',
  a11yButtonFocused: 'Button focused. Press Escape to return to grid navigation, or Tab to exit grid.',
  a11yReturnedToGrid: 'Returned to grid navigation. {name}. Use arrow keys to navigate.',
  a11yNavigatedTo: 'Navigated to {name}, row {row}, column {col}',
  a11yPressEscape: 'Press Escape to return to grid navigation.',
  a11yEnteredGrid: 'Entered gradient grid. {name}, row {row}, column {col} of {total}. Use arrow keys to navigate, Enter to access button, Tab to exit.',
  a11yCardPosition: '{name}, row {row}, column {col}',
});

const PLACEHOLDER_KEY_MAP = Object.freeze({
  loadMore: 'color-explore-grid-load-more',
  loadMoreAria: 'color-explore-grid-load-more-aria',
  modalDefaultGradientTitle: 'color-explore-modal-default-gradient-title',
  modalDefaultPaletteTitle: 'color-explore-modal-default-palette-title',
  blockError: 'color-explore-block-error',
  gridTitle: 'color-explore-grid-title',
  gridAria: 'color-explore-grid-aria',
  gridRoleDesc: 'color-explore-grid-role-desc',
  gridLiveRegion: 'color-explore-grid-live-region',
  gridInvalidData: 'color-explore-grid-invalid-data',
  gridCardAria: 'color-explore-grid-card-aria',
  gridShowingPartial: 'color-explore-grid-showing-partial',
  gridShowingAll: 'color-explore-grid-showing-all',
  a11yButtonFocused: 'color-explore-a11y-button-focused',
  a11yReturnedToGrid: 'color-explore-a11y-returned-to-grid',
  a11yNavigatedTo: 'color-explore-a11y-navigated-to',
  a11yPressEscape: 'color-explore-a11y-press-escape',
  a11yEnteredGrid: 'color-explore-a11y-entered-grid',
  a11yCardPosition: 'color-explore-a11y-card-position',
});

function isResolvedPlaceholder(value, key) {
  return value && value !== key.replaceAll('-', ' ');
}

export function createColorExplorePlaceholders(overrides = {}) {
  return { ...DEFAULT_PLACEHOLDERS, ...overrides };
}

export default async function loadColorExplorePlaceholders() {
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

    return createColorExplorePlaceholders(overrides);
  } catch {
    return createColorExplorePlaceholders();
  }
}
