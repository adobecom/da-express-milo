import { createTag } from '../../../scripts/utils.js';
import { createColorSwatchAdapter } from '../adapters/litComponentAdapters.js';

export function createGradientModal(gradient, options = {}) {
  const {
    onSave,
    onColorEdit,
  } = options;


  let currentGradient = { ...gradient };

  function generateGradientCSS() {
    const { type = 'linear', angle = 90, colorStops = [] } = currentGradient;

    if (colorStops.length === 0) {
      return 'linear-gradient(90deg, #ccc, #999)';
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
    ['linear', 'radial', 'conic'].forEach(type => {
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

      const swatchAdapter = createColorSwatchAdapter(stop.color, {
        onClick: () => {
          onColorEdit?.(stop.color, index);
        },
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

      stopCard.appendChild(swatchAdapter.element);
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

    getGradient: () => {
      return { ...currentGradient };
    },

    updateColorStop: (index, newColor) => {
      currentGradient.colorStops[index].color = newColor;
      updatePreview();
    },

    destroy: () => {
    },
  };
}
