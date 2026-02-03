import { createTag } from '../../../scripts/utils.js';

export function createModalManager() {

  let currentModal = null;
  let isOpen = false;
  let modalType = 'drawer'; // 'drawer' or 'full-screen'
  let onCloseCallback = null;

  function createOverlay(type) {
    const overlay = createTag('div', {
      class: `color-modal-overlay ${type}`,
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'modal-title',
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        close();
      }
    });

    return overlay;
  }

  function createContainer(type) {
    const container = createTag('div', {
      class: `color-modal-container ${type}`,
    });

    return container;
  }

  function createHeader(title) {
    const header = createTag('div', { class: 'color-modal-header' });

    const titleEl = createTag('h2', {
      id: 'modal-title',
      class: 'color-modal-title',
    });
    titleEl.textContent = title;

    const closeBtn = createTag('button', {
      type: 'button',
      class: 'color-modal-close',
      'aria-label': 'Close modal',
    });
    closeBtn.innerHTML = '×';
    closeBtn.addEventListener('click', () => {
      close();
    });

    header.appendChild(titleEl);
    header.appendChild(closeBtn);

    return header;
  }

  function createBody() {
    const body = createTag('div', { class: 'color-modal-body' });
    return body;
  }

  function createFooter(actions = {}) {
    const footer = createTag('div', { class: 'color-modal-footer' });

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
        class: 'color-modal-button cancel',
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
        class: 'color-modal-button primary',
      });
      confirmBtn.textContent = confirmLabel;
      confirmBtn.addEventListener('click', () => {
        onConfirm?.();
      });
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
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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

  function open(options = {}) {
    if (isOpen) {
      console.warn('[ModalManager] Modal already open, closing previous');
      close();
    }

    const {
      type = 'drawer',
      title = 'Modal',
      content,
      actions,
      onClose,
    } = options;


    modalType = type;
    onCloseCallback = onClose;

    const overlay = createOverlay(type);
    const container = createContainer(type);
    const header = createHeader(title);
    const body = createBody();
    const footer = actions ? createFooter(actions) : null;

    if (content) {
      body.appendChild(content);
    }

    container.appendChild(header);
    container.appendChild(body);
    if (footer) {
      container.appendChild(footer);
    }

    overlay.appendChild(container);

    document.body.appendChild(overlay);
    currentModal = overlay;
    isOpen = true;

    document.body.style.overflow = 'hidden';

    document.addEventListener('keydown', handleKeyboard);

    setTimeout(() => {
      const firstFocusable = container.querySelector('button, [href], input, select, textarea');
      firstFocusable?.focus();
    }, 100);

    setTimeout(() => {
      overlay.classList.add('open');
    }, 10);

  }

  function close() {
    if (!isOpen) return;


    currentModal?.classList.remove('open');

    setTimeout(() => {
      currentModal?.remove();
      currentModal = null;
      isOpen = false;
      modalType = 'drawer';

      document.body.style.overflow = '';

      document.removeEventListener('keydown', handleKeyboard);

      onCloseCallback?.();
      onCloseCallback = null;

    }, 300); // Match CSS animation duration
  }

  function updateTitle(newTitle) {
    const titleEl = currentModal?.querySelector('.color-modal-title');
    if (titleEl) {
      titleEl.textContent = newTitle;
    }
  }

  function getBody() {
    return currentModal?.querySelector('.color-modal-body');
  }

  function checkIsOpen() {
    return isOpen;
  }

  function getType() {
    return modalType;
  }

  return {
    open,
    close,
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
