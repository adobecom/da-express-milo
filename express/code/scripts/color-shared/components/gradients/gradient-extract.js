/**
 * Gradient Extract — draggable color stops + midpoint diamonds
 */

import { createTag } from '../../../utils.js';

const DIAMOND_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 9 9' fill='none'%3E%3Crect y='4.24265' width='6' height='6' transform='rotate(-45 0 4.24265)' fill='white'/%3E%3C/svg%3E";

const DEFAULT_STOPS = [
  { id: 0, position: 0, color: '#bfcdd9' },
  { id: 1, position: 0.25, color: '#3f8ebf' },
  { id: 2, position: 0.5, color: '#49590b' },
  { id: 3, position: 0.75, color: '#8da634' },
  { id: 4, position: 1, color: '#818c2b' },
];

function hexToRgb(hex) {
  const m = hex.slice(1).match(/.{2}/g);
  return m ? m.map((x) => parseInt(x, 16)) : [0, 0, 0];
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('')}`;
}

function blendColors(hex1, hex2) {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  return rgbToHex((r1 + r2) / 2, (g1 + g2) / 2, (b1 + b2) / 2);
}

function gradientCSS(stops, midpoints) {
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  const parts = [];
  for (let i = 0; i < sorted.length; i += 1) {
    const stop = sorted[i];
    parts.push({ pos: stop.position, color: stop.color });
    if (i < midpoints.length) {
      parts.push({ pos: midpoints[i], color: blendColors(stop.color, sorted[i + 1].color) });
    }
  }
  parts.sort((a, b) => a.pos - b.pos);
  const stopsStr = parts.map((p) => `${p.color} ${Math.round(p.pos * 100)}%`).join(', ');
  return `linear-gradient(90deg, ${stopsStr})`;
}

function positionFromEvent(e, containerEl) {
  const rect = containerEl.getBoundingClientRect();
  const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
  return Math.max(0, Math.min(1, x / rect.width));
}

/**
 * Create gradient extract element (S 343×80, L 668×80)
 * @param {Object} options
 * @param {Array} options.stops - [{ id, position, color }]
 * @param {string} options.size - 's' | 'l'
 * @param {Function} options.onChange - (stops, midpoints) => void
 * @returns {HTMLElement}
 */
export function createGradientExtract(options = {}) {
  const { stops: initialStops = DEFAULT_STOPS, size = 'l', onChange } = options;

  const stops = initialStops.map((s) => ({ ...s }));
  const midpoints = [];
  for (let i = 0; i < stops.length - 1; i += 1) {
    midpoints.push((stops[i].position + stops[i + 1].position) / 2);
  }

  const half = 21;
  const midHalf = size === 's' ? 6 : 9;

  const container = createTag('div', {
    class: `gradient-extract gradient-extract--${size}`,
    'aria-label': 'Gradient editor',
    role: 'region',
  });

  const bar = createTag('div', { class: 'gradient-extract__bar' });
  container.appendChild(bar);

  const markersWrap = createTag('div');
  markersWrap.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
  container.appendChild(markersWrap);

  function updateBar() {
    bar.style.background = gradientCSS(stops, midpoints);
  }

  function updateMarkers() {
    const circles = markersWrap.querySelectorAll('.gradient-extract__color-stop');
    const midEls = markersWrap.querySelectorAll('.gradient-extract__midpoint');

    circles.forEach((el) => {
      const stop = stops.find((s) => String(s.id) === el.dataset.stopId);
      if (stop) {
        el.style.left = `calc(${stop.position * 100}% - ${half}px)`;
        el.style.backgroundColor = stop.color;
      }
    });

    midEls.forEach((el, i) => {
      if (midpoints[i] != null) {
        el.style.left = `calc(${midpoints[i] * 100}% - ${midHalf}px)`;
      }
    });
  }

  function renderMarkers() {
    const sorted = [...stops].sort((a, b) => a.position - b.position);
    markersWrap.innerHTML = '';

    sorted.forEach((stop) => {
      const circle = createTag('div', {
        class: 'gradient-extract__color-stop',
        'data-stop-id': String(stop.id),
      });
      circle.style.left = `calc(${stop.position * 100}% - ${half}px)`;
      circle.style.backgroundColor = stop.color;
      circle.style.pointerEvents = 'auto';
      markersWrap.appendChild(circle);
    });

    midpoints.forEach((mid, i) => {
      const midEl = createTag('div', {
        class: 'gradient-extract__midpoint',
        'data-midpoint-index': String(i),
      });
      midEl.style.left = `calc(${mid * 100}% - ${midHalf}px)`;
      midEl.style.pointerEvents = 'auto';
      const img = createTag('img', { src: DIAMOND_SVG, alt: '' });
      if (size === 's') {
        img.style.width = '12px';
        img.style.height = '12px';
      }
      midEl.appendChild(img);
      markersWrap.appendChild(midEl);
    });
  }

  function onDown(e) {
    const target = e.target.closest('.gradient-extract__color-stop, .gradient-extract__midpoint');
    if (!target) return;
    if (e.touches) e.preventDefault();

    const isCircle = target.classList.contains('gradient-extract__color-stop');
    const { stopId } = target.dataset;
    const rawMid = target.dataset.midpointIndex;
    const midIndex = rawMid != null ? parseInt(rawMid, 10) : -1;

    const move = (ev) => {
      const pct = positionFromEvent(ev, container);
      const sorted = [...stops].sort((a, b) => a.position - b.position);

      if (isCircle && stopId != null) {
        const idx = sorted.findIndex((s) => String(s.id) === stopId);
        if (idx < 0) return;
        const prev = idx > 0 ? sorted[idx - 1].position : 0;
        const next = idx < sorted.length - 1 ? sorted[idx + 1].position : 1;
        const clamped = Math.max(prev, Math.min(next, pct));
        const stop = stops.find((s) => String(s.id) === stopId);
        if (stop) stop.position = clamped;
        if (idx > 0) {
          const prevStop = sorted[idx - 1];
          midpoints[idx - 1] = (prevStop.position + clamped) / 2;
        }
        if (idx < sorted.length - 1) {
          const nextStop = sorted[idx + 1];
          midpoints[idx] = (clamped + nextStop.position) / 2;
        }
      } else if (!isCircle && midIndex >= 0 && midIndex < midpoints.length) {
        const left = sorted[midIndex].position;
        const right = sorted[midIndex + 1].position;
        midpoints[midIndex] = Math.max(left, Math.min(right, pct));
      }

      updateBar();
      updateMarkers();
      onChange?.(stops, midpoints);
    };

    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      document.removeEventListener('touchmove', move, { passive: false });
      document.removeEventListener('touchend', up);
    };

    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
    document.addEventListener('touchmove', move, { passive: false });
    document.addEventListener('touchend', up);
  }

  function setupDrag() {
    container.addEventListener('mousedown', onDown);
    container.addEventListener('touchstart', onDown, { passive: false });
  }

  updateBar();
  renderMarkers();
  setupDrag();

  container.getStops = () => [...stops];
  container.getMidpoints = () => [...midpoints];

  return container;
}

export default createGradientExtract;
