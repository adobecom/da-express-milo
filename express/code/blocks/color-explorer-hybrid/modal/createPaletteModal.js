/**
 * Palette Modal Content
 * 
 * WIREFRAME FILE - Shows palette editing modal content
 * 
 * Used By: Strips Renderer (Palettes)
 * Purpose: View and edit palette details
 * 
 * Features:
 * - Display palette colors
 * - Edit individual colors (opens color wheel)
 * - Copy hex codes
 * - Save to Adobe Libraries
 * - Generate harmonies
 * 
 * Uses Lit Components:
 * - <color-palette> for display
 * - <color-wheel> for editing (nested modal)
 * - <ac-brand-libraries-color-picker> for saving
 */

import { createTag } from '../../../scripts/utils.js';
import { createPaletteAdapter } from '../adapters/litComponentAdapters.js';

/**
 * Create palette modal content
 * @param {Object} palette - Palette data
 * @param {Object} options - Configuration
 * @returns {Object} Palette modal content
 */
export function createPaletteModal(palette, options = {}) {
  const {
    onSave,
    onColorEdit,
  } = options;

  console.log('[PaletteModal] Creating content for:', palette.name);

  // Current palette state (mutable)
  let currentPalette = { ...palette };

  /**
   * Create palette display section
   */
  function createPaletteDisplay() {
    const section = createTag('div', { class: 'palette-display-section' });

    // Use Lit component to display palette
    const adapter = createPaletteAdapter(currentPalette, {
      onSelect: (selectedPalette) => {
        console.log('[PaletteModal] Palette selected:', selectedPalette);
      },
    });

    section.appendChild(adapter.element);

    return { section, adapter };
  }

  /**
   * Create color swatches section with edit buttons
   */
  function createColorSwatches() {
    const section = createTag('div', { class: 'color-swatches-section' });

    const title = createTag('h3', {});
    title.textContent = 'Colors';

    const swatchesGrid = createTag('div', { class: 'swatches-grid' });

    currentPalette.colors.forEach((color, index) => {
      const swatchCard = createTag('div', { class: 'swatch-card' });

      // Color preview
      const preview = createTag('div', {
        class: 'swatch-preview',
        style: `background-color: ${color}`,
      });

      // Hex code
      const hexCode = createTag('div', { class: 'swatch-hex' });
      hexCode.textContent = color;

      // Actions
      const actions = createTag('div', { class: 'swatch-actions' });

      // Edit button
      const editBtn = createTag('button', {
        type: 'button',
        class: 'swatch-action-btn',
        'aria-label': `Edit color ${color}`,
      });
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => {
        console.log('[PaletteModal] Edit color clicked:', color);
        onColorEdit?.(color, index);
      });

      // Copy button
      const copyBtn = createTag('button', {
        type: 'button',
        class: 'swatch-action-btn',
        'aria-label': `Copy ${color}`,
      });
      copyBtn.textContent = 'Copy';
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(color);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.textContent = 'Copy';
        }, 2000);
      });

      actions.appendChild(editBtn);
      actions.appendChild(copyBtn);

      swatchCard.appendChild(preview);
      swatchCard.appendChild(hexCode);
      swatchCard.appendChild(actions);

      swatchesGrid.appendChild(swatchCard);
    });

    section.appendChild(title);
    section.appendChild(swatchesGrid);

    return section;
  }

  /**
   * Create palette info section
   */
  function createPaletteInfo() {
    const section = createTag('div', { class: 'palette-info-section' });

    // Name
    const nameLabel = createTag('label', { for: 'palette-name' });
    nameLabel.textContent = 'Palette Name';

    const nameInput = createTag('input', {
      id: 'palette-name',
      type: 'text',
      value: currentPalette.name,
      placeholder: 'Enter palette name',
    });

    nameInput.addEventListener('input', (e) => {
      currentPalette.name = e.target.value;
    });

    // Category (if applicable)
    if (currentPalette.category) {
      const categoryLabel = createTag('label', {});
      categoryLabel.textContent = 'Category';
      const categoryValue = createTag('p', {});
      categoryValue.textContent = currentPalette.category;
      section.appendChild(categoryLabel);
      section.appendChild(categoryValue);
    }

    section.appendChild(nameLabel);
    section.appendChild(nameInput);

    return section;
  }

  /**
   * Create save to libraries section
   */
  function createSaveSection() {
    const section = createTag('div', { class: 'save-section' });

    // TODO: Integrate Lit <ac-brand-libraries-color-picker> component
    // For now, simple button
    const saveBtn = createTag('button', {
      type: 'button',
      class: 'save-libraries-btn',
    });
    saveBtn.textContent = 'Save to Adobe Libraries';
    saveBtn.addEventListener('click', () => {
      console.log('[PaletteModal] Save to libraries clicked');
      // TODO: Implement Adobe Libraries integration
    });

    section.appendChild(saveBtn);

    return section;
  }

  // Assemble content
  const container = createTag('div', { class: 'palette-modal-content' });

  const { section: displaySection, adapter: paletteAdapter } = createPaletteDisplay();
  const swatchesSection = createColorSwatches();
  const infoSection = createPaletteInfo();
  const saveSection = createSaveSection();

  container.appendChild(displaySection);
  container.appendChild(swatchesSection);
  container.appendChild(infoSection);
  container.appendChild(saveSection);

  // Public API
  return {
    element: container,

    // Get current palette state
    getPalette: () => {
      console.log('[PaletteModal] Getting palette:', currentPalette);
      return { ...currentPalette };
    },

    // Update a specific color
    updateColor: (index, newColor) => {
      console.log('[PaletteModal] Updating color:', index, newColor);
      currentPalette.colors[index] = newColor;
      // TODO: Update UI
    },

    // Cleanup
    destroy: () => {
      console.log('[PaletteModal] Destroying');
      paletteAdapter.destroy();
    },
  };
}
