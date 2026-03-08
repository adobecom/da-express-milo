/**
 * Full Width Layout Adapter
 * 
 * Creates a layout with three slots: header, main, footer
 * Desktop & Mobile: Single-column full-width stack
 * 
 * Slot topology:
 * - header: Top navigation/branding area
 * - main: Primary content area (full width)
 * - footer: Bottom actions/info
 */

const LAYOUT_TYPE = 'full-width';
const SLOT_NAMES = ['header', 'main', 'footer'];

/**
 * Creates a full-width layout adapter
 * @returns {Object} Layout adapter with type and mount method
 */
export function createFullWidthLayout() {
  return {
    type: LAYOUT_TYPE,
    
    /**
     * Mounts the layout into a container
     * @param {HTMLElement} container - Container element to mount into
     * @param {Object} config - Configuration options
     * @param {boolean} config.preserveSharedComponents - Whether to preserve shared components on clearSlot
     * @returns {Object} Layout instance
     */
    mount(container, config = {}) {
      const {
        preserveSharedComponents = true,
      } = config;

      const root = document.createElement('div');
      root.className = 'ax-full-width-layout';
      root.dataset.layout = LAYOUT_TYPE;

      const slots = {};

      SLOT_NAMES.forEach((slotName) => {
        const slotElement = document.createElement('div');
        slotElement.className = `ax-shell-slot ax-shell-slot--${slotName}`;
        slotElement.dataset.shellSlot = slotName;
        
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
