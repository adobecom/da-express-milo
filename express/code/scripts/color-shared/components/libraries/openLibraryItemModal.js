import {
  createGradientModalContent,
  ensureGradientModalContentStyles,
} from '../../modal/createGradientModalContent.js';
import { libraryGradientToModalGradient } from './libraryDownloadUtils.js';

/**
 * Open the Explore-style palette or gradient modal for a library item.
 *
 * @param {Object} item - theme or gradient library item
 * @param {Object} modalManager - from createModalManager()
 * @param {Object} options
 * @param {Object} options.modalStrings - resolved color modal placeholders
 * @param {Object} options.colorSwatchRailStrings - resolved swatch rail placeholders
 * @param {string} [options.fallbackPaletteTitle]
 * @param {string} [options.fallbackGradientTitle]
 * @param {number} [options.verticalMaxPerRow=10] - Max swatches per vertical
 *   strip in the palette modal (matches the Explore page default).
 */
export async function openLibraryItemModal(item, modalManager, {
  modalStrings = {},
  colorSwatchRailStrings = {},
  librariesStrings = {},
  libraryId = '',
  ccLibraryProvider = null,
  toolHrefs = {},
  fallbackPaletteTitle = 'Palette',
  fallbackGradientTitle = 'Gradient',
  verticalMaxPerRow = 10,
} = {}) {
  if (!item || !modalManager) return;

  if (item.type === 'gradient') {
    await ensureGradientModalContentStyles();
    const gradient = libraryGradientToModalGradient(item);
    return modalManager.open({
      title: gradient.name || fallbackGradientTitle,
      showTitle: false,
      content: () => createGradientModalContent(gradient, {
        strings: modalStrings,
        tags: item.tags?.length ? item.tags : undefined,
        showCreator: false,
      }),
    });
  }

  if (!item.colors?.length) return;

  // Saved themes open the editable "libraries saved themes" modal (name + tags
  // editing, Save changes / Edit theme). Falls back to the read-only palette
  // modal when the CC Library context is unavailable (e.g. can't persist edits).
  if (ccLibraryProvider && libraryId) {
    return modalManager.openLibraryThemeModal(item, {
      librariesStrings,
      colorSwatchRailStrings,
      libraryId,
      ccLibraryProvider,
      toolHrefs,
      verticalMaxPerRow,
    });
  }

  return modalManager.openPaletteSwatchesModal(item, {
    modalStrings,
    colorSwatchRailStrings,
    tags: item.tags,
    showCreator: false,
    verticalMaxPerRow,
    // Focus the dialog shell so the first Tab moves to the first strip, not the
    // toolbar (which is the first tabbable when the swatch rail renders cold).
    initialFocusSelector: (root) => root,
  });
}
