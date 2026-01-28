import { createTag } from '../../../scripts/utils.js';

/**
 * Creates a modal manager for color explorer modals/drawers
 * @param {Object} config - Configuration object
 * @param {string} config.modalType - Type of modal: 'drawer', 'full-screen', or 'modal'
 * @returns {Object} Modal manager with open and close methods
 */
// eslint-disable-next-line import/prefer-default-export
export function createColorModalManager(config = {}) {
  const modalType = config.modalType || 'drawer';
  let currentModal = null;
  let curtain = null;
  let modalElement = null;

  function close() {
    try {
      if (currentModal && currentModal.onClose) {
        currentModal.onClose();
      }

      if (currentModal && currentModal.escapeHandler) {
        document.removeEventListener('keydown', currentModal.escapeHandler);
      }

      if (modalElement) {
        modalElement.remove();
        modalElement = null;
      }

      if (curtain) {
        curtain.classList.add('hidden');
        curtain.setAttribute('aria-hidden', 'true');
      }

      document.body.classList.remove('disable-scroll');
      currentModal = null;
    } catch (error) {
      if (window.lana) {
        window.lana.log(`Color modal close error: ${error.message}`, {
          tags: 'color-explorer,modal',
        });
      }
      // eslint-disable-next-line no-console
      console.error('Color modal close error:', error);
    }
  }

  function createCurtain() {
    if (!curtain) {
      curtain = createTag('div', { class: 'color-modal-curtain' });
      curtain.setAttribute('aria-hidden', 'true');
      curtain.addEventListener('click', close);
      document.body.appendChild(curtain);
    }
    return curtain;
  }

  function createModalContainer(type) {
    const container = createTag('div', {
      class: `color-modal-container color-modal-${type}`,
      role: 'dialog',
      'aria-modal': 'true',
    });

    if (type === 'drawer') {
      container.classList.add('color-modal-drawer');
    } else if (type === 'full-screen') {
      container.classList.add('color-modal-fullscreen');
    } else {
      container.classList.add('color-modal-standard');
    }

    return container;
  }

  function open(options, variant) {
    try {
      // Handle two different call signatures:
      // 1. open(item, variant) - simple version
      // 2. open({ type, title, content, actions, onClose }) - complex version
      let modalConfig = options;
      let itemVariant = variant;

      if (typeof options === 'object' && !options.type && !options.content) {
        // Simple version: open(item, variant)
        const item = options;
        itemVariant = variant || 'strips';

        // Create basic modal content for item
        const content = createTag('div', { class: 'color-modal-item-content' });
        const title = createTag('h2', {});
        title.textContent = item.name || 'Color Item';
        content.appendChild(title);

        if (itemVariant === 'gradients' && item.colorStops) {
          const preview = createTag('div', {
            class: 'color-modal-preview',
            style: `background: linear-gradient(${item.angle || 90}deg, ${item.colorStops.map((s) => s.color).join(', ')}); height: 200px; border-radius: 8px;`,
          });
          content.appendChild(preview);
        } else if (item.colors && Array.isArray(item.colors)) {
          const colorSwatches = createTag('div', { class: 'color-modal-swatches' });
          item.colors.forEach((color) => {
            const swatch = createTag('div', {
              class: 'color-swatch',
              style: `background-color: ${color}; width: 60px; height: 60px; border-radius: 4px; border: 1px solid #ccc;`,
            });
            colorSwatches.appendChild(swatch);
          });
          content.appendChild(colorSwatches);
        }

        modalConfig = {
          type: modalType,
          title: item.name || 'Color Item',
          content,
          actions: {
            cancelLabel: 'Close',
            onCancel: close,
          },
        };
      }

      // Close any existing modal
      close();

      // Create curtain
      const curtainEl = createCurtain();
      curtainEl.classList.remove('hidden');
      curtainEl.setAttribute('aria-hidden', 'false');

      // Create modal container
      const type = modalConfig.type || modalType;
      modalElement = createModalContainer(type);

      // Create header if title provided
      if (modalConfig.title) {
        const header = createTag('div', { class: 'color-modal-header' });
        const titleEl = createTag('h2', { class: 'color-modal-title' });
        titleEl.textContent = modalConfig.title;

        const closeBtn = createTag('button', {
          class: 'color-modal-close',
          'aria-label': 'Close modal',
          type: 'button',
        });
        closeBtn.textContent = '×';
        closeBtn.addEventListener('click', close);

        header.appendChild(titleEl);
        header.appendChild(closeBtn);
        modalElement.appendChild(header);
      }

      // Add content
      if (modalConfig.content) {
        const contentWrapper = createTag('div', { class: 'color-modal-content' });
        if (modalConfig.content instanceof Node) {
          contentWrapper.appendChild(modalConfig.content);
        } else {
          contentWrapper.innerHTML = modalConfig.content;
        }
        modalElement.appendChild(contentWrapper);
      }

      // Add actions if provided
      if (modalConfig.actions) {
        const actionsEl = createTag('div', { class: 'color-modal-actions' });

        if (modalConfig.actions.cancelLabel) {
          const cancelBtn = createTag('button', {
            class: 'color-modal-cancel',
            type: 'button',
          });
          cancelBtn.textContent = modalConfig.actions.cancelLabel;
          cancelBtn.addEventListener('click', () => {
            if (modalConfig.actions.onCancel) {
              modalConfig.actions.onCancel();
            } else {
              close();
            }
          });
          actionsEl.appendChild(cancelBtn);
        }

        if (modalConfig.actions.confirmLabel) {
          const confirmBtn = createTag('button', {
            class: 'color-modal-confirm',
            type: 'button',
          });
          confirmBtn.textContent = modalConfig.actions.confirmLabel;
          confirmBtn.addEventListener('click', () => {
            if (modalConfig.actions.onConfirm) {
              modalConfig.actions.onConfirm();
            }
          });
          actionsEl.appendChild(confirmBtn);
        }

        if (actionsEl.children.length > 0) {
          modalElement.appendChild(actionsEl);
        }
      }

      // Store onClose callback
      currentModal = {
        element: modalElement,
        onClose: modalConfig.onClose,
      };

      // Append to body
      document.body.appendChild(modalElement);
      document.body.classList.add('disable-scroll');

      // Setup escape key handler
      const escapeHandler = (e) => {
        if (e.key === 'Escape') {
          close();
        }
      };
      document.addEventListener('keydown', escapeHandler);
      currentModal.escapeHandler = escapeHandler;

      // Focus management
      const firstFocusable = modalElement.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (firstFocusable) {
        firstFocusable.focus();
      }
    } catch (error) {
      if (window.lana) {
        window.lana.log(`Color modal open error: ${error.message}`, {
          tags: 'color-explorer,modal',
        });
      }
      // eslint-disable-next-line no-console
      console.error('Color modal open error:', error);
    }
  }

  return {
    open,
    close,
  };
}
