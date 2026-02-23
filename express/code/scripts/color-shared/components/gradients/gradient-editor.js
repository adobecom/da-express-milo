import { createTag } from '../../../utils.js';

const DEFAULT_STOPS = [
  { color: '#000000', position: 0 },
  { color: '#ffffff', position: 1 },
];

/* Gradient-stop — 8.485×8.485 rotated -45°, fill #fff */
const DIAMOND_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='9' viewBox='0 0 9 9' fill='none'%3E%3Crect y='4.24265' width='6' height='6' transform='rotate(-45 0 4.24265)' fill='white'/%3E%3C/svg%3E";

function hexToRgb(hex) {
  const m = String(hex).slice(1).match(/.{2}/g);
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

function normalizeGradient(gradient) {
  const colorStops = Array.isArray(gradient?.colorStops) && gradient.colorStops.length >= 2
    ? gradient.colorStops.map((s, i) => ({
      id: i,
      color: typeof s.color === 'string' ? s.color : '#808080',
      position: Math.max(0, Math.min(1, Number(s.position) ?? 0.5)),
    }))
    : DEFAULT_STOPS.map((s, i) => ({ ...s, id: i }));
  return {
    type: ['linear', 'radial', 'conic'].includes(gradient?.type) ? gradient.type : 'linear',
    angle: Math.max(0, Math.min(360, Number(gradient?.angle) ?? 90)),
    colorStops: colorStops.slice().sort((a, b) => a.position - b.position),
  };
}

function gradientToCSS(data, midpoints = []) {
  const { type = 'linear', angle = 90, colorStops = [] } = data;
  if (colorStops.length === 0) return 'linear-gradient(90deg, #ccc, #999)';
  const sorted = [...colorStops].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  let parts = [];
  if (midpoints.length > 0) {
    for (let i = 0; i < sorted.length; i += 1) {
      parts.push({ pos: sorted[i].position ?? 0, color: sorted[i].color });
      if (i < midpoints.length) {
        const nextColor = sorted[i + 1]?.color ?? sorted[i].color;
        parts.push({ pos: midpoints[i], color: blendColors(sorted[i].color, nextColor) });
      }
    }
    parts.sort((a, b) => a.pos - b.pos);
  } else {
    parts = sorted.map((s) => ({ pos: s.position ?? 0, color: s.color }));
  }
  const stops = parts.map((p) => `${p.color} ${Math.round(p.pos * 100)}%`).join(', ');
  if (type === 'radial') return `radial-gradient(circle, ${stops})`;
  if (type === 'conic') return `conic-gradient(from ${angle}deg, ${stops})`;
  return `linear-gradient(${angle}deg, ${stops})`;
}

const EVENT_PREFIX = 'gradient-editor:';

export function createGradientEditor(initialGradient, options = {}) {
  const {
    height = 80,
    size = 'l',
    ariaLabel = 'Gradient editor',
    onChange,
    onColorClick,
  } = options;

  let data = normalizeGradient(initialGradient);
  const midpoints = [];
  for (let i = 0; i < data.colorStops.length - 1; i += 1) {
    midpoints.push((data.colorStops[i].position + data.colorStops[i + 1].position) / 2);
  }
  let barEl = null;
  let handlesWrap = null;
  let barRect = null;
  const eventListeners = {};
  const midHalf = 4.25; /* 8.485×8.485, half ≈ 4.25 */

  const wrapper = createTag('div', {
    class: `gradient-editor gradient-editor--${size}`,
    'data-size': size,
  });
  if (height) wrapper.style.setProperty('--gradient-editor-height', `${height}px`);

  const barWrap = createTag('div', { class: 'gradient-editor-bar-wrap' });
  barEl = createTag('div', {
    class: 'gradient-editor-bar',
    'aria-label': ariaLabel,
  });
  if (height) barEl.style.height = `${height}px`;
  barEl.style.background = gradientToCSS(data, midpoints);

  handlesWrap = createTag('div', { class: 'gradient-editor-handles' });
  const showHandles = size === 'l'; /* L has gradient stops; M/S do not */

  function on(event, callback) {
    if (!eventListeners[event]) eventListeners[event] = [];
    eventListeners[event].push(callback);
  }

  function emit(event, detail) {
    const name = `${EVENT_PREFIX}${event}`;
    (eventListeners[event] || []).forEach((cb) => {
      try { cb(detail); } catch (err) { /* no-op */ }
    });
    wrapper.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  function updateBarAndHandles() {
    data.colorStops.sort((a, b) => a.position - b.position);
    if (barEl) barEl.style.background = gradientToCSS(data, midpoints);
    const handles = handlesWrap?.querySelectorAll('.gradient-editor-handle');
    handles?.forEach((handle) => {
      const stop = data.colorStops.find((s) => String(s.id) === handle.dataset.stopId);
      if (stop) {
        handle.style.left = `calc(${(stop.position ?? 0) * 100}% - var(--gradient-editor-handle-half, 11px))`;
        handle.style.backgroundColor = typeof stop.color === 'string' ? stop.color : '#808080';
        handle.setAttribute('aria-label', `Color stop, ${Math.round((stop.position ?? 0) * 100)}%`);
      }
    });
    const midEls = handlesWrap?.querySelectorAll('.gradient-editor-midpoint');
    midEls?.forEach((el, i) => {
      if (midpoints[i] != null) el.style.left = `calc(${midpoints[i] * 100}% - ${midHalf}px)`;
    });
    const payload = { ...data };
    onChange?.(payload);
    emit('change', payload);
  }

  function positionFromEvent(e) {
    const clientX = e.touches?.[0]?.clientX ?? e.clientX;
    if (!barRect) barRect = barEl.getBoundingClientRect();
    const x = (clientX - barRect.left) / barRect.width;
    return Math.max(0, Math.min(1, x));
  }

  function startDragStop(e, stop) {
    e.preventDefault();
    barRect = barEl.getBoundingClientRect();
    const move = (ev) => {
      ev.preventDefault();
      barRect = barEl.getBoundingClientRect();
      const pos = positionFromEvent(ev);
      const sorted = [...data.colorStops].sort((a, b) => a.position - b.position);
      const idx = sorted.findIndex((s) => s === stop);
      if (idx < 0) return;
      const prev = idx > 0 ? sorted[idx - 1].position : 0;
      const next = idx < sorted.length - 1 ? sorted[idx + 1].position : 1;
      stop.position = Math.max(prev, Math.min(next, pos));
      if (idx > 0) midpoints[idx - 1] = (sorted[idx - 1].position + stop.position) / 2;
      if (idx < midpoints.length) {
        const nextPos = sorted[idx + 1] ? sorted[idx + 1].position : 1;
        midpoints[idx] = (stop.position + nextPos) / 2;
      }
      updateBarAndHandles();
    };
    const end = () => {
      barRect = null;
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', end);
      document.removeEventListener('touchmove', move, { passive: false });
      document.removeEventListener('touchend', end);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', end);
    document.addEventListener('touchmove', move, { passive: false });
    document.addEventListener('touchend', end);
  }

  function startDragMidpoint(e, midIndex) {
    e.preventDefault();
    barRect = barEl.getBoundingClientRect();
    const move = (ev) => {
      ev.preventDefault();
      barRect = barEl.getBoundingClientRect();
      const pos = positionFromEvent(ev);
      const sorted = [...data.colorStops].sort((a, b) => a.position - b.position);
      const left = sorted[midIndex]?.position ?? 0;
      const right = sorted[midIndex + 1]?.position ?? 1;
      midpoints[midIndex] = Math.max(left, Math.min(right, pos));
      updateBarAndHandles();
    };
    const end = () => {
      barRect = null;
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', end);
      document.removeEventListener('touchmove', move, { passive: false });
      document.removeEventListener('touchend', end);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', end);
    document.addEventListener('touchmove', move, { passive: false });
    document.addEventListener('touchend', end);
  }

  if (showHandles) {
    data.colorStops.forEach((stop, index) => {
      const handle = createTag('button', {
        type: 'button',
        class: 'gradient-editor-handle',
        'aria-label': `Color stop, ${Math.round((stop.position ?? 0) * 100)}%`,
        'data-stop-id': String(stop.id),
        'data-index': String(index),
        tabIndex: 0,
      });
      handle.style.left = `calc(${(stop.position ?? 0) * 100}% - var(--gradient-editor-handle-half, 11px))`;
      handle.style.backgroundColor = typeof stop.color === 'string' ? stop.color : '#808080';
      handle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const detail = { stop, index };
        onColorClick?.(stop, index);
        emit('color-click', detail);
      });
      handle.addEventListener('mousedown', (e) => startDragStop(e, stop));
      handle.addEventListener('touchstart', (e) => startDragStop(e, stop), { passive: false });
      handlesWrap.appendChild(handle);
    });
    midpoints.forEach((mid, i) => {
      const midEl = createTag('div', {
        class: 'gradient-editor-midpoint',
        'data-midpoint-index': String(i),
        'aria-label': `Midpoint ${i + 1}`,
      });
      midEl.style.left = `calc(${mid * 100}% - ${midHalf}px)`;
      const img = createTag('img', { src: DIAMOND_SVG, alt: '' });
      midEl.appendChild(img);
      midEl.addEventListener('mousedown', (e) => startDragMidpoint(e, i));
      midEl.addEventListener('touchstart', (e) => startDragMidpoint(e, i), { passive: false });
      handlesWrap.appendChild(midEl);
    });
  }

  barWrap.appendChild(barEl);
  barWrap.appendChild(handlesWrap);
  wrapper.appendChild(barWrap);

  return {
    element: wrapper,
    getGradient: () => ({ ...data }),
    setGradient: (gradient) => {
      data = normalizeGradient(gradient);
      midpoints.length = 0;
      for (let i = 0; i < data.colorStops.length - 1; i += 1) {
        midpoints.push((data.colorStops[i].position + data.colorStops[i + 1].position) / 2);
      }
      barEl.style.background = gradientToCSS(data, midpoints);
      if (showHandles) {
        data.colorStops.forEach((stop, index) => {
          const handle = createTag('button', {
            type: 'button',
            class: 'gradient-editor-handle',
            'aria-label': `Color stop, ${Math.round((stop.position ?? 0) * 100)}%`,
            'data-stop-id': String(stop.id),
            'data-index': String(index),
            tabIndex: 0,
          });
          handle.style.left = `calc(${(stop.position ?? 0) * 100}% - var(--gradient-editor-handle-half, 11px))`;
          handle.style.backgroundColor = typeof stop.color === 'string' ? stop.color : '#808080';
          handle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const detail = { stop, index };
            onColorClick?.(stop, index);
            emit('color-click', detail);
          });
          handle.addEventListener('mousedown', (e) => startDragStop(e, stop));
          handle.addEventListener('touchstart', (e) => startDragStop(e, stop), { passive: false });
          handlesWrap.appendChild(handle);
        });
        midpoints.forEach((mid, i) => {
          const midEl = createTag('div', {
            class: 'gradient-editor-midpoint',
            'data-midpoint-index': String(i),
            'aria-label': `Midpoint ${i + 1}`,
          });
          midEl.style.left = `calc(${mid * 100}% - ${midHalf}px)`;
          const img = createTag('img', { src: DIAMOND_SVG, alt: '' });
          midEl.appendChild(img);
          midEl.addEventListener('mousedown', (e) => startDragMidpoint(e, i));
          midEl.addEventListener('touchstart', (e) => startDragMidpoint(e, i), { passive: false });
          handlesWrap.appendChild(midEl);
        });
      }
    },
    updateColorStop: (index, color) => {
      const stop = data.colorStops[index];
      if (stop) {
        stop.color = color;
        const handle = handlesWrap?.querySelector(`[data-stop-id="${stop.id}"]`);
        if (handle) handle.style.backgroundColor = color;
        if (barEl) barEl.style.background = gradientToCSS(data, midpoints);
        const payload = { ...data };
        onChange?.(payload);
        emit('change', payload);
      }
    },
    on,
    emit,
    destroy: () => {},
  };
}

export default createGradientEditor;
