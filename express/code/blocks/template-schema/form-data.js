/**
 * Form data operations - get, save, restore, and compose
 */

import { STORAGE_KEY, state } from './state.js';
import { fetchSourceDoc, getDAPath } from './plain-html.js';
import {
  showToast,
  createDestinationModal,
  createProgressModal,
  createSuccessModal,
  createUpdateSuccessModal,
} from './panel.js';
import { postDoc, previewDoc, uploadImage, getHiddenFolderPath } from './da-sdk.js';
import { swapImageOnPage } from './form-fields.js';
import { updatePlaceholder } from './live-update.js';

/**
 * Extract form data from an existing page's HTML
 * Parses elements with data-daas-key attributes and extracts their content
 * 
 * @param {string} html - The HTML content of the existing page
 * @returns {Object} - The extracted form data keyed by field key
 */
export function extractFormDataFromHtml(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const formData = {};

  // Find all elements with data-daas-key attribute
  const elements = doc.querySelectorAll('[data-daas-key]');

  elements.forEach((el) => {
    const key = el.dataset.daasKey;
    const type = el.dataset.daasType || 'text';

    if (!key) return;

    // Handle different field types
    if (type === 'image') {
      // For images, extract the src URL as an existing image (not a new upload)
      const img = el.tagName === 'IMG' ? el : el.querySelector('img');
      if (img?.src) {
        // Use 'existingUrl' to differentiate from new uploads (which use 'dataUrl')
        formData[key] = {
          existingUrl: img.src,
          alt: img.alt || '',
        };
      }
    } else if (type === 'richtext') {
      // For richtext, get innerHTML to preserve formatting
      formData[key] = el.innerHTML.trim();
    } else {
      // For text and other types, get text content
      formData[key] = el.textContent.trim();
    }
  });

  // Handle repeater fields - they may have indexed keys like faq[0].question
  // We need to detect and properly index them
  const repeaterData = {};
  const repeaterCounts = {};

  Object.entries(formData).forEach(([key, value]) => {
    // Check if this is a base repeater key (e.g., "faq[].question")
    const baseMatch = key.match(/^([^[]+)\[\]\.(.+)$/);
    if (baseMatch) {
      const [, repeaterName, fieldName] = baseMatch;
      if (!repeaterCounts[repeaterName]) {
        repeaterCounts[repeaterName] = 0;
      }
      // Find all elements with this repeater key to count instances
      const repeaterElements = doc.querySelectorAll(`[data-daas-key="${key}"]`);
      repeaterElements.forEach((el, idx) => {
        const indexedKey = `${repeaterName}[${idx}].${fieldName}`;
        const elType = el.dataset.daasType || 'text';
        if (elType === 'image') {
          const img = el.tagName === 'IMG' ? el : el.querySelector('img');
          if (img?.src) {
            repeaterData[indexedKey] = {
              existingUrl: img.src,
              alt: img.alt || '',
            };
          }
        } else if (elType === 'richtext') {
          repeaterData[indexedKey] = el.innerHTML.trim();
        } else {
          repeaterData[indexedKey] = el.textContent.trim();
        }
        repeaterCounts[repeaterName] = Math.max(repeaterCounts[repeaterName], idx + 1);
      });
      // Remove the base key from formData
      delete formData[key];
    }
  });

  // Merge repeater data back into formData
  Object.assign(formData, repeaterData);

  console.log('DaaS: Extracted form data from existing page:', Object.keys(formData));
  console.log('DaaS: Detected repeater counts:', repeaterCounts);

  return { formData, repeaterCounts };
}

/**
 * Validate required fields using native form validation
 * Checks if the form has any invalid inputs
 * @param {HTMLElement} formContainer - The form container element
 * @returns {Object} { isValid: boolean, missingFields: string[] }
 */
export function validateRequiredFields(formContainer) {
  console.log('DaaS DEBUG: validateRequiredFields called');

  const form = formContainer?.querySelector('form');
  if (!form) {
    console.log('DaaS DEBUG: No form found, returning valid');
    return { isValid: true, missingFields: [] };
  }

  // Use native form validation
  const isValid = form.checkValidity();
  console.log('DaaS DEBUG: form.checkValidity() =', isValid);

  // Collect names of invalid fields for tooltip
  const missingFields = [];
  if (!isValid) {
    const invalidInputs = form.querySelectorAll(':invalid');
    console.log('DaaS DEBUG: Found', invalidInputs.length, 'invalid inputs');

    invalidInputs.forEach((input) => {
      const name = input.name || input.closest('[data-key]')?.dataset.key;
      console.log('DaaS DEBUG: Invalid input:', {
        tagName: input.tagName,
        type: input.type,
        name: input.name,
        className: input.className,
        value: input.value,
        required: input.required,
        validity: input.validity ? {
          valueMissing: input.validity.valueMissing,
          typeMismatch: input.validity.typeMismatch,
          patternMismatch: input.validity.patternMismatch,
          tooShort: input.validity.tooShort,
          tooLong: input.validity.tooLong,
          valid: input.validity.valid,
        } : 'N/A',
      });
      if (name && !missingFields.includes(name)) {
        missingFields.push(name);
      }
    });
  }

  console.log('DaaS DEBUG: Validation result:', { isValid, missingFields });
  return { isValid, missingFields };
}

/**
 * Update Create Page button state based on validation
 */
export function updateCreateButtonState(panel, formContainer, schema) {
  console.log('DaaS DEBUG: updateCreateButtonState called');
  console.log('DaaS DEBUG: Call stack:', new Error().stack);

  const createBtn = panel.querySelector('#daas-create-btn');
  if (!createBtn) {
    console.log('DaaS DEBUG: No create button found');
    return;
  }

  console.log('DaaS DEBUG: Button state BEFORE:', { disabled: createBtn.disabled });

  const { isValid, missingFields } = validateRequiredFields(formContainer, schema);

  createBtn.disabled = !isValid;
  console.log('DaaS DEBUG: Button state AFTER:', { disabled: createBtn.disabled, isValid });

  if (!isValid) {
    createBtn.title = `Missing required fields: ${missingFields.join(', ')}`;
    createBtn.classList.add('daas-btn-disabled');
  } else {
    createBtn.title = 'Preview final page in new tab';
    createBtn.classList.remove('daas-btn-disabled');
  }
}

/**
 * Get all form data as an object
 */
export function getFormData(formContainer) {
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

    if (value) data[key] = value;
  });

  // Rich text editors
  formContainer.querySelectorAll('.daas-rte-value').forEach((input) => {
    if (input.name && input.value) data[input.name] = input.value;
  });

  // Multi-select values
  formContainer.querySelectorAll('.daas-multiselect-value').forEach((input) => {
    if (input.name && input.value) data[input.name] = input.value.split(',');
  });

  // Image dropzones - handle both new uploads (dataUrl) and existing images (existingUrl)
  formContainer.querySelectorAll('.daas-dropzone').forEach((dropzone) => {
    const key = dropzone.querySelector('.daas-dropzone-input')?.name;
    if (!key) return;

    // Check for new upload (has dataUrl)
    if (dropzone.dataset.imageData) {
      data[key] = {
        dataUrl: dropzone.dataset.imageData,
        fileName: dropzone.dataset.imageName,
      };
    } else if (dropzone.dataset.existingImageUrl) {
      // Existing image from edit mode (has existingUrl)
      data[key] = {
        existingUrl: dropzone.dataset.existingImageUrl,
      };
    }
  });

  return data;
}

