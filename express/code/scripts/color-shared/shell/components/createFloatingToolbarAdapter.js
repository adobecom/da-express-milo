import { initFloatingToolbar as defaultInitFloatingToolbar } from '../../toolbar/createFloatingToolbar.js';

/**
 * Creates a floating toolbar adapter that follows the shared component protocol.
 * Wraps the existing initFloatingToolbar functionality without assuming specific slot names.
 *
 * @param {HTMLElement} slotEl - The slot element to mount the toolbar into
 * @param {Object} options - Configuration options for the toolbar
 * @param {Object} [options.palette] - Palette data (colors, name)
 * @param {string} [options.type='palette'] - Type of toolbar
 * @param {string} [options.variant='standalone'] - Toolbar variant
 * @param {string} [options.ctaText] - CTA button text
 * @param {string} [options.mobileCTAText] - Mobile CTA button text
 * @param {boolean} [options.showEdit=true] - Show edit button
 * @param {boolean} [options.showPalette=true] - Show palette display
 * @param {boolean} [options.showPaletteName=true] - Show palette name field
 * @param {boolean} [options.editPaletteName=false] - Allow editing palette name
 * @param {Object} contextAPI - Shell context API (get, on, off)
 * @param {Object} [deps] - Optional dependencies for testing
 * @param {Function} [deps.initFloatingToolbar] - Override for initFloatingToolbar
 * @returns {Promise<Object|null>} Adapter instance following shared component protocol
 */
export async function createFloatingToolbarAdapter(slotEl, options = {}, contextAPI, deps = {}) {
  const { initFloatingToolbar = defaultInitFloatingToolbar } = deps;

  const palette = options.palette ?? contextAPI.get('palette');
  
  const toolbarOptions = {
    ...options,
    palette,
  };

  const toolbarInstance = await initFloatingToolbar(slotEl, toolbarOptions);

  if (!toolbarInstance) {
    return null;
  }

  const updateSwatches = (colors) => {
    if (!colors) return;
    
    try {
      toolbarInstance.toolbar?.updateSwatches(colors);
    } catch (err) {
      window.lana?.log(`Toolbar adapter update failed: ${err.message}`, {
        tags: 'shell,toolbar-adapter',
      });
    }
  };

  const handlePaletteChange = (newPalette) => {
    updateSwatches(newPalette?.colors);
  };

  contextAPI.on('palette', handlePaletteChange);

  return {
    element: toolbarInstance.toolbar.element,

    update(updateOptions = {}) {
      const colors = updateOptions.colors ?? updateOptions.palette?.colors;
      updateSwatches(colors);
    },

    destroy() {
      contextAPI.off('palette', handlePaletteChange);
      toolbarInstance.destroy();
    },
  };
}
