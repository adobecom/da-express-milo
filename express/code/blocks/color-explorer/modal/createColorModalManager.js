/**
 * Color Explorer - Modal Manager
 * Handles modal/drawer interactions
 * Uses functional pattern with closures
 */

import { createTag } from '../../../scripts/utils.js';

/**
 * Create color modal manager
 * @param {Object} config - Modal configuration
 * @returns {Object} Manager instance
 */
export function createColorModalManager(config) {
  // Private state
  let isOpen = false;
  let currentItem = null;
  let modalElement = null;

  /**
   * Create gradient content for modal
   * @param {Object} gradient - Gradient data
   * @returns {HTMLElement} Content element
   */
  function createGradientContent(gradient) {
    const content = createTag('div', { class: 'modal-gradient-content' });

    // Generate gradient CSS
    const { type = 'linear', angle = 90, colorStops = [] } = gradient;
    const stops = colorStops
      .map((stop) => `${stop.color} ${stop.position * 100}%`)
      .join(', ');
    const gradientCSS = type === 'radial'
      ? `radial-gradient(circle, ${stops})`
      : `linear-gradient(${angle}deg, ${stops})`;

    // Large gradient preview
    const preview = createTag('div', {
      class: 'modal-gradient-preview',
      style: `background: ${gradientCSS}`,
    });

    // Gradient details
    const details = createTag('div', { class: 'modal-gradient-details' });
    const typeLabel = createTag('p', {}, `Type: ${type === 'radial' ? 'Radial' : 'Linear'}`);
    const stopsLabel = createTag('p', {}, `Color Stops: ${colorStops.length}`);
    details.append(typeLabel, stopsLabel);

    // Core colors
    const colorsSection = createTag('div', { class: 'modal-gradient-colors' });
    const colorsTitle = createTag('h3', {}, 'Core Colors');
    const colorsGrid = createTag('div', { class: 'modal-colors-grid' });

    const coreColors = gradient.coreColors || colorStops.map((s) => s.color);
    coreColors.forEach((color) => {
      const colorItem = createTag('div', { class: 'modal-color-item' });
      const colorBox = createTag('div', {
        class: 'modal-color-box',
        style: `background-color: ${color}`,
      });
      const colorLabel = createTag('span', { class: 'modal-color-label' }, color);
      colorItem.append(colorBox, colorLabel);
      colorsGrid.append(colorItem);
    });

    colorsSection.append(colorsTitle, colorsGrid);

    content.append(preview, details, colorsSection);
    return content;
  }

  /**
   * Create palette content for modal
   * @param {Object} palette - Palette data
   * @returns {HTMLElement} Content element
   */
  function createPaletteContent(palette) {
    const content = createTag('div', { class: 'modal-palette-content' });
    const placeholder = createTag('p', {}, `Palette: ${palette.id}`);
    content.append(placeholder);
    return content;
  }

  /**
   * Create modal element
   * @param {Object} item - Item data
   * @param {string} variant - Variant type
   * @returns {HTMLElement} Modal element
   */
  function createModal(item, variant) {
    const modal = createTag('div', {
      class: `color-modal color-modal-${variant}`,
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': item.name || 'Color details',
    });

    // Header
    const header = createTag('div', { class: 'modal-header' });
    const title = createTag('h2', {}, item.name || 'Untitled');
    const closeBtn = createTag('button', {
      class: 'modal-close',
      'aria-label': 'Close',
    }, '×');

    closeBtn.addEventListener('click', () => close());

    header.append(title, closeBtn);

    // Content - variant specific
    let content;
    if (variant === 'gradients') {
      content = createGradientContent(item);
    } else if (variant === 'strips') {
      content = createPaletteContent(item);
    } else {
      content = createTag('div', { class: 'modal-content' });
      const placeholder = createTag('p', {}, `Modal for ${variant}: ${item.id}`);
      content.append(placeholder);
    }

    content.classList.add('modal-content');

    // Footer with actions
    const footer = createTag('div', { class: 'modal-footer' });
    const saveBtn = createTag('button', { class: 'btn-primary' }, 'Save to Libraries');
    const shareBtn = createTag('button', { class: 'btn-secondary' }, 'Share');
    const downloadBtn = createTag('button', { class: 'btn-secondary' }, 'Download');

    footer.append(saveBtn, shareBtn, downloadBtn);

    modal.append(header, content, footer);

    return modal;
  }

  /**
   * Open modal
   * @param {Object} item - Item data
   * @param {string} variant - Variant type
   */
  function open(item, variant) {
    if (isOpen) {
      close();
    }

    currentItem = item;
    modalElement = createModal(item, variant);

    document.body.append(modalElement);
    document.body.style.overflow = 'hidden';

    isOpen = true;

    // ESC key handler
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        close();
        document.removeEventListener('keydown', handleEscape);
      }
    };

    document.addEventListener('keydown', handleEscape);
  }

  /**
   * Close modal
   */
  function close() {
    if (!isOpen || !modalElement) return;

    modalElement.remove();
    document.body.style.overflow = '';

    isOpen = false;
    currentItem = null;
    modalElement = null;
  }

  /**
   * Get current item
   * @returns {Object|null} Current item
   */
  function getCurrentItem() {
    return currentItem;
  }

  /**
   * Check if modal is open
   * @returns {boolean} Is open
   */
  function getIsOpen() {
    return isOpen;
  }

  // Public API
  return {
    open,
    close,
    getCurrentItem,
    getIsOpen,
  };
}