/**
 * Get saved form data from sessionStorage
 */
export function getSavedFormData() {
  const storedData = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
  return storedData.savedFormData || null;
}

/**
 * Clear saved form data from sessionStorage
 */
export function clearSavedFormData() {
  const storedData = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
  delete storedData.savedFormData;
  delete storedData.savedAt;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(storedData));
}

/**
 * Handle save draft action - saves form data to sessionStorage
 */
export function handleSaveDraft(formContainer) {
  const formData = getFormData(formContainer);

  const storedData = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
  storedData.savedFormData = formData;
  storedData.savedAt = new Date().toISOString();

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(storedData));
  showToast('Draft saved!');
}

/**
 * Restore form data to the form fields and update page placeholders
 * @param {HTMLElement} formContainer - The form container element
 * @param {Object} savedData - The saved form data to restore
 * @param {Object} schema - Optional schema for field type detection
 */
export function restoreFormData(formContainer, savedData, schema = null) {
  if (!savedData) return;

  // Build field type map if schema provided
  const fieldTypeMap = {};
  if (schema?.fields) {
    schema.fields.forEach((field) => {
      fieldTypeMap[field.key] = field.type || 'text';
    });
  }

  Object.entries(savedData).forEach(([key, value]) => {
    // Handle image fields separately
    if (typeof value === 'object' && value.dataUrl) {
      // New upload with dataUrl (from draft save or user upload)
      restoreImageField(formContainer, key, value);
      return;
    }

    if (typeof value === 'object' && value.existingUrl) {
      // Existing image URL (from edit mode - loading existing page)
      restoreExistingImageField(formContainer, key, value);
      return;
    }

    const input = formContainer.querySelector(`[name="${key}"]`);
    if (input) {
      if (input.type === 'checkbox') {
        input.checked = value === 'true';
      } else {
        input.value = value;
      }
    }

    // Handle color picker fields - sync the UI (swatch, format, alpha) to match restored value
    const colorField = formContainer.querySelector(`.daas-field-color[data-key="${key}"]`);
    if (colorField?.syncColorPicker) {
      colorField.syncColorPicker();
    }

    // Handle Quill rich text editors
    const rteContainer = formContainer.querySelector(`.daas-field[data-key="${key}"] .daas-rte-container`);
    if (rteContainer) {
      const hiddenInput = rteContainer.querySelector('.daas-rte-value');
      if (hiddenInput) hiddenInput.value = value;

      if (rteContainer.quillInstance) {
        rteContainer.quillInstance.root.innerHTML = value;
      } else {
        const checkQuill = setInterval(() => {
          if (rteContainer.quillInstance) {
            rteContainer.quillInstance.root.innerHTML = value;
            clearInterval(checkQuill);
          }
        }, 100);
        setTimeout(() => clearInterval(checkQuill), 5000);
      }
    }

    // Handle multi-select
    const multiSelectValue = formContainer.querySelector(`.daas-multiselect-value[name="${key}"]`);
    if (multiSelectValue) {
      multiSelectValue.value = Array.isArray(value) ? value.join(',') : value;
      const optionsPanel = multiSelectValue.closest('.daas-field').querySelector('.daas-multiselect-options');
      if (optionsPanel) {
        const values = Array.isArray(value) ? value : value.split(',');
        optionsPanel.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
          cb.checked = values.includes(cb.value);
        });
        optionsPanel.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    // Update page placeholder with restored value
    if (value) {
      const baseKey = key.replace(/\[\d+\]/, '[]');
      const fieldType = fieldTypeMap[baseKey] || 'text';
      const displayValue = Array.isArray(value) ? value.join(', ') : value;
      updatePlaceholder(key, displayValue, fieldType);
    }
  });

  showToast('Draft restored!');
}

