/**
 * Palette Builder Layout Adapter
 * 
 * Creates a layout with four slots: topbar, sidebar, canvas, footer
 * Desktop: 2-column grid (sidebar + canvas) with topbar above and footer below
 * Mobile: Single-column stack with configurable order via CSS custom properties
 * 
 * Slot topology:
 * - topbar: Action menu bar
 * - sidebar: Brand, controls, page-specific inputs
 * - canvas: Main tool output area
 * - footer: Floating toolbar
 */

const LAYOUT_TYPE = 'palette-builder';
const SLOT_NAMES = ['topbar', 'sidebar', 'canvas', 'footer'];
const DEFAULT_MOBILE_ORDER = ['topbar', 'sidebar', 'canvas', 'footer'];

/**
 * Creates a palette builder layout adapter
 * @returns {Object} Layout adapter with type and mount method
 */
export function createPaletteBuilderLayout() {
  return {
    type: LAYOUT_TYPE,
    
    /**
     * Mounts the layout into a container
     * @param {HTMLElement} container - Container element to mount into
     * @param {Object} config - Configuration options
     * @param {boolean} config.preserveSharedComponents - Whether to preserve shared components on clearSlot
     * @param {string[]} config.mobileOrder - Custom mobile slot order
     * @returns {Object} Layout instance
     */
    mount(container, config = {}) {
      const {
        preserveSharedComponents = true,
        mobileOrder = DEFAULT_MOBILE_ORDER,
      } = config;

      const root = document.createElement('div');
      root.className = 'ax-palette-builder-layout';
      root.dataset.layout = LAYOUT_TYPE;

      const slots = {};

      SLOT_NAMES.forEach((slotName) => {
        const slotElement = document.createElement('div');
        slotElement.className = `ax-shell-slot ax-shell-slot--${slotName}`;
        slotElement.dataset.shellSlot = slotName;
        
        const mobileOrderIndex = mobileOrder.indexOf(slotName);
        if (mobileOrderIndex !== -1) {
          slotElement.style.setProperty('--mobile-order', mobileOrderIndex.toString());
        }
        
        root.appendChild(slotElement);
        slots[slotName] = slotElement;
      });

      container.appendChild(root);

      return {
        type: LAYOUT_TYPE,
        root,
        
        /**
         * Checks if a slot exists
         * @param {string} name - Slot name
         * @returns {boolean} True if slot exists
         */
        hasSlot(name) {
          return SLOT_NAMES.includes(name);
        },
        
        /**
         * Gets a slot element by name
         * @param {string} name - Slot name
         * @returns {HTMLElement|null} Slot element or null if not found
         */
        getSlot(name) {
          return slots[name] || null;
        },
        
        /**
         * Gets all slot names
         * @returns {string[]} Array of slot names
         */
        getSlotNames() {
          return [...SLOT_NAMES];
        },
        
        /**
         * Clears content from a slot
         * @param {string} name - Slot name
         */
        clearSlot(name) {
          const slot = slots[name];
          if (!slot) return;
          
          if (preserveSharedComponents) {
            const children = Array.from(slot.children);
            children.forEach((child) => {
              if (!child.dataset.sharedComponent) {
                slot.removeChild(child);
              }
            });
          } else {
            slot.innerHTML = '';
          }
        },
        
        /**
         * Destroys the layout and removes it from the DOM
         */
        destroy() {
          if (root.parentNode) {
            root.parentNode.removeChild(root);
          }
        },
      };
    },
  };
}
