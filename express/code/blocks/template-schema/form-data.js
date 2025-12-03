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
import { postDoc, previewDoc } from './da-sdk.js';

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
 * - Replaces all placeholders with form data values
 * - Removes unfilled placeholders
 * - Removes repeat delimiters
 * - Adds template metadata to body
 */
export async function composeFinalHtml(formData, schema) {
  const plainHtml = await fetchPlainHtml();
  if (!plainHtml) {
    console.error('Could not fetch plain HTML');
    return null;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(plainHtml, 'text/html');

  // Get current template path for metadata
  const templatePath = getDAPath();

  // Step 1: Replace placeholders with form data values
  Object.entries(formData).forEach(([key, value]) => {
    const baseKey = key.replace(/\[\d+\]/, '[]');
    const field = schema.fields?.find((f) => f.key === baseKey);

    // Skip image data objects (handled separately)
    if (typeof value === 'object' && value.dataUrl) return;

    const placeholderText = `[[${key}]]`;
    const encodedPlaceholder = encodeURIComponent(placeholderText);
    // Also handle base key placeholder for repeaters
    const basePlaceholderText = `[[${baseKey}]]`;
    const encodedBasePlaceholder = encodeURIComponent(basePlaceholderText);

    // Replace in text content
    const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent.includes(placeholderText) || node.textContent.includes(basePlaceholderText)) {
        const parent = node.parentElement;
        node.textContent = node.textContent
          .replace(placeholderText, value || '')
          .replace(basePlaceholderText, value || '');

        if (parent && field && value) {
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
      if (href.includes(placeholderText) || href.includes(encodedPlaceholder)
          || href.includes(basePlaceholderText) || href.includes(encodedBasePlaceholder)) {
        const newHref = href
          .replace(placeholderText, value || '')
          .replace(encodedPlaceholder, value ? encodeURIComponent(value) : '')
          .replace(basePlaceholderText, value || '')
          .replace(encodedBasePlaceholder, value ? encodeURIComponent(value) : '');
        el.setAttribute('href', newHref);
      }
    });

    // Replace in alt attributes
    doc.querySelectorAll('[alt]').forEach((el) => {
      if (el.alt.includes(placeholderText) || el.alt.includes(basePlaceholderText)) {
        el.alt = el.alt
          .replace(placeholderText, value || '')
          .replace(basePlaceholderText, value || '');
      }
    });

    // Replace in src attributes (for images)
    doc.querySelectorAll('[src]').forEach((el) => {
      if (el.src.includes(placeholderText) || el.src.includes(basePlaceholderText)) {
        el.src = el.src
          .replace(placeholderText, value || '')
          .replace(basePlaceholderText, value || '');
      }
    });
  });

  // Step 2: Remove repeat delimiter rows ([[@repeat(name)]] and [[@repeatend(name)]])
  const REPEAT_REGEX = /\[\[@repeat(?:end)?\([^)]+\)\]\]/;
  doc.querySelectorAll('div').forEach((div) => {
    const text = div.textContent.trim();
    if (REPEAT_REGEX.test(text) && text.match(REPEAT_REGEX)?.[0] === text) {
      // The entire content is just a repeat delimiter, remove the row
      div.remove();
    }
  });

  // Step 3: Clean up any remaining [[placeholder]] text (unfilled fields)
  const PLACEHOLDER_REGEX = /\[\[[^\]]+\]\]/g;

  // Clean text nodes
  const textWalker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null, false);
  let textNode;
  while ((textNode = textWalker.nextNode())) {
    if (PLACEHOLDER_REGEX.test(textNode.textContent)) {
      textNode.textContent = textNode.textContent.replace(PLACEHOLDER_REGEX, '');
    }
  }

  // Clean href attributes
  doc.querySelectorAll('a[href]').forEach((el) => {
    const href = el.getAttribute('href');
    // Check for both raw and URL-encoded placeholders
    if (href.includes('[[') || href.includes('%5B%5B')) {
      let newHref = href.replace(PLACEHOLDER_REGEX, '');
      // Also clean URL-encoded placeholders
      newHref = newHref.replace(/%5B%5B[^%]*%5D%5D/gi, '');
      el.setAttribute('href', newHref);
    }
  });

  // Clean alt attributes
  doc.querySelectorAll('[alt]').forEach((el) => {
    if (PLACEHOLDER_REGEX.test(el.alt)) {
      el.alt = el.alt.replace(PLACEHOLDER_REGEX, '');
    }
  });

  // Clean src attributes
  doc.querySelectorAll('[src]').forEach((el) => {
    const src = el.getAttribute('src');
    if (src && PLACEHOLDER_REGEX.test(src)) {
      el.setAttribute('src', src.replace(PLACEHOLDER_REGEX, ''));
    }
  });

  // Step 4: Add template metadata
  // Since DA stores only body innerHTML, we add a metadata div at the start
  if (templatePath) {
    const pathParts = templatePath.split('/').filter(Boolean);
    const templateId = pathParts[pathParts.length - 1] || 'unknown';

    const metadataDiv = doc.createElement('div');
    metadataDiv.className = 'daas-metadata';
    metadataDiv.style.display = 'none';
    metadataDiv.dataset.daasTemplatePath = templatePath;
    metadataDiv.dataset.daasTemplateId = templateId;

    // Insert at the beginning of body
    doc.body.insertBefore(metadataDiv, doc.body.firstChild);
  }

  // Step 5: Remove the template-schema block from output (it's only for authoring)
  const schemaBlock = doc.querySelector('.template-schema');
  if (schemaBlock) {
    // Remove the parent wrapper div if it only contains the schema block
    const parent = schemaBlock.parentElement;
    if (parent && parent.children.length === 1 && parent.tagName === 'DIV') {
      parent.remove();
    } else {
      schemaBlock.remove();
    }
  }

  return doc.body.innerHTML;
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
 * @param {string} daPath - DA path like /owner/repo/path/to/page
 * @returns {string|null} - AEM URL or null if can't determine
 * 
 * Example: /adobecom/da-express-milo/drafts/qiyundai/page
 *   -> https://hackathon-q-1--da-express-milo--adobecom.aem.live/drafts/qiyundai/page
 */