/**
 * Restore an image field to the dropzone UI and update page
 */
function restoreImageField(formContainer, key, imageData) {
  const { dataUrl, fileName } = imageData;
  if (!dataUrl) return;

  // Find the dropzone for this key
  const fieldWrapper = formContainer.querySelector(`.daas-field-image[data-key="${key}"]`);
  if (!fieldWrapper) return;

  const dropzone = fieldWrapper.querySelector('.daas-dropzone');
  const preview = dropzone?.querySelector('.daas-dropzone-preview');
  const content = dropzone?.querySelector('.daas-dropzone-content');

  if (!dropzone || !preview || !content) return;

  // Restore the preview UI
  preview.innerHTML = `
    <img src="${dataUrl}" alt="Preview" />
    <button type="button" class="daas-dropzone-remove" title="Remove image">
      <svg width="16" height="16" viewBox="0 0 16 16"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    </button>
  `;
  content.style.display = 'none';
  dropzone.classList.add('daas-dropzone-has-image');

  // Set up remove button handler
  preview.querySelector('.daas-dropzone-remove')?.addEventListener('click', (ev) => {
    ev.stopPropagation();
    preview.innerHTML = '';
    content.style.display = '';
    dropzone.classList.remove('daas-dropzone-has-image');
    delete dropzone.dataset.imageData;
    delete dropzone.dataset.imageName;
    // Note: resetImagePlaceholder would need to be imported if we want to reset the page image
  });

  // Store the data in the dropzone
  dropzone.dataset.imageData = dataUrl;
  dropzone.dataset.imageName = fileName || 'restored-image';

  // Update the image on the page
  swapImageOnPage(key, dataUrl);
}

/**
 * Restore an existing image field (from edit mode - URL instead of dataUrl)
 * This handles images that are already on the server and don't need to be uploaded
 */
function restoreExistingImageField(formContainer, key, imageData) {
  const { existingUrl, alt } = imageData;
  if (!existingUrl) return;

  // Find the dropzone for this key
  const fieldWrapper = formContainer.querySelector(`.daas-field-image[data-key="${key}"]`);
  if (!fieldWrapper) return;

  const dropzone = fieldWrapper.querySelector('.daas-dropzone');
  const preview = dropzone?.querySelector('.daas-dropzone-preview');
  const content = dropzone?.querySelector('.daas-dropzone-content');

  if (!dropzone || !preview || !content) return;

  // Restore the preview UI using the existing URL
  preview.innerHTML = `
    <img src="${existingUrl}" alt="${alt || 'Preview'}" />
    <button type="button" class="daas-dropzone-remove" title="Remove image">
      <svg width="16" height="16" viewBox="0 0 16 16"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    </button>
  `;
  content.style.display = 'none';
  dropzone.classList.add('daas-dropzone-has-image');

  // Set up remove button handler
  preview.querySelector('.daas-dropzone-remove')?.addEventListener('click', (ev) => {
    ev.stopPropagation();
    preview.innerHTML = '';
    content.style.display = '';
    dropzone.classList.remove('daas-dropzone-has-image');
    delete dropzone.dataset.existingImageUrl;
    delete dropzone.dataset.imageData;
    delete dropzone.dataset.imageName;
  });

  // Store the existing URL in a separate data attribute
  // This differentiates from new uploads (which use imageData)
  dropzone.dataset.existingImageUrl = existingUrl;

  // Update the image on the page
  swapImageOnPage(key, existingUrl);
}

