/**
 * Panel UI components - side panel, modals, and toast notifications
 */

/**
 * Create auth status indicator HTML
 * @returns {string} The auth status indicator HTML
 */
function createAuthIndicator() {
  return `
    <div class="daas-auth-indicator" title="Authentication status">
      <span class="daas-auth-dot"></span>
      <span class="daas-auth-label">Authenticated</span>
    </div>
  `;
}

/**
 * Create the side panel container
 * @param {boolean} isAuthenticated - Whether user is authenticated
 * @param {boolean} isEditMode - Whether in edit mode (editing existing page)
 * @param {string} editPagePath - The path of the page being edited (for display)
 */
export function createPanel(isAuthenticated = false, isEditMode = false, editPagePath = '') {
  const panel = document.createElement('div');
  panel.id = 'daas-authoring-panel';

  const authIndicator = isAuthenticated ? createAuthIndicator() : '';

  // Different button text and icon for edit mode
  const actionButtonText = isEditMode ? 'Update Page' : 'Create Page';
  const actionButtonTitle = isEditMode
    ? `Update page at ${editPagePath}`
    : 'Preview final page in new tab';
  const actionButtonIcon = isEditMode
    ? '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 14h12M11.5 2.5a1.4 1.4 0 012 2L5 13l-3 1 1-3 8.5-8.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    : '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14 10v3a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M8 8l6-6M10 2h4v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // Edit mode badge
  const editModeBadge = isEditMode
    ? `<div class="daas-edit-badge" title="Editing: ${editPagePath}">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 14h12M11.5 2.5a1.4 1.4 0 012 2L5 13l-3 1 1-3 8.5-8.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>Edit Mode</span>
      </div>`
    : '';

  // Dashboard URL - derive from current hostname
  const dashboardUrl = 'https://da.live/app/adobecom/da-express-milo/tools/daas-dashboard/dist/index';

  panel.innerHTML = `
    <div class="daas-panel-header">
      <div class="daas-panel-header-left">
        <h2>Content Authoring</h2>
        ${authIndicator}
        ${editModeBadge}
      </div>
      <button class="daas-panel-toggle" title="Toggle panel">
        <svg class="icon-collapse" width="20" height="20" viewBox="0 0 20 20"><path d="M8 4l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
        <svg class="icon-expand" width="20" height="20" viewBox="0 0 20 20"><path d="M12 4l-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
      </button>
    </div>
    <div class="daas-panel-content">
      <div class="daas-form-container"></div>
    </div>
    <div class="daas-panel-footer">
      <a href="${dashboardUrl}" target="_blank" class="daas-dashboard-link" title="View all pages created from templates">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/>
          <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/>
          <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/>
          <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/>
        </svg>
        <span>Daasboard</span>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" class="daas-external-icon">
          <path d="M12 9v4a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1h4M9 2h5v5M7 9l7-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </a>
      <div class="daas-footer-buttons">
        <button class="daas-btn daas-btn-secondary" id="daas-save-btn" title="Save form data for later">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 2H4a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M10 2v4H6V2" stroke="currentColor" stroke-width="1.5"/><path d="M4 9h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M4 11.5h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          Save Draft
        </button>
        <button class="daas-btn daas-btn-primary" id="daas-create-btn" title="${actionButtonTitle}">
          ${actionButtonIcon}
          ${actionButtonText}
        </button>
      </div>
    </div>
  `;

  // Store edit mode info on the panel for later use
  if (isEditMode) {
    panel.dataset.editMode = 'true';
    panel.dataset.editPagePath = editPagePath;
  }

  return panel;
}

/**
 * Create restore modal for saved form data
 */
