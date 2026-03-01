import { createTag } from '../../../utils.js';

/* Hex values below are data fallbacks for invalid/missing gradient data only; display uses Figma tokens. */
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

/** Sample gradient color at position p (0–1). Returns hex. */
function sampleColorAtPosition(data, midpoints, p) {
  const sorted = [...(data.colorStops || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  if (sorted.length === 0) return '#808080';
  const parts = [];
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
    parts.push(...sorted.map((s) => ({ pos: s.position ?? 0, color: s.color })));
  }
  if (parts.length === 0) return '#808080';
  const pos = Math.max(0, Math.min(1, p));
  let i = 0;
  while (i < parts.length - 1 && parts[i + 1].pos < pos) i += 1;
  if (i >= parts.length - 1) return parts[parts.length - 1].color;
  const a = parts[i];
  const b = parts[i + 1];
  const t = (b.pos - a.pos) < 1e-6 ? 1 : (pos - a.pos) / (b.pos - a.pos);
  const [r1, g1, b1] = hexToRgb(a.color);
  const [r2, g2, b2] = hexToRgb(b.color);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

const EVENT_PREFIX = 'gradient-editor:';

export function createGradientEditor(initialGradient, options = {}) {
  const {
    height = 80,
    size = 'l',
    ariaLabel = 'Gradient editor',
    showMockDebug = false,
    showMockHandlesOrder = false,
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
  let selectedStopId = null; /* current user selection (drag or click) */

  const wrapper = createTag('div', {
    class: `gradient-editor gradient-editor--${size}`,
    'data-size': size,
    role: 'group',
    'aria-label': ariaLabel,
  });
  if (height) wrapper.style.setProperty('--gradient-editor-height', `${height}px`);

  let mockDebugEl = null;
  let latestColorSwatch = null;
  let latestColorValue = null;
  let mockEventEl = null;
  let mockOrderEl = null;
  if (showMockDebug) {
    mockDebugEl = createTag('div', { class: 'gradient-editor-mock-debug', 'data-mock': 'true', 'aria-live': 'polite' });
    const latestColorWrap = createTag('div', { class: 'gradient-editor-mock-debug-latest' });
    latestColorSwatch = createTag('span', { class: 'gradient-editor-mock-debug-swatch' });
    latestColorValue = createTag('span', { class: 'gradient-editor-mock-debug-value' });
    mockEventEl = createTag('span', { class: 'gradient-editor-mock-debug-event' });
    latestColorWrap.appendChild(latestColorSwatch);
    latestColorWrap.appendChild(latestColorValue);
    mockDebugEl.appendChild(latestColorWrap);
    mockDebugEl.appendChild(mockEventEl);
  }
  if (showMockHandlesOrder) {
    mockOrderEl = createTag('div', {
      class: 'gradient-editor-mock-handles-order',
      'data-mock': 'true',
      'aria-live': 'polite',
      'aria-label': 'Color handles order (mock — not for prod)',
    });
    const orderTitle = createTag('div', { class: 'gradient-editor-mock-handles-order-title' });
    orderTitle.textContent = 'Handles order (mock — not for prod)';
    mockOrderEl.appendChild(orderTitle);
    mockOrderEl.appendChild(createTag('div', { class: 'gradient-editor-mock-handles-order-list' }));
  }

  function updateMockHandlesOrder() {
    if (!showMockHandlesOrder || !mockOrderEl) return;
    const listEl = mockOrderEl.querySelector('.gradient-editor-mock-handles-order-list');
    if (!listEl) return;
    listEl.innerHTML = '';
    const sorted = [...data.colorStops].sort((a, b) => a.position - b.position);
    sorted.forEach((stop, index) => {
      const hex = typeof stop.color === 'string' ? stop.color : '#808080';
      const item = createTag('div', { class: 'gradient-editor-mock-handles-order-item' });
      const swatch = createTag('span', {
        class: 'gradient-editor-mock-handles-order-swatch',
        style: `background-color: ${hex}`,
        title: hex,
      });
      const label = createTag('span', { class: 'gradient-editor-mock-handles-order-hex' });
      label.textContent = `${index + 1}. ${hex}`;
      item.appendChild(swatch);
      item.appendChild(label);
      listEl.appendChild(item);
    });
  }

  function setMockDebug(color, eventName, positionPct) {
    if (!showMockDebug) return;
    const hex = color != null && color !== '(midpoint)' ? String(color) : null;
    let position = positionPct;
    if (position == null && selectedStopId != null) {
      const s = data.colorStops.find((x) => String(x.id) === String(selectedStopId));
      position = s != null ? Math.round((s.position ?? 0) * 100) : null;
    }
    let valueText = '—';
    if (hex != null) valueText = position != null ? `${hex} at ${position}%` : hex;
    latestColorValue.textContent = valueText;
    latestColorSwatch.style.backgroundColor = hex ?? 'transparent';
    latestColorSwatch.style.borderColor = hex ? 'transparent' : 'var(--Palette-gray-300)';
    if (hex) latestColorSwatch.setAttribute('title', hex);
    mockEventEl.textContent = eventName != null ? eventName : '—';
    if (hex) {
      wrapper.setAttribute('data-latest-hex', hex);
      if (position != null) wrapper.setAttribute('data-latest-position', String(position));
      else wrapper.removeAttribute('data-latest-position');
    } else {
      wrapper.removeAttribute('data-latest-hex');
      wrapper.removeAttribute('data-latest-position');
    }
  }

  const barWrap = createTag('div', { class: 'gradient-editor-bar-wrap' });
  barEl = createTag('div', {
    class: 'gradient-editor-bar',
    'aria-label': ariaLabel,
  });
  if (height) barEl.style.height = `${height}px`;
  barEl.style.background = gradientToCSS(data, midpoints);

  handlesWrap = createTag('div', { class: 'gradient-editor-handles' });
  /* S: color handles (circles) only; L: color handles + midpoint diamonds (gradient stops) */
  const showColorHandles = size === 'l' || size === 's';
  const showMidpoints = size === 'l';

  /**
   * @param {Object} [stop] - Selected stop
   * @param {string} [colorAtPosition] - Sampled hex at stop.position (gradient at that position)
   */
  function setSelectedStop(stop, colorAtPosition) {
    selectedStopId = stop ? stop.id : null;
    const handles = handlesWrap?.querySelectorAll('.gradient-editor-handle') || [];
    const fallbackHex = stop && (typeof stop.color === 'string' ? stop.color : '#808080');
    const displayHex = colorAtPosition != null ? colorAtPosition : fallbackHex;
    handles.forEach((handle) => {
      const isSelected = stop && String(handle.dataset.stopId) === String(stop.id);
      handle.setAttribute('data-selected', isSelected ? 'true' : 'false');
      if (isSelected) {
        const positionPct = Math.round((stop.position ?? 0) * 100);
        handle.setAttribute('data-color', displayHex);
        handle.setAttribute('data-position', String(positionPct));
        handle.style.backgroundColor = displayHex;
        handle.setAttribute('aria-label', `Color stop, ${positionPct}%`);
        wrapper.setAttribute('data-selected-stop-id', String(stop.id));
        wrapper.setAttribute('data-selected-hex', displayHex);
        wrapper.setAttribute('data-selected-position', String(positionPct));
      }
    });
    if (!stop) {
      wrapper.removeAttribute('data-selected-stop-id');
      wrapper.removeAttribute('data-selected-hex');
      wrapper.removeAttribute('data-selected-position');
    }
  }

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
        const positionPct = Math.round((stop.position ?? 0) * 100);
        const colorAtPosition = sampleColorAtPosition(data, midpoints, stop.position ?? 0);
        handle.style.left = `calc(${positionPct}% - var(--gradient-editor-handle-half, 11px))`;
        handle.style.backgroundColor = colorAtPosition;
        handle.setAttribute('aria-label', `Color stop, ${positionPct}%`);
        handle.setAttribute('data-color', colorAtPosition);
        handle.setAttribute('data-position', String(positionPct));
      }
    });
    const midEls = handlesWrap?.querySelectorAll('.gradient-editor-midpoint');
    midEls?.forEach((el, i) => {
      if (midpoints[i] != null) el.style.left = `calc(${midpoints[i] * 100}% - ${midHalf}px)`;
    });
    /* Keep current selection in sync; show color at position (gradient bar at that point) */
    if (selectedStopId != null) {
      const selectedStop = data.colorStops.find((s) => String(s.id) === String(selectedStopId));
      if (selectedStop) {
        const sampled = sampleColorAtPosition(data, midpoints, selectedStop.position ?? 0);
        setSelectedStop(selectedStop, sampled);
      }
    }
    const payload = { ...data, midpoints: [...midpoints] };
    onChange?.(payload);
    emit('change', payload);
    updateMockHandlesOrder();
  }

  function positionFromEvent(e) {
    const clientX = e.touches?.[0]?.clientX ?? e.clientX;
    if (!barRect) barRect = barEl.getBoundingClientRect();
    const x = (clientX - barRect.left) / barRect.width;
    return Math.max(0, Math.min(1, x));
  }

  function startDragStop(e, stop) {
    e.preventDefault();
    const sampledHex = sampleColorAtPosition(data, midpoints, stop.position ?? 0);
    setSelectedStop(stop, sampledHex);
    setMockDebug(sampledHex, `${EVENT_PREFIX}change`, Math.round((stop.position ?? 0) * 100));
    barRect = barEl.getBoundingClientRect();
    const move = (ev) => {
      ev.preventDefault();
      barRect = barEl.getBoundingClientRect();
      const pos = positionFromEvent(ev);
      /* Allow handle to move past neighbors (0–1); order is maintained by re-sort in updateBarAndHandles */
      stop.position = Math.max(0, Math.min(1, pos));
      /* Recompute midpoints from current positions so they stay valid when stops cross */
      data.colorStops.sort((a, b) => a.position - b.position);
      midpoints.length = 0;
      for (let i = 0; i < data.colorStops.length - 1; i += 1) {
        midpoints.push((data.colorStops[i].position + data.colorStops[i + 1].position) / 2);
      }
      /* Preserve stop color when dragging so the gradient keeps its variety */
      updateBarAndHandles();
      const displayHex = typeof stop.color === 'string' ? stop.color : '#808080';
      setMockDebug(displayHex, `${EVENT_PREFIX}change`, Math.round((stop.position ?? 0) * 100));
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
      setMockDebug('(midpoint)', `${EVENT_PREFIX}change`);
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

  if (showColorHandles) {
    data.colorStops.forEach((stop, index) => {
      const positionPct = Math.round((stop.position ?? 0) * 100);
      const hex = typeof stop.color === 'string' ? stop.color : '#808080';
      const handle = createTag('button', {
        type: 'button',
        class: 'gradient-editor-handle',
        'aria-label': `Color stop, ${positionPct}%`,
        'data-stop-id': String(stop.id),
        'data-index': String(index),
        'data-color': hex,
        'data-position': String(positionPct),
        tabIndex: 0,
      });
      handle.style.left = `calc(${positionPct}% - var(--gradient-editor-handle-half, 11px))`;
      handle.style.backgroundColor = hex;
      handle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const sampledHex = sampleColorAtPosition(data, midpoints, stop.position ?? 0);
        setSelectedStop(stop, sampledHex);
        const detail = { stop, index };
        setMockDebug(sampledHex, `${EVENT_PREFIX}color-click`, Math.round((stop.position ?? 0) * 100));
        onColorClick?.(stop, index);
        emit('color-click', detail);
      });
      handle.addEventListener('mousedown', (e) => startDragStop(e, stop));
      handle.addEventListener('touchstart', (e) => startDragStop(e, stop), { passive: false });
      handlesWrap.appendChild(handle);
    });
  }
  if (showMidpoints) {
    midpoints.forEach((mid, i) => {
      const midEl = createTag('div', {
        class: 'gradient-editor-midpoint',
        'data-midpoint-index': String(i),
        role: 'button',
        tabIndex: 0,
        'aria-label': `Midpoint ${i + 1}, drag to adjust blend`,
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
  if (mockDebugEl) wrapper.appendChild(mockDebugEl);
  if (mockOrderEl) wrapper.appendChild(mockOrderEl);
  setMockDebug(null, null);
  updateMockHandlesOrder();

  return {
    element: wrapper,
    getGradient: () => ({ ...data, midpoints: [...midpoints] }),
    setGradient: (gradient) => {
      data = normalizeGradient(gradient);
      midpoints.length = 0;
      const expectedLen = data.colorStops.length - 1;
      const validMidpoints = Array.isArray(gradient.midpoints)
        && gradient.midpoints.length === expectedLen
        && gradient.midpoints.every((m) => typeof m === 'number' && m >= 0 && m <= 1);
      if (validMidpoints) {
        midpoints.push(...gradient.midpoints);
      } else {
        for (let i = 0; i < expectedLen; i += 1) {
          midpoints.push((data.colorStops[i].position + data.colorStops[i + 1].position) / 2);
        }
      }
      barEl.style.background = gradientToCSS(data, midpoints);
      if (showColorHandles) {
        data.colorStops.forEach((stop, index) => {
          const positionPct = Math.round((stop.position ?? 0) * 100);
          const hex = typeof stop.color === 'string' ? stop.color : '#808080';
          const handle = createTag('button', {
            type: 'button',
            class: 'gradient-editor-handle',
            'aria-label': `Color stop, ${positionPct}%`,
            'data-stop-id': String(stop.id),
            'data-index': String(index),
            'data-color': hex,
            'data-position': String(positionPct),
            tabIndex: 0,
          });
          handle.style.left = `calc(${positionPct}% - var(--gradient-editor-handle-half, 11px))`;
          handle.style.backgroundColor = hex;
          handle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const sampledHex = sampleColorAtPosition(data, midpoints, stop.position ?? 0);
            setSelectedStop(stop, sampledHex);
            const detail = { stop, index };
            setMockDebug(sampledHex, `${EVENT_PREFIX}color-click`, Math.round((stop.position ?? 0) * 100));
            onColorClick?.(stop, index);
            emit('color-click', detail);
          });
          handle.addEventListener('mousedown', (e) => startDragStop(e, stop));
          handle.addEventListener('touchstart', (e) => startDragStop(e, stop), { passive: false });
          handlesWrap.appendChild(handle);
        });
      }
      if (showMidpoints) {
        midpoints.forEach((mid, i) => {
          const midEl = createTag('div', {
            class: 'gradient-editor-midpoint',
            'data-midpoint-index': String(i),
            role: 'button',
            tabIndex: 0,
            'aria-label': `Midpoint ${i + 1}, drag to adjust blend`,
          });
          midEl.style.left = `calc(${mid * 100}% - ${midHalf}px)`;
          const img = createTag('img', { src: DIAMOND_SVG, alt: '' });
          midEl.appendChild(img);
          midEl.addEventListener('mousedown', (e) => startDragMidpoint(e, i));
          midEl.addEventListener('touchstart', (e) => startDragMidpoint(e, i), { passive: false });
          handlesWrap.appendChild(midEl);
        });
      }
      updateMockHandlesOrder();
    },
    updateColorStop: (index, color) => {
      const stop = data.colorStops[index];
      if (stop) {
        stop.color = color;
        setSelectedStop(stop);
        const handle = handlesWrap?.querySelector(`[data-stop-id="${stop.id}"]`);
        if (handle) {
          handle.style.backgroundColor = color;
          handle.setAttribute('data-color', color);
        }
        if (barEl) barEl.style.background = gradientToCSS(data, midpoints);
        const positionPct = Math.round((stop.position ?? 0) * 100);
        setMockDebug(color, `${EVENT_PREFIX}change`, positionPct);
        const payload = { ...data, midpoints: [...midpoints] };
        onChange?.(payload);
        emit('change', payload);
        updateMockHandlesOrder();
      }
    },
    on,
    emit,
    destroy: () => {},
  };
}

export default createGradientEditor;
