import { createTag } from '../../../scripts/utils.js';
import { createModalContentContainers } from './createModalContentContainers.js';
import { createGradientModalContent } from './createGradientModalContent.js';
import { announceModalState } from './screenReaderAnnouncer.js';

/**
 * Load modal styles dynamically
 * @returns {Promise<void>}
 */
async function loadModalStyles() {
  // Check if styles are already loaded
  const existingLink = document.querySelector('link[href*="modal-styles.css"]');
  if (existingLink) return;

  const stylesheetHref = `${window.location.origin}/express/code/blocks/color-explorer/modal/modal-styles.css`;
  const spectrumOverrideHref = `${window.location.origin}/express/code/blocks/color-explorer/spectrum-tags-override.css`;
  
  // PROTOTYPE: Load both modal styles and Spectrum tags override
  await Promise.all([
    new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = stylesheetHref;
      link.onload = resolve;
      link.onerror = () => reject(new Error(`Failed to load ${stylesheetHref}`));
      document.head.appendChild(link);
    }),
    new Promise((resolve, reject) => {
      const spectrumLink = document.createElement('link');
      spectrumLink.rel = 'stylesheet';
      spectrumLink.href = spectrumOverrideHref;
      spectrumLink.onload = resolve;
      spectrumLink.onerror = () => resolve(); // Don't fail if Spectrum override isn't critical
      document.head.appendChild(spectrumLink);
    })
  ]);
}

/**
 * Desktop Modal Container Component
 *
 * Epic 2.1: Enhanced Modal/Drawer System
 * Ticket: MWPW-186960
 *
 * A standalone modal container for desktop with no dependencies.
 * Features:
 * - Centered modal dialog
 * - Backdrop/curtain
 * - Header with title and close button
 * - Content area
 * - Actions footer (optional)
 * - Focus management
 * - Keyboard navigation (Escape to close)
 *
 * @param {Object} options - Configuration options
 * @param {string} options.title - Modal title
 * @param {HTMLElement|string} options.content - Modal content (element or HTML string)
 * @param {Object} options.actions - Action buttons configuration
 * @param {Function} options.onClose - Callback when modal closes
 * @returns {Object} Modal container API { element, open, close, destroy }
 */
