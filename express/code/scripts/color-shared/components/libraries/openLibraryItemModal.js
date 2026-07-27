/**
 * Open the editable "libraries saved" modal for a library item.
 *
 * @param {Object} item - theme or gradient library item
 * @param {Object} modalManager - from createModalManager()
 * @param {Object} options
 * @param {Object} options.colorSwatchRailStrings - resolved swatch rail placeholders
 * @param {Object} options.librariesStrings - resolved libraries placeholders
 * @param {string} options.libraryId - CC Library id the item belongs to
 * @param {Object} options.ccLibraryProvider - CC Library provider (required to persist edits)
 * @param {Object} [options.toolHrefs]
 * @param {number} [options.verticalMaxPerRow=10] - Max swatches per vertical
 *   strip in the palette modal (matches the Explore page default).
 */
export async function openLibraryItemModal(item, modalManager, {
  colorSwatchRailStrings = {},
  librariesStrings = {},
  libraryId = '',
  ccLibraryProvider = null,
  toolHrefs = {},
  verticalMaxPerRow = 10,
} = {}) {
  if (!item || !modalManager) return undefined;
  // Editing requires the CC Library context so changes can be persisted.
  if (!ccLibraryProvider || !libraryId) return undefined;

  if (item.type === 'gradient') {
    return modalManager.openLibraryGradientModal(item, {
      librariesStrings,
      colorSwatchRailStrings,
      libraryId,
      ccLibraryProvider,
      toolHrefs,
      verticalMaxPerRow,
    });
  }

  if (!item.colors?.length) return undefined;

  return modalManager.openLibraryThemeModal(item, {
    librariesStrings,
    colorSwatchRailStrings,
    libraryId,
    ccLibraryProvider,
    toolHrefs,
    verticalMaxPerRow,
  });
}
