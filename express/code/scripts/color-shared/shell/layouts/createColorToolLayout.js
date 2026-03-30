import { createTag } from '../../../utils.js';
import createShell from '../createShell.js';
import { isMobileOrTabletViewport } from '../../utils/utilities.js';

const LAYOUT_TYPE = 'color-tool';
const DEFAULT_SLOT_RENDER_ORDER = ['topbar', 'sidebar', 'canvas', 'footer'];
const DESKTOP_SLOT_RENDER_ORDER = ['sidebar', 'topbar', 'canvas', 'footer'];
const DEFAULT_LAYOUT_VARIANT = 'default';
const DEFAULT_TOOLBAR_MODE = 'sticky';
const DEFAULT_LAYOUT_SPANS = {
  tablet: { sidebar: 6, canvas: 6 },
  desktop: { sidebar: 4, canvas: 8 },
};

const TOOLBAR_MODES = new Set(['inline', 'sticky', 'sticky-on-scroll']);

const LAYOUT_DEPS = {
  critical: ['scripts/color-shared/shell/layouts/styles/color-tool-layout.css'],
  deferred: ['scripts/color-shared/action-menu.css'],
};

const SLOT_SEMANTICS = {
  topbar: { role: 'region', label: 'Top navigation' },
  sidebar: { role: 'region', label: 'Tool controls' },
  canvas: { role: 'region', label: 'Main content' },
  footer: { role: 'region', label: 'Toolbar' },
};

function clampSpan(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(Math.max(parsed, 1), 12);
}

function normalizeLayoutSpans(layoutSpans = {}) {
  return {
    tablet: {
      sidebar: clampSpan(layoutSpans.tablet?.sidebar, DEFAULT_LAYOUT_SPANS.tablet.sidebar),
      canvas: clampSpan(layoutSpans.tablet?.canvas, DEFAULT_LAYOUT_SPANS.tablet.canvas),
    },
    desktop: {
      sidebar: clampSpan(layoutSpans.desktop?.sidebar, DEFAULT_LAYOUT_SPANS.desktop.sidebar),
      canvas: clampSpan(layoutSpans.desktop?.canvas, DEFAULT_LAYOUT_SPANS.desktop.canvas),
    },
  };
}

function normalizeToolbarMode(toolbarMode, fallback = DEFAULT_TOOLBAR_MODE) {
  return TOOLBAR_MODES.has(toolbarMode) ? toolbarMode : fallback;
}

function getSlotRenderOrder() {
  return isMobileOrTabletViewport() ? DEFAULT_SLOT_RENDER_ORDER : DESKTOP_SLOT_RENDER_ORDER;
}

function buildGridColumnValue(start, span) {
  return `${start} / span ${span}`;
}

function collectCriticalDeps(config) {
  return {
    css: [...LAYOUT_DEPS.critical, ...(config.dependencies?.css || [])],
    services: config.dependencies?.services,
  };
}

function collectDeferredDeps(config) {
  const css = [];
  if (config.actionMenu) {
    css.push(...LAYOUT_DEPS.deferred);
  }
  return { css };
}

function initializeShell(config, host) {
  const shell = createShell(host);

  const criticalDeps = collectCriticalDeps(config);
  const criticalCssReady = shell.preload(criticalDeps);

  const deferredDeps = collectDeferredDeps(config);
  if (deferredDeps.css.length > 0) {
    shell.preload(deferredDeps).catch(() => {});
  }

  if (config.palette) {
    shell.context.set('palette', config.palette);
  }
  return { shell, criticalCssReady };
}

function buildSlotElements(
  mobileOrder,
  layoutVariant,
  toolbarMode,
  layoutSpans,
) {
  const root = createTag('div', {
    class: `ax-color-tool-layout${layoutVariant === 'canvas-footer' ? ' ax-color-tool-layout--canvas-footer' : ''}`,
    'data-layout': LAYOUT_TYPE,
    'data-layout-variant': layoutVariant,
    'data-toolbar-mode': toolbarMode,
  });

  root.style.setProperty('--ax-sidebar-span-tablet', layoutSpans.tablet.sidebar.toString());
  root.style.setProperty('--ax-canvas-span-tablet', layoutSpans.tablet.canvas.toString());
  root.style.setProperty('--ax-sidebar-span-desktop', layoutSpans.desktop.sidebar.toString());
  root.style.setProperty('--ax-canvas-span-desktop', layoutSpans.desktop.canvas.toString());
  root.style.setProperty(
    '--ax-main-column-tablet',
    buildGridColumnValue(layoutSpans.tablet.sidebar + 1, layoutSpans.tablet.canvas),
  );
  root.style.setProperty(
    '--ax-main-column-desktop',
    buildGridColumnValue(layoutSpans.desktop.sidebar + 1, layoutSpans.desktop.canvas),
  );

  const slots = {};
  getSlotRenderOrder().forEach((name) => {
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

    if (layoutVariant === 'canvas-footer' && ['topbar', 'sidebar'].includes(name)) {
      el.hidden = true;
      el.setAttribute('aria-hidden', 'true');
    }

    root.appendChild(el);
    slots[name] = el;
  });

  return { root, slots };
}

