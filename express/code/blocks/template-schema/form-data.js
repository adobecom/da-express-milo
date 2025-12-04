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
 * Extract individual values from a multi-placeholder element using template pattern
 * 
 * @param {string} template - Original template like "tasks=[[a]]&lang=[[b]]"
 * @param {string} content - Hydrated content like "tasks=flyer&lang=en-US"
 * @param {string[]} keys - Array of keys like ["a", "b"]
 * @returns {Object} - Map of key to extracted value
 */
function extractMultiPlaceholderValues(template, content, keys) {
  const result = {};

  // Convert template to regex pattern
  // Replace [[key]] with capturing groups, escape other regex chars
  let regexPattern = template
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
    .replace(/\\\[\\\[([^\]]+)\\\]\\\]/g, '(.*)'); // Replace escaped [[key]] with (.*)

  try {
    const regex = new RegExp(`^${regexPattern}$`);
    const matches = content.match(regex);

    if (matches) {
      // matches[0] is full match, matches[1..n] are captured groups
      keys.forEach((key, idx) => {
        if (matches[idx + 1] !== undefined) {
          result[key] = matches[idx + 1];
        }
      });
    }
  } catch (e) {
    // If regex fails, fall back to not extracting individual values
    console.warn('Failed to extract multi-placeholder values:', e);
  }

  return result;
}

/**
 * Check if an element contains rich HTML formatting (not just plain text)
 * Used to detect richtext content even without explicit data-daas-type
 * 
 * @param {HTMLElement} el - Element to check
 * @returns {boolean} - True if element contains rich formatting
 */
function hasRichContent(el) {
  if (!el) return false;
  // Check for common formatting elements
  const richTags = ['B', 'I', 'U', 'STRONG', 'EM', 'A', 'BR', 'UL', 'OL', 'LI', 'SPAN', 'P'];
  const hasFormattingChildren = el.querySelector(richTags.map((t) => t.toLowerCase()).join(','));
  // Also check if innerHTML differs significantly from textContent (indicates HTML tags)
  const innerHTML = el.innerHTML.trim();
  const textContent = el.textContent.trim();
  const hasHtmlTags = innerHTML.length > textContent.length + 10 && innerHTML.includes('<');
  return !!hasFormattingChildren || hasHtmlTags;
}

/**
 * Extract form data from an existing page's HTML
 * Parses elements with data-daas-key attributes and extracts their content
 * 
 * Handles multi-placeholder elements by using data-daas-template to extract
 * individual values for each placeholder key.
 * 
 * @param {string} html - The HTML content of the existing page
 * @returns {Object} - The extracted form data keyed by field key
 */
