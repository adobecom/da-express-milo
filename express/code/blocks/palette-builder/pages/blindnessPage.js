/**
 * Color Blindness Page Module
 * 
 * Page module for the color blindness simulator that follows the page contract.
 * Declares required slots, mounts content, sets initial context, and configures shared components.
 */

/**
 * Color Blindness Page
 * @type {Object}
 */
export default {
  /**
   * Required slots that this page needs from the layout
   * @type {string[]}
   */
  requiredSlots: ['sidebar', 'canvas'],

  /**
   * Initial context values for this page
   * @type {Object}
   */
  context: {
    palette: {
      colors: [],
      name: 'My Color Theme',
    },
    simulationType: 'all',
  },

  /**
   * Shared component configuration overrides
   * @type {Object}
   */
  shared: {
    actionBar: {
      active: 'blindness',
      actions: [
        { id: 'undo', icon: 'Undo' },
        { id: 'redo', icon: 'Redo' },
      ],
    },
  },

  /**
   * Mount page content into layout slots
   * @param {Object} slots - Map of slot name to HTMLElement
   * @param {Object} pageOptions - Page-specific options
   * @returns {Promise<void>}
   */
  async mount(slots, pageOptions = {}) {
    const { sidebar, canvas } = slots;

    // Create sidebar content
    const sidebarContent = document.createElement('div');
    sidebarContent.className = 'blindness-sidebar';
    sidebarContent.innerHTML = `
      <div class="blindness-sidebar-content">
        <h2>Color Blindness Simulator</h2>
        <p>Simulate how your palette appears with different types of color vision deficiency.</p>
      </div>
    `;

    // Create canvas content
    const canvasContent = document.createElement('div');
    canvasContent.className = 'blindness-canvas';
    canvasContent.innerHTML = `
      <div class="blindness-simulation-grid">
        <p>Simulation grid will be rendered here</p>
      </div>
    `;

    // Mount content into slots
    sidebar.appendChild(sidebarContent);
    canvas.appendChild(canvasContent);
  },

  /**
   * Cleanup when navigating away from this page
   * @returns {void}
   */
  destroy() {
    // Page-specific cleanup would go here
    // For now, no cleanup needed as content is removed by slot clearing
  },
};
