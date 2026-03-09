import { createTag } from '../../../utils.js';
import createShell from '../createShell.js';

const LAYOUT_TYPE = 'color-tool';
const SLOT_NAMES = ['topbar', 'sidebar', 'canvas', 'footer'];
const DEFAULT_MOBILE_ORDER = ['topbar', 'sidebar', 'canvas', 'footer'];

const SLOT_SEMANTICS = {
  topbar: { role: 'banner', label: 'Top navigation' },
  sidebar: { role: 'complementary', label: 'Tool controls' },
  canvas: { role: 'main', label: 'Main content' },
  footer: { role: 'contentinfo', label: 'Toolbar' },
};

async function initializeShell(config) {
  const shell = createShell();
  if (config.dependencies) {
    await shell.preload(config.dependencies);
  }
  if (config.palette) {
    shell.context.set('palette', config.palette);
  }
  return shell;
}

function buildSlotElements(mobileOrder) {
  const root = createTag('div', {
    class: 'ax-color-tool-layout',
    'data-layout': LAYOUT_TYPE,
  });

  const slots = {};
  SLOT_NAMES.forEach((name) => {
    const semantics = SLOT_SEMANTICS[name] || {};
    const el = createTag('div', {
      class: `ax-shell-slot ax-shell-slot--${name}`,
      'data-shell-slot': name,
      role: semantics.role,
      'aria-label': semantics.label,
    });

    const mobileOrderIndex = mobileOrder.indexOf(name);
    if (mobileOrderIndex !== -1) {
      el.style.setProperty('--mobile-order', mobileOrderIndex.toString());
    }

    root.appendChild(el);
    slots[name] = el;
  });

  return { root, slots };
}

async function mountToolbar(shell, footerSlot, toolbarConfig) {
  let toolbarHandle = null;

  const palette = shell.context.get('palette');
  if (palette) {
    const { initFloatingToolbar } = await import('../../toolbar/createFloatingToolbar.js');
    toolbarHandle = await initFloatingToolbar(footerSlot, {
      type: 'palette',
      variant: 'sticky',
      palette,
      ...toolbarConfig,
    });
  }

  const onPaletteChange = (newPalette) => {
    toolbarHandle?.toolbar?.updateSwatches(newPalette.colors, newPalette);
  };
  shell.context.on('palette', onPaletteChange);

  return { toolbarHandle, onPaletteChange };
}

function createLayoutAPI(slots, shell, root, toolbarHandle, onPaletteChange) {
  return {
    slots,
    context: shell.context,

    getSlot(name) {
      return slots[name] || null;
    },

    getSlotNames() {
      return [...SLOT_NAMES];
    },

    hasSlot(name) {
      return SLOT_NAMES.includes(name);
    },

    clearSlot(name) {
      const slot = slots[name];
      if (slot) slot.replaceChildren();
    },

    destroy() {
      shell.context.off('palette', onPaletteChange);
      toolbarHandle?.destroy();
      root.remove();
      shell.destroy();
    },
  };
}

/**
 * Creates the color tool layout — the primary abstraction blocks consume.
 *
 * Internally creates a shell (context + dependency resolution), builds
 * the slot-based DOM structure, mounts the floating toolbar into the
 * footer slot, and returns a simple API for blocks.
 *
 * @param {HTMLElement} container - Block element to mount into
 * @param {Object} [config] - Configuration
 * @param {Object} [config.palette] - Initial palette { colors, name }
 * @param {Object} [config.toolbar] - Toolbar options forwarded to initFloatingToolbar
 * @param {Object} [config.dependencies] - Dependencies to preload { css, services, spectrum }
 * @param {string[]} [config.mobileOrder] - Custom mobile slot order
 * @returns {Promise<Object>} Layout API { slots, context, getSlot, clearSlot, destroy }
 */
export default async function createColorToolLayout(container, config = {}) {
  const { mobileOrder = DEFAULT_MOBILE_ORDER, toolbar: toolbarConfig = {} } = config;

  const shell = await initializeShell(config);
  const { root, slots } = buildSlotElements(mobileOrder);
  container.appendChild(root);

  const { toolbarHandle, onPaletteChange } = await mountToolbar(shell, slots.footer, toolbarConfig);

  return createLayoutAPI(slots, shell, root, toolbarHandle, onPaletteChange);
}
