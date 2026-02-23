/**
 * MWPW-185800 Modal shell — createModalManager
 * Dev-only: for demonstrating the Modal gradient.
 * Uses ax-color-modal-* classes, Figma tokens, drawer/tablet/desktop breakpoints.
 */

import { createTag, getLibs } from '../../../scripts/utils.js';

const MODAL_STYLES_LOADED_KEY = 'colorSharedModalStylesLoaded';

async function ensureModalStyles() {
  if (document.documentElement.dataset[MODAL_STYLES_LOADED_KEY] === 'true') {
    return Promise.resolve();
  }
  const { getConfig, loadStyle } = await import(`${getLibs()}/utils/utils.js`);
  const config = getConfig();
  return new Promise((resolve) => {
    loadStyle(`${config.codeRoot}/scripts/color-shared/modal/modal-styles.css`, () => {
      document.documentElement.dataset[MODAL_STYLES_LOADED_KEY] = 'true';
      resolve();
    });
  });
}

function isVisible(el) {
  if (!el || el.nodeType !== 1) return false;
  const style = window.getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
}

function getFocusables(container) {
  const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const nodes = container?.querySelectorAll(selector) || [];
  return [...nodes].filter(isVisible);
}

export function createModalManager() {
  let curtain = null;
  let container = null;
  let isOpen = false;
  let isClosing = false;
  let onCloseCallback = null;
  let previousActiveElement = null;
  let liveRegion = null;
  let escapeHandler = null;
  let curtainTapTime = 0;
  let closeTimeoutId = null;

  function getOrCreateLiveRegion() {
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.className = 'ax-color-modal-live-region';
      liveRegion.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0;';
      document.body.appendChild(liveRegion);
    }
    return liveRegion;
  }

  function announce(message, assertive = false) {
    const region = getOrCreateLiveRegion();
    region.setAttribute('aria-live', assertive ? 'assertive' : 'polite');
    region.textContent = '';
    requestAnimationFrame(() => {
      region.textContent = message;
    });
  }

  function createCloseButton() {
    const btn = createTag('button', {
      type: 'button',
      class: 'ax-color-modal-close',
      'aria-label': 'Close modal',
    });
    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 14.406 14.406"><g transform="translate(-572.797 -811.797)"><line x1="11.578" y2="11.578" transform="translate(574.211 813.211)" stroke="currentColor" stroke-linecap="round" stroke-width="2"/><line x1="11.578" y1="11.578" transform="translate(574.211 813.211)" stroke="currentColor" stroke-linecap="round" stroke-width="2"/></g></svg>';
    btn.addEventListener('click', () => close());
    return btn;
  }

  function createCurtain(title, showTitle) {
    const el = createTag('div', {
      class: 'ax-color-modal-curtain',
      role: 'dialog',
      'aria-modal': 'true',
      tabindex: '-1',
    });
    if (showTitle) {
      el.setAttribute('aria-labelledby', 'ax-color-modal-title');
    } else {
      el.setAttribute('aria-label', title || 'Modal');
    }

    el.addEventListener('click', (e) => {
      if (e.target !== el) return;
      const now = Date.now();
      if (now - curtainTapTime < 500) return;
      close();
    });

    return el;
  }

  function createContainer() {
    return createTag('div', { class: 'ax-color-modal-container' });
  }

  function createHandle() {
    return createTag('div', { class: 'ax-color-modal-handle' });
  }

  function createHeader(title, showTitle) {
    const header = createTag('div', { class: 'ax-color-modal-header' });
    const closeBtn = createCloseButton();
    header.appendChild(closeBtn);
    if (showTitle && title) {
      const titleEl = createTag('h2', {
        id: 'ax-color-modal-title',
        class: 'ax-color-modal-title',
        tabindex: '-1',
      });
      titleEl.textContent = title;
      header.appendChild(titleEl);
    }
    return header;
  }

  function createContentSlot(content) {
    const slot = createTag('div', { class: 'ax-color-modal-content' });
    if (typeof content === 'string') {
      slot.textContent = content;
    } else if (content instanceof Node) {
      slot.appendChild(content);
    } else if (typeof content === 'function') {
      const result = content();
      if (typeof result === 'string') {
        slot.textContent = result;
      } else if (result instanceof Node) {
        slot.appendChild(result);
      }
    } else {
      slot.textContent = 'No content provided';
    }
    return slot;
  }

  function setupSwipeDown(contentEl) {
    let startY = 0;
    contentEl.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
    }, { passive: true });
    contentEl.addEventListener('touchend', (e) => {
      if (contentEl.scrollTop > 2) return;
      const endY = e.changedTouches[0].clientY;
      const delta = endY - startY;
      if (delta > 60) close();
    }, { passive: true });
  }

  function setupFocusTrap() {
    if (!container) return;
    const focusables = getFocusables(container);
    if (focusables.length === 0) return;

    container.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const list = getFocusables(container);
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  function open(options = {}) {
    const {
      title = 'Modal',
      content,
      showTitle = false,
      onClose,
    } = options;

    if (isOpen && isClosing) return;

    if (isOpen) {
      close();
    }

    onCloseCallback = onClose;
    previousActiveElement = document.activeElement;
    curtainTapTime = Date.now();

    ensureModalStyles().then(() => {
      const c = createCurtain(title, showTitle);
      const cnt = createContainer();
      const handle = createHandle();
      const header = createHeader(title, showTitle);
      const contentSlot = createContentSlot(content);

      cnt.appendChild(handle);
      cnt.appendChild(header);
      cnt.appendChild(contentSlot);
      c.appendChild(cnt);

      document.body.appendChild(c);
      document.body.classList.add('ax-color-modal-open');

      curtain = c;
      container = cnt;
      isOpen = true;
      isClosing = false;

      setupSwipeDown(contentSlot);
      setupFocusTrap();

      escapeHandler = (e) => {
        if (e.key === 'Escape') close();
      };
      document.addEventListener('keydown', escapeHandler);

      requestAnimationFrame(() => {
        c.classList.add('ax-color-modal-open');
        const focusTarget = showTitle && title
          ? cnt.querySelector('#ax-color-modal-title')
          : c;
        focusTarget?.focus();
      });

      announce(`${title} modal opened`, true);
    });
  }

  function close() {
    if (!isOpen || !curtain) return;
    if (isClosing) return;

    isClosing = true;
    curtain.classList.remove('ax-color-modal-open');
    curtain.classList.add('ax-color-modal-closing');

    document.removeEventListener('keydown', escapeHandler);
    escapeHandler = null;

    announce(`${curtain.querySelector('.ax-color-modal-title')?.textContent || 'Modal'} modal closed`, false);

    const nodeToRemove = curtain;
    curtain = null;
    container = null;

    closeTimeoutId = setTimeout(() => {
      nodeToRemove.remove();
      document.body.classList.remove('ax-color-modal-open');
      isOpen = false;
      isClosing = false;
      closeTimeoutId = null;
      if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
        previousActiveElement.focus();
      }
      previousActiveElement = null;
      onCloseCallback?.();
      onCloseCallback = null;
    }, 300);
  }

  function destroy() {
    if (closeTimeoutId) {
      clearTimeout(closeTimeoutId);
      closeTimeoutId = null;
    }
    if (curtain) {
      curtain.remove();
      curtain = null;
    }
    container = null;
    isOpen = false;
    isClosing = false;
    document.body.classList.remove('ax-color-modal-open');
    document.removeEventListener('keydown', escapeHandler);
    escapeHandler = null;
  }

  function updateTitle(newTitle) {
    const titleEl = container?.querySelector('#ax-color-modal-title');
    if (titleEl) titleEl.textContent = newTitle;
  }

  function getBody() {
    return container?.querySelector('.ax-color-modal-content') || null;
  }

  return {
    open,
    close,
    destroy,
    updateTitle,
    getBody,
    isOpen: () => isOpen,
  };
}
