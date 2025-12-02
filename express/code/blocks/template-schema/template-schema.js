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
  // Remove any existing extension and add .plain.html
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
 */
function createPanel() {
  const panel = document.createElement('div');
  panel.id = 'daas-authoring-panel';
  panel.innerHTML = `
    <div class="daas-panel-header">
      <h2>Content Authoring</h2>
      <button class="daas-panel-toggle" title="Toggle panel">
        <svg class="icon-collapse" width="20" height="20" viewBox="0 0 20 20"><path d="M12 4l-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
        <svg class="icon-expand" width="20" height="20" viewBox="0 0 20 20"><path d="M8 4l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
      </button>
    </div>
    <div class="daas-panel-content">
      <div class="daas-form-container"></div>
    </div>
    <div class="daas-panel-footer">
      <button class="daas-btn daas-btn-primary" id="daas-save-btn">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13 5L6.5 11.5L3 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Save
      </button>
    </div>
  `;

  return panel;
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

  // Set up dropzone events
  const fileInput = dropzone.querySelector('.daas-dropzone-input');
  const preview = dropzone.querySelector('.daas-dropzone-preview');
  const content = dropzone.querySelector('.daas-dropzone-content');

  // Click to browse
  dropzone.addEventListener('click', (e) => {
    if (e.target !== fileInput) {
      fileInput.click();
    }
  });

  // File selected
  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files[0]) {
      handleImageFile(fileInput.files[0], key, preview, content, dropzone);
    }
  });

  // Drag and drop
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
 * Handle image file selection - show preview and live swap on page
 */
function handleImageFile(file, key, preview, content, dropzone) {
  const reader = new FileReader();

  reader.onload = (e) => {
    const dataUrl = e.target.result;

    // Show preview in dropzone
    preview.innerHTML = `
      <img src="${dataUrl}" alt="Preview" />
      <button type="button" class="daas-dropzone-remove" title="Remove image">
        <svg width="16" height="16" viewBox="0 0 16 16"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
    `;
    content.style.display = 'none';
    dropzone.classList.add('daas-dropzone-has-image');

    // Remove button handler
    preview.querySelector('.daas-dropzone-remove').addEventListener('click', (ev) => {
      ev.stopPropagation();
      preview.innerHTML = '';
      content.style.display = '';
      dropzone.classList.remove('daas-dropzone-has-image');
      dropzone.querySelector('.daas-dropzone-input').value = '';
      // Reset the image on the page
      resetImagePlaceholder(key);
    });

    // Store the data URL for form submission
    dropzone.dataset.imageData = dataUrl;
    dropzone.dataset.imageName = file.name;

    // Live swap the image on the page
    swapImageOnPage(key, dataUrl);
  };

  reader.readAsDataURL(file);
}

/**
 * Find and swap image on page by placeholder key
 * Images are identified by their alt attribute matching the key
 */
