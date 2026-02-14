/**
 * Modal manager: vanilla shell only (no Lit, no Spectrum).
 * openPaletteModal / openGradientModal use simple DOM content for Phase 1 easy wire.
 * Loads its own CSS from this folder (modal-styles.css).
 */
/* eslint-disable no-use-before-define -- close/createHandle used in callbacks before declaration */
import { createTag, getLibs } from '../../utils.js';

const MODAL_STYLES_LOADED = 'colorSharedModalStylesLoaded';

/** Single live region for modal open/close announcements (aria-live polite). */
let srLiveRegion = null;
function announceToScreenReader(message) {
  if (!srLiveRegion) {
    srLiveRegion = document.createElement('div');
    srLiveRegion.setAttribute('role', 'status');
    srLiveRegion.setAttribute('aria-live', 'polite');
    srLiveRegion.setAttribute('aria-atomic', 'true');
    srLiveRegion.className = 'sr-only';
    srLiveRegion.id = 'color-shared-modal-sr-announcer';
    document.body?.appendChild(srLiveRegion);
  }
  srLiveRegion.textContent = '';
  setTimeout(() => {
    srLiveRegion.textContent = message || '';
    setTimeout(() => { srLiveRegion.textContent = ''; }, 1000);
  }, 100);
}

/** Close (X) icon — from assets: modal/icons/close.svg (Explore Palette 3) */
const CLOSE_ICON_SVG = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M13.8854 12L19.6094 6.27603C20.1302 5.75521 20.1302 4.91145 19.6094 4.39062C19.0885 3.86979 18.2448 3.86979 17.724 4.39062L12 10.1146L6.27603 4.39062C5.75521 3.86979 4.91145 3.86979 4.39062 4.39062C3.86979 4.91145 3.86979 5.75521 4.39062 6.27603L10.1146 12L4.39062 17.724C3.86979 18.2448 3.86979 19.0885 4.39062 19.6094C4.65103 19.8698 4.99218 20 5.33333 20C5.67447 20 6.01562 19.8698 6.27603 19.6094L12 13.8854L17.724 19.6094C17.9844 19.8698 18.3255 20 18.6667 20C19.0078 20 19.349 19.8698 19.6094 19.6094C20.1302 19.0885 20.1302 18.2448 19.6094 17.724L13.8854 12Z" fill="currentColor"/></svg>';

export const MODAL_TYPE_DRAWER = 'drawer';
export const MODAL_TYPE_STANDARD = 'standard';
export const BREAKPOINT_DESKTOP = 1024;

let stylesLoadPromise = null;

function ensureModalStyles() {
  if (stylesLoadPromise) return stylesLoadPromise;
  stylesLoadPromise = import(`${getLibs()}/utils/utils.js`)
    .then(({ loadStyle, getConfig }) => {
      const config = getConfig?.();
      const codeRoot = config?.codeRoot || '/express/code';
      return loadStyle(`${codeRoot}/scripts/color-shared/modal/modal-styles.css`);
    })
    .then(() => {
      document.documentElement.dataset[MODAL_STYLES_LOADED] = 'true';
    })
    .catch(() => {});
  return stylesLoadPromise;
}

function getTypeForViewport(width) {
  return width >= BREAKPOINT_DESKTOP ? MODAL_TYPE_STANDARD : MODAL_TYPE_DRAWER;
}

