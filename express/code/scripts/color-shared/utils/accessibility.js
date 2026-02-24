import { createTag } from '../../utils.js';

/* ── Screen Reader Announcements ─────────────────────────────── */

let announcer = null;

export function announceToScreenReader(message, { assertive = false } = {}) {
  if (!announcer) {
    announcer = createTag('div', {
      role: 'status',
      'aria-live': 'polite',
      'aria-atomic': 'true',
      class: 'ax-sr-only',
    });
    document.body.appendChild(announcer);
  }
  announcer.setAttribute('aria-live', assertive ? 'assertive' : 'polite');
  announcer.textContent = '';
  setTimeout(() => {
    announcer.textContent = message || '';
  }, 100);
}

/* ── Focus Trap ──────────────────────────────────────────────── */

const FOCUSABLE = [
  'button', '[href]', 'input', 'select', 'textarea',
  '[tabindex]:not([tabindex="-1"])',
  'sp-picker', 'sp-tag', 'sp-menu-item',
].join(', ');

export function createFocusTrap(container) {
  function handleKeydown(e) {
    if (e.key !== 'Tab') return;
    const focusable = [...container.querySelectorAll(FOCUSABLE)].filter(
      (el) => !el.disabled && el.offsetParent !== null,
    );
    if (!focusable.length) return;
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

  return {
    activate: () => container.addEventListener('keydown', handleKeydown),
    deactivate: () => container.removeEventListener('keydown', handleKeydown),
  };
}

/* ── Viewport ────────────────────────────────────────────────── */

export function isMobileViewport() {
  return window.matchMedia('(max-width: 599px)').matches;
}