async function mountActionMenu(topbarSlot, actionMenuConfig, modulePromise) {
  if (!actionMenuConfig) return null;

  const { createActionMenuComponent } = await modulePromise;

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

function createStickyVisibilityObserver(target, onVisibilityChange) {
  if (!target || typeof onVisibilityChange !== 'function' || typeof IntersectionObserver === 'undefined') {
    return null;
  }

  onVisibilityChange(false);

  const observer = new IntersectionObserver((entries) => {
    const entry = entries[0];
    const shouldShow = Boolean(entry) && !entry.isIntersecting && entry.boundingClientRect.top < 0;
    onVisibilityChange(shouldShow);
  }, { threshold: 0 });

  observer.observe(target);
  return observer;
}

async function mountToolbarCore(shell, root, footerSlot, toolbarConfig, modulePromise) {
  let toolbarHandle = null;
  let stickyToolbarHandle = null;
  let stickyObserver = null;
  let cleanupToolbarMount = () => {};

  const palette = shell.context.get('palette');
  if (palette) {
    const mod = modulePromise || import('../../toolbar/createFloatingToolbar.js');
    const { initFloatingToolbar } = await mod;
    const {
      mode = DEFAULT_TOOLBAR_MODE,
      variant = 'standalone',
      reserveSpace,
      ...toolbarOptions
    } = toolbarConfig;
    const shouldFloatOnScroll = mode === 'sticky-on-scroll';

    toolbarHandle = await initFloatingToolbar(footerSlot, {
      type: 'palette',
      variant: shouldFloatOnScroll ? 'standalone' : variant,
      palette,
      reserveSpace,
      ...toolbarOptions,
    });

    if (shouldFloatOnScroll && toolbarHandle) {
      const stickyContainer = createTag('div', { class: 'ax-toolbar-floating-host' });
      stickyContainer.hidden = true;
      stickyContainer.setAttribute('aria-hidden', 'true');
      root.appendChild(stickyContainer);

      stickyToolbarHandle = toolbarHandle;

      const syncPaletteName = ({ palette: nextPalette }) => {
        shell.context.set('palette', nextPalette);
      };

      let isStickyActive = false;
      const setStickyState = (nextSticky) => {
        if (nextSticky === isStickyActive) return;

        isStickyActive = nextSticky;

        if (nextSticky) {
          stickyContainer.hidden = false;
          stickyContainer.setAttribute('aria-hidden', 'false');
          toolbarHandle.mount(stickyContainer);
          toolbarHandle.setVariant('sticky', {
            reserveContainer: stickyContainer,
            reserveSpace: false,
          });
          return;
        }

        toolbarHandle.mount(footerSlot);
        toolbarHandle.setVariant('standalone', {
          reserveContainer: footerSlot,
          reserveSpace,
        });
        stickyContainer.hidden = true;
        stickyContainer.setAttribute('aria-hidden', 'true');
      };

      toolbarHandle.toolbar?.on('namechange', syncPaletteName);
      cleanupToolbarMount = () => {
        toolbarHandle.toolbar?.off?.('namechange', syncPaletteName);
        stickyContainer.hidden = true;
        stickyContainer.setAttribute('aria-hidden', 'true');
        stickyContainer.remove();
      };

      stickyObserver = createStickyVisibilityObserver(footerSlot, setStickyState);
    }
  }

  const onPaletteChange = (newPalette) => {
    toolbarHandle?.toolbar?.updateSwatches(newPalette.colors, newPalette);
    toolbarHandle?.toolbar?.updateName(newPalette.name);
  };
  shell.context.on('palette', onPaletteChange);

  return {
    toolbarHandle,
    stickyToolbarHandle,
    stickyObserver,
    cleanupToolbarMount,
    onPaletteChange,
  };
}

function deferToViewport(target, callback, rootMargin) {
  if (typeof IntersectionObserver === 'undefined') return callback();

  const opts = rootMargin ? { rootMargin } : {};
  return new Promise((resolve) => {
    let resolved = false;
    const complete = () => {
      if (resolved) return;
      resolved = true;
      io.disconnect();
      resolve(callback());
    };
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) complete();
    }, opts);
    io.observe(target);
    setTimeout(complete, 10000);
  });
}

