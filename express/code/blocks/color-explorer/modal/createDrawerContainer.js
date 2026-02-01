import { createTag } from '../../../scripts/utils.js';
import { createModalContentContainers } from './createModalContentContainers.js';
import { createGradientModalContent } from './createGradientModalContent.js';
import { createPaletteModalContent } from './createPaletteModalContent.js';

/**
 * Mobile/Tablet Drawer Container Component
 *
 * Epic 2.1: Enhanced Modal/Drawer System
 * Ticket: MWPW-186961
 *
 * A mobile-first drawer container for mobile and tablet devices.
 * Features:
 * - Bottom sheet positioning
 * - Slide up/down animation
 * - Swipe down to close gesture
 * - Backdrop tap to close
 * - Drawer handle indicator
 * - Focus management
 * - Keyboard navigation (Escape to close)
 *
 * @param {Object} options - Configuration options
 * @param {string} options.title - Drawer title (optional)
 * @param {HTMLElement|string} options.content - Drawer content (element or HTML string)
 * @param {Object} options.actions - Action buttons configuration
 * @param {Function} options.onClose - Callback when drawer closes
 * @param {boolean} options.useContentContainers - Use structured content containers
 * @param {Object} options.gradientData - Gradient data for gradient drawer
 * @returns {Object} Drawer container API { element, open, close, destroy }
 */
