import { createTag } from '../../../scripts/utils.js';
import { createPaletteAdapter } from '../adapters/litComponentAdapters.js';

export function createPaletteModal(palette, options = {}) {
  const {
    onSave,
    onColorEdit,
  } = options;


  let currentPalette = { ...palette };

  function createPaletteDisplay() {
    const section = createTag('div', { class: 'palette-display-section' });

    const adapter = createPaletteAdapter(currentPalette, {
      onSelect: (selectedPalette) => {
      },
    });

    section.appendChild(adapter.element);

    return { section, adapter };
  }

  function createColorSwatches() {
    const section = createTag('div', { class: 'color-swatches-section' });

    const title = createTag('h3', {});
    title.textContent = 'Colors';

    const swatchesGrid = createTag('div', { class: 'swatches-grid' });

    currentPalette.colors.forEach((color, index) => {
      const swatchCard = createTag('div', { class: 'swatch-card' });

      const preview = createTag('div', {
        class: 'swatch-preview',
        style: `background-color: ${color}`,
      });

      const hexCode = createTag('div', { class: 'swatch-hex' });
      hexCode.textContent = color;

      const actions = createTag('div', { class: 'swatch-actions' });

      const editBtn = createTag('button', {
        type: 'button',
        class: 'swatch-action-btn',
        'aria-label': `Edit color ${color}`,
      });
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => {
        onColorEdit?.(color, index);
      });

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

  function createPaletteInfo() {
    const section = createTag('div', { class: 'palette-info-section' });

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

  function createSaveSection() {
    const section = createTag('div', { class: 'save-section' });

    const saveBtn = createTag('button', {
      type: 'button',
      class: 'save-libraries-btn',
    });
    saveBtn.textContent = 'Save to Adobe Libraries';
    saveBtn.addEventListener('click', () => {
    });

    section.appendChild(saveBtn);

    return section;
  }

  const container = createTag('div', { class: 'palette-modal-content' });

  const { section: displaySection, adapter: paletteAdapter } = createPaletteDisplay();
  const swatchesSection = createColorSwatches();
  const infoSection = createPaletteInfo();
  const saveSection = createSaveSection();

  container.appendChild(displaySection);
  container.appendChild(swatchesSection);
  container.appendChild(infoSection);
  container.appendChild(saveSection);

  return {
    element: container,

    getPalette: () => {
      return { ...currentPalette };
    },

    updateColor: (index, newColor) => {
      currentPalette.colors[index] = newColor;
    },

    destroy: () => {
      paletteAdapter.destroy();
    },
  };
}
