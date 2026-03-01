import { createTag, getLibs } from '../../utils.js';

const MODAL_STYLES_LOADED = 'colorSharedModalStylesLoaded';
const CLOSE_ICON_PATH = 'icons/close.svg';
/** Drag past this (px) on release to close; else snap back. */
const SWIPE_CLOSE_THRESHOLD_PX = 120;
const DRAWER_MAX_DRAG_PX = 400;

let stylesLoadPromise = null;
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
  /** Keydown handler; assigned after close() so no-use-before-define is satisfied. */
  let keydownHandler = null;

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
    if (keydownHandler) document.removeEventListener('keydown', keydownHandler);

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
    let currentDragY = 0;

    function isDrawerMode() {
      return window.innerWidth < 600;
    }

    function onStart(e) {
      startY = e.touches[0].clientY;
      currentDragY = 0;
    }

    function onMove(e) {
      if (!isDrawerMode()) return;
      const content = container.querySelector('.ax-color-modal-content');
      if (!content || content.scrollTop > 2) return;
      const deltaY = e.touches[0].clientY - startY;
      if (deltaY <= 0) return;
      currentDragY = Math.min(deltaY, DRAWER_MAX_DRAG_PX);
      container.classList.add('ax-color-modal-dragging');
      container.style.setProperty('--drawer-drag-y', `${currentDragY}px`);
    }

    function onEnd() {
      if (!isDrawerMode()) return;
      container.classList.remove('ax-color-modal-dragging');
      if (currentDragY > SWIPE_CLOSE_THRESHOLD_PX) {
        close();
      } else {
        container.style.removeProperty('--drawer-drag-y');
      }
      currentDragY = 0;
    }

    container.addEventListener('touchstart', onStart, { passive: true });
    container.addEventListener('touchmove', onMove, { passive: true });
    container.addEventListener('touchend', onEnd, { passive: true });
    container.addEventListener('touchcancel', onEnd, { passive: true });
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

  keydownHandler = function onModalKeydown(e) {
    if (!isOpen) return;

    if (e.key === 'Escape') {
      close();
    }

    if (e.key === 'Tab') {
      const candidates = currentModal?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const closeBtnInModal = currentModal?.querySelector('.ax-color-modal-close');
      const isDrawerViewport = window.innerWidth < 600;

      let focusableElements = candidates ? [...candidates].filter((el) => {
        const s = window.getComputedStyle(el);
        const visible = s.display !== 'none' && s.visibility !== 'hidden' && el.offsetParent != null;
        const isCloseBtn = el === closeBtnInModal;
        if (isCloseBtn && !isDrawerViewport) return true;
        return visible;
      }) : [];

      const closeFirst = focusableElements.length > 0 && closeBtnInModal && !isDrawerViewport
        && focusableElements.includes(closeBtnInModal);
      if (closeFirst) {
        const idx = focusableElements.indexOf(closeBtnInModal);
        if (idx > 0) {
          focusableElements = [
            closeBtnInModal,
            ...focusableElements.filter((el) => el !== closeBtnInModal),
          ];
        }
      }

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
  };

  async function open(options = {}) {
    await ensureModalStyles();

    if (isOpen) close();

    let codeRoot = '/express/code';
    const libs = getLibs();
    if (libs) {
      try {
        const { getConfig } = await import(`${libs}/utils/utils.js`);
        codeRoot = getConfig?.()?.codeRoot || codeRoot;
      } catch (err) {
        window.lana?.log(`[createModalManager] getConfig failed, using default codeRoot: ${err}`, { tags: 'color-shared-modal', severity: 'error' });
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

    const closeBtn = createCloseButton(codeRoot);
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
    const activeEl = document.activeElement;
    previousActiveElement = (activeEl instanceof Node && document.body.contains(activeEl))
      ? activeEl : null;
    document.body.appendChild(overlay);
    document.body.classList.add('ax-color-modal-open');

    currentModal = overlay;
    isOpen = true;
    announceToScreenReader(`${title} modal opened`, { assertive: true });

    addSwipeToClose(container);
    document.addEventListener('keydown', keydownHandler);

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
    const { createGradientPickerRebuildContent, loadGradientPickerRebuildStyles } = await import('./createGradientPickerRebuildContent.js');
    await loadGradientPickerRebuildStyles();
    const p = palette || {};
    open({
      title: (p?.name && String(p.name)) || 'Palette',
      showTitle: false,
      content: () => createGradientPickerRebuildContent(p, {
        likesCount: '1.2K',
        creatorName: p.creator?.name ?? 'nicolagilroy',
        creatorImageUrl: p.creator?.imageUrl ?? p.creatorImageUrl,
        tags: ['Orange', 'Cinematic', 'Summer', 'Water'],
      }),
    });
  }

  async function openGradientModal(gradient = {}) {
    const { createGradientPickerRebuildContent, loadGradientPickerRebuildStyles } = await import('./createGradientPickerRebuildContent.js');
    await loadGradientPickerRebuildStyles();
    open({
      title: (gradient?.name && String(gradient.name)) || 'Gradient',
      showTitle: false,
      content: () => createGradientPickerRebuildContent(gradient || {}, {
        likesCount: '1.2K',
        creatorName: gradient?.creator?.name ?? 'nicolagilroy',
        creatorImageUrl: gradient?.creator?.imageUrl ?? gradient?.creatorImageUrl,
        tags: ['Orange', 'Cinematic', 'Summer', 'Water'],
      }),
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
