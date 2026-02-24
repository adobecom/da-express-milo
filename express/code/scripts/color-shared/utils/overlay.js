import { createTag } from '../../utils.js';
import { createFocusTrap } from './accessibility.js';

/**
 * Creates a curtain / backdrop element.
 * @param {string} className  CSS class for the curtain
 * @param {Function} [onClose]  Click handler (typically closes the overlay)
 * @returns {HTMLElement}
 */
export function createCurtain(className, onClose) {
  const curtain = createTag('div', { class: className, 'aria-hidden': 'true' });
  if (onClose) curtain.addEventListener('click', onClose);
  return curtain;
}

/**
 * Adds an Escape-key listener that calls `onClose`.
 * @returns {Function} Cleanup function to remove the listener
 */
export function addEscapeClose(onClose) {
  const handler = (e) => { if (e.key === 'Escape') onClose(); };
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}

/**
 * Activates a focus trap on the given container.
 * @returns {{ deactivate: Function }} Trap controller
 */
export function activateFocusTrap(container) {
  const trap = createFocusTrap(container);
  trap.activate();
  return trap;
}
