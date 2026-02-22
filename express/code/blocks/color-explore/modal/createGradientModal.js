import { createTag } from '../../../scripts/utils.js';

export function createGradientModal(gradient, options = {}) {
  try {
    if (!gradient || !gradient.name) {
      throw new Error('Invalid gradient data: missing name');
    }

    const {
      onSave,
      onColorEdit,
    } = options;

    const currentGradient = { ...gradient };

    if (!currentGradient.colorStops || currentGradient.colorStops.length === 0) {
      if (currentGradient.gradient && typeof currentGradient.gradient === 'string') {
        const gradientStr = currentGradient.gradient;
        const matches = gradientStr.match(/linear-gradient\((\d+)deg,\s*(.+)\)/);

        if (matches) {
          currentGradient.angle = parseInt(matches[1], 10);
          const stopsStr = matches[2];

          const stopMatches = Array.from(stopsStr.matchAll(/(rgba?\([^)]+\)|#[0-9A-Fa-f]{3,8})\s+(\d+)%/g));
          const colorStops = [];

          for (const match of stopMatches) {
            colorStops.push({
              color: match[1],
              position: parseInt(match[2], 10) / 100,
            });
          }

          if (colorStops.length > 0) {
            currentGradient.colorStops = colorStops;
            currentGradient.type = 'linear';
          }
        }
      }

      if (!currentGradient.colorStops || currentGradient.colorStops.length === 0) {
        currentGradient.colorStops = [
          { color: '#000000', position: 0 },
          { color: '#FFFFFF', position: 1 },
        ];
        currentGradient.type = currentGradient.type || 'linear';
        currentGradient.angle = currentGradient.angle || 90;
      }
    }

    function generateGradientCSS() {
      if (currentGradient.gradient && typeof currentGradient.gradient === 'string') {
        return currentGradient.gradient;
      }

      const { type = 'linear', angle = 90, colorStops = [] } = currentGradient;

      if (colorStops.length === 0) {
        return currentGradient.gradient || 'linear-gradient(90deg, #ccc, #999)';
      }

      const stops = colorStops
        .map((stop) => `${stop.color} ${stop.position * 100}%`)
        .join(', ');

      if (type === 'radial') {
        return `radial-gradient(circle, ${stops})`;
      }

      if (type === 'conic') {
        return `conic-gradient(from ${angle}deg, ${stops})`;
      }

      return `linear-gradient(${angle}deg, ${stops})`;
    }

    function createGradientPreview() {
      const section = createTag('div', { class: 'gradient-preview-section' });

      const preview = createTag('div', {
        class: 'gradient-preview-large',
        'aria-label': `${currentGradient.name} gradient preview`,
      });

      preview.style.background = generateGradientCSS();
      preview.style.height = '200px';
      preview.style.borderRadius = '8px';

      section.appendChild(preview);

      return { section, preview };
    }

    function createGradientControls() {
      const section = createTag('div', { class: 'gradient-controls-section' });

      const typeLabel = createTag('label', { for: 'gradient-type' });
      typeLabel.textContent = 'Gradient Type';

      const typeSelect = createTag('select', { id: 'gradient-type' });
      ['linear', 'radial', 'conic'].forEach((type) => {
        const option = createTag('option', { value: type });
        option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        if (type === currentGradient.type) {
          option.selected = true;
        }
        typeSelect.appendChild(option);
      });

      typeSelect.addEventListener('change', (e) => {
        currentGradient.type = e.target.value;
        updatePreview();
      });

      const angleLabel = createTag('label', { for: 'gradient-angle' });
      angleLabel.textContent = 'Angle';

      const angleInput = createTag('input', {
        id: 'gradient-angle',
        type: 'range',
        min: '0',
        max: '360',
        value: currentGradient.angle || 90,
      });

      const angleValue = createTag('span', {});
      angleValue.textContent = `${currentGradient.angle || 90}°`;

      angleInput.addEventListener('input', (e) => {
        currentGradient.angle = parseInt(e.target.value, 10);
        angleValue.textContent = `${currentGradient.angle}°`;
        updatePreview();
      });

      section.appendChild(typeLabel);
      section.appendChild(typeSelect);
      section.appendChild(angleLabel);
      section.appendChild(angleInput);
      section.appendChild(angleValue);

      return section;
    }

    function createColorStops() {
      const section = createTag('div', { class: 'color-stops-section' });

      const title = createTag('h3', {});
      title.textContent = 'Color Stops';

      const stopsContainer = createTag('div', { class: 'stops-container' });

      currentGradient.colorStops.forEach((stop, index) => {
        const stopCard = createTag('div', { class: 'stop-card' });

        const swatch = createTag('div', {
          class: 'color-swatch',
          style: `background-color: ${stop.color}; width: 40px; height: 40px; border-radius: 4px; cursor: pointer; border: 1px solid var(--color-gray-300);`,
        });
        swatch.setAttribute('aria-label', `Color stop ${index + 1}: ${stop.color}`);
        swatch.addEventListener('click', () => {
          onColorEdit?.(stop.color, index);
        });

        const posLabel = createTag('label', {});
        posLabel.textContent = `Position: ${Math.round(stop.position * 100)}%`;

        const posInput = createTag('input', {
          type: 'range',
          min: '0',
          max: '100',
          value: Math.round(stop.position * 100),
        });

        posInput.addEventListener('input', (e) => {
          stop.position = parseInt(e.target.value, 10) / 100;
          posLabel.textContent = `Position: ${Math.round(stop.position * 100)}%`;
          updatePreview();
        });

        const removeBtn = createTag('button', {
          type: 'button',
          class: 'stop-remove-btn',
          'aria-label': 'Remove color stop',
        });
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', () => {
          if (currentGradient.colorStops.length > 2) {
            currentGradient.colorStops.splice(index, 1);
            section.replaceWith(createColorStops().section);
            updatePreview();
          }
        });

        stopCard.appendChild(swatch);
        stopCard.appendChild(posLabel);
        stopCard.appendChild(posInput);
        stopCard.appendChild(removeBtn);

        stopsContainer.appendChild(stopCard);
      });

      const addBtn = createTag('button', {
        type: 'button',
        class: 'add-stop-btn',
      });
      addBtn.textContent = '+ Add Color Stop';
      addBtn.addEventListener('click', () => {
        currentGradient.colorStops.push({
          color: '#808080',
          position: 0.5,
        });
        section.replaceWith(createColorStops().section);
        updatePreview();
      });

      section.appendChild(title);
      section.appendChild(stopsContainer);
      section.appendChild(addBtn);

      return { section };
    }

    function updatePreview() {
      if (previewElement) {
        previewElement.style.background = generateGradientCSS();
      }
    }

    const container = createTag('div', { class: 'gradient-modal-content' });

    const { section: previewSection, preview: previewElement } = createGradientPreview();
    const controlsSection = createGradientControls();
    const { section: stopsSection } = createColorStops();

    container.appendChild(previewSection);
    container.appendChild(controlsSection);
    container.appendChild(stopsSection);

    return {
      element: container,

      getGradient: () => ({ ...currentGradient }),

      updateColorStop: (index, newColor) => {
        if (currentGradient.colorStops && currentGradient.colorStops[index]) {
          currentGradient.colorStops[index].color = newColor;
          updatePreview();
        }
      },

      destroy: () => {},
    };
  } catch (error) {
    if (window.lana) {
      window.lana.log(`Gradient modal error: ${error.message}`, {
        tags: 'color-explore,modal',
      });
    }

    const errorContainer = createTag('div', { class: 'gradient-modal-error' });
    const errorMessage = createTag('p', { class: 'error-message' });
    errorMessage.textContent = 'Failed to load gradient editor. Please try again.';
    errorContainer.appendChild(errorMessage);

    return {
      element: errorContainer,
      getGradient: () => null,
      updateColorStop: () => {},
      destroy: () => {},
    };
  }
}
