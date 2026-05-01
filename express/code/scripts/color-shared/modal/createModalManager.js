import { createTag } from '../../utils.js';
import loadMiloStyle from '../utils/loadMiloStyle.js';
import { announceToScreenReader, trapFocus, handleEscapeClose } from '../spectrum/index.js';
import { createSpectrumIcon } from '../utils/icons.js';
import { addSwipeToClose, saveFocusedElement, restoreFocusedElement, getNextOverlayZIndex, interpolate } from '../utils/utilities.js';
import { createColorModalPlaceholders } from '../i18n/loadColorModalPlaceholders.js';

const MODAL_STYLES_LOADED = 'colorSharedModalStylesLoaded';

let stylesLoadPromise = null;

function ensureModalStyles() {
  if (stylesLoadPromise) return stylesLoadPromise;
  stylesLoadPromise = loadMiloStyle('scripts/color-shared/modal/modal-styles.css')
    .then(() => {
      document.documentElement.dataset[MODAL_STYLES_LOADED] = 'true';
    })
    .catch(() => {});
  return stylesLoadPromise;
}

// eslint-disable-next-line import/prefer-default-export -- named export for createModalManager
export function createModalManager(strings = createColorModalPlaceholders()) {
  // Persistent shell — created once, never removed until destroy().
  let overlay = null;
  let container = null;
  let bodyEl = null;

  let isOpen = false;
  let onCloseCallback = null;
  let openOptions = null;
  let openedAt = 0;
  let previousActiveElement = null;
  let escHandler = null;
  let focusTrap = null;
  let closeTimeoutId = null;

  function close() {
    if (!isOpen) return;
    isOpen = false;

    const closingTitle = overlay.getAttribute('aria-label') || openOptions?.title || strings.defaultTitle;
    announceToScreenReader(interpolate(strings.announceClosed, { title: closingTitle }));

    clearTimeout(closeTimeoutId);
    container.classList.remove('ax-color-modal-open');
    container.classList.add('ax-color-modal-closing');
    overlay.classList.add('ax-color-modal-closing');

    document.body.classList.remove('ax-color-modal-open');
    escHandler?.release();
    escHandler = null;
    focusTrap?.release();
    focusTrap = null;

    const elementToFocus = previousActiveElement;
    const callback = onCloseCallback;
    previousActiveElement = null;
    onCloseCallback = null;
    openOptions = null;

    closeTimeoutId = setTimeout(() => {
      container.classList.remove('ax-color-modal-closing');
      overlay.classList.remove('ax-color-modal-closing');
      overlay.setAttribute('aria-hidden', 'true');
      while (bodyEl.firstChild) bodyEl.removeChild(bodyEl.firstChild);
      restoreFocusedElement(elementToFocus);
      callback?.();
    }, 300);
  }

  function createCloseButton() {
    const closeBtn = createTag('button', {
      type: 'button',
      class: 'ax-color-modal-close',
      'aria-label': strings.closeAria,
    });
    const icon = createSpectrumIcon('Close');
    icon.setAttribute('aria-hidden', 'true');
    closeBtn.appendChild(icon);
    closeBtn.addEventListener('click', () => close());
    return closeBtn;
  }

  function createTitleEl(title) {
    const titleEl = createTag('h2', {
      id: 'ax-color-modal-title',
      class: 'ax-color-modal-title',
      tabindex: '-1',
    });
    titleEl.textContent = title;
    return titleEl;
  }

  function initShell() {
    overlay = createTag('div', {
      class: 'ax-color-modal-curtain',
      role: 'dialog',
      'aria-modal': 'true',
      tabindex: '-1',
      'aria-hidden': 'true',
    });
    overlay.addEventListener('click', (e) => {
      if (e.target !== overlay) return;
      if (Date.now() - openedAt < 500) return;
      close();
    });

    container = createTag('div', { class: 'ax-color-modal-container' });
    bodyEl = createTag('div', { class: 'ax-color-modal-content' });

    container.appendChild(createTag('div', { class: 'ax-color-modal-handle' }));
    container.appendChild(bodyEl);
    container.appendChild(createCloseButton());
    overlay.appendChild(container);

    addSwipeToClose(container, {
      contentSelector: '.ax-color-modal-content',
      draggingClass: 'ax-color-modal-dragging',
      onClose: close,
    });

    document.body.appendChild(overlay);
  }

  async function open(options = {}) {
    await ensureModalStyles();

    if (!overlay) initShell();

    // Cancel any in-progress close animation and reset state.
    clearTimeout(closeTimeoutId);
    closeTimeoutId = null;
    container.classList.remove('ax-color-modal-closing');
    overlay.classList.remove('ax-color-modal-closing');

    if (isOpen) {
      isOpen = false;
      container.classList.remove('ax-color-modal-open');
      document.body.classList.remove('ax-color-modal-open');
      escHandler?.release();
      escHandler = null;
      focusTrap?.release();
      focusTrap = null;
      onCloseCallback?.();
      onCloseCallback = null;
    }

    // Clear previous content.
    while (bodyEl.firstChild) bodyEl.removeChild(bodyEl.firstChild);

    const {
      content,
      title = strings.defaultTitle,
      showTitle = false,
      onClose,
      initialFocusSelector,
    } = options;

    onCloseCallback = onClose;
    openOptions = { title, showTitle, content, onClose };
    openedAt = Date.now();

    // Update a11y attributes and optional title element.
    if (showTitle) {
      overlay.setAttribute('aria-labelledby', 'ax-color-modal-title');
      overlay.removeAttribute('aria-label');
      let titleEl = container.querySelector('.ax-color-modal-title');
      if (!titleEl) {
        titleEl = createTitleEl(title);
        container.insertBefore(titleEl, bodyEl);
      } else {
        titleEl.textContent = title;
      }
    } else {
      overlay.setAttribute('aria-label', title);
      overlay.removeAttribute('aria-labelledby');
      container.querySelector('.ax-color-modal-title')?.remove();
    }

    overlay.style.zIndex = getNextOverlayZIndex();
    overlay.removeAttribute('aria-hidden');

    if (content !== undefined && content !== null) {
      const nodeOrPromise = typeof content === 'function' ? content() : content;
      const node = (nodeOrPromise && typeof nodeOrPromise.then === 'function')
        ? await nodeOrPromise
        : nodeOrPromise;
      if (typeof node === 'string') {
        bodyEl.textContent = node;
      } else if (node && typeof node.nodeType === 'number') {
        bodyEl.appendChild(node);
      }
    }
    if (bodyEl.children.length === 0) {
      const fallback = document.createElement('div');
      fallback.className = 'ax-color-modal-content-fallback';
      fallback.textContent = strings.noContent;
      fallback.setAttribute('role', 'status');
      bodyEl.appendChild(fallback);
    }

    previousActiveElement = saveFocusedElement();
    document.body.classList.add('ax-color-modal-open');
    isOpen = true;
    announceToScreenReader(interpolate(strings.announceOpened, { title }), 'assertive');

    escHandler = handleEscapeClose(overlay, close);
    focusTrap = trapFocus(overlay, { getInitialFocus: initialFocusSelector });

    /* Force reflow so the browser records translateY(100%) before the open class fires. */
    // eslint-disable-next-line no-unused-expressions
    container.getBoundingClientRect();
    container.classList.add('ax-color-modal-open');
  }

  function updateTitle(newTitle) {
    const titleEl = container?.querySelector('.ax-color-modal-title');
    if (titleEl) titleEl.textContent = newTitle;
  }

  function getBody() {
    return bodyEl;
  }

  function checkIsOpen() {
    return isOpen;
  }

  function destroy() {
    clearTimeout(closeTimeoutId);
    if (isOpen) {
      isOpen = false;
      document.body.classList.remove('ax-color-modal-open');
      escHandler?.release();
      escHandler = null;
      focusTrap?.release();
      focusTrap = null;
    }
    overlay?.remove();
    overlay = null;
    container = null;
    bodyEl = null;
  }

  async function openPaletteModal(palette = {}) {
    const { createFullPaletteModalContent, ensurePaletteContentStyles } = await import('./createPaletteModalContent.js');
    await ensurePaletteContentStyles();
    open({
      title: (palette?.name && String(palette.name)) || 'Palette',
      showTitle: false,
      content: createFullPaletteModalContent(palette),
    });
  }

  async function openPaletteSwatchesModal(palette = {}, options = {}) {
    const {
      createPaletteSwatchesModalContent,
      ensurePaletteContentStyles,
    } = await import('./createPaletteModalContent.js');
    await ensurePaletteContentStyles();

    const contentView = createPaletteSwatchesModalContent(palette, options);
    open({
      title: (palette?.name && String(palette.name)) || 'Palette',
      showTitle: false,
      content: contentView.element,
      onClose: () => {
        contentView.destroy?.();
      },
      initialFocusSelector: options.initialFocusSelector,
    });
    contentView.initNav?.();
  }

  async function openGradientModal(gradient = {}) {
    const {
      createGradientModalContent,
      ensureGradientModalContentStyles,
    } = await import('./createGradientModalContent.js');
    await ensureGradientModalContentStyles();

    const creatorName = gradient?.creator?.name ?? gradient?.creatorName ?? 'nicolagilroy';
    const creatorImageUrl = gradient?.creator?.imageUrl ?? gradient?.creatorImageUrl;
    open({
      title: (gradient?.name && String(gradient.name)) || 'Gradient',
      showTitle: false,
      content: () => createGradientModalContent(gradient || {}, {
        creatorName,
        creatorImageUrl,
      }),
    });
  }

  async function openContrastCheckerModal(palette = {}, options = {}) {
    const {
      createContrastCheckerModalContent,
      ensureContrastContentStyles,
    } = await import('./createContrastCheckerModalContent.js');

    ensureContrastContentStyles().catch(() => {});

    const contentView = createContrastCheckerModalContent(palette, options);
    open({
      title: 'See contrast for your full palette',
      showTitle: false,
      content: contentView.element,
      initialFocusSelector: (body) => body.querySelector('.cc-modal-tab-bar [role="tab"]'),
      onClose: () => {
        contentView.destroy?.();
      },
    });
  }

  return {
    open,
    openPaletteModal,
    openPaletteSwatchesModal,
    openGradientModal,
    openContrastCheckerModal,
    close,
    destroy,
    updateTitle,
    getBody,
    isOpen: checkIsOpen,
  };
}
