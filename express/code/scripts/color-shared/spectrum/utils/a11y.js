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
 * Get the truly focused element by traversing into shadow roots.
 * `document.activeElement` only returns the shadow host; this helper
 * walks deeper until it reaches the leaf-level focused element.
 */
function getDeepActiveElement() {
  let el = document.activeElement;
  while (el?.shadowRoot?.activeElement) {
    el = el.shadowRoot.activeElement;
  }
  return el;
}

/**
 * Check whether `child` is a descendant of `ancestor`, crossing
 * shadow DOM boundaries. Standard `contains()` only works within a
 * single DOM tree; this walks up through shadow hosts as well.
 */
function isWithin(child, ancestor) {
  let node = child;
  while (node) {
    if (node === ancestor) return true;
    if (node.parentNode) {
      node = node.parentNode;
    } else if (node.host) {
      node = node.host;
    } else {
      return false;
    }
  }
  return false;
}

/**
 * Recursively collect tabbable elements in DOM order, piercing shadow
 * DOM boundaries so that elements inside nested web components
 * (sp-textfield, color-channel-slider, etc.) are found.
 */
function collectTabbable(root) {
  const result = [];

  function walk(parent) {
    let child = parent.firstElementChild;
    while (child) {
      if (child.matches?.(FOCUSABLE) && child.offsetParent !== null) {
        result.push(child);
      }
      if (child.shadowRoot) walk(child.shadowRoot);
      walk(child);
      child = child.nextElementSibling;
    }
  }

  walk(root);
  return result;
}

/**
 * Trap keyboard focus inside the given root element.
 * Works across shadow DOM boundaries for web-component-heavy trees.
 *
 * @param {HTMLElement} root — container that should trap focus
 * @returns {{ release: () => void }} — call release() to remove the trap
 */
export function trapFocus(root) {
  const controller = new AbortController();

  function handler(e) {
    if (e.key !== 'Tab') return;

    const focusable = collectTabbable(root);
    if (focusable.length === 0) {
      e.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = getDeepActiveElement();

    if (e.shiftKey && (active === first || isWithin(active, first))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || isWithin(active, last))) {
      e.preventDefault();
      first.focus();
    }
  }

  root.addEventListener('keydown', handler, { signal: controller.signal });

  // Move focus into the root if nothing inside is focused
  requestAnimationFrame(() => {
    const active = getDeepActiveElement();
    if (!isWithin(active, root)) {
      const focusable = collectTabbable(root);
      if (focusable[0]) focusable[0].focus();
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
 * Announce a message to screen readers via a live region.
 *
 * @param {string} message
 * @param {'polite'|'assertive'} [priority='polite']
 */
export function announceToScreenReader(message, priority = 'polite') {
  const region = ensureLiveRegion();
  region.setAttribute('aria-live', priority);
  // Clear first, then set — forces AT re-read even if message is identical
  region.textContent = '';
  requestAnimationFrame(() => {
    region.textContent = message;
  });
}