/**
 * Extract images from form data for upload
 * @param {Object} formData - The form data
 * @returns {Array<{key: string, fileName: string, dataUrl: string}>}
 */
export function extractImagesFromFormData(formData) {
  const images = [];
  Object.entries(formData).forEach(([key, value]) => {
    if (typeof value === 'object' && value.dataUrl && value.fileName) {
      images.push({
        key,
        fileName: value.fileName,
        dataUrl: value.dataUrl,
      });
    }
  });
  return images;
}

/**
 * Apply all schema metadata as data attributes to an element
 * Used when composing final HTML to preserve schema info
 *
 * @param {HTMLElement} element - Target element
 * @param {string} key - The placeholder key
 * @param {Object} field - The schema field definition
 */
function applySchemaDataAttributes(element, key, field) {
  if (!element || !field) return;

  // Set the key (use base key for repeaters)
  const baseKey = key.replace(/\[\d+\]/, '[]');
  element.dataset.daasKey = baseKey;

  // Set all schema attributes if present
  if (field.type) element.dataset.daasType = field.type;
  if (field.label) element.dataset.daasLabel = field.label;
  if (field.required) element.dataset.daasRequired = field.required;
  if (field.default) element.dataset.daasDefault = field.default;
  if (field.options) element.dataset.daasOptions = field.options;
  if (field.min) element.dataset.daasMin = field.min;
  if (field.max) element.dataset.daasMax = field.max;
  if (field.pattern) element.dataset.daasPattern = field.pattern;
}

/**
 * Compose final HTML with data attributes for saving
 * - Replaces all placeholders with form data values
 * - Handles richtext fields properly (HTML injection)
 * - Updates image placeholders with uploaded image URLs
 * - Removes unfilled placeholders
 * - Removes repeat delimiters
 * - Removes template-schema block
 *
 * @param {Object} formData - The form data
 * @param {Object} schema - The schema
 * @param {Object} imageUrls - Optional map of placeholder keys to uploaded image content URLs
 */