export function createRestoreModal() {
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
 * Create destination path modal for page creation
 * @param {string} basePrefix - The owner/repo prefix (e.g., "/adobecom/da-express-milo")
 * @param {string} defaultPath - The default page path (e.g., "/drafts/user/page-name")
 * @param {Object} options - Options
 * @param {boolean} options.hideOpenAfter - Hide the "open in new tab" checkbox
 */
export function createDestinationModal(basePrefix = '', defaultPath = '', options = {}) {
  const { hideOpenAfter = false } = options;

  // Create a shortened display prefix (show only repo name with tooltip for full path)
  const prefixParts = basePrefix.split('/').filter(Boolean);
  const shortPrefix = prefixParts.length >= 2 ? `/${prefixParts[1]}` : basePrefix;

  const openAfterOption = hideOpenAfter ? '' : `
        <div class="daas-modal-options">
          <label class="daas-checkbox-label">
            <input type="checkbox" id="daas-open-after" checked />
            <span>Open page in new tab after creation</span>
          </label>
        </div>`;

  const modal = document.createElement('div');
  modal.className = 'daas-modal-overlay';
  modal.innerHTML = `
    <div class="daas-modal daas-modal-wide">
      <div class="daas-modal-header">
        <h3>Create New Page</h3>
      </div>
      <div class="daas-modal-body">
        <p>Enter the page path for your new page:</p>
        <div class="daas-modal-field">
          <label for="daas-dest-path">Page Path</label>
          <div class="daas-path-input-wrapper">
            <span class="daas-path-prefix" title="${basePrefix}">${shortPrefix}</span>
            <input type="text" id="daas-dest-path" class="daas-input daas-path-input" value="${defaultPath}" placeholder="/drafts/username/page-name" />
          </div>
          <small class="daas-modal-hint">Full path: ${basePrefix}${defaultPath || '/...'}</small>
        </div>
        ${openAfterOption}
      </div>
      <div class="daas-modal-footer">
        <button class="daas-btn daas-btn-secondary" id="daas-modal-cancel">Cancel</button>
        <button class="daas-btn daas-btn-primary" id="daas-modal-create">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14 10v3a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M8 8l6-6M10 2h4v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Create Page
        </button>
      </div>
    </div>
  `;
  return modal;
}

/**
 * Create progress modal for page creation
 */
export function createProgressModal() {
  const modal = document.createElement('div');
  modal.className = 'daas-modal-overlay daas-modal-open';
  modal.innerHTML = `
    <div class="daas-modal daas-modal-progress">
      <div class="daas-progress-spinner"></div>
      <div class="daas-progress-text">Creating page...</div>
    </div>
  `;
  return modal;
}

/**
 * Create success modal after page creation
 * @param {string} destPath - The destination path of the created page
 * @param {string} pageUrl - The URL to view the created page
 */
export function createSuccessModal(destPath, pageUrl) {
  const modal = document.createElement('div');
  modal.className = 'daas-modal-overlay';
  modal.innerHTML = `
    <div class="daas-modal">
      <div class="daas-modal-header daas-modal-success-header">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#2d9d78" stroke-width="2"/>
          <path d="M8 12l2.5 2.5L16 9" stroke="#2d9d78" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <h3>Page Created Successfully!</h3>
      </div>
      <div class="daas-modal-body">
        <p>Your page has been created at:</p>
        <code class="daas-modal-path">${destPath}</code>
        ${pageUrl ? `<p><a href="${pageUrl}" target="_blank" class="daas-modal-link">View page in new tab →</a></p>` : ''}
      </div>
      <div class="daas-modal-footer">
        <button class="daas-btn daas-btn-primary" id="daas-modal-done">Done</button>
      </div>
    </div>
  `;
  return modal;
}

/**
 * Create success modal after page update
 * @param {string} destPath - The destination path of the updated page
 * @param {string} pageUrl - The URL to view the updated page
 */
export function createUpdateSuccessModal(destPath, pageUrl) {
  const modal = document.createElement('div');
  modal.className = 'daas-modal-overlay';
  modal.innerHTML = `
    <div class="daas-modal">
      <div class="daas-modal-header daas-modal-success-header">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#2d9d78" stroke-width="2"/>
          <path d="M8 12l2.5 2.5L16 9" stroke="#2d9d78" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <h3>Page Updated Successfully!</h3>
      </div>
      <div class="daas-modal-body">
        <p>Your page has been updated at:</p>
        <code class="daas-modal-path">${destPath}</code>
        ${pageUrl ? `<p><a href="${pageUrl}" target="_blank" class="daas-modal-link">View updated page in new tab →</a></p>` : ''}
      </div>
      <div class="daas-modal-footer">
        <button class="daas-btn daas-btn-primary" id="daas-modal-done">Done</button>
      </div>
    </div>
  `;
  return modal;
}

/**
 * Show toast notification
 */
export function showToast(message, isError = false) {
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

