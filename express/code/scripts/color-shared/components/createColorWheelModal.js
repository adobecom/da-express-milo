/**
 * Color Wheel Modal Component
 * 
 * WIREFRAME FILE - Shows modal structure with color wheel
 * 
 * Architecture Decision:
 * - Shared modal component
 * - Uses Lit <color-wheel> component via adapter
 * - Can be opened from any renderer
 * - Manages its own open/close state
 * - Returns selected colors via callback
 * 
 * Used By:
 * - Gradients Renderer (edit gradient colors)
 * - Extract Renderer (adjust extracted colors)
 * - Strips Renderer (optional - create new palette)
 * 
 * Modal Types:
 * - Full-screen: For complex editing (gradients)
 * - Drawer: For quick edits (palettes)
 */

import { createTag } from '../../../scripts/utils.js';
import { createColorWheelAdapter } from '../adapters/litComponentAdapters.js';

/**
 * Create color wheel modal
 * @param {Object} options - Configuration
 * @param {string} options.modalType - 'full-screen' or 'drawer'
 * @param {string} options.initialColor - Starting color
 * @param {Function} options.onColorChange - Color change callback
 * @param {Function} options.onSave - Save callback
 * @param {Function} options.onCancel - Cancel callback
 * @returns {Object} Modal component
 */
export function createColorWheelModal(options = {}) {
  const {
    modalType = 'full-screen',
    initialColor = '#FF0000',
    onColorChange,
    onSave,
    onCancel,
  } = options;


  let wheelAdapter = null;
  let currentColor = initialColor;
  let isOpen = false;

  /**
   * Create modal overlay
   */
  function createOverlay() {
    const overlay = createTag('div', { 
      class: `color-wheel-modal-overlay ${modalType}`,
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        close();
      }
    });

    return overlay;
  }

  /**
   * Create modal content
   */
  function createContent() {
    const content = createTag('div', { class: 'color-wheel-modal-content' });

    // Header
    const header = createTag('div', { class: 'modal-header' });
    const title = createTag('h2', {});
    title.textContent = 'Edit Color';
    const closeBtn = createTag('button', { 
      class: 'modal-close-btn',
      type: 'button',
      'aria-label': 'Close',
    });
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', close);

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Body - Color Wheel
    const body = createTag('div', { class: 'modal-body' });
    
    // Create Lit color wheel via adapter
    wheelAdapter = createColorWheelAdapter(currentColor, {
      onChange: (colorDetail) => {
        currentColor = colorDetail.color || currentColor;
        onColorChange?.(currentColor);
      },
      onChangeEnd: (colorDetail) => {
      },
    });

    body.appendChild(wheelAdapter.element);

    // TODO: Add harmony toolbar, swatch rail, etc.
    // const harmonyToolbar = createHarmonyToolbarAdapter();
    // body.appendChild(harmonyToolbar.element);

    // Footer - Actions
    const footer = createTag('div', { class: 'modal-footer' });
    
    const cancelBtn = createTag('button', { 
      class: 'modal-button cancel',
      type: 'button',
    });
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', close);

    const saveBtn = createTag('button', { 
      class: 'modal-button primary',
      type: 'button',
    });
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', () => {
      onSave?.(currentColor);
      close();
    });

    footer.appendChild(cancelBtn);
    footer.appendChild(saveBtn);

    // Assemble
    content.appendChild(header);
    content.appendChild(body);
    content.appendChild(footer);

    return content;
  }

  // Create elements
  const overlay = createOverlay();
  const content = createContent();
  overlay.appendChild(content);

  /**
   * Open modal
   */
  function open() {
    if (isOpen) return;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    isOpen = true;

    // Focus close button
    setTimeout(() => {
      overlay.querySelector('.modal-close-btn')?.focus();
    }, 100);
  }

  /**
   * Close modal
   */
  function close() {
    if (!isOpen) return;

    overlay.remove();
    document.body.style.overflow = '';
    isOpen = false;

    onCancel?.();
  }

  /**
   * Update color
   */
  function setColor(color) {
    currentColor = color;
    wheelAdapter?.setColor(color);
  }

  // Public API
  return {
    open,
    close,
    setColor,
    isOpen: () => isOpen,
    
    destroy: () => {
      close();
      wheelAdapter?.destroy();
    },
  };
}

/**
 * USAGE EXAMPLE in Renderer:
 * 
 * // Create modal once
 * const modal = createColorWheelModal({
 *   modalType: 'full-screen',
 *   initialColor: '#FF6B6B',
 *   onSave: (color) => {
 *     // Update gradient with new color
 *   },
 * });
 * 
 * // Open when user clicks edit button
 * editButton.addEventListener('click', () => {
 *   modal.setColor(gradient.baseColor);
 *   modal.open();
 * });
 */
