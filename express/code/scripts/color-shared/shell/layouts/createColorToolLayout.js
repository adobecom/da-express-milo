import { createTag, getIconElementDeprecated } from '../../../utils.js';
import createShell from '../createShell.js';

const LAYOUT_TYPE = 'color-tool';
const SLOT_NAMES = ['topbar', 'sidebar', 'canvas', 'footer'];
const DEFAULT_MOBILE_ORDER = ['topbar', 'sidebar', 'canvas', 'footer'];

const LAYOUT_DEPS = {
  base: ['scripts/color-shared/shell/layouts/styles/color-tool-layout.css'],
  actionMenu: ['scripts/color-shared/action-menu.css'],
};

const SLOT_SEMANTICS = {
  topbar: { role: 'region', label: 'Top navigation' },
  sidebar: { role: 'region', label: 'Tool controls' },
  canvas: { role: 'region', label: 'Main content' },
  footer: { role: 'region', label: 'Toolbar' },
};

function buildTextContent(content) {
  if (!content?.heading && !content?.paragraph) return null;

  const wrapper = createTag('div', { class: 'ax-text-content' });

  const showIcon = content.icon !== false;
  if (showIcon) {
    const logoContainer = createTag('div', { class: 'ax-text-content__logo' });
    const logo = getIconElementDeprecated('adobe-express-logo');
    logo.classList.add('ax-text-content__logo-icon');
    logoContainer.appendChild(logo);
    wrapper.appendChild(logoContainer);
  }

  const bodyContainer = createTag('div', { class: 'ax-text-content__body' });

  if (content.heading) {
    content.heading.classList.add('ax-text-content__heading');
    bodyContainer.appendChild(content.heading);
  }

  if (content.paragraph) {
    content.paragraph.classList.add('ax-text-content__paragraph');
    bodyContainer.appendChild(content.paragraph);
  }

  if (bodyContainer.children.length > 0) {
    wrapper.appendChild(bodyContainer);
  }

  return wrapper;
}

function collectLayoutDeps(config) {
  const css = [...LAYOUT_DEPS.base];

  if (config.actionMenu) {
    css.push(...LAYOUT_DEPS.actionMenu);
  }

  if (config.dependencies?.css) {
    css.push(...config.dependencies.css);
  }

  return {
    css,
    services: config.dependencies?.services,
  };
}

async function initializeShell(config, host) {
  const shell = createShell(host);

  const layoutDeps = collectLayoutDeps(config);
  await shell.preload(layoutDeps);

  if (config.palette) {
    shell.context.set('palette', config.palette);
  }
  return shell;
}

function buildSlotElements(mobileOrder, content) {
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

    if (name === 'sidebar' && content) {
      const textContent = buildTextContent(content);
      if (textContent) {
        el.appendChild(textContent);
      }
    }

    root.appendChild(el);
    slots[name] = el;
  });

  return { root, slots };
}

async function mountActionMenu(topbarSlot, actionMenuConfig) {
  if (!actionMenuConfig) return null;

  const { createActionMenuComponent } = await import('../../components/createActionMenuComponent.js');

  const actionMenu = await createActionMenuComponent({
    id: actionMenuConfig.id || 'color-tool-action-menu',
    type: actionMenuConfig.type || 'full',
    activeId: actionMenuConfig.activeId || '',
    navLinks: actionMenuConfig.navLinks || [],
    controls: actionMenuConfig.controls || [],
    onExpand: actionMenuConfig.onExpand,
    onUndo: actionMenuConfig.onUndo,
    onRedo: actionMenuConfig.onRedo,
    onGenerateRandom: actionMenuConfig.onGenerateRandom,
    enableState: actionMenuConfig.enableState !== false,
  });

  if (actionMenu?.element) {
    topbarSlot.appendChild(actionMenu.element);
  }

  return actionMenu;
}

async function mountToolbar(shell, footerSlot, toolbarConfig) {
  let toolbarHandle = null;

  const palette = shell.context.get('palette');
  if (palette) {
    const { initFloatingToolbar } = await import('../../toolbar/createFloatingToolbar.js');
    toolbarHandle = await initFloatingToolbar(footerSlot, {
      type: 'palette',
      variant: 'standalone',
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

function createLayoutAPI(slots, shell, root, toolbarHandle, actionMenuHandle, onPaletteChange) {
  return {
    slots,
    context: shell.context,
    actionMenu: actionMenuHandle,

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
      actionMenuHandle?.destroy();
      toolbarHandle?.destroy();
      root.remove();
      shell.destroy();
    },
  };
}

export default async function createColorToolLayout(container, config = {}) {
  const {
    mobileOrder = DEFAULT_MOBILE_ORDER,
    toolbar: toolbarConfig = {},
    actionMenu: actionMenuConfig,
    content,
  } = config;

  const { root, slots } = buildSlotElements(mobileOrder, content);
  container.appendChild(root);

  const shell = await initializeShell(config, root);

  const actionMenuHandle = await mountActionMenu(slots.topbar, actionMenuConfig);
  const { toolbarHandle, onPaletteChange } = await mountToolbar(shell, slots.footer, toolbarConfig);

  return createLayoutAPI(slots, shell, root, toolbarHandle, actionMenuHandle, onPaletteChange);
}
