/**
 * Screen Reader Announcer Utility
 * 
 * Provides accessible announcements for dynamic content changes
 * using ARIA live regions.
 * 
 * Epic 2.1: Enhanced Modal/Drawer System
 * Ticket: MWPW-186961 - Screen Reader Compliance
 * 
 * Usage:
 *   import { announce } from './screenReaderAnnouncer.js';
 *   announce('Color copied to clipboard', 'polite');
 */

let liveRegion = null;

/**
 * Initialize the screen reader announcer
 * Creates a hidden ARIA live region in the DOM
 */
function initAnnouncer() {
  if (liveRegion) return liveRegion;

  // Create live region container
  liveRegion = document.createElement('div');
  liveRegion.setAttribute('role', 'status');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.className = 'sr-only';
  liveRegion.id = 'modal-sr-announcer';

  // Append to body
  document.body.appendChild(liveRegion);

  return liveRegion;
}

/**
 * Announce a message to screen readers
 * 
 * @param {string} message - The message to announce
 * @param {string} priority - 'polite' (default) or 'assertive'
 * @param {number} clearDelay - Time in ms before clearing (default 1000)
 * 
 * Examples:
 *   announce('Color #FF0000 copied to clipboard');
 *   announce('Palette saved successfully', 'assertive');
 *   announce('3 items selected', 'polite', 2000);
 */
export function announce(message, priority = 'polite', clearDelay = 1000) {
  if (!message || typeof message !== 'string') {
    console.warn('[ScreenReader] Invalid announcement message:', message);
    return;
  }

  // Initialize if not already done
  const region = liveRegion || initAnnouncer();

  // Update priority if needed
  if (priority === 'assertive' && region.getAttribute('aria-live') !== 'assertive') {
    region.setAttribute('aria-live', 'assertive');
  } else if (priority === 'polite' && region.getAttribute('aria-live') !== 'polite') {
    region.setAttribute('aria-live', 'polite');
  }

  // Clear previous message first (forces re-announcement)
  region.textContent = '';

  // Use setTimeout to ensure screen readers pick up the change
  setTimeout(() => {
    region.textContent = message;
    console.log(`[ScreenReader] Announced (${priority}): ${message}`);

    // Clear after delay to keep DOM clean
    setTimeout(() => {
      region.textContent = '';
    }, clearDelay);
  }, 100);
}

/**
 * Announce with assertive priority (interrupts current announcements)
 * Use sparingly - only for critical messages
 * 
 * @param {string} message - The urgent message to announce
 */
export function announceUrgent(message) {
  announce(message, 'assertive', 1500);
}

/**
 * Announce a success message
 * 
 * @param {string} action - The action that succeeded (e.g., "copied", "saved")
 * @param {string} item - The item affected (optional)
 */
export function announceSuccess(action, item = '') {
  const message = item 
    ? `${item} ${action} successfully` 
    : `${action} successfully`;
  announce(message, 'polite');
}

/**
 * Announce an error message
 * 
 * @param {string} error - The error message
 */
export function announceError(error) {
  announce(`Error: ${error}`, 'assertive', 2000);
}

/**
 * Announce a color copy action
 * 
 * @param {string} hex - The hex color code
 * @param {number} index - Color index (optional)
 */
export function announceColorCopy(hex, index = null) {
  const message = index !== null
    ? `Color ${index + 1}, ${hex}, copied to clipboard`
    : `Color ${hex} copied to clipboard`;
  announce(message, 'polite');
}

/**
 * Announce a like action
 * 
 * @param {boolean} isLiked - Whether the item is now liked
 * @param {string} itemName - Name of the item (optional)
 */
export function announceLike(isLiked, itemName = 'Palette') {
  const action = isLiked ? 'liked' : 'unliked';
  announce(`${itemName} ${action}`, 'polite');
}

/**
 * Announce modal open/close
 * 
 * @param {boolean} isOpen - Whether modal is opening or closing
 * @param {string} modalType - Type of modal ('palette', 'gradient')
 */
export function announceModalState(isOpen, modalType = 'palette') {
  const state = isOpen ? 'opened' : 'closed';
  announce(`${modalType} modal ${state}`, 'polite');
}

/**
 * Clean up - remove live region from DOM
 */
export function cleanup() {
  if (liveRegion && liveRegion.parentNode) {
    liveRegion.parentNode.removeChild(liveRegion);
    liveRegion = null;
    console.log('[ScreenReader] Live region cleaned up');
  }
}

// Auto-initialize on module load
initAnnouncer();

export default {
  announce,
  announceUrgent,
  announceSuccess,
  announceError,
  announceColorCopy,
  announceLike,
  announceModalState,
  cleanup,
};
