/**
 * Template Schema Block
 *
 * Creates a side panel authoring form based on the parsed template schema.
 * - Live updates placeholders on the page
 * - Handles repeaters by modifying undecorated DOM
 * - Save button composes final HTML with data attributes
 * - Requires authentication via IMS or SUSI flow
 */

import { state } from './state.js';
import { getStoredSchema, parseSchemaHierarchy } from './schema.js';
import { fetchPlainHtmlForPreview, rerenderPageWithFormData } from './plain-html.js';
import { createPanel, createRestoreModal, showToast } from './panel.js';
import { createFormField, createFieldset } from './form-fields.js';
import { getPlaceholderValue, attachLiveUpdateListeners, setBlockFieldChangeCallback } from './live-update.js';
import {
  getFormData,
  getSavedFormData,
  clearSavedFormData,
  handleSaveDraft,
  handleCreatePage,
  restoreFormData,
  updateCreateButtonState,
} from './form-data.js';
import { checkAuth, createAuthUI } from './auth.js';

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
 * Add a new repeater item - triggers page re-render with expanded repeater
 */
async function addRepeaterItem(repeaterName, formContainer, schema) {
  state.repeaterCounts[repeaterName] = (state.repeaterCounts[repeaterName] || 1) + 1;

  await rerenderPageWithFormData(formContainer, schema, {
    getFormData,
    createPanel,
    buildForm,
    initPanelEvents,
    restoreFormData,
    showToast,
  });
}

/**
 * Remove a repeater item - triggers page re-render with reduced repeater
 */
async function removeRepeaterItem(repeaterName, formContainer, schema, itemIndex) {
  const currentCount = state.repeaterCounts[repeaterName] || 1;

  if (currentCount <= 1) {
    showToast('At least one item is required.', true);
    return;
  }

  // Get current form data and remove the item at the specified index
  const formData = getFormData(formContainer);
  const newFormData = reindexFormDataAfterRemove(formData, repeaterName, itemIndex, currentCount);

  // Update count
  state.repeaterCounts[repeaterName] = currentCount - 1;

  await rerenderPageWithFormData(formContainer, schema, {
    getFormData: () => newFormData, // Use the reindexed data
    createPanel,
    buildForm,
    initPanelEvents,
    restoreFormData,
    showToast,
  });
}

/**
 * Reindex form data after removing an item
 */
function reindexFormDataAfterRemove(formData, repeaterName, removedIndex, totalCount) {
  const newData = {};

  Object.entries(formData).forEach(([key, value]) => {
    const match = key.match(new RegExp(`^${repeaterName}\\[(\\d+)\\]\\.(.+)$`));
    if (match) {
      const idx = parseInt(match[1], 10);
      const fieldName = match[2];

      if (idx < removedIndex) {
        // Keep items before the removed one as-is
        newData[key] = value;
      } else if (idx > removedIndex) {
        // Shift items after the removed one down by 1
        newData[`${repeaterName}[${idx - 1}].${fieldName}`] = value;
      }
      // Skip the removed index
    } else {
      // Non-repeater field, keep as-is
      newData[key] = value;
    }
  });

  return newData;
}

/**
 * Reorder repeater items - swaps two adjacent items and triggers re-render
 */
async function reorderRepeaterItem(repeaterName, fromIndex, toIndex, formContainer, schema) {
  const currentCount = state.repeaterCounts[repeaterName] || 1;

  // Validate indices
  if (toIndex < 0 || toIndex >= currentCount) return;

  // Get current form data and swap the items
  const formData = getFormData(formContainer);
  const swappedFormData = swapRepeaterItems(formData, repeaterName, fromIndex, toIndex);

  await rerenderPageWithFormData(formContainer, schema, {
    getFormData: () => swappedFormData, // Use the swapped data
    createPanel,
    buildForm,
    initPanelEvents,
    restoreFormData,
    showToast,
  });
}

/**
 * Swap two repeater items in form data
 */
function swapRepeaterItems(formData, repeaterName, indexA, indexB) {
  const newData = { ...formData };

  // Find all fields for both indices
  const fieldsA = {};
  const fieldsB = {};

  Object.entries(formData).forEach(([key, value]) => {
    const matchA = key.match(new RegExp(`^${repeaterName}\\[${indexA}\\]\\.(.+)$`));
    const matchB = key.match(new RegExp(`^${repeaterName}\\[${indexB}\\]\\.(.+)$`));

    if (matchA) {
      fieldsA[matchA[1]] = value;
    }
    if (matchB) {
      fieldsB[matchB[1]] = value;
    }
  });

  // Swap: A's values go to B's keys, B's values go to A's keys
  Object.keys(fieldsA).forEach((fieldName) => {
    newData[`${repeaterName}[${indexB}].${fieldName}`] = fieldsA[fieldName];
  });
  Object.keys(fieldsB).forEach((fieldName) => {
    newData[`${repeaterName}[${indexA}].${fieldName}`] = fieldsB[fieldName];
  });

  return newData;
}