export async function composeFinalHtml(formData, schema, imageUrls = {}) {
  // Fetch DA source doc (not .plain.html) for page creation
  const sourceHtml = await fetchSourceDoc();
  if (!sourceHtml) {
    console.error('Could not fetch DA source doc');
    return null;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(sourceHtml, 'text/html');

  // Get template path for metadata block
  const templatePath = getDAPath();

  // Build a map of field types for richtext detection
  const fieldTypeMap = {};
  schema.fields?.forEach((field) => {
    fieldTypeMap[field.key] = field;
  });

  // Step 0: Handle uploaded images - update picture elements
  Object.entries(imageUrls).forEach(([key, contentUrl]) => {
    const placeholderText = `[[${key}]]`;
    const baseKey = key.replace(/\[\d+\]/, '[]');
    const field = fieldTypeMap[baseKey];

    // Find img elements with alt containing the placeholder
    doc.querySelectorAll('img[alt]').forEach((img) => {
      if (img.alt === placeholderText || img.alt === key) {
        // Update img src
        img.src = contentUrl;
        img.alt = ''; // Clear the placeholder alt

        // Update parent picture element's source srcsets
        const picture = img.closest('picture');
        if (picture) {
          picture.querySelectorAll('source').forEach((source) => {
            source.srcset = contentUrl;
          });
        }

        // Add schema attributes to the img element (not the picture wrapper)
        if (field) {
          applySchemaDataAttributes(img, key, field);
        }
      }
    });
  });

  // Step 0.5: Handle existing images (from edit mode) - these don't need upload
  Object.entries(formData).forEach(([key, value]) => {
    if (typeof value !== 'object' || !value.existingUrl) return;

    const existingUrl = value.existingUrl;
    const placeholderText = `[[${key}]]`;
    const baseKey = key.replace(/\[\d+\]/, '[]');
    const field = fieldTypeMap[baseKey];

    // Find img elements with alt containing the placeholder
    doc.querySelectorAll('img[alt]').forEach((img) => {
      if (img.alt === placeholderText || img.alt === key) {
        // Update img src with existing URL
        img.src = existingUrl;
        img.alt = ''; // Clear the placeholder alt

        // Update parent picture element's source srcsets
        const picture = img.closest('picture');
        if (picture) {
          picture.querySelectorAll('source').forEach((source) => {
            source.srcset = existingUrl;
          });
        }

        // Add schema attributes to the img element
        if (field) {
          applySchemaDataAttributes(img, key, field);
        }
      }
    });
  });

  // Step 1: Replace placeholders with form data values
  Object.entries(formData).forEach(([key, value]) => {
    const baseKey = key.replace(/\[\d+\]/, '[]');
    const field = fieldTypeMap[baseKey];
    const isRichText = field?.type === 'richtext';

    // Skip image data objects (handled above)
    if (typeof value === 'object' && (value.dataUrl || value.existingUrl)) return;

    const placeholderText = `[[${key}]]`;
    const encodedPlaceholder = encodeURIComponent(placeholderText);
    // Also handle base key placeholder for repeaters
    const basePlaceholderText = `[[${baseKey}]]`;
    const encodedBasePlaceholder = encodeURIComponent(basePlaceholderText);

    // Replace in text content - need to handle richtext differently
    const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null, false);
    const nodesToProcess = [];
    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent.includes(placeholderText) || node.textContent.includes(basePlaceholderText)) {
        nodesToProcess.push(node);
      }
    }

    // Process nodes (can't modify during TreeWalker iteration)
    nodesToProcess.forEach((textNode) => {
      const parent = textNode.parentElement;

      if (isRichText && value) {
        // For richtext, we need to inject HTML, not escaped text
        // Replace the text node's content and then parse as HTML
        const newContent = textNode.textContent
          .replace(placeholderText, value || '')
          .replace(basePlaceholderText, value || '');

        // If parent is a simple container (p, div, etc.), we can set innerHTML
        if (parent && ['P', 'DIV', 'SPAN', 'TD', 'LI'].includes(parent.tagName)) {
          parent.innerHTML = newContent;
        } else {
          textNode.textContent = newContent;
        }
      } else {
        // For non-richtext, just replace text
        textNode.textContent = textNode.textContent
          .replace(placeholderText, value || '')
          .replace(basePlaceholderText, value || '');
      }

      // Add all schema data attributes to parent element
      if (parent && field) {
        applySchemaDataAttributes(parent, key, field);
      }
    });

    // Replace in href attributes
    doc.querySelectorAll('a[href]').forEach((el) => {
      const href = el.getAttribute('href');
      if (href.includes(placeholderText) || href.includes(encodedPlaceholder)
          || href.includes(basePlaceholderText) || href.includes(encodedBasePlaceholder)) {
        const newHref = href
          .replace(placeholderText, value || '')
          .replace(encodedPlaceholder, value ? encodeURIComponent(value) : '')
          .replace(basePlaceholderText, value || '')
          .replace(encodedBasePlaceholder, value ? encodeURIComponent(value) : '');
        el.setAttribute('href', newHref);
        // Add schema attributes to links with placeholders
        if (field) {
          applySchemaDataAttributes(el, key, field);
        }
      }
    });

    // Replace in alt attributes
    doc.querySelectorAll('[alt]').forEach((el) => {
      if (el.alt.includes(placeholderText) || el.alt.includes(basePlaceholderText)) {
        el.alt = el.alt
          .replace(placeholderText, value || '')
          .replace(basePlaceholderText, value || '');
        // Add schema attributes to the img element directly (not picture wrapper)
        if (field) {
          applySchemaDataAttributes(el, key, field);
        }
      }
    });

    // Replace in src attributes (for images)
    doc.querySelectorAll('[src]').forEach((el) => {
      const src = el.getAttribute('src');
      if (src && (src.includes(placeholderText) || src.includes(basePlaceholderText))) {
        el.setAttribute('src', src
          .replace(placeholderText, value || '')
          .replace(basePlaceholderText, value || ''));
      }
    });
  });

  // Step 2: Remove repeat delimiter elements ([[@repeat(name)]] and [[@repeatend(name)]])
  // Look for p, div, or span elements that contain ONLY a repeat delimiter
  const REPEAT_REGEX = /^\s*\[\[@repeat(?:end)?\([^)]+\)\]\]\s*$/;
  doc.querySelectorAll('p, div, span').forEach((el) => {
    const text = el.textContent;
    if (REPEAT_REGEX.test(text)) {
      // Check if this element or its parent should be removed
      const parent = el.parentElement;
      // If parent is a simple wrapper div with only this child, remove the parent
      if (parent && parent.tagName === 'DIV' && parent.children.length === 1) {
        parent.remove();
      } else {
        el.remove();
      }
    }
  });

  // Step 3: Clean up any remaining [[placeholder]] text (unfilled fields)
  // Regex handles nested brackets like [[faq[].question]] and [[faq[0].answer]]
  const PLACEHOLDER_REGEX = /\[\[[a-zA-Z0-9_.\[\]]+\]\]/g;

  // Clean text nodes - collect first, then modify
  const textNodesToClean = [];
  const textWalker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null, false);
  let textNode;
  while ((textNode = textWalker.nextNode())) {
    if (textNode.textContent.includes('[[')) {
      textNodesToClean.push(textNode);
    }
  }
  textNodesToClean.forEach((tn) => {
    tn.textContent = tn.textContent.replace(PLACEHOLDER_REGEX, '');
  });

  // Clean href attributes
  doc.querySelectorAll('a[href]').forEach((el) => {
    const href = el.getAttribute('href');
    // Check for both raw and URL-encoded placeholders
    if (href.includes('[[') || href.includes('%5B%5B')) {
      let newHref = href.replace(PLACEHOLDER_REGEX, '');
      // Also clean URL-encoded placeholders: %5B%5B...%5D%5D
      newHref = newHref.replace(/%5B%5B[a-zA-Z0-9_.%5B%5D]+%5D%5D/gi, '');
      el.setAttribute('href', newHref);
    }
  });

  // Clean alt attributes
  doc.querySelectorAll('[alt]').forEach((el) => {
    if (el.alt.includes('[[')) {
      el.alt = el.alt.replace(PLACEHOLDER_REGEX, '');
    }
  });

  // Clean src attributes
  doc.querySelectorAll('[src]').forEach((el) => {
    const src = el.getAttribute('src');
    if (src && src.includes('[[')) {
      el.setAttribute('src', src.replace(PLACEHOLDER_REGEX, ''));
    }
  });

  // Step 4: Remove empty blocks (blocks that only contained placeholders, now empty)
  // A block is a div with a class name that represents a component
  doc.querySelectorAll('main [class]').forEach((block) => {
    // Skip special blocks
    if (block.classList.contains('metadata') || block.classList.contains('template-schema')) {
      return;
    }

    // Check if block has any meaningful content (non-whitespace text or images with src)
    const hasText = block.textContent.trim().length > 0;
    const hasImages = block.querySelectorAll('img[src]:not([src=""])').length > 0;
    const hasLinks = Array.from(block.querySelectorAll('a[href]')).some((a) => {
      const href = a.getAttribute('href');
      return href && href.trim() && !href.startsWith('bookmark://');
    });

    // If block has no meaningful content, remove it and its wrapper
    if (!hasText && !hasImages && !hasLinks) {
      console.log('DaaS: Removing empty block:', block.className);
      const parent = block.parentElement;
      // If parent is a wrapper div with only this block, remove parent too
      if (parent && parent.tagName === 'DIV' && !parent.className && parent.children.length === 1) {
        parent.remove();
      } else {
        block.remove();
      }
    }
  });

  // Step 5: Remove the template-schema block from output (it's only for authoring)
  const schemaBlock = doc.querySelector('.template-schema');
  if (schemaBlock) {
    // Remove the parent wrapper div if it only contains the schema block
    const parent = schemaBlock.parentElement;
    if (parent && parent.tagName === 'DIV') {
      // Check if parent has other meaningful children besides the schema
      const otherChildren = Array.from(parent.children).filter((c) => c !== schemaBlock);
      if (otherChildren.length === 0) {
        parent.remove();
      } else {
        schemaBlock.remove();
      }
    } else {
      schemaBlock.remove();
    }
  }

  // Step 6: Add template metadata as data attributes on body element
  if (templatePath) {
    // Generate template ID by hashing the path
    const templateId = hashString(templatePath);
    doc.body.dataset.daasTemplatePath = templatePath;
    doc.body.dataset.daasTemplateId = templateId;
  }

  // Return full body element including the tag with attributes
  return doc.body.outerHTML;
}

