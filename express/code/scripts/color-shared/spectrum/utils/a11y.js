/**
 * Accessibility Utilities for Express Spectrum Components
 *
 * Provides focus trapping, keyboard handlers, ARIA helpers, and
 * live-region management for screen-reader announcements.
 */

// ── Focus Trapping ──────────────────────────────────────────────────

const FOCUSABLE = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'sp-button:not([disabled])',
  'sp-picker:not([disabled])',
  'sp-menu-item:not([disabled])',
  'sp-action-button:not([disabled])',
].join(', ');

/**
 * Trap keyboard focus inside the given root element.
 *
 * @param {HTMLElement} root — container that should trap focus
 * @returns {{ release: () => void }} — call release() to remove the trap
 */
export function trapFocus(root) {
  const controller = new AbortController();

  function handler(e) {
    if (e.key !== 'Tab') return;

    const focusable = [...root.querySelectorAll(FOCUSABLE)].filter(
      (el) => el.offsetParent !== null,
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  root.addEventListener('keydown', handler, { signal: controller.signal });

  // Move focus into the root if nothing inside is focused
  requestAnimationFrame(() => {
    if (!root.contains(document.activeElement)) {
      const first = root.querySelector(FOCUSABLE);
      if (first) first.focus();
    }
  });

  return {
    release() {
      controller.abort();
    },
  };
}

// ── Escape Key Handler ──────────────────────────────────────────────

/**
 * Close an element when Escape is pressed.
 *
 * @param {HTMLElement} el       — the element to listen on
 * @param {Function}    callback — invoked on Escape press
 * @returns {{ release: () => void }}
 */
export function handleEscapeClose(el, callback) {
  const controller = new AbortController();

  el.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        callback(e);
      }
    },
    { signal: controller.signal },
  );

  return {
    release() {
      controller.abort();
    },
  };
}

// ── Background Scroll Lock ──────────────────────────────────────────

let scrollLockCount = 0;
let savedOverflow = '';

/**
 * Prevent background scrolling (for dialogs / modals).
 */
export function disableBackgroundScroll() {
  if (scrollLockCount === 0) {
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  scrollLockCount++;
}

/**
 * Re-enable background scrolling.
 */
export function restoreBackgroundScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    document.body.style.overflow = savedOverflow;
  }
}

// ── ARIA helpers ────────────────────────────────────────────────────

/**
 * Link a tooltip to its target via aria-describedby.
 *
 * @param {HTMLElement} target  — the element being described
 * @param {HTMLElement} tooltip — the tooltip element
 * @returns {{ release: () => void }}
 */
export function ariaDescribedBy(target, tooltip) {
  if (!tooltip.id) {
    tooltip.id = `express-tooltip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }
  const prev = target.getAttribute('aria-describedby') || '';
  target.setAttribute('aria-describedby', `${prev} ${tooltip.id}`.trim());

  return {
    release() {
      const current = target.getAttribute('aria-describedby') || '';
      const updated = current
        .split(/\s+/)
        .filter((id) => id !== tooltip.id)
        .join(' ')
        .trim();
      if (updated) target.setAttribute('aria-describedby', updated);
      else target.removeAttribute('aria-describedby');
    },
  };
}

// ── Live Region (screen-reader announcements) ───────────────────────

let liveRegion = null;

function ensureLiveRegion() {
  if (liveRegion && document.body.contains(liveRegion)) return liveRegion;

  liveRegion = document.createElement('div');
  liveRegion.id = 'express-spectrum-live-region';
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.setAttribute('role', 'status');
  Object.assign(liveRegion.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0,0,0,0)',
    whiteSpace: 'nowrap',
    border: '0',
  });
  document.body.appendChild(liveRegion);
  return liveRegion;
}

/**
 * Clear the live region immediately so any current announcement is stopped.
 * Call before moving focus on ESC, then announce the new focus.
 */
export function clearScreenReaderAnnouncement() {
  const region = liveRegion && document.body.contains(liveRegion) ? liveRegion : ensureLiveRegion();
  region.textContent = '';
}

/**
 * Announce a message to screen readers via a live region.
 * Per WCAG/ARIA, every focusable element must have an accessible name so the SR announces it
 * when focus moves there; we use this only to supplement (e.g. after ESC or Tab onto a card).
 * Appends an invisible suffix so repeated identical messages still trigger a re-announce.
 *
 * @param {string} message
 * @param {'polite'|'assertive'} [priority='polite']
 * @param {{ immediate?: boolean }} [options] - immediate: true = next tick (assertive interrupt); false = 100ms
 */
const ZERO_WIDTH_SPACE = '\u200B';
let announceCounter = 0;
const MAX_ANNOUNCE_UNIQUE = 50;

export function announceToScreenReader(message, priority = 'polite', options = {}) {
  const { immediate = false } = options;
  const region = ensureLiveRegion();
  region.setAttribute('aria-live', priority);
  region.textContent = '';
  const text = (message || '').trim();
  announceCounter = (announceCounter % MAX_ANNOUNCE_UNIQUE) + 1;
  const suffix = ZERO_WIDTH_SPACE.repeat(announceCounter);
  const delay = immediate ? 0 : 100;
  setTimeout(() => {
    region.textContent = text ? text + suffix : '';
  }, delay);
}