/**
 * Handle block field change - triggers page re-render with current form data
 * This is called when a field inside a block changes (not free text)
 */
async function handleBlockFieldChange(formContainer, schema) {
  // Re-render uses the same mechanism as repeater changes
  await rerenderPageWithFormData(formContainer, schema, {
    getFormData,
    createPanel,
    buildForm,
    initPanelEvents,
    restoreFormData,
    showToast,
  });
}

/**
 * Initialize panel event listeners
 * @param {boolean} isRerender - If true, skip panel-level listeners (they're already attached)
 */
function initPanelEvents(panel, formContainer, schema, isRerender = false) {
  // Set up the block field change callback for live-update.js
  // This needs to be updated each time to reference the current formContainer
  setBlockFieldChangeCallback(() => handleBlockFieldChange(formContainer, schema));

  // Only attach panel-level listeners on first init (not during re-render)
  if (!isRerender) {
    panel.querySelector('.daas-panel-toggle')?.addEventListener('click', () => {
      panel.classList.toggle('daas-panel-collapsed');
      document.body.classList.toggle('daas-panel-minimized');
    });

    // Use event delegation on panel for repeater buttons
    // Store references in dataset so we can update them
    panel.dataset.eventsAttached = 'true';

    panel.addEventListener('click', async (e) => {
      // Get current formContainer and schema from panel's stored references
      const currentFormContainer = panel.querySelector('.daas-form-container');
      const currentSchema = JSON.parse(currentFormContainer?.dataset?.schemaFields || '[]');
      const schemaObj = { fields: currentSchema };

      const addBtn = e.target.closest('.daas-add-item');
      if (addBtn) {
        addBtn.disabled = true;
        addBtn.textContent = 'Adding...';
        await addRepeaterItem(addBtn.dataset.repeaterName, currentFormContainer, schemaObj);
      }

      const removeBtn = e.target.closest('.daas-remove-item');
      if (removeBtn) {
        const item = removeBtn.closest('.daas-repeater-item');
        if (item) {
          const repeaterName = item.dataset.repeaterName;
          const itemIndex = parseInt(item.dataset.index, 10);
          if (repeaterName !== undefined) {
            await removeRepeaterItem(repeaterName, currentFormContainer, schemaObj, itemIndex);
          }
        }
      }

      const moveUpBtn = e.target.closest('.daas-move-up');
      if (moveUpBtn && !moveUpBtn.disabled) {
        const item = moveUpBtn.closest('.daas-repeater-item');
        if (item) {
          const repeaterName = item.dataset.repeaterName;
          const fromIndex = parseInt(item.dataset.index, 10);
          await reorderRepeaterItem(repeaterName, fromIndex, fromIndex - 1, currentFormContainer, schemaObj);
        }
      }

      const moveDownBtn = e.target.closest('.daas-move-down');
      if (moveDownBtn && !moveDownBtn.disabled) {
        const item = moveDownBtn.closest('.daas-repeater-item');
        if (item) {
          const repeaterName = item.dataset.repeaterName;
          const fromIndex = parseInt(item.dataset.index, 10);
          await reorderRepeaterItem(repeaterName, fromIndex, fromIndex + 1, currentFormContainer, schemaObj);
        }
      }
    });

    // Save Draft button
    panel.querySelector('#daas-save-btn')?.addEventListener('click', () => {
      const currentFormContainer = panel.querySelector('.daas-form-container');
      handleSaveDraft(currentFormContainer);
    });

    // Create Page button
    panel.querySelector('#daas-create-btn')?.addEventListener('click', () => {
      const createBtn = panel.querySelector('#daas-create-btn');
      if (createBtn?.disabled) {
        showToast('Please fill all required fields first.', true);
        return;
      }
      const currentFormContainer = panel.querySelector('.daas-form-container');
      const currentSchema = JSON.parse(currentFormContainer?.dataset?.schemaFields || '[]');
      handleCreatePage(currentFormContainer, { fields: currentSchema });
    });
  }

  // These need to be attached to the new form fields each time
  const validateOnChange = () => updateCreateButtonState(panel, formContainer, schema);

  formContainer.addEventListener('input', validateOnChange);
  formContainer.addEventListener('change', validateOnChange);

  // Also listen for Quill changes (they don't bubble as native events)
  const observeQuillChanges = () => {
    formContainer.querySelectorAll('.daas-rte-container').forEach((rte) => {
      if (rte.quillInstance && !rte.dataset.validationAttached) {
        rte.quillInstance.on('text-change', validateOnChange);
        rte.dataset.validationAttached = 'true';
      }
    });
  };
  observeQuillChanges();
  // Re-check after a delay for late-loading Quill instances
  setTimeout(observeQuillChanges, 500);

  // Run initial validation
  updateCreateButtonState(panel, formContainer, schema);

  attachLiveUpdateListeners(formContainer, formContainer);
}

