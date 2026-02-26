import { createTag, getLibs } from '../../utils.js';
import { announceToScreenReader, trapFocus, handleEscapeClose } from '../spectrum/index.js';
import { createSpectrumIcon } from '../utils/icons.js';
import { addSwipeToClose, saveFocusedElement, restoreFocusedElement } from '../utils/utilities.js';

const MODAL_STYLES_LOADED = 'colorSharedModalStylesLoaded';

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

// eslint-disable-next-line import/prefer-default-export -- named export for createModalManager
export function createModalManager() {
  let currentModal = null;
  let isOpen = false;
  let onCloseCallback = null;
  let openOptions = null;
  let openedAt = 0;
  let previousActiveElement = null;
  let escHandler = null;
  let focusTrap = null;

  function close() {
    if (!isOpen) return;
    isOpen = false;

    const closingTitle = currentModal?.querySelector('.ax-color-modal-title')?.textContent
      || openOptions?.title
      || 'Modal';
    announceToScreenReader(`${closingTitle} modal closed`);

    const container = currentModal?.querySelector('.ax-color-modal-container');
    container?.classList.remove('ax-color-modal-open');
    container?.classList.add('ax-color-modal-closing');
    currentModal?.classList.add('ax-color-modal-closing');

    document.body.classList.remove('ax-color-modal-open');
    escHandler?.release();
    escHandler = null;
    focusTrap?.release();
    focusTrap = null;

    const duration = 300;
    const elementToFocus = previousActiveElement;
    const modalToRemove = currentModal;
    const callback = onCloseCallback;
    previousActiveElement = null;
    onCloseCallback = null;
    openOptions = null;
    currentModal = null;

    setTimeout(() => {
      modalToRemove?.remove();
      restoreFocusedElement(elementToFocus);
      callback?.();
    }, duration);
  }

  function createOverlay(a11y = {}) {
    const attrs = {
      class: 'ax-color-modal-curtain',
      role: 'dialog',
      'aria-modal': 'true',
      tabindex: '-1',
    };
    if (a11y.labelledById) attrs['aria-labelledby'] = a11y.labelledById;
    else if (a11y.ariaLabel) attrs['aria-label'] = a11y.ariaLabel;
    const overlay = createTag('div', attrs);

    overlay.addEventListener('click', (e) => {
      if (e.target !== overlay) return;
      if (Date.now() - openedAt < 500) return;
      close();
    });

    return overlay;
  }

  function createContainer() {
    return createTag('div', { class: 'ax-color-modal-container' });
  }

  function createHandle() {
    return createTag('div', { class: 'ax-color-modal-handle' });
  }

  function attachSwipeToClose(container) {
    return addSwipeToClose(container, {
      contentSelector: '.ax-color-modal-content',
      draggingClass: 'ax-color-modal-dragging',
      onClose: close,
    });
  }

  function createCloseButton() {
    const closeBtn = createTag('button', {
      type: 'button',
      class: 'ax-color-modal-close',
      'aria-label': 'Close modal',
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

  function createBody() {
    return createTag('div', { class: 'ax-color-modal-content' });
  }

  async function open(options = {}) {
    await ensureModalStyles();

    if (isOpen) close();

    const {
      content,
      title = 'Modal',
      showTitle = false,
      onClose,
    } = options;

    onCloseCallback = onClose;
    openOptions = { title, showTitle, content, onClose };
    openedAt = Date.now();

    const overlay = createOverlay(showTitle
      ? { labelledById: 'ax-color-modal-title' }
      : { ariaLabel: title });
    const container = createContainer();
    const body = createBody();

    const closeBtn = createCloseButton();
    container.appendChild(closeBtn);
    container.appendChild(createHandle());
    if (showTitle) {
      container.appendChild(createTitleEl(title));
    }
    container.appendChild(body);

    if (content !== undefined && content !== null) {
      const node = typeof content === 'function' ? content() : content;
      if (typeof node === 'string') {
        body.textContent = node;
      } else if (node && typeof node.nodeType === 'number') {
        body.appendChild(node);
      }
    }
    if (body.children.length === 0) {
      const fallback = document.createElement('div');
      fallback.className = 'ax-color-modal-content-fallback';
      fallback.textContent = 'No content provided';
      fallback.setAttribute('role', 'status');
      body.appendChild(fallback);
    }

    overlay.appendChild(container);
    previousActiveElement = saveFocusedElement();
    document.body.appendChild(overlay);
    document.body.classList.add('ax-color-modal-open');

    currentModal = overlay;
    isOpen = true;
    announceToScreenReader(`${title} modal opened`, 'assertive');

    attachSwipeToClose(container);
    escHandler = handleEscapeClose(overlay, close);
    focusTrap = trapFocus(overlay);

    /* Double rAF: paint at translateY(100%) before .open so slide-up transition runs every time. */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        container.classList.add('ax-color-modal-open');
        const focusTarget = showTitle
          ? container.querySelector('#ax-color-modal-title')
          : overlay;
        (focusTarget || overlay).focus();
      });
    });
  }

  function updateTitle(newTitle) {
    const titleEl = currentModal?.querySelector('.ax-color-modal-title');
    if (titleEl) {
      titleEl.textContent = newTitle;
    }
  }

  function getBody() {
    return currentModal?.querySelector('.ax-color-modal-content');
  }

  function checkIsOpen() {
    return isOpen;
  }

  function destroy() {
    if (isOpen) close();
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

  async function openGradientModal(gradient = {}) {
    const { createGradientPickerRebuildContent, loadGradientPickerRebuildStyles } = await import('./createGradientPickerRebuildContent.js');
    await loadGradientPickerRebuildStyles();
    open({
      title: (gradient?.name && String(gradient.name)) || 'Gradient',
      showTitle: false,
      content: () => createGradientPickerRebuildContent(gradient || {}, {}),
    });
  }

  return {
    open,
    openPaletteModal,
    openGradientModal,
    close,
    destroy,
    updateTitle,
    getBody,
    isOpen: checkIsOpen,
  };
}
