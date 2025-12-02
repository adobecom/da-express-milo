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
function swapImageOnPage(key, dataUrl) {
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
      const item = createRepeaterItem(name, fields, i);
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
export function createRepeaterItem(repeaterName, fields, index) {
  const item = document.createElement('div');
  item.className = 'daas-repeater-item';
  item.dataset.index = index;

  const header = document.createElement('div');
  header.className = 'daas-repeater-item-header';
  header.innerHTML = `
    <span class="daas-item-number">${index + 1}</span>
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

