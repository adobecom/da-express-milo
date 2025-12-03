/**
 * Form data operations - get, save, restore, and compose
 */

import { STORAGE_KEY } from './state.js';
import { fetchPlainHtml, getDAPath } from './plain-html.js';
import {
  showToast,
  createDestinationModal,
  createProgressModal,
  createSuccessModal,
} from './panel.js';
import { postDoc } from './da-sdk.js';

/**
 * Validate required fields and return validation result
 * @param {HTMLElement} formContainer - The form container element
 * @param {Object} schema - The schema object with fields array
 * @returns {Object} { isValid: boolean, missingFields: string[] }
 */
export function validateRequiredFields(formContainer, schema) {
  const missingFields = [];

  if (!schema?.fields) return { isValid: true, missingFields };

  // Build a set of required base keys
  const requiredKeys = new Set();
  schema.fields.forEach((field) => {
    if (field.required === 'true' || field.required === true) {
      requiredKeys.add(field.key);
    }
  });

  if (requiredKeys.size === 0) return { isValid: true, missingFields };

  // Check each required field
  requiredKeys.forEach((baseKey) => {
    const isRepeater = baseKey.includes('[]');

    if (isRepeater) {
      // For repeaters, check all indexed instances
      const repeaterPrefix = baseKey.replace('[]', '[');
      let foundAny = false;

      formContainer.querySelectorAll(`[name^="${repeaterPrefix}"]`).forEach((input) => {
        const value = getInputValue(input);
        if (value) foundAny = true;
      });

      // Also check RTE values
      formContainer.querySelectorAll(`.daas-rte-value[name^="${repeaterPrefix}"]`).forEach((input) => {
        const value = input.value?.trim();
        if (value && value !== '<p><br></p>') foundAny = true;
      });

      if (!foundAny) {
        const label = schema.fields.find((f) => f.key === baseKey)?.label || baseKey;
        missingFields.push(label);
      }
    } else {
      // For regular fields, check by exact name or base key
      const input = formContainer.querySelector(`[name="${baseKey}"]`)
        || formContainer.querySelector(`.daas-rte-value[name="${baseKey}"]`);

      const value = input ? getInputValue(input) : null;

      if (!value || (typeof value === 'string' && value === '<p><br></p>')) {
        const label = schema.fields.find((f) => f.key === baseKey)?.label || baseKey;
        missingFields.push(label);
      }
    }
  });

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Get value from an input element (handles different input types)
 */
function getInputValue(input) {
  if (!input) return null;

  if (input.classList.contains('daas-rte-value')) {
    const val = input.value?.trim();
    return val && val !== '<p><br></p>' ? val : null;
  }

  if (input.classList.contains('daas-multiselect-value')) {
    return input.value?.trim() || null;
  }

  if (input.type === 'checkbox') {
    return input.checked ? 'true' : null;
  }

  return input.value?.trim() || null;
}

/**
 * Update Create Page button state based on validation
 */
export function updateCreateButtonState(panel, formContainer, schema) {
  const createBtn = panel.querySelector('#daas-create-btn');
  if (!createBtn) return;

  const { isValid, missingFields } = validateRequiredFields(formContainer, schema);

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
 * Restore form data to the form fields
 */
export function restoreFormData(formContainer, savedData) {
  if (!savedData) return;

  Object.entries(savedData).forEach(([key, value]) => {
    if (typeof value === 'object' && value.dataUrl) return;

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
  });

  showToast('Draft restored!');
}

/**
 * Compose final HTML with data attributes for saving
 */
export async function composeFinalHtml(formData, schema) {
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

    if (typeof value === 'object' && value.dataUrl) return;

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

    // Replace in href attributes
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
 * Generate default destination path based on current URL
 * Appends '-new' to the current path or generates a timestamped name
 */
function getDefaultDestinationPath() {
  const daPath = getDAPath();
  if (daPath) {
    // Append timestamp to avoid conflicts
    const timestamp = Date.now().toString(36);
    return `${daPath}-${timestamp}`;
  }
  return '';
}

/**
 * Generate the AEM page URL from a DA path
 * @param {string} daPath - DA path like /owner/repo/path/to/page
 * @returns {string|null} - AEM URL or null if can't determine
 */
function getAEMPageUrl(daPath) {
  const { hostname } = window.location;

  // Parse AEM hostname to get ref, repo, owner
  const match = hostname.match(/^([^-]+)--([^-]+)--([^.]+)\.aem\.(page|live)/);
  if (!match) return null;

  const [, ref, , , domain] = match;

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
    const defaultPath = getDefaultDestinationPath();
    const modal = createDestinationModal(defaultPath);
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
      const destPath = pathInput.value.trim();
      if (!destPath) {
        showToast('Please enter a destination path', true);
        pathInput.focus();
        return;
      }

      // Validate path format
      if (!destPath.startsWith('/') || destPath.split('/').filter(Boolean).length < 2) {
        showToast('Path must be in format: /owner/repo/path', true);
        pathInput.focus();
        return;
      }

      closeModal({
        destPath,
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

    // Focus input
    setTimeout(() => pathInput.focus(), 100);
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
 * Handle create page action - shows destination modal, composes HTML, and saves via DA SDK
 */
export async function handleCreatePage(formContainer, schema) {
  // Step 1: Show destination modal and get user input
  const result = await showDestinationModal(formContainer, schema);
  if (!result) {
    // User cancelled
    return;
  }

  const { destPath, openAfter } = result;

  // Step 2: Show progress modal
  const progressModal = showProgressModalElement();

  try {
    // Step 3: Get form data and compose final HTML
    const formData = getFormData(formContainer);
    console.log('DaaS: Creating page with form data:', formData);

    const finalHtml = await composeFinalHtml(formData, schema);
    if (!finalHtml) {
      throw new Error('Failed to compose final HTML');
    }

    // Step 4: Post to DA API
    const postResult = await postDoc(destPath, finalHtml);

    // Remove progress modal
    progressModal.remove();

    if (!postResult.success) {
      // Handle specific error cases
      if (postResult.error === 'No auth token') {
        showToast('Authentication required. Please sign in again.', true);
      } else if (postResult.status === 401) {
        showToast('Session expired. Please sign in again.', true);
      } else if (postResult.status === 403) {
        showToast('Permission denied. Check your access rights.', true);
      } else {
        showToast(`Failed to create page: ${postResult.error}`, true);
      }
      return;
    }

    // Step 5: Success! Generate page URL and optionally open
    const pageUrl = getAEMPageUrl(destPath);

    if (openAfter && pageUrl) {
      window.open(pageUrl, '_blank');
    }

    // Show success modal
    await showSuccessModalElement(destPath, pageUrl);

    console.log('DaaS: Page created successfully at', destPath);
  } catch (error) {
    progressModal.remove();
    console.error('DaaS: Page creation failed:', error);
    showToast(`Failed to create page: ${error.message}`, true);
  }
}