function mountToolbar(shell, root, footerSlot, toolbarConfig, modulePromise) {
  if (isMobileOrTabletViewport()) {
    return deferToViewport(
      footerSlot,
      () => mountToolbarCore(shell, root, footerSlot, toolbarConfig, modulePromise),
      toolbarConfig.viewportMargin,
    );
  }
  return mountToolbarCore(shell, root, footerSlot, toolbarConfig, modulePromise);
}

function createLayoutAPI(slots, shell, root) {
  // Mutable state shared between the public API and async hydration callbacks.
  // Using a closure object (rather than `this`) so destroy() works even when
  // destructured: `const { destroy } = layout; destroy();`
  const state = {
    destroyed: false,
    actionMenu: null,
    toolbar: null,
    stickyToolbar: null,
    stickyObserver: null,
    cleanupToolbarMount: () => {},
    onPaletteChange: () => {},
  };

  const layout = {
    slots,
    context: shell.context,

    get actionMenu() { return state.actionMenu; },
    set actionMenu(v) { state.actionMenu = v; },

    get toolbar() { return state.toolbar; },
    set toolbar(v) { state.toolbar = v; },

    get stickyToolbar() { return state.stickyToolbar; },
    set stickyToolbar(v) { state.stickyToolbar = v; },

    get destroyed() { return state.destroyed; },

    getSlot(name) {
      return slots[name] || null;
    },

    getSlotNames() {
      return [...DEFAULT_SLOT_RENDER_ORDER];
    },

    hasSlot(name) {
      return DEFAULT_SLOT_RENDER_ORDER.includes(name);
    },

    clearSlot(name) {
      const slot = slots[name];
      if (slot) slot.replaceChildren();
    },

    destroy() {
      state.destroyed = true;
      if (state.onPaletteChange) shell.context.off('palette', state.onPaletteChange);
      state.stickyObserver?.disconnect();
      state.cleanupToolbarMount?.();
      state.actionMenu?.destroy();
      if (state.stickyToolbar && state.stickyToolbar !== state.toolbar) {
        state.stickyToolbar.destroy();
      }
      state.toolbar?.destroy();
      root.remove();
      shell.destroy();
    },
  };

  return { layout, state };
}

export default async function createColorToolLayout(container, config = {}) {
  const {
    mobileOrder = DEFAULT_SLOT_RENDER_ORDER,
    layoutVariant = DEFAULT_LAYOUT_VARIANT,
    toolbar: toolbarConfig = {},
    actionMenu: actionMenuConfig,
    layoutSpans,
  } = config;

  // Eagerly warm module cache — imports start downloading immediately
  const actionMenuModulePromise = actionMenuConfig
    ? import('../../components/createActionMenuComponent.js') : null;
  const toolbarModulePromise = config.palette
    ? import('../../toolbar/createFloatingToolbar.js') : null;

  const resolvedToolbarMode = normalizeToolbarMode(toolbarConfig.mode);
  const resolvedLayoutSpans = normalizeLayoutSpans(layoutSpans);
  const resolvedToolbarConfig = {
    ...toolbarConfig,
    mode: resolvedToolbarMode,
  };

  const { root, slots } = buildSlotElements(
    mobileOrder,
    layoutVariant,
    resolvedToolbarMode,
    resolvedLayoutSpans,
  );

  container.appendChild(root);

  // Shell init: critical CSS fires non-blocking, deferred CSS fire-and-forget
  const { shell, criticalCssReady } = initializeShell(config, root);

  // Wait only for critical CSS — then return layout immediately.
  // Both action menu and toolbar mount non-blocking in parallel.
  await criticalCssReady;

  const { layout, state } = createLayoutAPI(slots, shell, root);

  // Both components mount simultaneously and hydrate the layout when ready.
  // Each callback guards against early destroy so it never mutates a torn-down layout.
  layout.actionMenuReady = mountActionMenu(slots.topbar, actionMenuConfig, actionMenuModulePromise)
    .then((handle) => {
      if (!state.destroyed) state.actionMenu = handle;
      return handle;
    })
    .catch(() => null);

  const toolbarReady = mountToolbar(
    shell, root, slots.footer, resolvedToolbarConfig, toolbarModulePromise,
  ).then(({
    toolbarHandle,
    stickyToolbarHandle,
    stickyObserver,
    cleanupToolbarMount,
    onPaletteChange,
  }) => {
    if (state.destroyed) return;
    state.toolbar = toolbarHandle;
    state.stickyToolbar = stickyToolbarHandle;
    state.stickyObserver = stickyObserver;
    state.cleanupToolbarMount = cleanupToolbarMount;
    state.onPaletteChange = onPaletteChange;
  }).catch(() => {});

  layout.ready = Promise.all([layout.actionMenuReady, toolbarReady])
    .then(() => layout)
    .catch(() => layout);

  return layout;
}
