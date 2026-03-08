/**
 * Contrast Checker Page Module
 * 
 * Page module for the contrast checker tool following the shell page contract.
 * Declares required slots, mounts contrast-specific content, and manages
 * contrast-specific context (foreground/background colors and ratio).
 */

/**
 * Creates the sidebar content for contrast checker
 * @param {Object} shell - Shell context API
 * @returns {HTMLElement} Sidebar content element
 */
function createContrastSidebar(shell) {
  const sidebar = document.createElement('div');
  sidebar.className = 'contrast-sidebar';
  sidebar.dataset.pageContent = 'contrast-sidebar';

  const title = document.createElement('h2');
  title.textContent = 'Contrast Checker';
  sidebar.appendChild(title);

  const description = document.createElement('p');
  description.textContent = 'Check color contrast ratios for accessibility compliance.';
  sidebar.appendChild(description);

  return sidebar;
}

/**
 * Creates the canvas content for contrast checker
 * @param {Object} shell - Shell context API
 * @returns {HTMLElement} Canvas content element
 */
function createContrastCanvas(shell) {
  const canvas = document.createElement('div');
  canvas.className = 'contrast-canvas';
  canvas.dataset.pageContent = 'contrast-canvas';

  const preview = document.createElement('div');
  preview.className = 'contrast-preview';
  preview.textContent = 'Contrast preview area';
  canvas.appendChild(preview);

  return canvas;
}

/**
 * Contrast Checker Page Module
 * 
 * Follows the shell page contract:
 * - requiredSlots: slots this page needs from the layout
 * - preload: page-specific dependencies
 * - context: initial context values for this page
 * - mount: inject page content into layout slots
 * - destroy: cleanup when navigating away
 */
export default {
  /**
   * Slots required by this page from the active layout
   */
  requiredSlots: ['sidebar', 'canvas'],

  /**
   * Page-specific dependencies to load
   */
  preload: {
    css: [],
    services: [],
  },

  /**
   * Initial context values for contrast checker
   * Per AD #18: palette persists across navigation, contrastRatio is page-specific
   */
  context: {
    palette: {
      colors: ['#FFFDEB', '#0076FF'],
      name: 'Contrast Pair',
    },
    contrastRatio: 4.5,
  },

  /**
   * Mount page content into layout slots
   * @param {Object} params - Mount parameters
   * @param {Object} params.shell - Shell context API
   * @param {Object} params.layout - Active layout instance
   * @returns {Promise<void>}
   */
  async mount({ shell, layout }) {
    const sidebarSlot = layout.getSlot('sidebar');
    const canvasSlot = layout.getSlot('canvas');

    const sidebarContent = createContrastSidebar(shell);
    const canvasContent = createContrastCanvas(shell);

    sidebarSlot.appendChild(sidebarContent);
    canvasSlot.appendChild(canvasContent);
  },

  /**
   * Cleanup when navigating away from this page
   * @param {Object} params - Destroy parameters
   * @param {Object} params.shell - Shell context API
   * @param {Object} params.layout - Active layout instance
   */
  destroy({ shell, layout }) {
    // Page-specific cleanup
    // Context keys (contrastRatio) are cleared by the shell per AD #18
    // Slots are cleared by the shell during page transition
  },
};
