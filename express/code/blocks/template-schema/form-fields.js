/**
 * Form field creation - all input types including dropzone, RTE, multiselect
 */

import { state } from './state.js';

/**
 * Load Quill editor from CDN if not already loaded
 */
async function loadQuill() {
  if (window.Quill) return window.Quill;

  // Load Quill CSS
  if (!document.querySelector('link[href*="quill"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.snow.css';
    document.head.appendChild(link);
  }

  // Load Quill JS
  return new Promise((resolve, reject) => {
    if (window.Quill) {
      resolve(window.Quill);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.js';
    script.onload = () => resolve(window.Quill);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/**
 * Fetch select options from a JSON endpoint
 */
export async function fetchSelectOptions(url) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Failed to fetch options from ${url}`);
    const json = await resp.json();
    if (json.data && Array.isArray(json.data)) {
      return json.data.map((item) => ({
        value: item.value || '',
        label: item.label || item.value || '',
      }));
    }
    if (Array.isArray(json)) {
      return json.map((item) => (typeof item === 'string'
        ? { value: item, label: item }
        : { value: item.value || '', label: item.label || item.value || '' }));
    }
    return [];
  } catch (e) {
    console.error('Failed to fetch options:', e);
    return [];
  }
}

/**
 * Find and swap image on page by placeholder key
 */
export function swapImageOnPage(key, dataUrl) {
  const selectors = [
    `img[alt="${key}"]`,
    `img[alt="[[${key}]]"]`,
    `[data-daas-placeholder="${key}"] img`,
  ];

  selectors.forEach((selector) => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        if (el.tagName === 'IMG') {
          el.src = dataUrl;
          el.srcset = '';
          const picture = el.closest('picture');
          if (picture) {
            picture.querySelectorAll('source').forEach((s) => s.remove());
          }
        }
      });
    } catch (e) {
      // Selector might not be valid, skip
    }
  });
}

/**
 * Reset image placeholder
 */
function resetImagePlaceholder(key) {
  console.log('Image reset for:', key);
}

/**
 * Handle image file selection
 */
function handleImageFile(file, key, preview, content, dropzone) {
  const reader = new FileReader();

  reader.onload = (e) => {
    const dataUrl = e.target.result;

    preview.innerHTML = `
      <img src="${dataUrl}" alt="Preview" />
      <button type="button" class="daas-dropzone-remove" title="Remove image">
        <svg width="16" height="16" viewBox="0 0 16 16"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
    `;
    content.style.display = 'none';
    dropzone.classList.add('daas-dropzone-has-image');

    preview.querySelector('.daas-dropzone-remove').addEventListener('click', (ev) => {
      ev.stopPropagation();
      preview.innerHTML = '';
      content.style.display = '';
      dropzone.classList.remove('daas-dropzone-has-image');
      dropzone.querySelector('.daas-dropzone-input').value = '';
      resetImagePlaceholder(key);
    });

    dropzone.dataset.imageData = dataUrl;
    dropzone.dataset.imageName = file.name;
    swapImageOnPage(key, dataUrl);
  };

  reader.readAsDataURL(file);
}

/**
 * Create image dropzone field
 */
function createImageDropzone(field, key) {
  const wrapper = document.createElement('div');
  wrapper.className = 'daas-field daas-field-image';
  wrapper.dataset.key = key;

  const label = document.createElement('label');
  const labelText = field.label || field.fieldName || key.split('.').pop();
  label.textContent = labelText;
  if (field.required === 'true') {
    label.innerHTML += ' <span class="daas-required">*</span>';
  }
  wrapper.appendChild(label);

  const dropzone = document.createElement('div');
  dropzone.className = 'daas-dropzone';
  dropzone.innerHTML = `
    <input type="file" accept="image/*" class="daas-dropzone-input" name="${key}" />
    <div class="daas-dropzone-content">
      <svg class="daas-dropzone-icon" width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="6" width="24" height="20" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
        <circle cx="11" cy="13" r="2" stroke="currentColor" stroke-width="2" fill="none"/>
        <path d="M4 22l6-6 4 4 6-6 8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </svg>
      <span class="daas-dropzone-text">Drop image here or click to browse</span>
    </div>
    <div class="daas-dropzone-preview"></div>
  `;
  wrapper.appendChild(dropzone);

  const fileInput = dropzone.querySelector('.daas-dropzone-input');
  const preview = dropzone.querySelector('.daas-dropzone-preview');
  const content = dropzone.querySelector('.daas-dropzone-content');

  dropzone.addEventListener('click', (e) => {
    if (e.target !== fileInput) fileInput.click();
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files[0]) {
      handleImageFile(fileInput.files[0], key, preview, content, dropzone);
    }
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('daas-dropzone-dragover');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('daas-dropzone-dragover');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('daas-dropzone-dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageFile(file, key, preview, content, dropzone);
    }
  });

  return wrapper;
}

/**
 * Color format conversion utilities
 */
const ColorUtils = {
  // Parse hex to RGB
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : null;
  },

  // RGB to hex
  rgbToHex(r, g, b) {
    return '#' + [r, g, b].map((x) => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  },

  // RGB to HSL
  rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h;
    let s;
    const l = (max + min) / 2;

    if (max === min) {
      h = 0;
      s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
        default: h = 0;
      }
    }
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  },

  // Format color based on selected format
  formatColor(hex, format, alpha = 1) {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;

    switch (format) {
      case 'hex':
        return hex.toUpperCase();
      case 'rgb':
        return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      case 'rgba':
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
      case 'hsl': {
        const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
        return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
      }
      case 'hsla': {
        const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
        return `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${alpha})`;
      }
      default:
        return hex;
    }
  },

  // Parse any color format back to hex (for color input)
  parseToHex(colorStr) {
    if (!colorStr) return '#000000';
    colorStr = colorStr.trim();

    // Already hex
    if (colorStr.startsWith('#')) {
      return colorStr.length === 4
        ? '#' + colorStr[1] + colorStr[1] + colorStr[2] + colorStr[2] + colorStr[3] + colorStr[3]
        : colorStr;
    }

    // RGB/RGBA
    const rgbMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      return this.rgbToHex(
        parseInt(rgbMatch[1], 10),
        parseInt(rgbMatch[2], 10),
        parseInt(rgbMatch[3], 10),
      );
    }

    // HSL/HSLA - simplified conversion
    const hslMatch = colorStr.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%/);
    if (hslMatch) {
      const h = parseInt(hslMatch[1], 10) / 360;
      const s = parseInt(hslMatch[2], 10) / 100;
      const l = parseInt(hslMatch[3], 10) / 100;

      let r; let g; let b;
      if (s === 0) {
        r = g = b = l;
      } else {
        const hue2rgb = (p, q, t) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1 / 6) return p + (q - p) * 6 * t;
          if (t < 1 / 2) return q;
          if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
          return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
      }
      return this.rgbToHex(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
    }

    return '#000000';
  },

  // Extract alpha from rgba/hsla
  extractAlpha(colorStr) {
    const match = colorStr.match(/(?:rgba|hsla)\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/);
    return match ? parseFloat(match[1]) : 1;
  },
};

/**
 * Create color picker field
 */
function createColorPicker(field, value, key) {
  const wrapper = document.createElement('div');
  wrapper.className = 'daas-field daas-field-color';
  wrapper.dataset.key = key;

  const label = document.createElement('label');
  const labelText = field.label || field.fieldName || key.split('.').pop();
  label.textContent = labelText;
  if (field.required === 'true') {
    label.innerHTML += ' <span class="daas-required">*</span>';
  }
  wrapper.appendChild(label);

  const container = document.createElement('div');
  container.className = 'daas-color-container';

  // Determine initial format and values
  const initialHex = value ? ColorUtils.parseToHex(value) : (field.default || '#1473E6');
  const initialAlpha = value ? ColorUtils.extractAlpha(value) : 1;
  const initialFormat = field.options || 'hex'; // Use options field for default format

  // Color preview swatch
  const swatch = document.createElement('div');
  swatch.className = 'daas-color-swatch';
  swatch.style.backgroundColor = initialHex;

  // Native color input (hidden behind swatch)
  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.className = 'daas-color-input';
  colorInput.value = initialHex;

  swatch.appendChild(colorInput);
  container.appendChild(swatch);

  // Format selector
  const formatSelect = document.createElement('select');
  formatSelect.className = 'daas-color-format';
  formatSelect.innerHTML = `
    <option value="hex">HEX</option>
    <option value="rgb">RGB</option>
    <option value="rgba">RGBA</option>
    <option value="hsl">HSL</option>
    <option value="hsla">HSLA</option>
  `;
  formatSelect.value = initialFormat;
  container.appendChild(formatSelect);

  // Alpha slider (shown only for rgba/hsla)
  const alphaContainer = document.createElement('div');
  alphaContainer.className = 'daas-color-alpha';
  alphaContainer.style.display = (initialFormat === 'rgba' || initialFormat === 'hsla') ? 'flex' : 'none';

  const alphaLabel = document.createElement('span');
  alphaLabel.className = 'daas-alpha-label';
  alphaLabel.textContent = 'α';

  const alphaSlider = document.createElement('input');
  alphaSlider.type = 'range';
  alphaSlider.className = 'daas-alpha-slider';
  alphaSlider.min = '0';
  alphaSlider.max = '1';
  alphaSlider.step = '0.01';
  alphaSlider.value = initialAlpha;

  const alphaValue = document.createElement('span');
  alphaValue.className = 'daas-alpha-value';
  alphaValue.textContent = initialAlpha;

  alphaContainer.appendChild(alphaLabel);
  alphaContainer.appendChild(alphaSlider);
  alphaContainer.appendChild(alphaValue);
  container.appendChild(alphaContainer);

  // Text display of formatted color (editable for manual input)
  const textInput = document.createElement('input');
  textInput.type = 'text';
  textInput.className = 'daas-input daas-color-text';
  textInput.name = key;
  textInput.value = ColorUtils.formatColor(initialHex, initialFormat, initialAlpha);
  textInput.placeholder = '#000000';
  if (field.required === 'true') textInput.required = true;
  container.appendChild(textInput);

  wrapper.appendChild(container);

  // Update function
  const updateColor = () => {
    const hex = colorInput.value;
    const format = formatSelect.value;
    const alpha = parseFloat(alphaSlider.value);

    swatch.style.backgroundColor = format.includes('a')
      ? `rgba(${ColorUtils.hexToRgb(hex).r}, ${ColorUtils.hexToRgb(hex).g}, ${ColorUtils.hexToRgb(hex).b}, ${alpha})`
      : hex;

    textInput.value = ColorUtils.formatColor(hex, format, alpha);
    alphaValue.textContent = alpha.toFixed(2);

    // Dispatch both input and change events for validation and live preview
    textInput.dispatchEvent(new Event('input', { bubbles: true }));
    textInput.dispatchEvent(new Event('change', { bubbles: true }));
  };

  // Event listeners
  colorInput.addEventListener('input', updateColor);

  formatSelect.addEventListener('change', () => {
    const format = formatSelect.value;
    alphaContainer.style.display = (format === 'rgba' || format === 'hsla') ? 'flex' : 'none';
    updateColor();
  });

  alphaSlider.addEventListener('input', updateColor);

  // Sync function - updates all UI from text input value
  // Called on manual text input and when data is restored
  const syncFromTextValue = () => {
    const typedValue = textInput.value.trim();
    if (typedValue) {
      const parsedHex = ColorUtils.parseToHex(typedValue);
      const parsedAlpha = ColorUtils.extractAlpha(typedValue);

      // Detect format from the value
      let detectedFormat = 'hex';
      if (typedValue.startsWith('rgba')) detectedFormat = 'rgba';
      else if (typedValue.startsWith('rgb')) detectedFormat = 'rgb';
      else if (typedValue.startsWith('hsla')) detectedFormat = 'hsla';
      else if (typedValue.startsWith('hsl')) detectedFormat = 'hsl';

      colorInput.value = parsedHex;
      formatSelect.value = detectedFormat;
      alphaSlider.value = parsedAlpha;
      alphaValue.textContent = parsedAlpha.toFixed(2);
      alphaContainer.style.display = (detectedFormat === 'rgba' || detectedFormat === 'hsla') ? 'flex' : 'none';
      swatch.style.backgroundColor = typedValue;
    }
  };

  // Allow manual text input - sync back to color picker
  textInput.addEventListener('change', syncFromTextValue);

  // Store sync function on wrapper for external access (used by restoreFormData)
  wrapper.syncColorPicker = syncFromTextValue;

  return wrapper;
}

/**
 * Create rich text editor field using Quill
 */
function createRichTextEditor(field, value, key) {
  const wrapper = document.createElement('div');
  wrapper.className = 'daas-field daas-field-richtext';
  wrapper.dataset.key = key;

  const label = document.createElement('label');
  const labelText = field.label || field.fieldName || key.split('.').pop();
  label.textContent = labelText;
  if (field.required === 'true') {
    label.innerHTML += ' <span class="daas-required">*</span>';
  }
  wrapper.appendChild(label);

  const rteContainer = document.createElement('div');
  rteContainer.className = 'daas-rte-container';

  const editorEl = document.createElement('div');
  editorEl.className = 'daas-rte-editor';
  rteContainer.appendChild(editorEl);

  const hiddenInput = document.createElement('input');
  hiddenInput.type = 'hidden';
  hiddenInput.name = key;
  hiddenInput.className = 'daas-rte-value';
  hiddenInput.value = value || '';
  rteContainer.appendChild(hiddenInput);

  wrapper.appendChild(rteContainer);

  loadQuill().then((Quill) => {
    const quill = new Quill(editorEl, {
      theme: 'snow',
      placeholder: 'Enter rich text...',
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'clean'],
        ],
      },
    });

    if (value) quill.root.innerHTML = value;
    rteContainer.quillInstance = quill;

    quill.on('text-change', () => {
      hiddenInput.value = quill.root.innerHTML;
    });

    if (field.max) {
      const counter = document.createElement('span');
      counter.className = 'daas-char-counter';
      const maxVal = parseInt(field.max, 10);
      const updateCounter = () => {
        const len = quill.getText().length - 1;
        counter.textContent = `${len}/${maxVal}`;
        counter.classList.toggle('daas-over-limit', len > maxVal);
      };
      updateCounter();
      quill.on('text-change', updateCounter);
      wrapper.appendChild(counter);
    }
  }).catch((err) => {
    console.error('Failed to load Quill:', err);
    const textarea = document.createElement('textarea');
    textarea.className = 'daas-input';
    textarea.name = key;
    textarea.value = value || '';
    textarea.placeholder = 'Enter text...';
    textarea.rows = 4;
    rteContainer.replaceWith(textarea);
  });

  return wrapper;
}

/**
 * Create multi-select dropdown with checkboxes
 */
function createMultiSelect(field, value, key, options) {
  const wrapper = document.createElement('div');
  wrapper.className = 'daas-field daas-field-multiselect';
  wrapper.dataset.key = key;

  const label = document.createElement('label');
  const labelText = field.label || field.fieldName || key.split('.').pop();
  label.textContent = labelText;
  if (field.required === 'true') {
    label.innerHTML += ' <span class="daas-required">*</span>';
  }
  wrapper.appendChild(label);

  const dropdown = document.createElement('div');
  dropdown.className = 'daas-multiselect';

  const display = document.createElement('button');
  display.type = 'button';
  display.className = 'daas-multiselect-display daas-input';

  const hiddenInput = document.createElement('input');
  hiddenInput.type = 'hidden';
  hiddenInput.name = key;
  hiddenInput.className = 'daas-multiselect-value';
  wrapper.appendChild(hiddenInput);

  const optionsPanel = document.createElement('div');
  optionsPanel.className = 'daas-multiselect-options';

  const selectedValues = Array.isArray(value) ? value : (value ? [value] : []);

  const updateDisplay = () => {
    const checked = optionsPanel.querySelectorAll('input:checked');
    if (checked.length === 0) {
      display.innerHTML = '<span class="daas-multiselect-placeholder">Select options...</span>';
    } else {
      const labels = Array.from(checked).map((cb) => cb.nextElementSibling.textContent);
      display.innerHTML = `<span class="daas-multiselect-tags">${labels.map((l) => `<span class="daas-tag">${l}</span>`).join('')}</span>`;
    }
    hiddenInput.value = Array.from(checked).map((cb) => cb.value).join(',');
  };

  const populateOptions = (opts) => {
    optionsPanel.innerHTML = '';
    opts.forEach((opt) => {
      const optionLabel = document.createElement('label');
      optionLabel.className = 'daas-multiselect-option';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = opt.value;
      if (selectedValues.includes(opt.value)) checkbox.checked = true;
      checkbox.addEventListener('change', updateDisplay);

      const span = document.createElement('span');
      span.textContent = opt.label;

      optionLabel.appendChild(checkbox);
      optionLabel.appendChild(span);
      optionsPanel.appendChild(optionLabel);
    });
    updateDisplay();
  };

  display.addEventListener('click', () => {
    dropdown.classList.toggle('daas-multiselect-open');
  });

  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove('daas-multiselect-open');
    }
  });

  dropdown.appendChild(display);
  dropdown.appendChild(optionsPanel);
  wrapper.appendChild(dropdown);

  if (Array.isArray(options)) {
    populateOptions(options);
  } else if (typeof options === 'string' && (options.startsWith('/') || options.startsWith('http'))) {
    display.innerHTML = '<span class="daas-multiselect-placeholder">Loading...</span>';
    fetchSelectOptions(options).then(populateOptions);
  }

  return wrapper;
}

/**
 * Create form field based on schema field definition
 */
export function createFormField(field, value = '', keyOverride = null) {
  const key = keyOverride || field.key;
  const fieldType = field.type || 'text';
  const isMulti = fieldType.startsWith('multi-');
  const baseType = isMulti ? fieldType.replace('multi-', '') : fieldType;

  if (baseType === 'image') return createImageDropzone(field, key);
  if (baseType === 'richtext') return createRichTextEditor(field, value, key);
  if (baseType === 'color') return createColorPicker(field, value, key);
  if (baseType === 'select' && isMulti) return createMultiSelect(field, value, key, field.options);

  const wrapper = document.createElement('div');
  wrapper.className = 'daas-field';
  wrapper.dataset.key = key;

  const label = document.createElement('label');
  const labelText = field.label || field.fieldName || key.split('.').pop();
  label.textContent = labelText;
  if (field.required === 'true') {
    label.innerHTML += ' <span class="daas-required">*</span>';
  }

  let input;
  const inputId = `daas-field-${key.replace(/[.[\]]/g, '-')}`;

  switch (baseType) {
    case 'select':
      input = document.createElement('select');
      if (field.options?.startsWith('/') || field.options?.startsWith('http')) {
        input.innerHTML = '<option value="">Loading...</option>';
        fetchSelectOptions(field.options).then((options) => {
          input.innerHTML = '<option value="">Select...</option>';
          options.forEach((opt) => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            if (opt.value === value) option.selected = true;
            input.appendChild(option);
          });
        });
      } else if (field.options) {
        input.innerHTML = '<option value="">Select...</option>';
        field.options.split(',').forEach((opt) => {
          const option = document.createElement('option');
          option.value = opt.trim();
          option.textContent = opt.trim();
          if (opt.trim() === value) option.selected = true;
          input.appendChild(option);
        });
      }
      break;

    case 'boolean':
      input = document.createElement('select');
      input.innerHTML = `
        <option value="">—</option>
        <option value="true" ${value === 'true' ? 'selected' : ''}>Yes</option>
        <option value="false" ${value === 'false' ? 'selected' : ''}>No</option>
      `;
      break;

    case 'number':
      input = document.createElement('input');
      input.type = 'number';
      input.value = value;
      if (field.min) input.min = field.min;
      if (field.max) input.max = field.max;
      break;

    case 'url':
      input = document.createElement('input');
      input.type = 'url';
      input.value = value;
      input.placeholder = 'https://...';
      break;

    case 'date':
      input = document.createElement('input');
      input.type = 'date';
      input.value = value;
      break;

    case 'text':
    default:
      input = document.createElement('input');
      input.type = 'text';
      input.value = value;
      if (field.max) input.maxLength = parseInt(field.max, 10);
      if (field.pattern) input.pattern = field.pattern;
      break;
  }

  input.id = inputId;
  input.name = key;
  input.className = 'daas-input';
  if (field.required === 'true') input.required = true;
  if (field.default && !value) input.value = field.default;

  label.setAttribute('for', inputId);
  wrapper.appendChild(label);
  wrapper.appendChild(input);

  if (field.max && baseType === 'text') {
    const counter = document.createElement('span');
    counter.className = 'daas-char-counter';
    const maxVal = parseInt(field.max, 10);
    counter.textContent = `${(input.value || '').length}/${maxVal}`;
    input.addEventListener('input', () => {
      counter.textContent = `${input.value.length}/${maxVal}`;
      counter.classList.toggle('daas-over-limit', input.value.length > maxVal);
    });
    wrapper.appendChild(counter);
  }

  return wrapper;
}

/**
 * Create a fieldset/group section
 */
export function createFieldset(name, fields, isRepeater = false) {
  const section = document.createElement('fieldset');
  section.className = `daas-fieldset ${isRepeater ? 'daas-repeater' : 'daas-group'}`;
  section.dataset.name = name;

  const legend = document.createElement('legend');
  legend.innerHTML = `
    <span class="daas-fieldset-name">${name}</span>
    ${isRepeater ? '<span class="daas-badge">repeater</span>' : ''}
  `;
  section.appendChild(legend);

  const content = document.createElement('div');
  content.className = 'daas-fieldset-content';

  if (isRepeater) {
    const itemsWrapper = document.createElement('div');
    itemsWrapper.className = 'daas-repeater-items';
    itemsWrapper.dataset.repeaterName = name;

    const count = state.repeaterCounts[name] || 1;
    for (let i = 0; i < count; i++) {
      const item = createRepeaterItem(name, fields, i, count);
      itemsWrapper.appendChild(item);
    }

    content.appendChild(itemsWrapper);

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'daas-btn daas-btn-sm daas-add-item';
    addBtn.dataset.repeaterName = name;
    addBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 12 12"><path d="M6 2v8M2 6h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      Add Item
    `;
    content.appendChild(addBtn);
  } else {
    fields.forEach((field) => {
      const fieldEl = createFormField(field);
      content.appendChild(fieldEl);
    });
  }

  section.appendChild(content);
  return section;
}

/**
 * Create a single repeater item
 */
export function createRepeaterItem(repeaterName, fields, index, totalCount = 1) {
  const item = document.createElement('div');
  item.className = 'daas-repeater-item';
  item.dataset.index = index;
  item.dataset.repeaterName = repeaterName;

  const isFirst = index === 0;
  const isLast = index === totalCount - 1;

  const header = document.createElement('div');
  header.className = 'daas-repeater-item-header';
  header.innerHTML = `
    <span class="daas-item-number">${index + 1}</span>
    <div class="daas-reorder-btns">
      <button type="button" class="daas-btn-icon daas-move-up" title="Move up" ${isFirst ? 'disabled' : ''}>
        <svg width="12" height="12" viewBox="0 0 12 12"><path d="M6 2L2 6h3v4h2V6h3L6 2z" fill="currentColor"/></svg>
      </button>
      <button type="button" class="daas-btn-icon daas-move-down" title="Move down" ${isLast ? 'disabled' : ''}>
        <svg width="12" height="12" viewBox="0 0 12 12"><path d="M6 10l4-4H7V2H5v4H2l4 4z" fill="currentColor"/></svg>
      </button>
    </div>
    <button type="button" class="daas-btn-icon daas-remove-item" title="Remove item">
      <svg width="14" height="14" viewBox="0 0 14 14"><path d="M11 3L3 11M3 3l8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
    </button>
  `;
  item.appendChild(header);

  const fieldsWrapper = document.createElement('div');
  fieldsWrapper.className = 'daas-repeater-item-fields';

  fields.forEach((field) => {
    const indexedKey = `${repeaterName}[${index}].${field.fieldName}`;
    const fieldEl = createFormField(field, '', indexedKey);
    fieldsWrapper.appendChild(fieldEl);
  });

  item.appendChild(fieldsWrapper);
  return item;
}

