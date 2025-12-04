/**
 * Template Schema Builder
 * Compact SPA for building template-schema tables with groups and repeaters
 * 
 * Notation:
 * - group.field = Field inside a group (dot notation)
 * - repeater[].field = Field inside a repeater (bracket notation)
 */

// Column definitions for the schema table (no 'multiple' - use multi-* types instead)
const COLUMNS = ['key', 'label', 'type', 'required', 'default', 'options', 'min', 'max', 'pattern'];

// Field types available (multi- prefix for multiple selection)
const FIELD_TYPES = ['', 'text', 'richtext', 'url', 'select', 'multi-select', 'number', 'boolean', 'date', 'image', 'color'];

// State
let schema = [];
let idCounter = 0;

// Generate unique ID
const genId = () => `item-${++idCounter}`;

// Create a new field item
const createField = () => ({
  id: genId(),
  itemType: 'field',
  key: '',
  label: '',
  type: '',
  required: false,
  default: '',
  options: '',
  min: '',
  max: '',
  pattern: '',
  expanded: true,
});

// Create a new group
const createGroup = () => ({
  id: genId(),
  itemType: 'group',
  key: '',
  children: [],
  expanded: true,
});

// Create a new repeater
const createRepeater = () => ({
  id: genId(),
  itemType: 'repeater',
  key: '',
  children: [],
  expanded: true,
});

// DOM elements
let schemaTree;
let copyBtn;
let toast;

/**
 * Initialize the application
 */
function init() {
  schemaTree = document.getElementById('schemaTree');
  copyBtn = document.getElementById('copyBtn');
  toast = document.getElementById('toast');

  bindEvents();
  render();
}

/**
 * Bind event handlers
 */
function bindEvents() {
  // Add buttons in footer
  document.querySelectorAll('.add-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action === 'field') {
        schema.push(createField());
      } else if (action === 'group') {
        schema.push(createGroup());
      } else if (action === 'repeater') {
        schema.push(createRepeater());
      }
      render();
    });
  });

  // Copy button
  copyBtn.addEventListener('click', copyTable);

  // Delegated events for schema items
  schemaTree.addEventListener('click', handleSchemaClick);
  schemaTree.addEventListener('input', handleSchemaInput);
  schemaTree.addEventListener('change', handleSchemaChange);
}

/**
 * Handle clicks within schema tree
 */
function handleSchemaClick(e) {
  const target = e.target;
  
  // Toggle expand/collapse on header click
  if (target.closest('.item-header') && !target.closest('.delete-btn') && !target.closest('.copy-placeholder-btn')) {
    const item = target.closest('.schema-item');
    const id = item?.dataset.id;
    if (id) {
      toggleExpand(id);
    }
    return;
  }

  // Delete button
  if (target.closest('.delete-btn')) {
    e.stopPropagation();
    const item = target.closest('.schema-item');
    const id = item?.dataset.id;
    if (id) {
      deleteItem(id);
    }
    return;
  }

  // Copy placeholder button
  if (target.closest('.copy-placeholder-btn')) {
    e.stopPropagation();
    const item = target.closest('.schema-item');
    const id = item?.dataset.id;
    if (id) {
      copyPlaceholder(id);
    }
    return;
  }

  // Add child button (for groups/repeaters)
  if (target.closest('.add-child-btn')) {
    const item = target.closest('.schema-item');
    const id = item?.dataset.id;
    if (id) {
      addChildField(id);
    }
    return;
  }
}

/**
 * Handle input changes
 */
function handleSchemaInput(e) {
  const target = e.target;
  if (!target.matches('input')) return;
  
  const item = target.closest('.schema-item');
  const id = item?.dataset.id;
  const field = target.name;
  
  if (id && field) {
    updateItemField(id, field, target.value);
  }
}

/**
 * Handle select and checkbox changes
 */
function handleSchemaChange(e) {
  const target = e.target;
  
  const item = target.closest('.schema-item');
  const id = item?.dataset.id;
  const field = target.name;
  
  if (!id || !field) return;
  
  if (target.matches('select')) {
    updateItemField(id, field, target.value);
  } else if (target.matches('input[type="checkbox"]')) {
    updateItemField(id, field, target.checked);
  }
}

/**
 * Get the full key path for an item, considering parent groups/repeaters
 * @param {string} id - Item ID
 * @param {Array} items - Schema items to search
 * @param {string} prefix - Current prefix from parent
 * @returns {Object|null} - { item, fullKey, isInRepeater, repeaterName }
 */
