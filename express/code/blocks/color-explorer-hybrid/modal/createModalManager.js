/**
 * Modal Manager
 * 
 * WIREFRAME FILE - Shows modal orchestration structure
 * 
 * Architecture Decision:
 * - Central modal manager (singleton pattern)
 * - Handles different modal types: drawer, full-screen
 * - Manages open/close state
 * - Only one modal open at a time
 * - Composes with specific modal content (color wheel, palette editor, etc.)
 * 
 * Responsibilities:
 * - Create modal overlay & container
 * - Handle open/close animations
 * - Manage keyboard events (ESC to close)
 * - Handle backdrop clicks
 * - Prevent body scroll when open
 * - Provide consistent modal structure
 * 
 * Does NOT:
 * - Know about specific content (delegates to content creators)
 * - Manage color state (delegates to renderers)
 * - Fetch data (delegates to services)
 */

import { createTag } from '../../../scripts/utils.js';

/**
 * Create modal manager
 * @returns {Object} Modal manager instance
 */
export function createModalManager() {
  console.log('[ModalManager] Initializing modal manager');

  // Private state
  let currentModal = null;
  let isOpen = false;
  let modalType = 'drawer'; // 'drawer' or 'full-screen'
  let onCloseCallback = null;

  /**
   * Create modal overlay
   * @param {string} type - Modal type ('drawer' or 'full-screen')
   * @returns {HTMLElement} Overlay element
   */
  function createOverlay(type) {
    const overlay = createTag('div', {
      class: `color-modal-overlay ${type}`,
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'modal-title',
    });

    // Close on backdrop click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        console.log('[ModalManager] Backdrop clicked');
        close();
      }
    });

    return overlay;
  }

  /**
   * Create modal container
   * @param {string} type - Modal type
   * @returns {HTMLElement} Container element
   */
  function createContainer(type) {
    const container = createTag('div', {
      class: `color-modal-container ${type}`,
    });

    return container;
  }

  /**
   * Create modal header
   * @param {string} title - Modal title
   * @returns {HTMLElement} Header element
   */
  function createHeader(title) {
    const header = createTag('div', { class: 'color-modal-header' });

    // Title
    const titleEl = createTag('h2', {
      id: 'modal-title',
      class: 'color-modal-title',
    });
    titleEl.textContent = title;

    // Close button
    const closeBtn = createTag('button', {
      type: 'button',
      class: 'color-modal-close',
      'aria-label': 'Close modal',
    });
    closeBtn.innerHTML = '×';
    closeBtn.addEventListener('click', () => {
      console.log('[ModalManager] Close button clicked');
      close();
    });

    header.appendChild(titleEl);
    header.appendChild(closeBtn);

    return header;
  }

  /**
   * Create modal body
   * @returns {HTMLElement} Body element
   */
  function createBody() {
    const body = createTag('div', { class: 'color-modal-body' });
    return body;
  }

  /**
   * Create modal footer
   * @param {Object} actions - Action buttons configuration
   * @returns {HTMLElement} Footer element
   */
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
        console.log('[ModalManager] Cancel clicked');
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
        console.log('[ModalManager] Confirm clicked');
        onConfirm?.();
        // Note: Don't auto-close, let onConfirm decide
      });
      footer.appendChild(confirmBtn);
    }

    return footer;
  }

  /**
   * Handle keyboard events
   * @param {KeyboardEvent} e - Keyboard event
   */
  function handleKeyboard(e) {
    if (!isOpen) return;

    // ESC to close
    if (e.key === 'Escape') {
      console.log('[ModalManager] ESC pressed');
      close();
    }

    // Tab trap (keep focus inside modal)
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

  /**
   * Open modal with content
   * @param {Object} options - Modal options
   * @param {string} options.type - Modal type ('drawer' or 'full-screen')
   * @param {string} options.title - Modal title
   * @param {HTMLElement} options.content - Modal content element
   * @param {Object} options.actions - Footer actions configuration
   * @param {Function} options.onClose - Close callback
   */
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

    console.log('[ModalManager] Opening modal:', type, title);

    modalType = type;
    onCloseCallback = onClose;

    // 1. Create modal structure
    const overlay = createOverlay(type);
    const container = createContainer(type);
    const header = createHeader(title);
    const body = createBody();
    const footer = actions ? createFooter(actions) : null;

    // 2. Add content to body
    if (content) {
      body.appendChild(content);
    }

    // 3. Assemble modal
    container.appendChild(header);
    container.appendChild(body);
    if (footer) {
      container.appendChild(footer);
    }

    overlay.appendChild(container);

    // 4. Add to DOM
    document.body.appendChild(overlay);
    currentModal = overlay;
    isOpen = true;

    // 5. Prevent body scroll
    document.body.style.overflow = 'hidden';

    // 6. Add keyboard listener
    document.addEventListener('keydown', handleKeyboard);

    // 7. Focus first focusable element
    setTimeout(() => {
      const firstFocusable = container.querySelector('button, [href], input, select, textarea');
      firstFocusable?.focus();
    }, 100);

    // 8. Add open class for animation
    setTimeout(() => {
      overlay.classList.add('open');
    }, 10);

    console.log('[ModalManager] ✅ Modal opened');
  }

  /**
   * Close modal
   */
  function close() {
    if (!isOpen) return;

    console.log('[ModalManager] Closing modal');

    // 1. Remove open class for animation
    currentModal?.classList.remove('open');

    // 2. Wait for animation, then remove
    setTimeout(() => {
      currentModal?.remove();
      currentModal = null;
      isOpen = false;
      modalType = 'drawer';

      // 3. Restore body scroll
      document.body.style.overflow = '';

      // 4. Remove keyboard listener
      document.removeEventListener('keydown', handleKeyboard);

      // 5. Call close callback
      onCloseCallback?.();
      onCloseCallback = null;

      console.log('[ModalManager] ✅ Modal closed');
    }, 300); // Match CSS animation duration
  }

  /**
   * Update modal title
   * @param {string} newTitle - New title
   */
  function updateTitle(newTitle) {
    const titleEl = currentModal?.querySelector('.color-modal-title');
    if (titleEl) {
      titleEl.textContent = newTitle;
      console.log('[ModalManager] Title updated:', newTitle);
    }
  }

  /**
   * Get modal body element (for adding content dynamically)
   * @returns {HTMLElement|null} Body element
   */
  function getBody() {
    return currentModal?.querySelector('.color-modal-body');
  }

  /**
   * Check if modal is open
   * @returns {boolean} Is open
   */
  function checkIsOpen() {
    return isOpen;
  }

  /**
   * Get current modal type
   * @returns {string} Modal type
   */
  function getType() {
    return modalType;
  }

  // Public API
  return {
    open,
    close,
    updateTitle,
    getBody,
    isOpen: checkIsOpen,
    getType,
  };
}

/**
 * USAGE EXAMPLES:
 */

// Example 1: Simple modal with Lit color wheel
/*
import { createModalManager } from './modal/createModalManager.js';
import { createColorWheelAdapter } from './adapters/litComponentAdapters.js';

const modalManager = createModalManager();

// Create color wheel content
const wheelAdapter = createColorWheelAdapter('#FF6B6B', {
  onChange: (color) => console.log('Color changed:', color),
});

// Open modal
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

// Example 2: Palette editor modal
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

// Example 3: Image upload modal (Extract variant)
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
