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
 */
export function createPanel(isAuthenticated = false) {
  const panel = document.createElement('div');
  panel.id = 'daas-authoring-panel';

  const authIndicator = isAuthenticated ? createAuthIndicator() : '';

  panel.innerHTML = `
    <div class="daas-panel-header">
      <div class="daas-panel-header-left">
        <h2>Content Authoring</h2>
        ${authIndicator}
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

