/**
 * Modal variant: renders one gradient bar (standalone + circles) at one size.
 * Used by createGradientsRenderer when type is modal-l | modal-m | modal-s.
 */
import { createGradientDetailSection } from '../../components/gradients/gradient-strip-tall.js';

const SIZES = ['l', 'm', 's'];

/** Parse CSS linear-gradient to { type, angle, colorStops } for createGradientDetailSection. */
function gradientStringToData(cssString) {
  const fallback = {
    type: 'linear',
    angle: 90,
    colorStops: [{ color: '#ccc', position: 0 }, { color: '#999', position: 1 }],
  };
  if (!cssString || typeof cssString !== 'string') return fallback;
  const re = /#(?:[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\s*(\d+)%?/g;
  const stops = [];
  let m = re.exec(cssString);
  while (m !== null) {
    const color = m[0].trim().split(/\s+/)[0];
    const pct = parseInt(m[1], 10);
    stops.push({ color, position: Number.isNaN(pct) ? 0.5 : pct / 100 });
    m = re.exec(cssString);
  }
  if (stops.length < 2) return fallback;
  const angleMatch = cssString.match(/linear-gradient\s*\(\s*(\d+)deg/);
  return {
    type: 'linear',
    angle: angleMatch ? parseInt(angleMatch[1], 10) : 90,
    colorStops: stops,
  };
}

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

  container.innerHTML = '';
  container.appendChild(wrap);
  return wrap;
}

export default renderModal;
