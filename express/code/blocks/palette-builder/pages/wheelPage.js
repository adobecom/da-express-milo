/**
 * Color Wheel Page Module
 * 
 * Responsibilities:
 * - Declares required slots (sidebar, main)
 * - Provides page-specific shared component overrides
 * - Sets initial palette context
 * - Mounts wheel-specific content into layout slots
 * - Cleans up page-owned listeners and resources on destroy
 */

/**
 * Create sidebar content for color wheel page
 * @param {Object} shell - Shell API instance
 * @returns {HTMLElement} Sidebar content element
 */
function createWheelSidebar(shell) {
  const sidebar = document.createElement('div');
  sidebar.className = 'wheel-sidebar';
  sidebar.setAttribute('data-page-content', 'wheel');
  
  const heading = document.createElement('h2');
  heading.textContent = 'Color Wheel';
  sidebar.appendChild(heading);
  
  const description = document.createElement('p');
  description.textContent = 'Create harmonious color palettes using color theory principles.';
  sidebar.appendChild(description);
  
  return sidebar;
}

/**
 * Create main content for color wheel page
 * @param {Object} shell - Shell API instance
 * @returns {HTMLElement} Main content element
 */
function createWheelOutput(shell) {
  const main = document.createElement('div');
  main.className = 'wheel-output';
  main.setAttribute('data-page-content', 'wheel');
  
  const placeholder = document.createElement('div');
  placeholder.className = 'wheel-placeholder';
  placeholder.textContent = 'Color wheel output will appear here';
  main.appendChild(placeholder);
  
  return main;
}

/**
 * Color Wheel Page Definition
 */
export default {
  /**
   * Required slots this page needs from the layout
   */
  requiredSlots: ['sidebar', 'main'],

  /**
   * Optional preload dependencies
   */
  preload: {
    css: [],
    services: [],
  },

  /**
   * Shared component option overrides for this page
   */
  shared: {
    'action-bar': {
      active: 'wheel',
      actions: [
        { id: 'undo', icon: 'Undo', label: 'Undo' },
        { id: 'redo', icon: 'Redo', label: 'Redo' },
        { id: 'generate', icon: 'Shuffle', label: 'Generate random' },
        { id: 'expand', icon: 'Expand', label: 'Full screen' },
      ],
    },
  },

  /**
   * Initial context values for this page
   */
  context: {
    palette: {
      colors: [],
      name: 'My Color Theme',
    },
  },

  /**
   * Mount page content into shell slots
   * @param {Object} shell - Shell API instance
   * @returns {Promise<void>}
   */
  async mount(shell) {
    const sidebarContent = createWheelSidebar(shell);
    const mainContent = createWheelOutput(shell);
    
    shell.inject('sidebar', sidebarContent);
    shell.inject('main', mainContent);
  },

  /**
   * Cleanup when navigating away from this page
   * @param {Object} shell - Shell API instance
   */
  destroy(shell) {
    // Page-specific teardown
    // Currently no listeners or resources to clean up
    // This will be expanded when actual wheel functionality is implemented
  },
};
