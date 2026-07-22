/**
 * Modal variant: renders one gradient bar (standalone + circles) at one size.
 * Used by createGradientsRenderer when type is modal-l | modal-m | modal-s.
 */
import { createGradientDetailSection } from '../../components/gradients/gradient-strip-tall.js';
import { gradientStringToData } from '../../utils/gradientFallback.js';

const SIZES = ['l', 'm', 's'];

/**
 * Render modal variant into container. Returns 1 element.
 * @param {HTMLElement} container - Target element (will be cleared).
 * @param {Object} gradient - Card format { id, name, gradient }.
 * @param {string} size - 'l' | 'm' | 's'.
 * @returns {HTMLElement} The wrapper element (ax-color-gradient-modal-size-row).
 */
export function renderModal(container, gradient, size = 'l') {
  if (!container) return null;

  const s = SIZES.includes(size) ? size : 'l';

  const wrap = document.createElement('div');
  wrap.className = `ax-color-gradient-modal-size-row ax-color-gradient-modal-size--${s}`;
  const data = gradientStringToData(gradient.gradient ?? 'linear-gradient(90deg, #ccc, #999)');
  const section = createGradientDetailSection(data, { size: s });
  wrap.appendChild(section);

  container.replaceChildren(wrap);
  return wrap;
}

export default renderModal;