/**
 * Simple hash function to generate a unique ID from a string
 * Uses djb2 algorithm - fast and produces good distribution
 * @param {string} str - String to hash
 * @returns {string} - Hex hash string
 */
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i); // hash * 33 + c
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Convert to positive hex string
  return Math.abs(hash).toString(16);
}

/**
 * Get the base prefix (owner/repo) from the current URL
 * @returns {string} - Base prefix like "/adobecom/da-express-milo" or empty string
 */
function getBasePrefix() {
  const daPath = getDAPath();
  if (daPath) {
    // Extract /owner/repo from the full path
    const parts = daPath.split('/').filter(Boolean);
    if (parts.length >= 2) {
      return `/${parts[0]}/${parts[1]}`;
    }
  }
  return '';
}

/**
 * Generate default page path based on current URL (without owner/repo)
 * Appends timestamp to avoid conflicts
 */
function getDefaultPagePath() {
  const daPath = getDAPath();
  if (daPath) {
    // Extract path portion (after /owner/repo)
    const parts = daPath.split('/').filter(Boolean);
    if (parts.length >= 3) {
      const pagePath = '/' + parts.slice(2).join('/');
      const timestamp = Date.now().toString(36);
      return `${pagePath}-${timestamp}`;
    }
  }
  return '';
}