function swapImageOnPage(key, dataUrl) {
  // Find images where alt contains the key (post-render, braces are stripped)
  // e.g., alt="hero.image" or data-daas-placeholder="hero.image"
  const selectors = [
    `img[alt="${key}"]`,
    `img[alt="{{${key}}}"]`,
    `[data-daas-placeholder="${key}"] img`,
    `picture:has(img[alt="${key}"])`,
  ];

  selectors.forEach((selector) => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        if (el.tagName === 'PICTURE') {
          // Replace picture sources and img
          const img = el.querySelector('img');
          if (img) {
            // Remove all source elements (they won't work with data URLs anyway)
            el.querySelectorAll('source').forEach((s) => s.remove());
            img.src = dataUrl;
            img.srcset = '';
          }
        } else if (el.tagName === 'IMG') {
          // Direct img replacement
          el.src = dataUrl;
          el.srcset = '';
          // Also handle parent picture if exists
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
 * Reset image placeholder to original state
 */
function resetImagePlaceholder(key) {
  // For now, we can't easily restore the original - just clear
  // In a full implementation, we'd store the original sources
  console.log('Image reset for:', key);
}

/**
 * Create form field based on schema field definition
 */
function createFormField(field, value = '', keyOverride = null) {
  const wrapper = document.createElement('div');
  wrapper.className = 'daas-field';
  const key = keyOverride || field.key;
  wrapper.dataset.key = key;

  // Special handling for image type
  if (field.type === 'image') {
    return createImageDropzone(field, key);
  }

  const label = document.createElement('label');
  const labelText = field.label || field.fieldName || key.split('.').pop();
  label.textContent = labelText;
  if (field.required === 'true') {
    label.innerHTML += ' <span class="daas-required">*</span>';
  }

  let input;
  const inputId = `daas-field-${key.replace(/[.\[\]]/g, '-')}`;

  switch (field.type) {
    case 'richtext':
      input = document.createElement('textarea');
      input.rows = 4;
      input.value = value;
      break;

    case 'select':
      input = document.createElement('select');
      // If options is a path/URL, fetch it
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
      if (field.multiple === 'true') {
        input.multiple = true;
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

  // Add character counter for text fields with max
  if (field.max && (field.type === 'text' || field.type === 'richtext')) {
    const counter = document.createElement('span');
    counter.className = 'daas-char-counter';
    const maxVal = parseInt(field.max, 10);
    counter.textContent = `${(input.value || '').length}/${maxVal}`;
    input.addEventListener('input', () => {
      counter.textContent = `${input.value.length}/${maxVal}`;
      if (input.value.length > maxVal) {
        counter.classList.add('daas-over-limit');
      } else {
        counter.classList.remove('daas-over-limit');
      }
    });
    wrapper.appendChild(counter);
  }

  return wrapper;
}

/**
 * Fetch select options from a JSON endpoint
 * Expected response format: { data: [{ value, label }, ...] }
 */
async function fetchSelectOptions(url) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Failed to fetch options from ${url}`);
    const json = await resp.json();
    // Handle the expected format: { total, limit, offset, data: [...], :type }
    if (json.data && Array.isArray(json.data)) {
      return json.data.map((item) => ({
        value: item.value || '',
        label: item.label || item.value || '',
      }));
    }
    // Fallback for simple array
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
    // For repeaters, create item management UI
    const itemsWrapper = document.createElement('div');
    itemsWrapper.className = 'daas-repeater-items';
    itemsWrapper.dataset.repeaterName = name;

    // Add one empty item by default
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
    // For groups, render fields directly
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
    // Create key with index: faq[0].question
    const indexedKey = `${repeaterName}[${index}].${field.fieldName}`;
    const fieldEl = createFormField(field, '', indexedKey);
    fieldsWrapper.appendChild(fieldEl);
  });

  item.appendChild(fieldsWrapper);
  return item;
}

/**
 * Update placeholder on the page with new value (live preview)
 * Searches for elements with data-daas-placeholder attribute
 */
function updatePlaceholder(key, value) {
  // Try data attribute approach (from decorate.js preprocessing)
  const elements = document.querySelectorAll(`[data-daas-placeholder="${key}"]`);
  if (elements.length > 0) {
    elements.forEach((el) => {
      el.textContent = value || '';
    });
    return;
  }

  // Also try partial placeholder (for inline placeholders)
  const partialElements = document.querySelectorAll(`[data-daas-placeholder-partial="${key}"]`);
  partialElements.forEach((el) => {
    // For partial, we need original template - for now just set content
    el.textContent = value || '';
  });
}

/**
 * Get current placeholder value from page
 */
function getPlaceholderValue(key) {
  // Check data attribute elements
  const el = document.querySelector(`[data-daas-placeholder="${key}"]`);
  if (el) {
    return el.textContent || '';
  }
  return '';
}

/**
 * Get all form data as an object
 */
function getFormData(formContainer) {
  const data = {};

  // Regular inputs
  const inputs = formContainer.querySelectorAll('.daas-input');
  inputs.forEach((input) => {
    const key = input.name;
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

  // Image dropzones
  const dropzones = formContainer.querySelectorAll('.daas-dropzone[data-image-data]');
  dropzones.forEach((dropzone) => {
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

  // Create a form element
  const form = document.createElement('form');
  form.className = 'daas-form';
  form.addEventListener('submit', (e) => e.preventDefault());

  // Render standalone fields first
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

  // Render groups
  Object.values(groups).forEach((group) => {
    const fieldset = createFieldset(group.name, group.fields, false);
    form.appendChild(fieldset);
  });

  // Render repeaters
  Object.values(repeaters).forEach((repeater) => {
    const fieldset = createFieldset(repeater.name, repeater.fields, true);
    form.appendChild(fieldset);
  });

  formContainer.appendChild(form);

  // Store field definitions for repeater item creation
  formContainer.dataset.repeaterFields = JSON.stringify(repeaters);
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

  // Re-attach live update listeners to new inputs
  attachLiveUpdateListeners(newItem);
}

/**
 * Remove a repeater item
 */
function removeRepeaterItem(item) {
  const itemsWrapper = item.closest('.daas-repeater-items');
  if (!itemsWrapper) return;

  // Don't allow removing the last item
  const items = itemsWrapper.querySelectorAll('.daas-repeater-item');
  if (items.length <= 1) {
    showToast('At least one item is required.', true);
    return;
  }

  item.remove();

  // Re-index remaining items
  const remainingItems = itemsWrapper.querySelectorAll('.daas-repeater-item');
  remainingItems.forEach((el, idx) => {
    el.dataset.index = idx;
    el.querySelector('.daas-item-number').textContent = idx + 1;

    // Update field names with new index
    el.querySelectorAll('.daas-input, .daas-dropzone-input').forEach((input) => {
      input.name = input.name.replace(/\[\d+\]/, `[${idx}]`);
    });
  });
}

/**
 * Attach live update listeners to form inputs
 */
function attachLiveUpdateListeners(container) {
  const inputs = container.querySelectorAll('.daas-input');
  inputs.forEach((input) => {
    input.addEventListener('input', () => {
      // For repeater fields, extract the base key (faq[0].question -> faq[].question)
      const key = input.name.replace(/\[\d+\]/, '[]');
      updatePlaceholder(key, input.value);
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

  // Apply form data to placeholders
  Object.entries(formData).forEach(([key, value]) => {
    // Find the schema field for this key
    const baseKey = key.replace(/\[\d+\]/, '[]');
    const field = schema.fields?.find((f) => f.key === baseKey);

    // Handle image data differently
    if (typeof value === 'object' && value.dataUrl) {
      // For images, we'd need to upload and get a real URL
      // For now, just note it in the data attributes
      return;
    }

    // Replace placeholders in text content
    const placeholderText = `{{${key}}}`;
    const walker = document.createTreeWalker(
      doc.body,
      NodeFilter.SHOW_TEXT,
      null,
      false,
    );

    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent.includes(placeholderText)) {
        const parent = node.parentElement;
        node.textContent = node.textContent.replace(placeholderText, value || '');

        // Add data attributes to parent element
        if (parent && field) {
          parent.dataset.daasKey = baseKey;
          if (field.type) parent.dataset.daasType = field.type;
          if (field.label) parent.dataset.daasLabel = field.label;
          if (field.required === 'true') parent.dataset.daasRequired = 'true';
          if (field.min) parent.dataset.daasMin = field.min;
          if (field.max) parent.dataset.daasMax = field.max;
          if (field.options) parent.dataset.daasOptions = field.options;
          if (field.pattern) parent.dataset.daasPattern = field.pattern;
        }
      }
    }

    // Also check for placeholders in href attributes
    doc.querySelectorAll('[href*="{{"]').forEach((el) => {
      if (el.getAttribute('href')?.includes(placeholderText)) {
        el.setAttribute('href', el.getAttribute('href').replace(placeholderText, encodeURIComponent(value || '')));
      }
    });

    // Check for placeholders in alt attributes (images)
    doc.querySelectorAll('[alt*="{{"]').forEach((el) => {
      if (el.alt.includes(placeholderText)) {
        el.alt = el.alt.replace(placeholderText, value || '');
      }
    });
  });

  // Return the composed HTML (just body content for cleaner output)
  return doc.body.innerHTML;
}

/**
 * Handle save action
 */
async function handleSave(formContainer, schema) {
  const formData = getFormData(formContainer);
  console.log('Form data:', formData);

  const finalHtml = await composeFinalHtml(formData, schema);
  if (finalHtml) {
    console.log('Final HTML composed successfully');

    // For now, store in sessionStorage and log
    sessionStorage.setItem('daas-composed-html', finalHtml);

    // TODO: Send to API
    // await sendToApi(finalHtml);

    // Show success feedback
    showToast('Content saved successfully!');
  } else {
    showToast('Failed to save content', true);
  }
}

/**
 * Show toast notification
 */
function showToast(message, isError = false) {
  // Remove existing toast
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

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.add('daas-toast-show');
  });

  // Remove after delay
  setTimeout(() => {
    toast.classList.remove('daas-toast-show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Initialize panel event listeners
 */
function initPanelEvents(panel, formContainer, schema) {
  // Toggle button
  panel.querySelector('.daas-panel-toggle')?.addEventListener('click', () => {
    panel.classList.toggle('daas-panel-collapsed');
    document.body.classList.toggle('daas-panel-minimized');
  });

  // Add repeater item (event delegation)
  panel.addEventListener('click', (e) => {
    const addBtn = e.target.closest('.daas-add-item');
    if (addBtn) {
      const repeaterName = addBtn.dataset.repeaterName;
      addRepeaterItem(repeaterName, formContainer);
    }

    const removeBtn = e.target.closest('.daas-remove-item');
    if (removeBtn) {
      const item = removeBtn.closest('.daas-repeater-item');
      if (item) {
        removeRepeaterItem(item);
      }
    }
  });

  // Save button
  panel.querySelector('#daas-save-btn')?.addEventListener('click', () => {
    handleSave(formContainer, schema);
  });

  // Live update listeners for initial fields
  attachLiveUpdateListeners(formContainer);
}

/**
 * Main block decoration
 */
export default async function decorate(block) {
  // Hide the original block
  block.style.display = 'none';

  // Get stored schema
  const schema = getStoredSchema();
  if (!schema.fields || schema.fields.length === 0) {
    console.warn('DaaS: No schema fields found in storage');
    return;
  }

  // Load styles
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/express/code/blocks/template-schema/template-schema.css';
  document.head.appendChild(link);

  // Create and append the side panel
  const panel = createPanel();
  document.body.appendChild(panel);

  // Add body class for layout adjustment
  document.body.classList.add('daas-panel-active');

  // Build the form
  const formContainer = panel.querySelector('.daas-form-container');
  buildForm(schema, formContainer);

  // Initialize events
  initPanelEvents(panel, formContainer, schema);

  // Open panel by default with animation
  requestAnimationFrame(() => {
    panel.classList.add('daas-panel-open');
  });

  console.log('DaaS: Authoring panel initialized with', schema.fields.length, 'fields');
}