/**
 * Show restore modal and handle user choice
 * 
 * When restoring saved data, we need to trigger a full page re-render because:
 * - Blocks like hero-color have already consumed placeholder elements during initial decoration
 * - Simply calling updatePlaceholder can't restore those consumed elements
 * - A full re-render applies form data BEFORE block decoration
 */
function showRestoreModal(formContainer, savedData, schema) {
  const modal = createRestoreModal();
  document.body.appendChild(modal);

  requestAnimationFrame(() => modal.classList.add('daas-modal-open'));

  modal.querySelector('#daas-modal-discard')?.addEventListener('click', () => {
    clearSavedFormData();
    modal.classList.remove('daas-modal-open');
    setTimeout(() => modal.remove(), 200);
  });

  modal.querySelector('#daas-modal-restore')?.addEventListener('click', async () => {
    modal.classList.remove('daas-modal-open');
    setTimeout(() => modal.remove(), 200);

    // Trigger a full page re-render with the saved data
    // This ensures blocks see real values instead of placeholder text
    await rerenderPageWithFormData(formContainer, schema, {
      getFormData: () => savedData, // Use the saved data instead of current form
      createPanel,
      buildForm,
      initPanelEvents,
      restoreFormData,
      showToast,
    });
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      clearSavedFormData();
      modal.classList.remove('daas-modal-open');
      setTimeout(() => modal.remove(), 200);
    }
  });
}

/**
 * Initialize panel with auth UI (SUSI flow)
 */
async function initPanelWithAuth(panel) {
  const formContainer = panel.querySelector('.daas-form-container');
  formContainer.innerHTML = '';

  const authUI = await createAuthUI();
  formContainer.appendChild(authUI);

  // Disable footer buttons when showing auth
  const footer = panel.querySelector('.daas-panel-footer');
  if (footer) {
    footer.style.display = 'none';
  }
}

/**
 * Initialize panel with form (authenticated)
 */
function initPanelWithForm(panel, schema) {
  const formContainer = panel.querySelector('.daas-form-container');
  buildForm(schema, formContainer);

  initPanelEvents(panel, formContainer, schema);

  // Enable footer buttons
  const footer = panel.querySelector('.daas-panel-footer');
  if (footer) {
    footer.style.display = '';
  }

  // Check for saved form data and show restore modal
  const savedData = getSavedFormData();
  if (savedData && Object.keys(savedData).length > 0) {
    setTimeout(() => {
      showRestoreModal(formContainer, savedData, schema);
    }, 300);
  }

  console.log('DaaS: Authoring panel initialized with', schema.fields.length, 'fields');
}

/**
 * Main block decoration
 */
export default async function decorate(block) {
  block.style.display = 'none';

  // Skip if panel already exists (e.g., during re-render)
  // The rerenderPageWithFormData function handles panel updates during re-render
  const existingPanel = document.getElementById('daas-authoring-panel');
  if (existingPanel) {
    console.log('DaaS: Panel already exists, skipping decoration');
    return;
  }

  const schema = getStoredSchema();
  if (!schema.fields || schema.fields.length === 0) {
    console.warn('DaaS: No schema fields found in storage');
    return;
  }

  // Cache the plain HTML for repeater expansion (uses .plain.html for preview)
  if (!state.cachedPlainHtml) {
    state.cachedPlainHtml = await fetchPlainHtmlForPreview();
  }

  // Initialize repeater counts (1 item each by default)
  const { repeaters } = parseSchemaHierarchy(schema.fields);
  Object.keys(repeaters).forEach((name) => {
    if (!(name in state.repeaterCounts)) {
      state.repeaterCounts[name] = 1;
    }
  });

  // Add CSS if not already added
  if (!document.querySelector('link[href*="template-schema.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/express/code/blocks/template-schema/template-schema.css';
    document.head.appendChild(link);
  }

  // Check authentication status
  const authStatus = await checkAuth();
  const authenticated = authStatus.authenticated;

  // Create panel with auth indicator based on status
  const panel = createPanel(authenticated);
  document.body.appendChild(panel);
  document.body.classList.add('daas-panel-active');

  requestAnimationFrame(() => panel.classList.add('daas-panel-open'));

  if (authenticated) {
    // User is authenticated - show the form
    console.log('DaaS: User authenticated via', authStatus.source);
    initPanelWithForm(panel, schema);
  } else {
    // User is not authenticated - show SUSI flow
    console.log('DaaS: User not authenticated, showing SUSI flow');
    await initPanelWithAuth(panel);
  }
}

// Export for use by plain-html.js rerenderPageWithFormData
export { buildForm, initPanelEvents };