export function createModalManager() {
  ensureModalStyles();

  let currentModal = null;
  let isOpen = false;
  let modalType = MODAL_TYPE_DRAWER;
  let onCloseCallback = null;
  let openOptions = null;
  let drawerOpenedAt = 0;
  let resizeDebounceTimer = null;
  let resizeListener = null;

  function createOverlay(type) {
    const curtainClass = type === MODAL_TYPE_DRAWER ? 'ax-color-drawer-modal-curtain' : 'ax-color-modal-curtain';
    const overlay = createTag('div', {
      class: curtainClass,
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'ax-color-modal-title',
    });

    overlay.addEventListener('click', (e) => {
      if (e.target !== overlay) return;
      if (type === MODAL_TYPE_DRAWER && Date.now() - drawerOpenedAt < 500) return;
      close();
    });

    return overlay;
  }

  function createContainer(type) {
    const containerClass = type === MODAL_TYPE_DRAWER ? 'ax-color-drawer-modal-container' : 'ax-color-modal-container';
    return createTag('div', { class: containerClass });
  }

  function addDrawerSwipeToClose(container) {
    let startY = 0;
    function onStart(e) {
      startY = e.touches[0].clientY;
    }
    function onMove(e) {
      const content = container.querySelector('.ax-color-drawer-modal-content');
      if (!content || content.scrollTop > 2) return;
      const deltaY = e.touches[0].clientY - startY;
      if (deltaY > 60) close();
    }
    container.addEventListener('touchstart', onStart, { passive: true });
    container.addEventListener('touchmove', onMove, { passive: true });
  }

  function switchMode(newType) {
    if (!currentModal || newType === modalType) return;
    const overlay = currentModal;
    const container = currentModal.querySelector('.ax-color-drawer-modal-container, .ax-color-modal-container');
    if (!container) return;

    const isToDrawer = newType === MODAL_TYPE_DRAWER;
    const width = window.innerWidth;
    const isDesktop = width >= BREAKPOINT_DESKTOP;
    const isTabletOrDesktop = width >= 768;

    const computed = getComputedStyle(container);

    /* Pin dimensions during swap (resize down desktop → tablet). */
    const minH = container.style.minHeight || computed.minHeight;
    const h = container.style.height || computed.height;
    if (minH && minH !== '0px') {
      container.style.minHeight = minH;
    } else if (isDesktop) {
      container.style.minHeight = '604px';
    } else if (isToDrawer && isTabletOrDesktop) {
      /* Resizing down: pin min-height so drawer does not flash. */
      container.style.minHeight = '604px';
    }
    if (isDesktop && h && h !== '0px') container.style.height = h;
    else if (isDesktop) container.style.height = '604px';
    else if (isToDrawer && isTabletOrDesktop) container.style.height = '604px';

    /* Disable transitions during swap to avoid artifacts at tablet/desktop breakpoint */
    overlay.classList.add('ax-color-modal-no-transition');
    container.classList.add('ax-color-modal-no-transition');

    overlay.className = isToDrawer ? 'ax-color-drawer-modal-curtain' : 'ax-color-modal-curtain';
    container.className = isToDrawer ? 'ax-color-drawer-modal-container' : 'ax-color-modal-container';
    overlay.classList.add('ax-color-modal-no-transition');
    container.classList.add('ax-color-modal-no-transition');

    const header = container.querySelector('.ax-color-drawer-modal-header, .ax-color-modal-header');
    const titleEl = container.querySelector('.ax-color-drawer-modal-title, .ax-color-modal-title');
    const closeBtn = container.querySelector('.ax-color-drawer-modal-close, .ax-color-modal-close');
    const body = container.querySelector('.ax-color-drawer-modal-content, .ax-color-modal-content');
    const footer = container.querySelector('.ax-color-drawer-modal-actions, .ax-color-modal-actions');
    const cancelBtn = container.querySelector('.ax-color-drawer-modal-cancel, .ax-color-modal-cancel');
    const confirmBtn = container.querySelector('.ax-color-drawer-modal-confirm, .ax-color-modal-confirm');

    if (header) header.className = isToDrawer ? 'ax-color-drawer-modal-header' : 'ax-color-modal-header';
    if (titleEl) titleEl.className = isToDrawer ? 'ax-color-drawer-modal-title' : 'ax-color-modal-title';
    if (closeBtn) closeBtn.className = isToDrawer ? 'ax-color-drawer-modal-close' : 'ax-color-modal-close';
    if (body) body.className = isToDrawer ? 'ax-color-drawer-modal-content' : 'ax-color-modal-content';
    if (footer) footer.className = isToDrawer ? 'ax-color-drawer-modal-actions' : 'ax-color-modal-actions';
    if (cancelBtn) cancelBtn.className = isToDrawer ? 'ax-color-drawer-modal-cancel' : 'ax-color-modal-cancel';
    if (confirmBtn) confirmBtn.className = isToDrawer ? 'ax-color-drawer-modal-confirm' : 'ax-color-modal-confirm';

    let handle = container.querySelector('.ax-color-drawer-modal-handle');
    if (isToDrawer && !handle) {
      handle = createHandle();
      container.insertBefore(handle, header);
    } else if (!isToDrawer && handle) {
      handle.remove();
    }

    if (isToDrawer) {
      container.classList.remove('drawer-closing');
      container.classList.add('drawer-open');
      drawerOpenedAt = Date.now();
      addDrawerSwipeToClose(container);
    } else {
      container.classList.remove('drawer-open', 'drawer-closing');
    }

    modalType = newType;
    if (openOptions) openOptions.type = newType;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.remove('ax-color-modal-no-transition');
        container.classList.remove('ax-color-modal-no-transition');
        container.style.minHeight = '';
        container.style.height = '';
      });
    });
  }

  function addResizeListener() {
    function checkViewport() {
      if (!isOpen || !currentModal) return;
      const width = window.innerWidth;
      const newType = getTypeForViewport(width);
      if (newType === modalType) return;
      switchMode(newType);
    }
    function onResize() {
      if (resizeDebounceTimer) clearTimeout(resizeDebounceTimer);
      resizeDebounceTimer = setTimeout(checkViewport, 150);
    }
    resizeListener = onResize;
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
  }

  function removeResizeListener() {
    if (resizeDebounceTimer) {
      clearTimeout(resizeDebounceTimer);
      resizeDebounceTimer = null;
    }
    if (resizeListener) {
      window.removeEventListener('resize', resizeListener);
      window.removeEventListener('orientationchange', resizeListener);
      resizeListener = null;
    }
  }

  function createHandle() {
    const handle = createTag('div', { class: 'ax-color-drawer-modal-handle' });
    return handle;
  }

  function createHeader(title) {
    const headerClass = modalType === MODAL_TYPE_DRAWER ? 'ax-color-drawer-modal-header' : 'ax-color-modal-header';
    const header = createTag('div', { class: headerClass });

    const titleEl = createTag('h2', {
      id: 'ax-color-modal-title',
      class: modalType === MODAL_TYPE_DRAWER ? 'ax-color-drawer-modal-title' : 'ax-color-modal-title',
    });
    titleEl.textContent = title;

    const closeClass = modalType === MODAL_TYPE_DRAWER ? 'ax-color-drawer-modal-close' : 'ax-color-modal-close';
    const closeBtn = createTag('button', {
      type: 'button',
      class: closeClass,
      'aria-label': 'Close modal',
    });
    closeBtn.innerHTML = CLOSE_ICON_SVG;
    closeBtn.addEventListener('click', () => close());

    header.appendChild(titleEl);
    header.appendChild(closeBtn);

    return header;
  }

  function createBody() {
    const bodyClass = modalType === MODAL_TYPE_DRAWER ? 'ax-color-drawer-modal-content' : 'ax-color-modal-content';
    return createTag('div', { class: bodyClass });
  }

  function createFooter(actions = {}) {
    const footerClass = modalType === MODAL_TYPE_DRAWER ? 'ax-color-drawer-modal-actions' : 'ax-color-modal-actions';
    const footer = createTag('div', { class: footerClass });

    const {
      cancelLabel = 'Cancel',
      confirmLabel = 'Save',
      onCancel,
      onConfirm,
      showCancel = true,
      showConfirm = true,
    } = actions;

    if (showCancel) {
      const cancelBtn = createTag('button', {
        type: 'button',
        class: modalType === MODAL_TYPE_DRAWER ? 'ax-color-drawer-modal-cancel' : 'ax-color-modal-cancel',
      });
      cancelBtn.textContent = cancelLabel;
      cancelBtn.addEventListener('click', () => {
        onCancel?.();
        close();
      });
      footer.appendChild(cancelBtn);
    }

    if (showConfirm) {
      const confirmBtn = createTag('button', {
        type: 'button',
        class: modalType === MODAL_TYPE_DRAWER ? 'ax-color-drawer-modal-confirm' : 'ax-color-modal-confirm',
      });
      confirmBtn.textContent = confirmLabel;
      confirmBtn.addEventListener('click', () => onConfirm?.());
      footer.appendChild(confirmBtn);
    }

    return footer;
  }

  function handleKeyboard(e) {
    if (!isOpen) return;

    if (e.key === 'Escape') {
      close();
    }

    if (e.key === 'Tab') {
      const focusableElements = currentModal?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );

      if (focusableElements && focusableElements.length > 0) {
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  }

  async function open(options = {}) {
    await ensureModalStyles();

    if (isOpen) close();

    const {
      type = MODAL_TYPE_DRAWER,
      title = 'Modal',
      content,
      actions: actionsIn,
      onClose,
    } = options;

    modalType = type;
    onCloseCallback = onClose;
    openOptions = { type, title, content, actions: actionsIn, onClose };
    if (type === MODAL_TYPE_DRAWER) drawerOpenedAt = Date.now();

    const a = actionsIn || {};
    const actions = {
      cancelLabel: a.cancel?.label ?? a.cancelLabel ?? 'Cancel',
      confirmLabel: a.confirm?.label ?? a.confirmLabel ?? 'Save',
      onCancel: a.cancel?.onClick ?? a.onCancel,
      onConfirm: a.confirm?.onClick ?? a.onConfirm,
      showCancel: a.cancel !== undefined ? (a.cancel !== false) : true,
      showConfirm: a.confirm !== undefined ? (a.confirm !== false) : true,
    };

    const overlay = createOverlay(type);
    const container = createContainer(type);
    const header = createHeader(title);
    const body = createBody();
    const footer = actionsIn ? createFooter(actions) : null;

    if (content) {
      if (typeof content === 'string') {
        body.innerHTML = content;
      } else {
        body.appendChild(content);
      }
    }

    if (modalType === MODAL_TYPE_DRAWER) {
      container.appendChild(createHandle());
    }
    container.appendChild(header);
    container.appendChild(body);
    if (footer) {
      container.appendChild(footer);
    }

    overlay.appendChild(container);
    document.body.appendChild(overlay);
    document.body.classList.add('ax-color-modal-open');

    currentModal = overlay;
    isOpen = true;
    announceToScreenReader(`${title} modal opened`);

    if (modalType === MODAL_TYPE_DRAWER) addDrawerSwipeToClose(container);
    addResizeListener();
    document.addEventListener('keydown', handleKeyboard);

    if (modalType === MODAL_TYPE_DRAWER) {
      requestAnimationFrame(() => {
        container.classList.add('drawer-open');
      });
    } else {
      overlay.classList.remove('hidden');
    }

    setTimeout(() => {
      const firstFocusable = container.querySelector('button, [href], input, select, textarea');
      firstFocusable?.focus();
    }, 150);
  }

  function close() {
    if (!isOpen) return;
    const closingTitle = currentModal?.querySelector('.ax-color-drawer-modal-title, .ax-color-modal-title')?.textContent || 'Modal';
    announceToScreenReader(`${closingTitle} modal closed`);

    const container = currentModal?.querySelector('.ax-color-drawer-modal-container, .ax-color-modal-container');
    if (modalType === MODAL_TYPE_DRAWER && container) {
      container.classList.remove('drawer-open');
      container.classList.add('drawer-closing');
    } else if (currentModal) {
      currentModal.classList.add('hidden');
      const c = currentModal.querySelector('.ax-color-modal-container');
      if (c) c.classList.add('hidden');
    }

    document.body.classList.remove('ax-color-modal-open');
    removeResizeListener();
    document.removeEventListener('keydown', handleKeyboard);

    const duration = 300;
    setTimeout(() => {
      currentModal?.remove();
      currentModal = null;
      isOpen = false;
      modalType = MODAL_TYPE_DRAWER;
      onCloseCallback?.();
      onCloseCallback = null;
      openOptions = null;
    }, duration);
  }

  function updateTitle(newTitle) {
    const titleEl = currentModal?.querySelector('.ax-color-drawer-modal-title, .ax-color-modal-title');
    if (titleEl) {
      titleEl.textContent = newTitle;
    }
  }

  function getBody() {
    return currentModal?.querySelector('.ax-color-drawer-modal-content, .ax-color-modal-content');
  }

  function checkIsOpen() {
    return isOpen;
  }

  function getType() {
    return modalType;
  }

  /** Vanilla content only (no Lit/Spectrum). Phase 1 easy wire. */
  function createSimplePaletteContent(palette) {
    const wrap = createTag('div', { class: 'color-modal-simple-palette' });
    const name = createTag('p', { class: 'color-modal-simple-palette-name' });
    name.textContent = palette?.name ? `Palette: ${palette.name}` : 'Palette';
    wrap.appendChild(name);
    if (palette?.description) {
      const desc = createTag('p', { class: 'color-modal-simple-description' });
      desc.textContent = palette.description;
      wrap.appendChild(desc);
    }
    const colors = palette?.colors || [];
    if (colors.length) {
      const list = createTag('div', { class: 'color-modal-simple-swatches' });
      colors.forEach((hex) => {
        const swatch = createTag('div', {
          class: 'color-modal-simple-swatch',
          style: `background-color: ${hex}; min-width: 24px; height: 24px; border-radius: 4px;`,
          title: hex,
        });
        list.appendChild(swatch);
      });
      wrap.appendChild(list);
    }
    return wrap;
  }

  /** Vanilla content only (no Lit/Spectrum). Phase 1 easy wire. */
  function createSimpleGradientContent(gradient) {
    const wrap = createTag('div', { class: 'color-modal-simple-gradient' });
    const name = createTag('p', { class: 'color-modal-simple-gradient-name' });
    name.textContent = gradient?.name ? `Gradient: ${gradient.name}` : 'Gradient';
    wrap.appendChild(name);
    if (gradient?.description) {
      const desc = createTag('p', { class: 'color-modal-simple-description' });
      desc.textContent = gradient.description;
      wrap.appendChild(desc);
    }
    const stops = gradient?.colorStops || [];
    const angle = gradient?.angle ?? 90;
    const type = gradient?.type || 'linear';
    let css = `linear-gradient(${angle}deg, ${stops.map((s) => s?.color || '#ccc').join(', ')})`;
    if (type === 'radial') css = `radial-gradient(circle, ${stops.map((s) => s?.color || '#ccc').join(', ')})`;
    if (type === 'conic') css = `conic-gradient(from ${angle}deg, ${stops.map((s) => s?.color || '#ccc').join(', ')})`;
    const preview = createTag('div', {
      class: 'color-modal-simple-gradient-preview',
      style: `background: ${stops.length ? css : 'linear-gradient(90deg, #ccc, #999)'}; height: 80px; border-radius: 8px;`,
    });
    wrap.appendChild(preview);
    return wrap;
  }

  function openPaletteModal(palette) {
    open({
      type: 'drawer',
      title: (palette?.name && String(palette.name)) || 'Palette',
      content: createSimplePaletteContent(palette || {}),
    });
  }

  function openGradientModal(gradient) {
    open({
      type: 'drawer',
      title: (gradient?.name && String(gradient.name)) || 'Gradient',
      content: createSimpleGradientContent(gradient || {}),
    });
  }

  function destroy() {
    if (isOpen) close();
  }

  return {
    open,
    close,
    destroy,
    openPaletteModal,
    openGradientModal,
    updateTitle,
    getBody,
    isOpen: checkIsOpen,
    getType,
  };
}

