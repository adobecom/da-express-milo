/* eslint-disable no-use-before-define */
import { createTag, getLibs } from '../../utils.js';

const MODAL_STYLES_LOADED = 'colorSharedModalStylesLoaded';

let srLiveRegion = null;
function announceToScreenReader(message, { assertive = false } = {}) {
  if (!srLiveRegion) {
    srLiveRegion = document.createElement('div');
    srLiveRegion.setAttribute('role', 'status');
    srLiveRegion.setAttribute('aria-live', 'polite');
    srLiveRegion.setAttribute('aria-atomic', 'true');
    srLiveRegion.className = 'sr-only';
    srLiveRegion.id = 'color-shared-modal-sr-announcer';
    document.body?.appendChild(srLiveRegion);
  }
  srLiveRegion.setAttribute('aria-live', assertive ? 'assertive' : 'polite');
  srLiveRegion.textContent = '';
  setTimeout(() => {
    srLiveRegion.textContent = message || '';
  }, 100);
}

const CLOSE_ICON_PATH = 'icons/close.svg';

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

  function addSwipeToClose(container) {
    let startY = 0;
    function onStart(e) {
      startY = e.touches[0].clientY;
    }
    function onMove(e) {
      const content = container.querySelector('.ax-color-modal-content');
      if (!content || content.scrollTop > 2) return;
      const deltaY = e.touches[0].clientY - startY;
      if (deltaY > 60) close();
    }
    container.addEventListener('touchstart', onStart, { passive: true });
    container.addEventListener('touchmove', onMove, { passive: true });
  }

  function createCloseButton(codeRoot) {
    const closeBtn = createTag('button', {
      type: 'button',
      class: 'ax-color-modal-close',
      'aria-label': 'Close modal',
    });
    const icon = createTag('img', {
      src: `${codeRoot}/${CLOSE_ICON_PATH}`,
      alt: '',
      width: 24,
      height: 24,
    });
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

  function handleKeyboard(e) {
    if (!isOpen) return;

    if (e.key === 'Escape') {
      close();
    }

    if (e.key === 'Tab') {
      const candidates = currentModal?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const focusableElements = candidates ? [...candidates].filter((el) => {
        const s = window.getComputedStyle(el);
        return s.display !== 'none' && s.visibility !== 'hidden' && el.offsetParent != null;
      }) : [];

      if (focusableElements.length > 0) {
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

    let codeRoot = '/express/code';
    const libs = getLibs();
    if (libs) {
      try {
        const { getConfig } = await import(`${libs}/utils/utils.js`);
        codeRoot = getConfig?.()?.codeRoot || codeRoot;
      } catch {
        // eslint-disable-next-line no-empty
      }
    }

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

    container.appendChild(createHandle());
    container.appendChild(createCloseButton(codeRoot));
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
    const activeEl = document.activeElement;
    previousActiveElement = (activeEl instanceof Node && document.body.contains(activeEl))
      ? activeEl : null;
    document.body.appendChild(overlay);
    document.body.classList.add('ax-color-modal-open');

    currentModal = overlay;
    isOpen = true;
    announceToScreenReader(`${title} modal opened`, { assertive: true });

    addSwipeToClose(container);
    document.addEventListener('keydown', handleKeyboard);

    requestAnimationFrame(() => {
      container.classList.add('ax-color-modal-open');
      requestAnimationFrame(() => {
        const focusTarget = showTitle
          ? container.querySelector('#ax-color-modal-title')
          : overlay;
        (focusTarget || overlay).focus();
      });
    });
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;

    const closingTitle = currentModal?.querySelector('.ax-color-modal-title')?.textContent
      || openOptions?.title
      || 'Modal';
    announceToScreenReader(`${closingTitle} modal closed`);

    const container = currentModal?.querySelector('.ax-color-modal-container');
    if (container) {
      container.classList.remove('ax-color-modal-open');
      container.classList.add('ax-color-modal-closing');
    }
    if (currentModal) {
      currentModal.classList.add('ax-color-modal-closing');
    }

    document.body.classList.remove('ax-color-modal-open');
    document.removeEventListener('keydown', handleKeyboard);

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
      if (elementToFocus && typeof elementToFocus.focus === 'function' && document.body.contains(elementToFocus)) {
        elementToFocus.focus();
      }
      callback?.();
    }, duration);
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
    const { createGradientPickerRebuildContent, ensureGradientPickerRebuildStyles } = await import('./createGradientPickerRebuildContent.js');
    await ensureGradientPickerRebuildStyles();
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