function getAEMPageUrl(daPath) {
  const { hostname } = window.location;

  // Check if this is an AEM URL and extract domain (page|live)
  if (!hostname.includes('.aem.')) return null;
  
  const domainMatch = hostname.match(/\.aem\.(page|live)/);
  if (!domainMatch) return null;
  const domain = domainMatch[1];

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
 * Handle create page action - shows destination modal, composes HTML, saves via DA SDK, and previews
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
  const progressText = progressModal.querySelector('.daas-progress-text');

  try {
    // Step 3: Get form data and compose final HTML
    const formData = getFormData(formContainer);
    console.log('DaaS: Creating page with form data:', formData);

    const finalHtml = await composeFinalHtml(formData, schema);
    if (!finalHtml) {
      throw new Error('Failed to compose final HTML');
    }

    // Step 4: Post to DA API
    if (progressText) progressText.textContent = 'Saving document...';
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
        showToast(`Failed to create page: ${postResult.error}`, true);
      }
      return;
    }

    // Step 5: Preview the page via AEM Admin API
    if (progressText) progressText.textContent = 'Generating preview...';
    const previewResult = await previewDoc(destPath);

    // Remove progress modal
    progressModal.remove();

    if (!previewResult.success) {
      // Preview failed but document was saved - still show success but warn about preview
      console.warn('DaaS: Preview failed but document saved:', previewResult.error);
      showToast('Page saved! Preview generation had an issue, but you can still view the page.', false);
    }

    // Step 6: Success! Generate page URL and optionally open
    const pageUrl = getAEMPageUrl(destPath);

    if (openAfter && pageUrl) {
      window.open(pageUrl, '_blank');
    }

    // Show success modal
    await showSuccessModalElement(destPath, pageUrl);

    console.log('DaaS: Page created and previewed successfully at', destPath);
  } catch (error) {
    progressModal.remove();
    console.error('DaaS: Page creation failed:', error);
    showToast(`Failed to create page: ${error.message}`, true);
  }
}

