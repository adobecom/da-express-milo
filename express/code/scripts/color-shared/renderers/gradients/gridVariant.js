/**
 * Grid variant: renders gradient card(s). Supports 1 size or many (L, M, S).
 * Used by createGradientsRenderer when type is grid-l | grid-m | grid-s (or grid for many).
 */
import { createGradientStripElements } from '../../components/gradients/gradient-strip.js';

const SIZES = ['l', 'm', 's'];

/**
 * Render grid variant into container.
 * @param {HTMLElement} container - Target element (will be cleared).
 * @param {Object} gradient - Card format { id, name, gradient }.
 * @param {string|string[]} sizeOrSizes - One size ('l'|'m'|'s') or array for many.
 * @returns {HTMLElement|HTMLElement[]} One element or array of elements.
 */
export function renderGrid(container, gradient, sizeOrSizes = 'l') {
  if (!container) return null;

  const sizes = Array.isArray(sizeOrSizes)
    ? sizeOrSizes.filter((s) => SIZES.includes(s))
    : [SIZES.includes(sizeOrSizes) ? sizeOrSizes : 'l'];

  container.innerHTML = '';

  if (sizes.length === 1) {
    const cards = createGradientStripElements([gradient]);
    container.appendChild(cards[0]);
    return cards[0];
  }

  const appended = [];
  sizes.forEach(() => {
    const cards = createGradientStripElements([gradient]);
    container.appendChild(cards[0]);
    appended.push(cards[0]);
  });
  return appended;
}

export default renderGrid;