export function createDrawerContainer(options = {}) {
  const {
    title = '',
    content = null,
    actions = null,
    onClose = null,
    useContentContainers = false,
    gradientData = null,
    paletteData = null,
  } = options;

  let drawerElement = null;
  let curtainElement = null;
  let isOpen = false;
  let escapeHandler = null;
  let focusableElements = [];
  let firstFocusableElement = null;
  let lastFocusableElement = null;

  // Swipe gesture handling
  let touchStartY = 0;
  let touchCurrentY = 0;
  let isDragging = false;
  const SWIPE_THRESHOLD = 100; // Minimum distance to trigger close

  /**
   * Create the backdrop/curtain element
   */
  function createCurtain() {
    if (!curtainElement) {
      curtainElement = createTag('div', {
        class: 'drawer-modal-curtain hidden',
        'aria-hidden': 'true',
      });

      // Close on backdrop tap
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
   * Create the drawer container element
   */
  function createDrawer() {
    if (drawerElement) {
      return drawerElement;
    }

    drawerElement = createTag('div', {
      class: 'drawer-modal-container hidden',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': title ? 'drawer-modal-title' : undefined,
    });

    // Drawer handle (visual indicator for swipe)
    const handle = createTag('div', {
      class: 'drawer-modal-handle',
      'aria-hidden': 'true',
    });
    drawerElement.appendChild(handle);

    // Close button
    const closeBtn = createTag('button', {
      class: 'drawer-modal-close',
      'aria-label': 'Close palette preview',
      type: 'button',
    });
    closeBtn.addEventListener('click', close);
    drawerElement.appendChild(closeBtn);

    // Header (if title provided)
    if (title) {
      const header = createTag('header', { class: 'drawer-modal-header' });

      const titleEl = createTag('h2', {
        id: 'drawer-modal-title',
        class: 'drawer-modal-title',
      });
      titleEl.textContent = title;

      header.appendChild(titleEl);
      drawerElement.appendChild(header);
    }

    // Content area
    const contentWrapper = createTag('main', { class: 'drawer-modal-content' });

    if (content) {
      // Use provided content
      if (content instanceof Node) {
        contentWrapper.appendChild(content);
      } else if (typeof content === 'string') {
        contentWrapper.innerHTML = content;
      }
    } else if (paletteData) {
      // Use palette-specific content (color strips matching Figma design for mobile)
      const containers = createPaletteModalContent(paletteData);
      contentWrapper.appendChild(containers.paletteContainer);
      contentWrapper.appendChild(containers.nameTagsContainer);
      contentWrapper.appendChild(containers.toolbarContainer);

      // Set drawer accessible name per Figma: "(Title of palette) - Preview"
      const paletteName = paletteData.name || 'Palette';
      drawerElement.setAttribute('aria-label', `${paletteName} - Preview`);

      // Store container references for later access
      drawerElement._contentContainers = containers;
    } else if (gradientData) {
      // Use gradient-specific content (matching Figma design)
      const containers = createGradientModalContent(gradientData);
      contentWrapper.appendChild(containers.paletteContainer);
      contentWrapper.appendChild(containers.nameTagsContainer);
      contentWrapper.appendChild(containers.toolbarContainer);

      // Set drawer accessible name per Figma: "(Title of palette) - Preview"
      const paletteName = gradientData.name || 'Palette';
      drawerElement.setAttribute('aria-label', `${paletteName} - Preview`);

      // Store container references for later access
      drawerElement._contentContainers = containers;
    } else if (useContentContainers) {
      // Use structured content containers (for palette/gradient drawers)
      const containers = createModalContentContainers();
      contentWrapper.appendChild(containers.paletteContainer);
      contentWrapper.appendChild(containers.nameTagsContainer);
      contentWrapper.appendChild(containers.toolbarContainer);

      // Store container references for later access
      drawerElement._contentContainers = containers;
    }

    drawerElement.appendChild(contentWrapper);

    // Actions footer (optional)
    if (actions) {
      const actionsEl = createTag('footer', { class: 'drawer-modal-actions' });

      if (actions.cancel) {
        const cancelBtn = createTag('button', {
          class: 'drawer-modal-cancel',
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
          class: 'drawer-modal-confirm',
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
        drawerElement.appendChild(actionsEl);
      }
    }

    // Setup swipe gesture handlers
    setupSwipeGestures();

    return drawerElement;
  }

  /**
   * Setup swipe down gesture to close drawer
   */
  function setupSwipeGestures() {
    if (!drawerElement) return;

    // Touch start
    drawerElement.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
      isDragging = true;
    }, { passive: true });

    // Touch move
    drawerElement.addEventListener('touchmove', (e) => {
      if (!isDragging) return;

      touchCurrentY = e.touches[0].clientY;
      const deltaY = touchCurrentY - touchStartY;

      // Only allow downward swipes
      if (deltaY > 0) {
        // Apply transform to drawer for visual feedback
        drawerElement.style.transform = `translateY(${deltaY}px)`;
        // Prevent scrolling while dragging
        e.preventDefault();
      }
    }, { passive: false });

    // Touch end
    drawerElement.addEventListener('touchend', () => {
      if (!isDragging) return;

      const deltaY = touchCurrentY - touchStartY;

      // Reset transform
      drawerElement.style.transform = '';

      // If swipe distance exceeds threshold, close drawer
      if (deltaY > SWIPE_THRESHOLD) {
        close();
      }

      isDragging = false;
      touchStartY = 0;
      touchCurrentY = 0;
    }, { passive: true });

    // Also allow dragging from the handle
    const handle = drawerElement.querySelector('.drawer-modal-handle');
    if (handle) {
      handle.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
        isDragging = true;
      }, { passive: true });
    }
  }

  /**
   * Get all focusable elements within the drawer
   */
  function getFocusableElements() {
    if (!drawerElement) return [];

    const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    return Array.from(drawerElement.querySelectorAll(selector));
  }

  /**
   * Setup focus trap
   */
  function setupFocusTrap() {
    focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    firstFocusableElement = focusableElements[0];
    lastFocusableElement = focusableElements[focusableElements.length - 1];

    // Trap focus within drawer
    drawerElement.addEventListener('keydown', (e) => {
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
   * Open the drawer
   */
  function open() {
    console.log('[Drawer] open() called, isOpen:', isOpen);
    if (isOpen) {
      console.log('[Drawer] Already open, returning');
      return;
    }

    // Ensure drawer element exists
    console.log('[Drawer] Creating drawer element...');
    const drawer = createDrawer();
    console.log('[Drawer] Drawer element created:', drawer);

    // Ensure curtain exists and is visible
    console.log('[Drawer] Creating curtain...');
    const curtain = createCurtain();
    curtain.classList.remove('hidden');
    curtain.setAttribute('aria-hidden', 'false');
    console.log('[Drawer] Curtain visible');

    // Ensure drawer is appended to body (not already in DOM elsewhere)
    if (drawer.parentNode !== document.body) {
      console.log('[Drawer] Appending drawer to body...');
      // Remove from any existing parent first
      if (drawer.parentNode) {
        drawer.parentNode.removeChild(drawer);
      }
      document.body.appendChild(drawer);
      console.log('[Drawer] Drawer appended to body');
    } else {
      console.log('[Drawer] Drawer already in body');
    }

    // Trigger slide-up animation
    console.log('[Drawer] Triggering slide-up animation...');
    requestAnimationFrame(() => {
      drawer.classList.remove('hidden');
      drawer.classList.add('drawer-open');
      console.log('[Drawer] Animation classes applied');
    });

    // Lock body scroll
    document.body.classList.add('modal-open');
    console.log('[Drawer] Body scroll locked');

    isOpen = true;

    // Setup focus trap and escape handler
    setupFocusTrap();
    setupEscapeHandler();

    // Focus first focusable element
    if (firstFocusableElement) {
      firstFocusableElement.focus();
    } else if (drawerElement) {
      drawerElement.focus();
    }
    
    console.log('[Drawer] Drawer opened successfully');
  }

  /**
   * Close the drawer
   */
  function close() {
    if (!isOpen) return;

    // Remove escape handler
    if (escapeHandler) {
      document.removeEventListener('keydown', escapeHandler);
      escapeHandler = null;
    }

    // Trigger slide-down animation
    if (drawerElement) {
      drawerElement.classList.remove('drawer-open');
      drawerElement.classList.add('drawer-closing');

      // Wait for animation to complete before hiding
      setTimeout(() => {
        if (drawerElement) {
          drawerElement.classList.add('hidden');
          drawerElement.classList.remove('drawer-closing');
        }
      }, 300); // Match CSS animation duration
    }

    // Hide curtain
    if (curtainElement) {
      curtainElement.classList.add('hidden');
      curtainElement.setAttribute('aria-hidden', 'true');
    }

    // Restore body scroll
    document.body.classList.remove('modal-open');

    isOpen = false;

    // Call onClose callback
    if (onClose) {
      onClose();
    }
  }

  /**
   * Destroy the drawer (cleanup)
   */
  function destroy() {
    close();

    if (drawerElement) {
      drawerElement.remove();
      drawerElement = null;
    }

    if (curtainElement) {
      curtainElement.remove();
      curtainElement = null;
    }

    focusableElements = [];
    firstFocusableElement = null;
    lastFocusableElement = null;
  }

  // Initialize drawer structure (but don't show it yet)
  createDrawer();

  return {
    element: drawerElement,
    open,
    close,
    destroy,
    isOpen: () => isOpen,
    // Access to content containers if using structured containers
    getContentContainers: () => drawerElement?._contentContainers || null,
  };
}
