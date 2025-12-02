/**
 * Template Schema Block
 *
 * Creates a side panel authoring form based on the parsed template schema.
 * - Live updates placeholders on the page
 * - Handles repeaters by modifying undecorated DOM
 * - Save button composes final HTML with data attributes
 */

import { state } from './state.js';
import { getStoredSchema, parseSchemaHierarchy } from './schema.js';
import { fetchPlainHtml, rerenderWithRepeaters } from './plain-html.js';
import { createPanel, createRestoreModal, showToast } from './panel.js';
import { createFormField, createFieldset } from './form-fields.js';
import { getPlaceholderValue, attachLiveUpdateListeners } from './live-update.js';
import {
  getFormData,
  getSavedFormData,
  clearSavedFormData,
  handleSaveDraft,
  handleCreatePage,
  restoreFormData,
} from './form-data.js';

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

  await rerenderWithRepeaters(formContainer, schema, {
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

  await rerenderWithRepeaters(formContainer, schema, {
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

  await rerenderWithRepeaters(formContainer, schema, {
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
 * Initialize panel event listeners
 */
function initPanelEvents(panel, formContainer, schema) {
  panel.querySelector('.daas-panel-toggle')?.addEventListener('click', () => {
    panel.classList.toggle('daas-panel-collapsed');
    document.body.classList.toggle('daas-panel-minimized');
  });

  panel.addEventListener('click', async (e) => {
    const addBtn = e.target.closest('.daas-add-item');
    if (addBtn) {
      addBtn.disabled = true;
      addBtn.textContent = 'Adding...';
      await addRepeaterItem(addBtn.dataset.repeaterName, formContainer, schema);
    }

    const removeBtn = e.target.closest('.daas-remove-item');
    if (removeBtn) {
      const item = removeBtn.closest('.daas-repeater-item');
      if (item) {
        const repeaterName = item.dataset.repeaterName;
        const itemIndex = parseInt(item.dataset.index, 10);
        if (repeaterName !== undefined) {
          await removeRepeaterItem(repeaterName, formContainer, schema, itemIndex);
        }
      }
    }

    const moveUpBtn = e.target.closest('.daas-move-up');
    if (moveUpBtn && !moveUpBtn.disabled) {
      const item = moveUpBtn.closest('.daas-repeater-item');
      if (item) {
        const repeaterName = item.dataset.repeaterName;
        const fromIndex = parseInt(item.dataset.index, 10);
        await reorderRepeaterItem(repeaterName, fromIndex, fromIndex - 1, formContainer, schema);
      }
    }

    const moveDownBtn = e.target.closest('.daas-move-down');
    if (moveDownBtn && !moveDownBtn.disabled) {
      const item = moveDownBtn.closest('.daas-repeater-item');
      if (item) {
        const repeaterName = item.dataset.repeaterName;
        const fromIndex = parseInt(item.dataset.index, 10);
        await reorderRepeaterItem(repeaterName, fromIndex, fromIndex + 1, formContainer, schema);
      }
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

  requestAnimationFrame(() => modal.classList.add('daas-modal-open'));

  modal.querySelector('#daas-modal-discard')?.addEventListener('click', () => {
    clearSavedFormData();
    modal.classList.remove('daas-modal-open');
    setTimeout(() => modal.remove(), 200);
  });

  modal.querySelector('#daas-modal-restore')?.addEventListener('click', () => {
    restoreFormData(formContainer, savedData);
    modal.classList.remove('daas-modal-open');
    setTimeout(() => modal.remove(), 200);
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
 * Main block decoration
 */
export default async function decorate(block) {
  block.style.display = 'none';

  const schema = getStoredSchema();
  if (!schema.fields || schema.fields.length === 0) {
    console.warn('DaaS: No schema fields found in storage');
    return;
  }

  // Cache the plain HTML for repeater expansion
  if (!state.cachedPlainHtml) {
    state.cachedPlainHtml = await fetchPlainHtml();
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
    setTimeout(() => {
      showRestoreModal(formContainer, savedData);
    }, 300);
  }

  console.log('DaaS: Authoring panel initialized with', schema.fields.length, 'fields');
}

// Export for use by plain-html.js rerenderWithRepeaters
export { buildForm, initPanelEvents };