/**
 * Generate the AEM page URL from a DA path
 * Always uses .aem.page (preview domain) since we only preview, not publish
 *
 * @param {string} daPath - DA path like /owner/repo/path/to/page
 * @returns {string|null} - AEM URL or null if can't determine
 * 
 * Example: /adobecom/da-express-milo/drafts/qiyundai/page
 *   -> https://hackathon-q-1--da-express-milo--adobecom.aem.page/drafts/qiyundai/page
 */
function getAEMPageUrl(daPath) {
  const { hostname } = window.location;

  // Check if this is an AEM URL
  if (!hostname.includes('.aem.')) return null;

  // Always use .aem.page for preview (not .aem.live which is for published pages)
  const domain = 'page';

  // Split hostname to get ref
  // Format: {ref}--{repo}--{owner}.aem.{page|live}
  const hostParts = hostname.split('.aem.')[0].split('--');
  if (hostParts.length < 3) return null;
  
  const ref = hostParts[0]; // e.g., "hackathon-q-1"

  // Parse the DA path: /owner/repo/path/to/page
  const pathParts = daPath.split('/').filter(Boolean);
  if (pathParts.length < 3) return null;

  const [owner, repo, ...restPath] = pathParts;
  const pagePath = restPath.join('/');

  return `https://${ref}--${repo}--${owner}.aem.${domain}/${pagePath}`;
}

/**
 * Show the destination modal and handle page creation
 */
function showDestinationModal(formContainer, schema) {
  return new Promise((resolve) => {
    const basePrefix = getBasePrefix();
    const defaultPath = getDefaultPagePath();

    // If we can't determine the base prefix, we can't create pages
    if (!basePrefix) {
      showToast('Cannot determine repository. Are you on an AEM page?', true);
      resolve(null);
      return;
    }

    const modal = createDestinationModal(basePrefix, defaultPath);
    document.body.appendChild(modal);

    requestAnimationFrame(() => modal.classList.add('daas-modal-open'));

    const pathInput = modal.querySelector('#daas-dest-path');
    const openAfterCheckbox = modal.querySelector('#daas-open-after');
    const cancelBtn = modal.querySelector('#daas-modal-cancel');
    const createBtn = modal.querySelector('#daas-modal-create');

    const closeModal = (result = null) => {
      modal.classList.remove('daas-modal-open');
      setTimeout(() => {
        modal.remove();
        resolve(result);
      }, 200);
    };

    cancelBtn.addEventListener('click', () => closeModal(null));

    createBtn.addEventListener('click', () => {
      let pagePath = pathInput.value.trim();
      if (!pagePath) {
        showToast('Please enter a page path', true);
        pathInput.focus();
        return;
      }

      // Ensure path starts with /
      if (!pagePath.startsWith('/')) {
        pagePath = '/' + pagePath;
      }

      // Validate path has at least one segment
      if (pagePath.split('/').filter(Boolean).length < 1) {
        showToast('Please enter a valid page path', true);
        pathInput.focus();
        return;
      }

      // Combine base prefix with page path
      const fullDestPath = basePrefix + pagePath;

      closeModal({
        destPath: fullDestPath,
        openAfter: openAfterCheckbox.checked,
      });
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(null);
    });

    // Close on Escape
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal(null);
    });

    // Focus input and select text
    setTimeout(() => {
      pathInput.focus();
      pathInput.select();
    }, 100);
  });
}

/**
 * Show progress modal during page creation
 */
function showProgressModalElement() {
  const modal = createProgressModal();
  document.body.appendChild(modal);
  return modal;
}

/**
 * Show success modal after page creation
 */
function showSuccessModalElement(destPath, pageUrl) {
  return new Promise((resolve) => {
    const modal = createSuccessModal(destPath, pageUrl);
    document.body.appendChild(modal);

    requestAnimationFrame(() => modal.classList.add('daas-modal-open'));

    const doneBtn = modal.querySelector('#daas-modal-done');

    const closeModal = () => {
      modal.classList.remove('daas-modal-open');
      setTimeout(() => {
        modal.remove();
        resolve();
      }, 200);
    };

    doneBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') closeModal();
    });
  });
}

/**
 * Show success modal after page update
 */
