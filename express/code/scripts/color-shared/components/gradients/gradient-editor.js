import { createTag } from '../../../utils.js';

const DEFAULT_STOPS = [
  { color: '#000000', position: 0 },
  { color: '#ffffff', position: 1 },
];

function normalizeGradient(gradient) {
  const colorStops = Array.isArray(gradient?.colorStops) && gradient.colorStops.length >= 2
    ? gradient.colorStops.map((s) => ({
      color: typeof s.color === 'string' ? s.color : '#808080',
      position: Math.max(0, Math.min(1, Number(s.position) ?? 0.5)),
    }))
    : [...DEFAULT_STOPS];
  return {
    type: ['linear', 'radial', 'conic'].includes(gradient?.type) ? gradient.type : 'linear',
    angle: Math.max(0, Math.min(360, Number(gradient?.angle) ?? 90)),
    colorStops: colorStops.slice().sort((a, b) => a.position - b.position),
  };
}

function gradientToCSS(data) {
  const { type = 'linear', angle = 90, colorStops = [] } = data;
  if (colorStops.length === 0) return 'linear-gradient(90deg, #ccc, #999)';
  const stops = colorStops
    .map((s) => `${s.color} ${(s.position ?? 0) * 100}%`)
    .join(', ');
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
  let barEl = null;
  let handlesWrap = null;
  let barRect = null;
  const eventListeners = {};

  const wrapper = createTag('div', {
    class: `gradient-editor gradient-editor--${size}`,
    'data-size': size,
  });

  const barWrap = createTag('div', { class: 'gradient-editor-bar-wrap' });
  barEl = createTag('div', {
    class: 'gradient-editor-bar',
    'aria-label': ariaLabel,
  });
  if (height) barEl.style.height = `${height}px`;
  barEl.style.background = gradientToCSS(data);

  handlesWrap = createTag('div', { class: 'gradient-editor-handles' });

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
    if (barEl) barEl.style.background = gradientToCSS(data);
    const handles = handlesWrap?.querySelectorAll('.gradient-editor-handle');
    handles?.forEach((handle, index) => {
      const stop = data.colorStops[index];
      if (stop) {
        handle.style.left = `${(stop.position ?? 0) * 100}%`;
        handle.style.backgroundColor = typeof stop.color === 'string' ? stop.color : '#808080';
        handle.setAttribute('aria-label', `Color stop ${index + 1}, ${Math.round((stop.position ?? 0) * 100)}%`);
      }
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

  function startDrag(e, index) {
    e.preventDefault();
    barRect = barEl.getBoundingClientRect();
    const move = (ev) => {
      ev.preventDefault();
      const pos = positionFromEvent(ev);
      data.colorStops[index].position = pos;
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

  data.colorStops.forEach((stop, index) => {
    const handle = createTag('button', {
      type: 'button',
      class: 'gradient-editor-handle',
      'aria-label': `Color stop ${index + 1}, ${Math.round((stop.position ?? 0) * 100)}%`,
      'data-index': String(index),
      tabIndex: 0,
    });
    handle.style.left = `${(stop.position ?? 0) * 100}%`;
    handle.style.backgroundColor = typeof stop.color === 'string' ? stop.color : '#808080';
    handle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const detail = { stop, index };
      onColorClick?.(stop, index);
      emit('color-click', detail);
    });
    handle.addEventListener('mousedown', (e) => startDrag(e, index));
    handle.addEventListener('touchstart', (e) => startDrag(e, index), { passive: false });
    handlesWrap.appendChild(handle);
  });

  barWrap.appendChild(barEl);
  barWrap.appendChild(handlesWrap);
  wrapper.appendChild(barWrap);

  return {
    element: wrapper,
    getGradient: () => ({ ...data }),
    setGradient: (gradient) => {
      data = normalizeGradient(gradient);
      barEl.style.background = gradientToCSS(data);
      handlesWrap.innerHTML = '';
      data.colorStops.forEach((stop, index) => {
        const handle = createTag('button', {
          type: 'button',
          class: 'gradient-editor-handle',
          'aria-label': `Color stop ${index + 1}, ${Math.round((stop.position ?? 0) * 100)}%`,
          'data-index': String(index),
          tabIndex: 0,
        });
        handle.style.left = `${(stop.position ?? 0) * 100}%`;
        handle.style.backgroundColor = typeof stop.color === 'string' ? stop.color : '#808080';
        handle.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const detail = { stop, index };
          onColorClick?.(stop, index);
          emit('color-click', detail);
        });
        handle.addEventListener('mousedown', (e) => startDrag(e, index));
        handle.addEventListener('touchstart', (e) => startDrag(e, index), { passive: false });
        handlesWrap.appendChild(handle);
      });
    },
    updateColorStop: (index, color) => {
      if (data.colorStops[index]) {
        data.colorStops[index].color = color;
        const handle = handlesWrap?.querySelector(`[data-index="${index}"]`);
        if (handle) handle.style.backgroundColor = color;
        if (barEl) barEl.style.background = gradientToCSS(data);
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