function getItemWithPath(id, items = schema, prefix = '', isInRepeater = false, repeaterName = '') {
  for (const item of items) {
    if (item.id === id) {
      let fullKey = prefix ? `${prefix}.${item.key}` : item.key;
      return { item, fullKey, isInRepeater, repeaterName };
    }
    if (item.children) {
      let newPrefix;
      let newIsInRepeater = isInRepeater;
      let newRepeaterName = repeaterName;

      if (item.itemType === 'group' && item.key) {
        newPrefix = prefix ? `${prefix}.${item.key}` : item.key;
      } else if (item.itemType === 'repeater' && item.key) {
        newPrefix = prefix ? `${prefix}.${item.key}[]` : `${item.key}[]`;
        newIsInRepeater = true;
        newRepeaterName = item.key;
      } else {
        newPrefix = prefix;
      }

      const found = getItemWithPath(id, item.children, newPrefix, newIsInRepeater, newRepeaterName);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Generate placeholder text for an item
 * @param {Object} item - The schema item
 * @param {string} fullKey - The full key path
 * @param {boolean} isInRepeater - Whether item is inside a repeater
 * @returns {string} - The placeholder text to copy
 */
function generatePlaceholder(item, fullKey, isInRepeater) {
  if (!fullKey) return null;

  // Repeaters provide wrapper placeholders
  if (item.itemType === 'repeater') {
    return `[[@repeat(${item.key})]]\n[[@repeatend(${item.key})]]`;
  }

  // Groups don't provide placeholders (children imply grouping via dot notation)
  if (item.itemType === 'group') {
    return null;
  }

  // Boolean fields have conditional syntax
  if (item.type === 'boolean') {
    return `[[${fullKey}?option1|option2]]`;
  }

  // Regular fields
  return `[[${fullKey}]]`;
}

/**
 * Copy placeholder to clipboard
 */
async function copyPlaceholder(id) {
  const result = getItemWithPath(id);
  if (!result) {
    showToast('Item not found', true);
    return;
  }

  const { item, fullKey, isInRepeater } = result;
  const placeholder = generatePlaceholder(item, fullKey, isInRepeater);

  if (!placeholder) {
    showToast('No placeholder for this item', true);
    return;
  }

  try {
    await navigator.clipboard.writeText(placeholder);
    showToast('Copied!');
  } catch (err) {
    console.error('Copy failed:', err);
    showToast('Copy failed', true);
  }
}

/**
 * Find item by ID in schema (recursive)
 */
function findItem(id, items = schema) {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children) {
      const found = findItem(id, item.children);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Find parent of item by ID
 */
function findParent(id, items = schema, parent = null) {
  for (const item of items) {
    if (item.id === id) return { parent, list: items };
    if (item.children) {
      const found = findParent(id, item.children, item);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Toggle item expand/collapse
 */
function toggleExpand(id) {
  const item = findItem(id);
  if (item) {
    item.expanded = !item.expanded;
    render();
  }
}

/**
 * Update a field value on an item
 */
function updateItemField(id, field, value) {
  const item = findItem(id);
  if (item) {
    item[field] = value;
    // Update display name in header without full re-render
    const itemEl = document.querySelector(`.schema-item[data-id="${id}"]`);
    if (itemEl && field === 'key') {
      const nameEl = itemEl.querySelector(':scope > .item-header .item-name');
      if (nameEl) {
        nameEl.textContent = value || getDefaultName(item.itemType);
      }

      // Show/hide copy button based on key presence (for fields and repeaters, not groups)
      const isGroup = item.itemType === 'group';
      const headerEl = itemEl.querySelector(':scope > .item-header');
      let copyBtn = headerEl?.querySelector('.copy-placeholder-btn');

      if (!isGroup && value && !copyBtn) {
        // Add copy button if it doesn't exist
        const deleteBtn = headerEl?.querySelector('.delete-btn');
        if (deleteBtn) {
          const btn = document.createElement('button');
          btn.className = 'copy-placeholder-btn';
          btn.title = 'Copy placeholder';
          btn.innerHTML = getCopyIcon();
          deleteBtn.before(btn);
        }
      } else if ((!value || isGroup) && copyBtn) {
        // Remove copy button if key is empty or it's a group
        copyBtn.remove();
      }
    }
  }
}

/**
 * Delete an item
 */
function deleteItem(id) {
  const result = findParent(id);
  if (result) {
    const { list } = result;
    const index = list.findIndex((item) => item.id === id);
    if (index !== -1) {
      list.splice(index, 1);
      render();
    }
  }
}

/**
 * Add child field to a group or repeater
 */
function addChildField(id) {
  const item = findItem(id);
  if (item && item.children) {
    item.children.push(createField());
    item.expanded = true;
    render();
  }
}

/**
 * Get default display name for item type
 */
function getDefaultName(itemType) {
  switch (itemType) {
    case 'group': return 'New Group';
    case 'repeater': return 'New Repeater';
    default: return 'New Field';
  }
}

/**
 * Get chevron SVG
 */
function getChevron() {
  return `<svg class="chevron" viewBox="0 0 12 12"><path fill="currentColor" d="M4 2l4 4-4 4"/></svg>`;
}

/**
 * Get icon SVG for item type
 */
function getItemIcon(itemType) {
  switch (itemType) {
    case 'group':
      return `<svg class="item-icon" viewBox="0 0 12 12"><rect x="1" y="2" width="10" height="8" rx="1" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>`;
    case 'repeater':
      return `<svg class="item-icon" viewBox="0 0 12 12"><path fill="currentColor" d="M1 2h10v1.5H1zM1 5.25h10v1.5H1zM1 8.5h10V10H1z"/></svg>`;
    default:
      return `<svg class="item-icon" viewBox="0 0 12 12"><rect x="2" y="2" width="8" height="8" rx="1" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>`;
  }
}

/**
 * Render the schema tree
 */
function render() {
  if (schema.length === 0) {
    schemaTree.innerHTML = `
      <div class="empty-state">
        <svg width="20" height="20" viewBox="0 0 20 20"><rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M10 7v6M7 10h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        <p>No fields yet.<br>Add fields, groups, or repeaters below.</p>
      </div>
    `;
    return;
  }

  schemaTree.innerHTML = schema.map((item) => renderItem(item)).join('');
}

/**
 * Get copy icon SVG
 */
function getCopyIcon() {
  return `<svg width="10" height="10" viewBox="0 0 12 12"><rect x="4" y="4" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M8 4V3a1 1 0 00-1-1H3a1 1 0 00-1 1v4a1 1 0 001 1h1" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>`;
}

/**
 * Render a single schema item
 */
function renderItem(item) {
  const isContainer = item.itemType === 'group' || item.itemType === 'repeater';
  const isRepeater = item.itemType === 'repeater';
  const isGroup = item.itemType === 'group';
  const expandedClass = item.expanded ? 'is-expanded' : '';
  const typeClass = isContainer ? `is-${item.itemType}` : '';
  const displayName = item.key || getDefaultName(item.itemType);

  // Show copy button for fields and repeaters (groups don't have placeholders)
  const showCopyBtn = !isGroup && item.key;

  let html = `
    <div class="schema-item ${typeClass} ${expandedClass}" data-id="${item.id}">
      <div class="item-header">
        ${getChevron()}
        ${getItemIcon(item.itemType)}
        <span class="item-name">${escapeHtml(displayName)}</span>
        ${!isContainer && item.type ? `<span class="item-type">${item.type}</span>` : ''}
        ${isContainer ? `<span class="item-badge ${item.itemType}">${isRepeater ? '[]' : '{}'}</span>` : ''}
        ${showCopyBtn ? `<button class="copy-placeholder-btn" title="Copy placeholder">${getCopyIcon()}</button>` : ''}
        <button class="delete-btn" title="Delete">
          <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 2l6 6M8 2L2 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
      </div>
      <div class="item-body">
        ${renderItemForm(item)}
      </div>
  `;

  if (isContainer) {
    html += `
      <div class="item-children">
        ${item.children.map((child) => renderItem(child)).join('')}
        <button class="add-child-btn">+ Add Field</button>
      </div>
    `;
  }

  html += '</div>';
  return html;
}

/**
 * Render form fields for an item
 */
function renderItemForm(item) {
  if (item.itemType === 'group' || item.itemType === 'repeater') {
    return `
      <div class="form-row">
        <div class="form-group">
          <label>Name</label>
          <input type="text" name="key" value="${escapeHtml(item.key)}" placeholder="e.g. hero, faq">
        </div>
      </div>
    `;
  }

  return `
    <div class="form-row">
      <div class="form-group">
        <label>Key</label>
        <input type="text" name="key" value="${escapeHtml(item.key)}" placeholder="title">
      </div>
      <div class="form-group">
        <label>Label</label>
        <input type="text" name="label" value="${escapeHtml(item.label)}" placeholder="Title">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Type</label>
        <select name="type">
          ${FIELD_TYPES.map((t) => `<option value="${t}" ${item.type === t ? 'selected' : ''}>${t || '—'}</option>`).join('')}
        </select>
      </div>
      <div class="form-group toggle-group">
        <label class="toggle-label">
          <input type="checkbox" name="required" ${item.required ? 'checked' : ''}>
          <span class="toggle-switch"></span>
          <span>Required</span>
        </label>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group sm">
        <label>Min</label>
        <input type="number" name="min" value="${escapeHtml(item.min)}" placeholder="0">
      </div>
      <div class="form-group sm">
        <label>Max</label>
        <input type="number" name="max" value="${escapeHtml(item.max)}" placeholder="—">
      </div>
      <div class="form-group">
        <label>Default</label>
        <input type="text" name="default" value="${escapeHtml(item.default)}" placeholder="—">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Options</label>
        <input type="text" name="options" value="${escapeHtml(item.options)}" placeholder="URL or a,b,c">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Pattern</label>
        <input type="text" name="pattern" value="${escapeHtml(item.pattern)}" placeholder="regex">
      </div>
    </div>
  `;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Flatten schema to rows for table generation
 * Handles prefix notation for groups (.) and repeaters ([])
 */
function flattenSchema(items = schema, prefix = '') {
  const rows = [];
  
  for (const item of items) {
    if (item.itemType === 'group' && item.key) {
      // Group: use dot notation for children
      const groupPrefix = prefix ? `${prefix}.${item.key}` : item.key;
      rows.push(...flattenSchema(item.children, groupPrefix));
    } else if (item.itemType === 'repeater' && item.key) {
      // Repeater: use bracket notation for children
      const repeaterPrefix = prefix ? `${prefix}.${item.key}[]` : `${item.key}[]`;
      rows.push(...flattenSchema(item.children, repeaterPrefix));
    } else if (item.itemType === 'field' && item.key) {
      // Field: add with prefix
      const fullKey = prefix ? `${prefix}.${item.key}` : item.key;
      rows.push({
        ...item,
        key: fullKey,
      });
    }
  }
  
  return rows;
}

/**
 * Generate HTML table for rich text editors (ProseMirror, Word, etc.)
 */
function generateTableHtml() {
  const rows = flattenSchema();
  
  if (rows.length === 0) {
    return null;
  }

  // Build HTML table
  let html = '<table><tbody>';
  
  // Title row
  html += `<tr><td colspan="${COLUMNS.length}">template-schema</td></tr>`;
  
  // Header row
  html += '<tr>';
  for (const col of COLUMNS) {
    html += `<td>${col}</td>`;
  }
  html += '</tr>';
  
  // Data rows
  for (const row of rows) {
    html += '<tr>';
    for (const col of COLUMNS) {
      let value = row[col] || '';
      // Convert boolean true to 'true' string for required column
      if (col === 'required' && value === true) {
        value = 'true';
      }
      html += `<td>${value}</td>`;
    }
    html += '</tr>';
  }
  
  html += '</tbody></table>';
  return html;
}

/**
 * Copy table to clipboard as HTML (for rich text editors like ProseMirror)
 */
async function copyTable() {
  const html = generateTableHtml();
  
  if (!html) {
    showToast('Add fields with keys first', true);
    return;
  }

  try {
    // Use ClipboardItem API to write HTML that rich text editors can parse
    const blob = new Blob([html], { type: 'text/html' });
    const clipboardItem = new ClipboardItem({
      'text/html': blob,
    });
    await navigator.clipboard.write([clipboardItem]);
    showToast('Copied!');
  } catch (err) {
    console.error('Copy failed:', err);
    // Fallback to plain text
    try {
      await navigator.clipboard.writeText(html);
      showToast('Copied as text');
    } catch (fallbackErr) {
      showToast('Copy failed', true);
    }
  }
}

/**
 * Show toast notification
 */
function showToast(message, isError = false) {
  toast.textContent = message;
  toast.className = 'toast show' + (isError ? ' error' : '');
  
  setTimeout(() => {
    toast.className = 'toast';
  }, 2000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