function showUpdateSuccessModalElement(destPath, pageUrl) {
  return new Promise((resolve) => {
    const modal = createUpdateSuccessModal(destPath, pageUrl);
    document.body.appendChild(modal);

    requestAnimationFrame(() => modal.classList.add('daas-modal-open'));

    const doneBtn = modal.querySelector('#daas-modal-done');

    const closeModal = () => {
      modal.classList.remove('daas-modal-open');
      setTimeout(() => {
        modal.remove();
        resolve();
      }, 200);
    };

    doneBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') closeModal();
    });
  });
}

/**
 * Handle create/update page action
 * - In create mode: shows destination modal, composes HTML, saves via DA SDK, and previews
 * - In edit mode: uses locked destination path, skips destination modal
 */
export async function handleCreatePage(formContainer, schema) {
  const isEditMode = state.isEditMode;
  const editPagePath = state.editPagePath;

  let destPath;
  let openAfter = true;

  if (isEditMode && editPagePath) {
    // Edit mode: use the locked destination path
    destPath = editPagePath;
    console.log('DaaS: Updating existing page at:', destPath);
  } else {
    // Create mode: show destination modal
    const result = await showDestinationModal(formContainer, schema);
    if (!result) {
      // User cancelled
      return;
    }
    destPath = result.destPath;
    openAfter = result.openAfter;
  }

  // Show progress modal
  const progressModal = showProgressModalElement();
  const progressText = progressModal.querySelector('.daas-progress-text');
  const actionVerb = isEditMode ? 'Updating' : 'Creating';

  try {
    // Get form data
    const formData = getFormData(formContainer);
    console.log(`DaaS: ${actionVerb} page with form data:`, formData);

    // Upload images first (if any)
    const images = extractImagesFromFormData(formData);
    const imageUrls = {};

    if (images.length > 0) {
      if (progressText) progressText.textContent = `Uploading images (0/${images.length})...`;

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (progressText) progressText.textContent = `Uploading images (${i + 1}/${images.length})...`;

        const uploadResult = await uploadImage(destPath, img.fileName, img.dataUrl);
        if (uploadResult.success && uploadResult.contentUrl) {
          imageUrls[img.key] = uploadResult.contentUrl;
          console.log(`DaaS: Image ${img.key} uploaded to ${uploadResult.contentUrl}`);
        } else {
          console.warn(`DaaS: Failed to upload image ${img.key}:`, uploadResult.error);
          // Continue with other images even if one fails
        }
      }
    }

    // Compose final HTML with uploaded image URLs
    if (progressText) progressText.textContent = 'Composing page...';
    const finalHtml = await composeFinalHtml(formData, schema, imageUrls);
    if (!finalHtml) {
      throw new Error('Failed to compose final HTML');
    }

    // Post to DA API (same endpoint for create and update)
    if (progressText) progressText.textContent = isEditMode ? 'Updating document...' : 'Saving document...';
    const postResult = await postDoc(destPath, finalHtml);

    if (!postResult.success) {
      progressModal.remove();
      // Handle specific error cases
      if (postResult.error === 'No auth token') {
        showToast('Authentication required. Please sign in again.', true);
      } else if (postResult.status === 401) {
        showToast('Session expired. Please sign in again.', true);
      } else if (postResult.status === 403) {
        showToast('Permission denied. Check your access rights.', true);
      } else {
        showToast(`Failed to ${isEditMode ? 'update' : 'create'} page: ${postResult.error}`, true);
      }
      return;
    }

    // Preview the page via AEM Admin API
    if (progressText) progressText.textContent = 'Generating preview...';
    const previewResult = await previewDoc(destPath);

    // Remove progress modal
    progressModal.remove();

    if (!previewResult.success) {
      // Preview failed but document was saved - still show success but warn about preview
      console.warn('DaaS: Preview failed but document saved:', previewResult.error);
      showToast('Page saved! Preview generation had an issue, but you can still view the page.', false);
    }

    // Success! Generate page URL and optionally open
    const pageUrl = getAEMPageUrl(destPath);

    if (openAfter && pageUrl) {
      window.open(pageUrl, '_blank');
    }

    // Show appropriate success modal
    if (isEditMode) {
      await showUpdateSuccessModalElement(destPath, pageUrl);
      console.log('DaaS: Page updated and previewed successfully at', destPath);
    } else {
      await showSuccessModalElement(destPath, pageUrl);
      console.log('DaaS: Page created and previewed successfully at', destPath);
    }
  } catch (error) {
    progressModal.remove();
    console.error(`DaaS: Page ${isEditMode ? 'update' : 'creation'} failed:`, error);
    showToast(`Failed to ${isEditMode ? 'update' : 'create'} page: ${error.message}`, true);
  }
}