export function extractFormDataFromHtml(html) {
  // Pre-extract richtext content from raw HTML BEFORE DOMParser corrupts nested tags
  // DOMParser auto-corrects invalid nested <p> tags, losing the content
  const richtextValues = {};
  const richtextRegex = /<(\w+)[^>]*data-daas-key="([^"]+)"[^>]*data-daas-type="richtext"[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = richtextRegex.exec(html)) !== null) {
    const key = match[2];
    const content = match[3].trim();
    if (content && !richtextValues[key]) {
      richtextValues[key] = content;
      console.log(`DaaS: Pre-extracted richtext for "${key}" from raw HTML:`, content.substring(0, 100));
    }
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const formData = {};

  // Find all elements with data-daas-key attribute
  const elements = doc.querySelectorAll('[data-daas-key]');

  elements.forEach((el) => {
    const keyAttr = el.dataset.daasKey;
    const type = el.dataset.daasType || 'text';
    const template = el.dataset.daasTemplate;

    if (!keyAttr) return;

    // Check if this element has multiple placeholder keys (comma-separated)
    const keys = keyAttr.split(',').map((k) => k.trim());
    const isMultiPlaceholder = keys.length > 1;

    if (isMultiPlaceholder && template) {
      // Multi-placeholder element - extract individual values using template
      const content = el.textContent.trim();
      const extractedValues = extractMultiPlaceholderValues(template, content, keys);

      // Add each extracted value to formData
      Object.entries(extractedValues).forEach(([key, value]) => {
        if (!formData[key]) {
          formData[key] = value;
        }
      });
    } else {
      // Single placeholder element
      const key = keys[0];

      if (type === 'image') {
        // For images, extract the src URL as an existing image
        const img = el.tagName === 'IMG' ? el : el.querySelector('img');
        if (img?.src) {
          formData[key] = {
            existingUrl: img.src,
            alt: img.alt || '',
          };
        }
      } else if (type === 'url') {
        // For URL type fields - extract from href if it's an anchor, otherwise textContent
        if (el.tagName === 'A') {
          formData[key] = decodeURIComponent(el.getAttribute('href') || '');
        } else {
          // URL stored as text content (e.g., in a span)
          formData[key] = el.textContent.trim();
        }
      } else if (type === 'richtext') {
        // For richtext, prefer pre-extracted value from raw HTML (avoids DOMParser corruption)
        // DOMParser auto-corrects nested <p> tags which corrupts richtext content
        if (!formData[key]) {
          if (richtextValues[key]) {
            formData[key] = richtextValues[key];
            console.log(`DaaS: Using pre-extracted richtext for "${key}":`, formData[key].substring(0, 100));
          } else {
            // Fallback to innerHTML if pre-extraction didn't find it
            formData[key] = el.innerHTML.trim();
            console.log(`DaaS: Extracted richtext for "${key}" from DOM:`, formData[key].substring(0, 100) || '(empty)');
          }
        }
      } else if (hasRichContent(el)) {
        // For elements with rich content but no explicit richtext type
        if (!formData[key]) {
          formData[key] = el.innerHTML.trim();
        }
      } else {
        // For text and other types, get text content
        const textValue = el.textContent.trim();
        // Keep first non-empty value - don't let empty elements overwrite
        if (!formData[key]) {
          formData[key] = textValue;
        }
      }
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
      // Need to handle comma-separated keys too
      const repeaterElements = doc.querySelectorAll(`[data-daas-key*="${key}"]`);
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

  return { formData, repeaterCounts };
}

/**
 * Validate required fields using native form validation
 * Checks if the form has any invalid inputs
 * @param {HTMLElement} formContainer - The form container element
 * @returns {Object} { isValid: boolean, missingFields: string[] }
 */
export function validateRequiredFields(formContainer) {
  const form = formContainer?.querySelector('form');
  if (!form) return { isValid: true, missingFields: [] };

  const isValid = form.checkValidity();
  const missingFields = [];

  if (!isValid) {
    form.querySelectorAll(':invalid').forEach((input) => {
      const name = input.name || input.closest('[data-key]')?.dataset.key;
      if (name && !missingFields.includes(name)) {
        missingFields.push(name);
      }
    });
  }

  return { isValid, missingFields };
}

/**
 * Update Create Page button state based on validation
 */
export function updateCreateButtonState(panel, formContainer) {
  const createBtn = panel.querySelector('#daas-create-btn');
  if (!createBtn) return;

  const { isValid, missingFields } = validateRequiredFields(formContainer);

  createBtn.disabled = !isValid;

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

  // Debug: log all inputs found
  const allInputs = formContainer.querySelectorAll('.daas-input');
  console.log(`DaaS getFormData: Found ${allInputs.length} .daas-input elements`);
  
  // Debug: log repeater item count
  const repeaterItems = formContainer.querySelectorAll('.daas-repeater-item');
  console.log(`DaaS getFormData: Found ${repeaterItems.length} repeater items`);

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

    // Debug: log each key-value pair
    console.log(`DaaS getFormData: "${key}" = "${value?.substring?.(0, 50) || value}"`);
    
    if (value) data[key] = value;
  });
  
  console.log('DaaS getFormData: Collected keys:', Object.keys(data));

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
 * Extract repeater counts from form data
 * Analyzes keys like "faq[0].question", "faq[1].question" to determine
 * how many items each repeater should have
 * 
 * @param {Object} formData - The form data object
 * @returns {Object} - Map of repeater name to count, e.g., { faq: 2 }
 */
export function getRepeaterCountsFromFormData(formData) {
  const counts = {};
  
  Object.keys(formData).forEach((key) => {
    // Match keys like "faq[0].question" or "carousel[2].title"
    const match = key.match(/^([^[]+)\[(\d+)\]\./);
    if (match) {
      const repeaterName = match[1];
      const index = parseInt(match[2], 10);
      // Track the highest index + 1 as the count
      counts[repeaterName] = Math.max(counts[repeaterName] || 0, index + 1);
    }
  });
  
  return counts;
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
 * @param {Object} options - Optional settings
 * @param {boolean} options.silent - If true, don't show toast message (default: false)
 */
export function restoreFormData(formContainer, savedData, schema = null, options = {}) {
  if (!savedData) return;

  const { silent = false } = options;

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
        // For select elements with async options, also update the pending value
        // so it's used when options finish loading
        if (input.tagName === 'SELECT' && input.dataset.pendingValue !== undefined) {
          input.dataset.pendingValue = value;
        }
      }
    }

    // Handle color picker fields - sync the UI (swatch, format, alpha) to match restored value
    const colorField = formContainer.querySelector(`.daas-field-color[data-key="${key}"]`);
    if (colorField?.syncColorPicker) {
      colorField.syncColorPicker();
    }

    // Handle Quill rich text editors
    // Try multiple selector strategies for finding RTE containers
    let rteContainer = formContainer.querySelector(`.daas-field[data-key="${key}"] .daas-rte-container`);
    
    // Fallback: try finding by CSS-escaped key (for keys with special chars)
    if (!rteContainer) {
      const escapedKey = CSS.escape(key);
      rteContainer = formContainer.querySelector(`.daas-field[data-key="${escapedKey}"] .daas-rte-container`);
    }
    
    // Fallback: try finding RTE by hidden input name
    if (!rteContainer) {
      const hiddenInputByName = formContainer.querySelector(`.daas-rte-value[name="${key}"]`);
      rteContainer = hiddenInputByName?.closest('.daas-rte-container');
    }
    
    if (rteContainer) {
      console.log(`DaaS: Restoring RTE field "${key}" with value length: ${value?.length || 0}`);
      
      const hiddenInput = rteContainer.querySelector('.daas-rte-value');
      if (hiddenInput) hiddenInput.value = value;

      // Set Quill content without stealing focus
      const setQuillContent = (quill) => {
        // Store current selection state
        const hadFocus = quill.hasFocus();
        
        // Set content using root.innerHTML (simpler, doesn't affect focus)
        quill.root.innerHTML = value || '';
        
        // Update Quill's internal state to match
        quill.update('silent');
        
        // Blur if it wasn't focused before
        if (!hadFocus) {
          quill.blur();
        }
        
        console.log(`DaaS: Set Quill content for "${key}"`);
      };

      if (rteContainer.quillInstance) {
        setQuillContent(rteContainer.quillInstance);
      } else {
        // Wait for Quill to initialize (one-time check, not polling)
        const checkQuill = setInterval(() => {
          if (rteContainer.quillInstance) {
            setQuillContent(rteContainer.quillInstance);
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
 * Supports multiple placeholders in the same element:
 * - data-daas-key: comma-separated list of keys (e.g., "template.tasks,template.language")
 * - data-daas-template: original template pattern for value extraction in edit mode
 *   (e.g., "tasks=[[template.tasks]]&language=[[template.language]]")
 *
 * @param {HTMLElement} element - Target element
 * @param {string} key - The placeholder key
 * @param {Object} field - The schema field definition
 * @param {string} originalText - Optional original text with placeholder pattern
 */
function applySchemaDataAttributes(element, key, field, originalText = null) {
  if (!element || !field) return;

  // Use base key for repeaters
  const baseKey = key.replace(/\[\d+\]/, '[]');

  // Handle multiple placeholders in the same element
  // Append new keys as comma-separated list
  if (element.dataset.daasKey) {
    const existingKeys = element.dataset.daasKey.split(',');
    if (!existingKeys.includes(baseKey)) {
      element.dataset.daasKey = `${element.dataset.daasKey},${baseKey}`;
    }
  } else {
    element.dataset.daasKey = baseKey;
  }

  // Store original template pattern if provided and element has multiple placeholders
  // This allows extracting individual values in edit mode
  if (originalText && originalText.includes('[[') && !element.dataset.daasTemplate) {
    element.dataset.daasTemplate = originalText;
  }

  // For other attributes, only set if not already present (first placeholder wins)
  if (field.type && !element.dataset.daasType) element.dataset.daasType = field.type;
  if (field.label && !element.dataset.daasLabel) element.dataset.daasLabel = field.label;
  if (field.required && !element.dataset.daasRequired) element.dataset.daasRequired = field.required;
  if (field.default && !element.dataset.daasDefault) element.dataset.daasDefault = field.default;
  if (field.options && !element.dataset.daasOptions) element.dataset.daasOptions = field.options;
  if (field.min && !element.dataset.daasMin) element.dataset.daasMin = field.min;
  if (field.max && !element.dataset.daasMax) element.dataset.daasMax = field.max;
  if (field.pattern && !element.dataset.daasPattern) element.dataset.daasPattern = field.pattern;
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

  // CRITICAL: Expand repeaters before parsing and replacing placeholders
  // This duplicates repeater template rows for each item (e.g., faq[0], faq[1], etc.)
  const { expandRepeatersInHtml } = await import('./plain-html.js');
  const expandedHtml = expandRepeatersInHtml(sourceHtml, state.repeaterCounts);

  const parser = new DOMParser();
  const doc = parser.parseFromString(expandedHtml, 'text/html');

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

  // Step 0.9: Pre-scan for elements with multiple placeholders and store their templates
  // This must happen BEFORE any replacements so we capture the original pattern
  const MULTI_PLACEHOLDER_REGEX = /\[\[([^\]]+)\]\]/g;
  const multiPlaceholderElements = new Map(); // element -> original template

  // Scan text nodes
  const preWalker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null, false);
  let preNode;
  while ((preNode = preWalker.nextNode())) {
    const matches = preNode.textContent.match(MULTI_PLACEHOLDER_REGEX);
    if (matches && matches.length > 1) {
      // Multiple placeholders in this text node - store original template
      const parent = preNode.parentElement;
      if (parent && !multiPlaceholderElements.has(parent)) {
        multiPlaceholderElements.set(parent, preNode.textContent);
      }
    }
  }

  // Scan href attributes
  doc.querySelectorAll('a[href]').forEach((el) => {
    const href = el.getAttribute('href');
    const decodedHref = decodeURIComponent(href);
    const matches = decodedHref.match(MULTI_PLACEHOLDER_REGEX);
    if (matches && matches.length > 1) {
      if (!multiPlaceholderElements.has(el)) {
        multiPlaceholderElements.set(el, decodedHref);
      }
    }
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
        let richValue = value;
        
        // If parent is a <p> and value contains block-level elements like <p>,
        // strip the outer <p> wrapper to avoid invalid nested <p> tags
        if (parent?.tagName === 'P') {
          // Check if value is wrapped in a single <p> tag
          const pMatch = richValue.match(/^<p>([\s\S]*)<\/p>$/i);
          if (pMatch) {
            richValue = pMatch[1]; // Use inner content without <p> wrapper
          }
        }
        
        const newContent = textNode.textContent
          .replace(placeholderText, richValue || '')
          .replace(basePlaceholderText, richValue || '');

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
      // Include original template if this element has multiple placeholders
      if (parent && field) {
        const originalTemplate = multiPlaceholderElements.get(parent);
        applySchemaDataAttributes(parent, key, field, originalTemplate);
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
        // Include original template if this element has multiple placeholders
        if (field) {
          const originalTemplate = multiPlaceholderElements.get(el);
          applySchemaDataAttributes(el, key, field, originalTemplate);
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
 * @param {HTMLElement} formContainer - The form container
 * @param {Object} schema - The schema
 * @param {Object} options - Options
 * @param {boolean} options.hideSamePagePreviewOption - Hide the "open in new tab" option
 */
function showDestinationModal(formContainer, schema, options = {}) {
  return new Promise((resolve) => {
    const basePrefix = getBasePrefix();
    const defaultPath = getDefaultPagePath();
    const { hideSamePagePreviewOption = false } = options;

    // If we can't determine the base prefix, we can't create pages
    if (!basePrefix) {
      showToast('Cannot determine repository. Are you on an AEM page?', true);
      resolve(null);
      return;
    }

    const modal = createDestinationModal(basePrefix, defaultPath, { hideOpenAfter: hideSamePagePreviewOption });
    document.body.appendChild(modal);

    requestAnimationFrame(() => modal.classList.add('daas-modal-open'));

    const pathInput = modal.querySelector('#daas-dest-path');
    const openAfterCheckbox = modal.querySelector('#daas-open-after');
    const cancelBtn = modal.querySelector('#daas-modal-cancel');
    const createBtn = modal.querySelector('#daas-modal-create');
    const hintText = modal.querySelector('.daas-modal-hint');

    // Update the full path hint as user types
    const updateHint = () => {
      let pagePath = pathInput.value.trim();
      if (!pagePath.startsWith('/') && pagePath) {
        pagePath = '/' + pagePath;
      }
      hintText.textContent = `Full path: ${basePrefix}${pagePath || '/...'}`;
    };
    pathInput.addEventListener('input', updateHint);

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
        openAfter: openAfterCheckbox ? openAfterCheckbox.checked : false,
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
 * @param {string} destPath - Destination path
 * @param {string} pageUrl - Page URL (may be hidden in same-page preview mode)
 * @param {boolean} hideLink - Whether to hide the "view page" link
 */
function showSuccessModalElement(destPath, pageUrl, hideLink = false) {
  return new Promise((resolve) => {
    const modal = createSuccessModal(destPath, hideLink ? null : pageUrl);
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
 * @param {string} destPath - Destination path
 * @param {string} pageUrl - Page URL (may be hidden in same-page preview mode)
 * @param {boolean} hideLink - Whether to hide the "view page" link
 */
function showUpdateSuccessModalElement(destPath, pageUrl, hideLink = false) {
  return new Promise((resolve) => {
    const modal = createUpdateSuccessModal(destPath, hideLink ? null : pageUrl);
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
 * Check if running in same-page preview mode (iframe)
 * When `samepagepreview` URL param is present, we shouldn't open new tabs
 */
function isSamePagePreview() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has('samepagepreview');
}

/**
 * Handle create/update page action
 * - In create mode: shows destination modal, composes HTML, saves via DA SDK, and previews
 * - In edit mode: uses locked destination path, skips destination modal
 */
export async function handleCreatePage(formContainer, schema) {
  const isEditMode = state.isEditMode;
  const editPagePath = state.editPagePath;
  const samePagePreview = isSamePagePreview();

  let destPath;
  let openAfter = !samePagePreview; // Default to true unless in same-page preview mode

  if (isEditMode && editPagePath) {
    // Edit mode: use the locked destination path
    destPath = editPagePath;
    console.log('DaaS: Update mode - destination locked to:', destPath);
  } else {
    // Create mode: show destination modal
    const result = await showDestinationModal(formContainer, schema, { hideSamePagePreviewOption: samePagePreview });
    if (!result) {
      // User cancelled
      return;
    }
    destPath = result.destPath;
    openAfter = samePagePreview ? false : result.openAfter;
  }

  // Show progress modal
  const progressModal = showProgressModalElement();
  const progressText = progressModal.querySelector('.daas-progress-text');
  const actionVerb = isEditMode ? 'Updating' : 'Creating';

  try {
    // Get form data
    const formData = getFormData(formContainer);

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
    // In same-page preview mode, hide the "view page" link
    if (isEditMode) {
      await showUpdateSuccessModalElement(destPath, pageUrl, samePagePreview);
    } else {
      await showSuccessModalElement(destPath, pageUrl, samePagePreview);
    }

    console.log(`DaaS: Page ${isEditMode ? 'updated' : 'created'} successfully at`, destPath);
  } catch (error) {
    progressModal.remove();
    console.error(`DaaS: Page ${isEditMode ? 'update' : 'creation'} failed:`, error);
    showToast(`Failed to ${isEditMode ? 'update' : 'create'} page: ${error.message}`, true);
  }
}