/*
import { createModalManager } from './modal/createModalManager.js';
import { createColorWheelAdapter } from './adapters/litComponentAdapters.js';

const modalManager = createModalManager();

const wheelAdapter = createColorWheelAdapter('#FF6B6B', {
});

modalManager.open({
  type: 'full-screen',
  title: 'Edit Gradient Color',
  content: wheelAdapter.element,
  actions: {
    cancelLabel: 'Cancel',
    confirmLabel: 'Save Color',
    onConfirm: () => {
      const color = wheelAdapter.getCurrentColor();
      saveColor(color);
      modalManager.close();
    },
  },
  onClose: () => {
    wheelAdapter.destroy();
  },
});
*/

/*
const modalManager = createModalManager();

const paletteEditor = createPaletteEditor(paletteData);

modalManager.open({
  type: 'drawer',
  title: 'Edit Palette',
  content: paletteEditor.element,
  actions: {
    confirmLabel: 'Save Palette',
    onConfirm: () => {
      const updatedPalette = paletteEditor.getPalette();
      savePalette(updatedPalette);
      modalManager.close();
    },
  },
});
*/

/*
const modalManager = createModalManager();

const uploadUI = createUploadUI();

modalManager.open({
  type: 'full-screen',
  title: 'Upload Image to Extract Colors',
  content: uploadUI.element,
  actions: {
    showCancel: true,
    showConfirm: false, // No confirm button, handled by upload
  },
  onClose: () => {
    uploadUI.destroy();
  },
});
*/
