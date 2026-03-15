/**
 * Extract variant: 80px strip, sizes L/S. MWPW-187036, REST 6198-370556.
 */
import { createGradientDetailSection } from '../../components/gradients/gradient-strip-tall.js';
import { FIGMA_GRADIENT_EXTRACT } from '../../utils/gradientFallback.js';

const SIZES = ['l', 's'];

/** Parse CSS linear-gradient string to { type, angle, colorStops }. */
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
 * Parse gradient CSS string and return midpoint positions between each color stop (0–1).
 * @param {string} gradientCss - e.g. linear-gradient(90deg, #a 0%, #b 25%, #c 100%)
 * @returns {number[]}
 */
function getStopPositionsBetweenColors(gradientCss) {
  const matches = [...(gradientCss || '').matchAll(/(\d+(?:\.\d+)?)\s*%/g)];
  const positions = [...new Set(matches.map((m) => Number(m[1]) / 100))].sort((a, b) => a - b);
  const midpoints = [];
  for (let i = 0; i < positions.length - 1; i += 1) {
    midpoints.push((positions[i] + positions[i + 1]) / 2);
  }
  return midpoints;
}

/**
 * Render extract variant into container. One strip; size 'l' or 's' from Figma.
 * @param {HTMLElement} container - Target element (will be cleared).
 * @param {Object} gradient - Card format { id, name, gradient }.
 * @param {string} size - 'l' | 's'.
 * @returns {HTMLElement} The wrapper element (ax-color-gradient-extract-wrap).
 */
export function renderExtract(container, gradient, size = 'l') {
  if (!container) return null;

  const s = SIZES.includes(size) ? size : 'l';
  const wrap = document.createElement('div');
  wrap.className = `ax-color-gradient-extract-wrap ax-color-gradient-extract-wrap--${s}`;
  const data = gradientStringToData(FIGMA_GRADIENT_EXTRACT);
  const section = createGradientDetailSection(data, { size: s });
  wrap.appendChild(section);

  const bar = section.querySelector('.gradient-strip-bar');
  const barStops = bar?.querySelector('.gradient-strip-bar-stops');
  if (barStops) {
    const stopPositions = getStopPositionsBetweenColors(FIGMA_GRADIENT_EXTRACT);
    const isSmall = s === 's';
    stopPositions.forEach((pct) => {
      const diamond = document.createElement('span');
      diamond.className = 'ax-color-gradient-extract-diamond';
      diamond.setAttribute('aria-hidden', 'true');
      diamond.style.left = `${pct * 100}%`;
      if (isSmall) {
        diamond.style.position = 'absolute';
        diamond.style.top = '50%';
        diamond.style.width = '6px';
        diamond.style.height = '6px';
        diamond.style.transform = 'translate(-50%, -50%) rotate(-45deg)';
        diamond.style.backgroundColor = '#fff';
        diamond.style.pointerEvents = 'none';
      }
      barStops.appendChild(diamond);
    });
  }

  container.replaceChildren(wrap);
  return wrap;
}

export default renderExtract;
