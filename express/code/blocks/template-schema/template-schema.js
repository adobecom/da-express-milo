/**
 * Template Schema Block
 *
 * Creates a side panel authoring form based on the parsed template schema.
 * - Live updates placeholders on the page
 * - Handles repeaters by modifying undecorated DOM
 * - Save button composes final HTML with data attributes
 */

const STORAGE_KEY = 'daas-template-schema';

/**
 * Get stored schema from sessionStorage
 */
function getStoredSchema() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
  } catch (e) {
    console.error('Failed to parse stored schema:', e);
    return {};
  }
}

/**
 * Parse schema fields into hierarchical structure
 * Groups fields by their prefix (e.g., hero.title -> hero group with title field)
 */
function parseSchemaHierarchy(fields) {
  const groups = {};
  const repeaters = {};
  const standalone = [];

  fields.forEach((field) => {
    const key = field.key;

    // Check for repeater pattern: name[].field
    const repeaterMatch = key.match(/^([^[]+)\[\]\.(.+)$/);
    if (repeaterMatch) {
      const [, repeaterName, fieldName] = repeaterMatch;
      if (!repeaters[repeaterName]) {
        repeaters[repeaterName] = { name: repeaterName, fields: [] };
      }
      repeaters[repeaterName].fields.push({ ...field, fieldName, originalKey: key });
      return;
    }

    // Check for group pattern: name.field
    const groupMatch = key.match(/^([^.]+)\.(.+)$/);
    if (groupMatch) {
      const [, groupName, fieldName] = groupMatch;
      if (!groups[groupName]) {
        groups[groupName] = { name: groupName, fields: [] };
      }
      groups[groupName].fields.push({ ...field, fieldName, originalKey: key });
      return;
    }

    // Standalone field
    standalone.push(field);
  });

  return { groups, repeaters, standalone };
}

/**
 * Fetch the .plain.html version of the current page
 */
async function fetchPlainHtml() {
  const url = new URL(window.location.href);
  url.pathname = url.pathname.replace(/\/?(?:\.html)?$/, '.plain.html');

  try {
    const resp = await fetch(url.toString());
    if (!resp.ok) throw new Error(`Failed to fetch ${url}`);
    return await resp.text();
  } catch (e) {
    console.error('Failed to fetch plain HTML:', e);
    return null;
  }
}

/**
 * Create the side panel container
 * Note: Icons are positioned for a RIGHT-side panel:
 * - Collapse (→) means slide panel right to hide
 * - Expand (←) means slide panel left to show
 */
function createPanel() {
  const panel = document.createElement('div');
  panel.id = 'daas-authoring-panel';
  panel.innerHTML = `
    <div class="daas-panel-header">
      <h2>Content Authoring</h2>
      <button class="daas-panel-toggle" title="Toggle panel">
        <svg class="icon-collapse" width="20" height="20" viewBox="0 0 20 20"><path d="M8 4l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
        <svg class="icon-expand" width="20" height="20" viewBox="0 0 20 20"><path d="M12 4l-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
      </button>
    </div>
    <div class="daas-panel-content">
      <div class="daas-form-container"></div>
    </div>
    <div class="daas-panel-footer">
      <button class="daas-btn daas-btn-secondary" id="daas-save-btn" title="Save form data for later">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 2H4a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M10 2v4H6V2" stroke="currentColor" stroke-width="1.5"/><path d="M4 9h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M4 11.5h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        Save Draft
      </button>
      <button class="daas-btn daas-btn-primary" id="daas-create-btn" title="Preview final page in new tab">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14 10v3a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M8 8l6-6M10 2h4v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Create Page
      </button>
    </div>
  `;

  return panel;
}

/**
 * Create restore modal for saved form data
 */
function createRestoreModal() {
  const modal = document.createElement('div');
  modal.className = 'daas-modal-overlay';
  modal.innerHTML = `
    <div class="daas-modal">
      <div class="daas-modal-header">
        <h3>Restore Saved Draft?</h3>
      </div>
      <div class="daas-modal-body">
        <p>You have a saved draft from a previous session. Would you like to restore it?</p>
      </div>
      <div class="daas-modal-footer">
        <button class="daas-btn daas-btn-secondary" id="daas-modal-discard">Discard</button>
        <button class="daas-btn daas-btn-primary" id="daas-modal-restore">Restore</button>
      </div>
    </div>
  `;
  return modal;
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
    if (e.target !== fileInput) {
      fileInput.click();
    }
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

  // Container for Quill
  const rteContainer = document.createElement('div');
  rteContainer.className = 'daas-rte-container';

  // Editor element
  const editorEl = document.createElement('div');
  editorEl.className = 'daas-rte-editor';
  rteContainer.appendChild(editorEl);

  // Hidden input for form data
  const hiddenInput = document.createElement('input');
  hiddenInput.type = 'hidden';
  hiddenInput.name = key;
  hiddenInput.className = 'daas-rte-value';
  hiddenInput.value = value || '';
  rteContainer.appendChild(hiddenInput);

  wrapper.appendChild(rteContainer);

  // Initialize Quill asynchronously
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

    // Set initial content
    if (value) {
      quill.root.innerHTML = value;
    }

    // Store quill instance for later access
    rteContainer.quillInstance = quill;

    // Update hidden input on change
    quill.on('text-change', () => {
      hiddenInput.value = quill.root.innerHTML;
    });

    // Character counter
    if (field.max) {
      const counter = document.createElement('span');
      counter.className = 'daas-char-counter';
      const maxVal = parseInt(field.max, 10);
      const updateCounter = () => {
        const len = quill.getText().length - 1; // -1 for trailing newline
        counter.textContent = `${len}/${maxVal}`;
        counter.classList.toggle('daas-over-limit', len > maxVal);
      };
      updateCounter();
      quill.on('text-change', updateCounter);
      wrapper.appendChild(counter);
    }
  }).catch((err) => {
    console.error('Failed to load Quill:', err);
    // Fallback to textarea
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

  // Dropdown container
  const dropdown = document.createElement('div');
  dropdown.className = 'daas-multiselect';

  // Display button
  const display = document.createElement('button');
  display.type = 'button';
  display.className = 'daas-multiselect-display daas-input';

  // Hidden input for form data
  const hiddenInput = document.createElement('input');
  hiddenInput.type = 'hidden';
  hiddenInput.name = key;
  hiddenInput.className = 'daas-multiselect-value';
  wrapper.appendChild(hiddenInput);

  // Options panel
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
      if (selectedValues.includes(opt.value)) {
        checkbox.checked = true;
      }
      checkbox.addEventListener('change', updateDisplay);

      const span = document.createElement('span');
      span.textContent = opt.label;

      optionLabel.appendChild(checkbox);
      optionLabel.appendChild(span);
      optionsPanel.appendChild(optionLabel);
    });
    updateDisplay();
  };

  // Toggle dropdown
  display.addEventListener('click', () => {
    dropdown.classList.toggle('daas-multiselect-open');
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove('daas-multiselect-open');
    }
  });

  dropdown.appendChild(display);
  dropdown.appendChild(optionsPanel);
  wrapper.appendChild(dropdown);

  // Populate options (may be async)
  if (Array.isArray(options)) {
    populateOptions(options);
  } else if (typeof options === 'string' && (options.startsWith('/') || options.startsWith('http'))) {
    display.innerHTML = '<span class="daas-multiselect-placeholder">Loading...</span>';
    fetchSelectOptions(options).then((opts) => {
      populateOptions(opts);
    });
  }

  return wrapper;
}