export async function createDesktopModalContainer(options = {}) {
  const {
    title = '',
    content = null,
    actions = null,
    onClose = null,
    useContentContainers = false,
    gradientData = null, // New: gradient data for gradient modal
  } = options;

  let modalElement = null;
  let curtainElement = null;
  let isOpen = false;
  let escapeHandler = null;
  let focusableElements = [];
  let firstFocusableElement = null;
  let lastFocusableElement = null;

  /**
   * Create the backdrop/curtain element
   */
  function createCurtain() {
    if (!curtainElement) {
      curtainElement = createTag('div', {
        class: 'modal-curtain hidden',
        'aria-hidden': 'true',
      });

      // Close on backdrop click
      curtainElement.addEventListener('click', (e) => {
        if (e.target === curtainElement) {
          close();
        }
      });
    }

    // Ensure curtain is appended to body
    if (curtainElement.parentNode !== document.body) {
      if (curtainElement.parentNode) {
        curtainElement.parentNode.removeChild(curtainElement);
      }
      document.body.appendChild(curtainElement);
    }

    return curtainElement;
  }

  /**
   * Create the modal container element
   */
  async function createModal() {
    if (modalElement) {
      return modalElement;
    }

    modalElement = createTag('div', {
      class: 'modal-container hidden',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': title ? 'modal-title' : undefined,
    });

    // Close button - positioned outside modal (per Figma design)
    const closeBtn = createTag('button', {
      class: 'modal-close',
      'aria-label': 'Close palette preview',
      type: 'button',
    });
    
    // Add close icon SVG
    const closeIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    closeIcon.setAttribute('width', '18');
    closeIcon.setAttribute('height', '18');
    closeIcon.setAttribute('viewBox', '0 0 18 18');
    closeIcon.setAttribute('fill', 'none');
    closeIcon.innerHTML = '<path d="M1 1L17 17M17 1L1 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
    closeBtn.appendChild(closeIcon);
    
    closeBtn.addEventListener('click', close);
    modalElement.appendChild(closeBtn);

    // Header (if title provided)
    if (title) {
      const header = createTag('header', { class: 'modal-header' });

      const titleEl = createTag('h2', {
        id: 'modal-title',
        class: 'modal-title',
      });
      titleEl.textContent = title;

      header.appendChild(titleEl);
      modalElement.appendChild(header);
    }

    // Content area
    const contentWrapper = createTag('main', { class: 'modal-content' });

    if (content) {
      // Use provided content
      if (content instanceof Node) {
        contentWrapper.appendChild(content);
      } else if (typeof content === 'string') {
        contentWrapper.innerHTML = content;
      }
    } else if (gradientData) {
      // Use gradient-specific content (matching Figma design)
      const containers = await createGradientModalContent(gradientData);
      contentWrapper.appendChild(containers.paletteContainer);
      contentWrapper.appendChild(containers.nameTagsContainer);
      contentWrapper.appendChild(containers.toolbarContainer);

      // Set modal accessible name per Figma: "(Title of palette) - Preview"
      const paletteName = gradientData.name || 'Palette';
      modalElement.setAttribute('aria-label', `${paletteName} - Preview`);

      // Store container references for later access
      modalElement._contentContainers = containers;
    } else if (useContentContainers) {
      // Use structured content containers (for palette/gradient modals)
      const containers = createModalContentContainers();
      contentWrapper.appendChild(containers.paletteContainer);
      contentWrapper.appendChild(containers.nameTagsContainer);
      contentWrapper.appendChild(containers.toolbarContainer);

      // Store container references for later access
      modalElement._contentContainers = containers;
    }

    modalElement.appendChild(contentWrapper);

    // Actions footer (optional)
    if (actions) {
      const actionsEl = createTag('footer', { class: 'modal-actions' });

      if (actions.cancel) {
        const cancelBtn = createTag('button', {
          class: 'modal-cancel',
          type: 'button',
        });
        cancelBtn.textContent = actions.cancel.label || 'Cancel';
        cancelBtn.addEventListener('click', () => {
          if (actions.cancel.onClick) {
            actions.cancel.onClick();
          }
          close();
        });
        actionsEl.appendChild(cancelBtn);
      }

      if (actions.confirm) {
        const confirmBtn = createTag('button', {
          class: 'modal-confirm',
          type: 'button',
        });
        confirmBtn.textContent = actions.confirm.label || 'Confirm';
        confirmBtn.addEventListener('click', () => {
          if (actions.confirm.onClick) {
            actions.confirm.onClick();
          }
        });
        actionsEl.appendChild(confirmBtn);
      }

      if (actionsEl.children.length > 0) {
        modalElement.appendChild(actionsEl);
      }
    }

    return modalElement;
  }

  /**
   * Get all focusable elements within the modal
   */
  function getFocusableElements() {
    if (!modalElement) return [];

    const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    return Array.from(modalElement.querySelectorAll(selector));
  }

  /**
   * Setup focus trap
   */
  function setupFocusTrap() {
    focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    firstFocusableElement = focusableElements[0];
    lastFocusableElement = focusableElements[focusableElements.length - 1];

    // Trap focus within modal
    modalElement.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusableElement) {
          e.preventDefault();
          lastFocusableElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusableElement) {
          e.preventDefault();
          firstFocusableElement.focus();
        }
      }
    });
  }

  /**
   * Setup escape key handler
   */
  function setupEscapeHandler() {
    escapeHandler = (e) => {
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };
    document.addEventListener('keydown', escapeHandler);
  }

  /**
   * Open the modal
   */
  async function open() {
    if (isOpen) return;

    // Load modal styles first
    try {
      await loadModalStyles();
    } catch (error) {
      console.error('[Desktop Modal] Failed to load modal styles:', error);
      if (window.lana) {
        window.lana.log(`Desktop modal CSS load error: ${error.message}`, {
          tags: 'color-explorer,modal',
        });
      }
    }

    // Ensure modal element exists
    const modal = await createModal();

    // Ensure curtain exists and is visible
    const curtain = createCurtain();
    curtain.classList.remove('hidden');
    curtain.setAttribute('aria-hidden', 'false');

    // Ensure modal is appended to body (not already in DOM elsewhere)
    if (modal.parentNode !== document.body) {
      // Remove from any existing parent first
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
      document.body.appendChild(modal);
    }

    // Make modal visible
    modal.classList.remove('hidden');

    // Lock body scroll
    document.body.classList.add('modal-open');

    isOpen = true;

    // Setup focus trap and escape handler
    setupFocusTrap();
    setupEscapeHandler();

    // Focus first focusable element
    if (firstFocusableElement) {
      firstFocusableElement.focus();
    } else if (modalElement) {
      modalElement.focus();
    }

    // Announce to screen readers
    const modalType = gradientData ? 'gradient' : 'palette';
    announceModalState(true, modalType);
  }

  /**
   * Close the modal
   */
  function close() {
    if (!isOpen) return;

    // Remove escape handler
    if (escapeHandler) {
      document.removeEventListener('keydown', escapeHandler);
      escapeHandler = null;
    }

    // Hide curtain
    if (curtainElement) {
      curtainElement.classList.add('hidden');
      curtainElement.setAttribute('aria-hidden', 'true');
    }

    // Hide and remove modal
    if (modalElement) {
      modalElement.classList.add('hidden');
      if (modalElement.parentNode) {
        modalElement.parentNode.removeChild(modalElement);
      }
      // Don't set to null - keep element for reuse
    }

    // Restore body scroll
    document.body.classList.remove('modal-open');

    isOpen = false;

    // Announce to screen readers
    const modalType = gradientData ? 'gradient' : 'palette';
    announceModalState(false, modalType);

    // Call onClose callback
    if (onClose) {
      onClose();
    }
  }

  /**
   * Destroy the modal (cleanup)
   */
  function destroy() {
    close();

    if (curtainElement) {
      curtainElement.remove();
      curtainElement = null;
    }

    focusableElements = [];
    firstFocusableElement = null;
    lastFocusableElement = null;
  }

  // Initialize modal structure (but don't show it yet)
  await createModal();

  return {
    element: modalElement,
    open,
    close,
    destroy,
    isOpen: () => isOpen,
    // Access to content containers if using structured containers
    getContentContainers: () => modalElement?._contentContainers || null,
  };
}
