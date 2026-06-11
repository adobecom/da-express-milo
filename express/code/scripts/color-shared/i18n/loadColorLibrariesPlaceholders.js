import loadPlaceholders from './utils.js';

export const DEFAULT_PLACEHOLDERS = Object.freeze({
  librariesSignIn: 'Sign in to view your Creative Cloud Libraries.',
  blockError: 'Unable to load your libraries. Please refresh and try again.',
  librariesDefaultName: 'Library',
  librariesSearchPlaceholder: 'Search libraries',
  librariesSavedLibrary: '{count} saved library',
  librariesSavedLibraries: '{count} saved libraries',
  librariesSortBy: 'Sort by',
  librariesSortLabel: 'Sort',
  librariesSortAria: 'Sort libraries',
  librariesSortHeading: 'Sort libraries by',
  librariesSortLastModified: 'Last modified',
  librariesSortName: 'Name',
  librariesExpandAll: 'Expand all',
  librariesCollapseAll: 'Collapse all',
  librariesThemeSubtitle: 'Color theme',
  librariesThemeColorBlindSubtitle: 'Color blind safe theme',
  librariesGradientSubtitle: 'Color gradient',
  librariesColorBlindBadge: 'Color blind safe',
  librariesEmptyHeading: '0 results for "{query}"',
  librariesEmptyDescription: 'Check your spelling, or try another search.',
  librariesGoBack: 'Go back to libraries',
  librariesColorBlindAria: 'View color blindness simulation for {name}',
  librariesDownloadAria: 'Download {name}',
  librariesDeleteAria: 'Delete {name}',
  librariesEditAria: 'Edit {name}',
  librariesOpenAria: 'Open {name}',
  librariesCountTheme: '{count} theme',
  librariesCountThemes: '{count} themes',
  librariesCountGradient: '{count} gradient',
  librariesCountGradients: '{count} gradients',
});

const PLACEHOLDER_KEY_MAP = Object.freeze({
  librariesSignIn: 'color-libraries-sign-in',
  blockError: 'color-libraries-block-error',
  librariesDefaultName: 'color-libraries-default-name',
  librariesSearchPlaceholder: 'color-libraries-search-placeholder',
  librariesSavedLibrary: 'color-libraries-saved-library',
  librariesSavedLibraries: 'color-libraries-saved-libraries',
  librariesSortBy: 'color-libraries-sort-by',
  librariesSortLabel: 'color-libraries-sort-label',
  librariesSortAria: 'color-libraries-sort-aria',
  librariesSortHeading: 'color-libraries-sort-heading',
  librariesSortLastModified: 'color-libraries-sort-last-modified',
  librariesSortName: 'color-libraries-sort-name',
  librariesExpandAll: 'color-libraries-expand-all',
  librariesCollapseAll: 'color-libraries-collapse-all',
  librariesThemeSubtitle: 'color-libraries-theme-subtitle',
  librariesThemeColorBlindSubtitle: 'color-libraries-theme-color-blind-subtitle',
  librariesGradientSubtitle: 'color-libraries-gradient-subtitle',
  librariesColorBlindBadge: 'color-libraries-color-blind-badge',
  librariesEmptyHeading: 'color-libraries-empty-heading',
  librariesEmptyDescription: 'color-libraries-empty-description',
  librariesGoBack: 'color-libraries-go-back',
  librariesColorBlindAria: 'color-libraries-color-blind-aria',
  librariesDownloadAria: 'color-libraries-download-aria',
  librariesDeleteAria: 'color-libraries-delete-aria',
  librariesEditAria: 'color-libraries-edit-aria',
  librariesOpenAria: 'color-libraries-open-aria',
  librariesCountTheme: 'color-libraries-count-theme',
  librariesCountThemes: 'color-libraries-count-themes',
  librariesCountGradient: 'color-libraries-count-gradient',
  librariesCountGradients: 'color-libraries-count-gradients',
});

export function createColorLibrariesPlaceholders(overrides = {}) {
  return { ...DEFAULT_PLACEHOLDERS, ...overrides };
}

export default function loadColorLibrariesPlaceholders() {
  return loadPlaceholders(PLACEHOLDER_KEY_MAP, createColorLibrariesPlaceholders);
}