/**
 * Create form field based on schema field definition
 * Supports multi- prefix for types (e.g., multi-select)
 */
function createFormField(field, value = '', keyOverride = null) {
  const key = keyOverride || field.key;
  const fieldType = field.type || 'text';
  const isMulti = fieldType.startsWith('multi-');
  const baseType = isMulti ? fieldType.replace('multi-', '') : fieldType;

  // Special handling for image type
  if (baseType === 'image') {
    return createImageDropzone(field, key);
  }

  // Special handling for richtext type
  if (baseType === 'richtext') {
    return createRichTextEditor(field, value, key);
  }

  // Special handling for multi-select (type: "multi-select")
  if (baseType === 'select' && isMulti) {
    return createMultiSelect(field, value, key, field.options);
  }

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
  const inputId = `daas-field-${key.replace(/[.\[\]]/g, '-')}`;

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

  // Character counter for text fields
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
 * Fetch select options from a JSON endpoint
 */
async function fetchSelectOptions(url) {
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
 * Create a fieldset/group section
 */
function createFieldset(name, fields, isRepeater = false) {
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

    const item = createRepeaterItem(name, fields, 0);
    itemsWrapper.appendChild(item);

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
function createRepeaterItem(repeaterName, fields, index) {
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

/**
 * Update placeholder on the page with new value (live preview)
 * Handles text content, href attributes (including URL-encoded), and alt attributes
 * For richtext fields, uses innerHTML to render HTML content
 */
function updatePlaceholder(key, value, fieldType = 'text') {
  const placeholderText = `[[${key}]]`;
  const encodedPlaceholder = encodeURIComponent(placeholderText); // %5B%5Bkey%5D%5D
  const isRichText = fieldType === 'richtext';

  // For URL type fields, update href attributes
  if (fieldType === 'url') {
    document.querySelectorAll('a[href]').forEach((link) => {
      const href = link.getAttribute('href');
      if (href.includes(placeholderText) || href.includes(encodedPlaceholder)) {
        const newHref = href
          .replace(placeholderText, value || placeholderText)
          .replace(encodedPlaceholder, value ? encodeURIComponent(value) : encodedPlaceholder);
        link.setAttribute('href', newHref);
      }
    });
    return;
  }

  // Try data attribute approach (from decorate.js preprocessing)
  const elements = document.querySelectorAll(`[data-daas-placeholder="${key}"]`);
  elements.forEach((el) => {
    if (value) {
      // Use innerHTML for richtext to render HTML tags
      if (isRichText) {
        el.innerHTML = value;
      } else {
        el.textContent = value;
      }
    } else if (!el.textContent.includes('[[')) {
      el.textContent = placeholderText;
    }
  });

  // Partial placeholders
  const partialElements = document.querySelectorAll(`[data-daas-placeholder-partial="${key}"]`);
  partialElements.forEach((el) => {
    if (el.textContent.includes(placeholderText)) {
      if (isRichText) {
        el.innerHTML = el.innerHTML.replace(placeholderText, value || placeholderText);
      } else {
        el.textContent = el.textContent.replace(placeholderText, value || placeholderText);
      }
    } else if (value) {
      if (!el.dataset.daasOriginalText) {
        el.dataset.daasOriginalText = el.textContent;
      }
      if (isRichText) {
        el.innerHTML = value;
      } else {
        el.textContent = value;
      }
    }
  });

  // Fallback: search for [[key]] in text nodes
  if (elements.length === 0 && partialElements.length === 0) {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false,
    );

    let node;
    const nodesToUpdate = [];
    while ((node = walker.nextNode())) {
      if (node.textContent.includes(placeholderText)) {
        nodesToUpdate.push(node);
      }
    }

    nodesToUpdate.forEach((textNode) => {
      if (isRichText) {
        // For richtext in text nodes, we need to replace the node with HTML
        const span = document.createElement('span');
        span.innerHTML = textNode.textContent.replace(placeholderText, value || placeholderText);
        textNode.parentNode.replaceChild(span, textNode);
      } else {
        textNode.textContent = textNode.textContent.replace(
          placeholderText,
          value || placeholderText,
        );
      }
    });
  }
}

/**
 * Get current placeholder value from page
 */
function getPlaceholderValue(key) {
  const el = document.querySelector(`[data-daas-placeholder="${key}"]`);
  if (el) {
    const content = el.textContent || '';
    if (content.includes('[[') && content.includes(']]')) {
      return '';
    }
    return content;
  }
  return '';
}

/**
 * Get all form data as an object
 */
function getFormData(formContainer) {
  const data = {};

  // Regular inputs
  formContainer.querySelectorAll('.daas-input').forEach((input) => {
    const key = input.name;
    if (!key) return;

    let value = input.value;

    if (input.type === 'checkbox') {
      value = input.checked ? 'true' : 'false';
    } else if (input.multiple && input.tagName === 'SELECT') {
      value = Array.from(input.selectedOptions).map((o) => o.value);
    }

    if (value) {
      data[key] = value;
    }
  });

  // Rich text editors
  formContainer.querySelectorAll('.daas-rte-value').forEach((input) => {
    if (input.name && input.value) {
      data[input.name] = input.value;
    }
  });

  // Multi-select values
  formContainer.querySelectorAll('.daas-multiselect-value').forEach((input) => {
    if (input.name && input.value) {
      data[input.name] = input.value.split(',');
    }
  });

  // Image dropzones
  formContainer.querySelectorAll('.daas-dropzone[data-image-data]').forEach((dropzone) => {
    const key = dropzone.querySelector('.daas-dropzone-input')?.name;
    if (key) {
      data[key] = {
        dataUrl: dropzone.dataset.imageData,
        fileName: dropzone.dataset.imageName,
      };
    }
  });

  return data;
}

/**
 * Build the authoring form from schema
 */
function buildForm(schema, formContainer) {
  formContainer.innerHTML = '';

  if (!schema.fields || schema.fields.length === 0) {
    formContainer.innerHTML = '<p class="daas-empty">No schema fields found.</p>';
    return;
  }

  const { groups, repeaters, standalone } = parseSchemaHierarchy(schema.fields);

  const form = document.createElement('form');
  form.className = 'daas-form';
  form.addEventListener('submit', (e) => e.preventDefault());

  if (standalone.length > 0) {
    const section = document.createElement('div');
    section.className = 'daas-form-section';

    standalone.forEach((field) => {
      const currentValue = getPlaceholderValue(field.key);
      const fieldEl = createFormField(field, currentValue);
      section.appendChild(fieldEl);
    });

    form.appendChild(section);
  }

  Object.values(groups).forEach((group) => {
    const fieldset = createFieldset(group.name, group.fields, false);
    form.appendChild(fieldset);
  });

  Object.values(repeaters).forEach((repeater) => {
    const fieldset = createFieldset(repeater.name, repeater.fields, true);
    form.appendChild(fieldset);
  });

  formContainer.appendChild(form);
  formContainer.dataset.repeaterFields = JSON.stringify(repeaters);
  formContainer.dataset.schemaFields = JSON.stringify(schema.fields);
}

/**
 * Add a new repeater item
 */
function addRepeaterItem(repeaterName, formContainer) {
  const itemsWrapper = formContainer.querySelector(`.daas-repeater-items[data-repeater-name="${repeaterName}"]`);
  if (!itemsWrapper) return;

  const repeaters = JSON.parse(formContainer.dataset.repeaterFields || '{}');
  const repeater = repeaters[repeaterName];
  if (!repeater) return;

  const existingItems = itemsWrapper.querySelectorAll('.daas-repeater-item');
  const newIndex = existingItems.length;

  const newItem = createRepeaterItem(repeaterName, repeater.fields, newIndex);
  itemsWrapper.appendChild(newItem);

  attachLiveUpdateListeners(newItem, formContainer);
}

/**
 * Remove a repeater item
 */
function removeRepeaterItem(item) {
  const itemsWrapper = item.closest('.daas-repeater-items');
  if (!itemsWrapper) return;

  const items = itemsWrapper.querySelectorAll('.daas-repeater-item');
  if (items.length <= 1) {
    showToast('At least one item is required.', true);
    return;
  }

  item.remove();

  const remainingItems = itemsWrapper.querySelectorAll('.daas-repeater-item');
  remainingItems.forEach((el, idx) => {
    el.dataset.index = idx;
    el.querySelector('.daas-item-number').textContent = idx + 1;

    el.querySelectorAll('.daas-input, .daas-dropzone-input, .daas-rte-value, .daas-multiselect-value').forEach((input) => {
      if (input.name) {
        input.name = input.name.replace(/\[\d+\]/, `[${idx}]`);
      }
    });
  });
}

/**
 * Attach live update listeners to form inputs
 */
function attachLiveUpdateListeners(container, formContainer) {
  const schemaFields = JSON.parse(formContainer?.dataset?.schemaFields || '[]');

  // Regular inputs
  container.querySelectorAll('.daas-input').forEach((input) => {
    if (!input.name) return;

    input.addEventListener('input', () => {
      const key = input.name.replace(/\[\d+\]/, '[]');
      const field = schemaFields.find((f) => f.key === key);
      updatePlaceholder(key, input.value, field?.type);
    });

    input.addEventListener('change', () => {
      const key = input.name.replace(/\[\d+\]/, '[]');
      const field = schemaFields.find((f) => f.key === key);
      updatePlaceholder(key, input.value, field?.type);
    });
  });

  // Rich text editors (Quill) - wait for async initialization
  container.querySelectorAll('.daas-rte-container').forEach((rteContainer) => {
    const hiddenInput = rteContainer.querySelector('.daas-rte-value');
    if (!hiddenInput?.name) return;

    const attachQuillListener = () => {
      if (rteContainer.quillInstance) {
        rteContainer.quillInstance.on('text-change', () => {
          const key = hiddenInput.name.replace(/\[\d+\]/, '[]');
          const html = rteContainer.quillInstance.root.innerHTML;
          hiddenInput.value = html;
          updatePlaceholder(key, html, 'richtext');
        });
      }
    };

    // If Quill is already ready, attach now
    if (rteContainer.quillInstance) {
      attachQuillListener();
    } else {
      // Wait for Quill to initialize
      const checkQuill = setInterval(() => {
        if (rteContainer.quillInstance) {
          attachQuillListener();
          clearInterval(checkQuill);
        }
      }, 100);
      setTimeout(() => clearInterval(checkQuill), 5000);
    }
  });

  // Multi-select
  container.querySelectorAll('.daas-multiselect-options').forEach((optionsPanel) => {
    optionsPanel.addEventListener('change', () => {
      const hiddenInput = optionsPanel.closest('.daas-field').querySelector('.daas-multiselect-value');
      if (hiddenInput?.name) {
        const key = hiddenInput.name.replace(/\[\d+\]/, '[]');
        updatePlaceholder(key, hiddenInput.value);
      }
    });
  });
}

/**
 * Compose final HTML with data attributes for saving
 */
async function composeFinalHtml(formData, schema) {
  const plainHtml = await fetchPlainHtml();
  if (!plainHtml) {
    console.error('Could not fetch plain HTML');
    return null;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(plainHtml, 'text/html');

  Object.entries(formData).forEach(([key, value]) => {
    const baseKey = key.replace(/\[\d+\]/, '[]');
    const field = schema.fields?.find((f) => f.key === baseKey);

    if (typeof value === 'object' && value.dataUrl) {
      return;
    }

    const placeholderText = `[[${key}]]`;
    const encodedPlaceholder = encodeURIComponent(placeholderText);

    // Replace in text content
    const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent.includes(placeholderText)) {
        const parent = node.parentElement;
        node.textContent = node.textContent.replace(placeholderText, value || '');

        if (parent && field) {
          parent.dataset.daasKey = baseKey;
          if (field.type) parent.dataset.daasType = field.type;
          if (field.label) parent.dataset.daasLabel = field.label;
          if (field.required === 'true') parent.dataset.daasRequired = 'true';
          if (field.min) parent.dataset.daasMin = field.min;
          if (field.max) parent.dataset.daasMax = field.max;
        }
      }
    }

    // Replace in href attributes (both encoded and plain)
    doc.querySelectorAll('a[href]').forEach((el) => {
      const href = el.getAttribute('href');
      if (href.includes(placeholderText) || href.includes(encodedPlaceholder)) {
        const newHref = href
          .replace(placeholderText, value || '')
          .replace(encodedPlaceholder, value ? encodeURIComponent(value) : '');
        el.setAttribute('href', newHref);
      }
    });

    // Replace in alt attributes
    doc.querySelectorAll('[alt]').forEach((el) => {
      if (el.alt.includes(placeholderText)) {
        el.alt = el.alt.replace(placeholderText, value || '');
      }
    });
  });

  return doc.body.innerHTML;
}

/**
 * Handle save draft action - saves form data to sessionStorage
 */
function handleSaveDraft(formContainer) {
  const formData = getFormData(formContainer);

  // Get existing schema data and add formData to it
  const storedData = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
  storedData.savedFormData = formData;
  storedData.savedAt = new Date().toISOString();

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(storedData));
  showToast('Draft saved!');
}

/**
 * Handle create page action - composes HTML and opens in new tab
 */
async function handleCreatePage(formContainer, schema) {
  const formData = getFormData(formContainer);
  console.log('Form data:', formData);

  const finalHtml = await composeFinalHtml(formData, schema);
  if (finalHtml) {
    // Create a complete HTML document
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview - DaaS Generated Page</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  </style>
</head>
<body>
${finalHtml}
</body>
</html>`;

    // Open in new tab
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');

    showToast('Page opened in new tab!');
  } else {
    showToast('Failed to create page', true);
  }
}

/**
 * Get saved form data from sessionStorage
 */
function getSavedFormData() {
  const storedData = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
  return storedData.savedFormData || null;
}

/**
 * Clear saved form data from sessionStorage
 */
function clearSavedFormData() {
  const storedData = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
  delete storedData.savedFormData;
  delete storedData.savedAt;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(storedData));
}

/**
 * Restore form data to the form fields
 */
function restoreFormData(formContainer, savedData) {
  if (!savedData) return;

  // Restore regular inputs
  Object.entries(savedData).forEach(([key, value]) => {
    // Skip image data objects for now
    if (typeof value === 'object' && value.dataUrl) return;

    // Find input by name
    const input = formContainer.querySelector(`[name="${key}"]`);
    if (input) {
      if (input.type === 'checkbox') {
        input.checked = value === 'true';
      } else {
        input.value = value;
      }
    }

    // Handle Quill rich text editors
    const rteContainer = formContainer.querySelector(`.daas-field[data-key="${key}"] .daas-rte-container`);
    if (rteContainer) {
      const hiddenInput = rteContainer.querySelector('.daas-rte-value');
      if (hiddenInput) hiddenInput.value = value;

      // If Quill is already loaded, set content
      if (rteContainer.quillInstance) {
        rteContainer.quillInstance.root.innerHTML = value;
      } else {
        // Wait for Quill to load
        const checkQuill = setInterval(() => {
          if (rteContainer.quillInstance) {
            rteContainer.quillInstance.root.innerHTML = value;
            clearInterval(checkQuill);
          }
        }, 100);
        // Stop checking after 5 seconds
        setTimeout(() => clearInterval(checkQuill), 5000);
      }
    }

    // Handle multi-select hidden inputs
    const multiSelectValue = formContainer.querySelector(`.daas-multiselect-value[name="${key}"]`);
    if (multiSelectValue) {
      multiSelectValue.value = Array.isArray(value) ? value.join(',') : value;
      // Check the corresponding checkboxes
      const optionsPanel = multiSelectValue.closest('.daas-field').querySelector('.daas-multiselect-options');
      if (optionsPanel) {
        const values = Array.isArray(value) ? value : value.split(',');
        optionsPanel.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
          cb.checked = values.includes(cb.value);
        });
        // Trigger display update
        const event = new Event('change', { bubbles: true });
        optionsPanel.dispatchEvent(event);
      }
    }
  });

  showToast('Draft restored!');
}

/**
 * Show toast notification
 */
function showToast(message, isError = false) {
  const existingToast = document.querySelector('.daas-toast');
  existingToast?.remove();

  const toast = document.createElement('div');
  toast.className = `daas-toast ${isError ? 'daas-toast-error' : 'daas-toast-success'}`;
  toast.innerHTML = `
    ${isError
    ? '<svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M5 5l6 6M11 5l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
    : '<svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M5 8l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>'
}
    <span>${message}</span>
  `;

  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('daas-toast-show'));
  setTimeout(() => {
    toast.classList.remove('daas-toast-show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Initialize panel event listeners
 */
function initPanelEvents(panel, formContainer, schema) {
  panel.querySelector('.daas-panel-toggle')?.addEventListener('click', () => {
    panel.classList.toggle('daas-panel-collapsed');
    document.body.classList.toggle('daas-panel-minimized');
  });

  panel.addEventListener('click', (e) => {
    const addBtn = e.target.closest('.daas-add-item');
    if (addBtn) {
      addRepeaterItem(addBtn.dataset.repeaterName, formContainer);
    }

    const removeBtn = e.target.closest('.daas-remove-item');
    if (removeBtn) {
      const item = removeBtn.closest('.daas-repeater-item');
      if (item) removeRepeaterItem(item);
    }
  });

  // Save Draft button
  panel.querySelector('#daas-save-btn')?.addEventListener('click', () => {
    handleSaveDraft(formContainer);
  });

  // Create Page button
  panel.querySelector('#daas-create-btn')?.addEventListener('click', () => {
    handleCreatePage(formContainer, schema);
  });

  attachLiveUpdateListeners(formContainer, formContainer);
}

/**
 * Show restore modal and handle user choice
 */
function showRestoreModal(formContainer, savedData) {
  const modal = createRestoreModal();
  document.body.appendChild(modal);

  // Animate in
  requestAnimationFrame(() => modal.classList.add('daas-modal-open'));

  // Discard button
  modal.querySelector('#daas-modal-discard')?.addEventListener('click', () => {
    clearSavedFormData();
    modal.classList.remove('daas-modal-open');
    setTimeout(() => modal.remove(), 200);
  });

  // Restore button
  modal.querySelector('#daas-modal-restore')?.addEventListener('click', () => {
    restoreFormData(formContainer, savedData);
    modal.classList.remove('daas-modal-open');
    setTimeout(() => modal.remove(), 200);
  });

  // Close on overlay click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      clearSavedFormData();
      modal.classList.remove('daas-modal-open');
      setTimeout(() => modal.remove(), 200);
    }
  });
}

/**
 * Main block decoration
 */
export default async function decorate(block) {
  block.style.display = 'none';

  const schema = getStoredSchema();
  if (!schema.fields || schema.fields.length === 0) {
    console.warn('DaaS: No schema fields found in storage');
    return;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/express/code/blocks/template-schema/template-schema.css';
  document.head.appendChild(link);

  const panel = createPanel();
  document.body.appendChild(panel);
  document.body.classList.add('daas-panel-active');

  const formContainer = panel.querySelector('.daas-form-container');
  buildForm(schema, formContainer);

  initPanelEvents(panel, formContainer, schema);

  requestAnimationFrame(() => panel.classList.add('daas-panel-open'));

  // Check for saved form data and show restore modal
  const savedData = getSavedFormData();
  if (savedData && Object.keys(savedData).length > 0) {
    // Small delay to let the panel render first
    setTimeout(() => {
      showRestoreModal(formContainer, savedData);
    }, 300);
  }

  console.log('DaaS: Authoring panel initialized with', schema.fields.length, 'fields');
}
