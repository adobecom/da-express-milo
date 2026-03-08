import { createTag } from '../../../utils.js';

const LAYOUT_TYPE = 'palette-builder';
const SLOT_NAMES = ['topbar', 'sidebar', 'canvas', 'footer'];
const DEFAULT_MOBILE_ORDER = ['topbar', 'sidebar', 'canvas', 'footer'];

/**
 * Creates a palette builder layout adapter
 * @returns {Object} Layout adapter with type and mount method
 */
export default function createPaletteBuilderLayout() {
  return {
    type: LAYOUT_TYPE,

    /**
     * Mounts the layout into a container
     * @param {HTMLElement} container - Container element to mount into
     * @param {Object} config - Configuration options
     * @param {boolean} config.preserveSharedComponents - Whether to preserve
     *   shared components on clearSlot
     * @param {string[]} config.mobileOrder - Custom mobile slot order
     * @returns {Object} Layout instance
     */
    mount(container, config = {}) {
      const {
        preserveSharedComponents = true,
        mobileOrder = DEFAULT_MOBILE_ORDER,
      } = config;

      const root = createTag('div', {
        class: 'ax-palette-builder-layout',
        'data-layout': LAYOUT_TYPE,
      });

      const slots = {};

      const slotSemantics = {
        topbar: { role: 'banner', label: 'Top navigation' },
        sidebar: { role: 'complementary', label: 'Tool controls' },
        canvas: { role: 'main', label: 'Main content' },
        footer: { role: 'contentinfo', label: 'Toolbar' },
      };

      SLOT_NAMES.forEach((slotName) => {
        const semantics = slotSemantics[slotName] || {};
        const slotElement = createTag('div', {
          class: `ax-shell-slot ax-shell-slot--${slotName}`,
          'data-shell-slot': slotName,
          role: semantics.role,
          'aria-label': semantics.label,
        });

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
            slot.replaceChildren();
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
