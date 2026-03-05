/** Gradient editor — contract, API, a11y: see README.md (same folder). */
import { createTag } from '../../../utils.js';
import { announceToScreenReader } from '../../spectrum/utils/a11y.js';
import { showExpressToast } from '../../spectrum/components/express-toast.js';

const DEFAULT_HEX = '#808080';
const DEFAULT_STOPS = [
  { color: '#000000', position: 0 },
  { color: '#ffffff', position: 1 },
];

const MIDPOINT_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='9' viewBox='0 0 9 9' fill='none'%3E%3Ccircle cx='4.5' cy='4.5' r='3' fill='white'/%3E%3C/svg%3E";

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
      color: typeof s.color === 'string' ? s.color : DEFAULT_HEX,
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

function sampleColorAtPosition(data, midpoints, p) {
  const sorted = [...(data.colorStops || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  if (sorted.length === 0) return DEFAULT_HEX;
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
  if (parts.length === 0) return DEFAULT_HEX;
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

function hexForA11y(hex) {
  const h = typeof hex === 'string' && hex.startsWith('#') ? hex : `#${String(hex || '808080').replace(/^#/, '')}`;
  return h.toUpperCase();
}

const KEYBOARD_STEP = 0.01;
const KEYBOARD_STEP_SHIFT = 0.05;

/** See README.md for full contract and API. Config-driven: layout, size, and feature flags. */
export function createGradientEditor(initialGradient, options = {}) {
  const {
    height = 80,
    size = 'l',
    layout: optLayout = 'static',
    draggable: optDraggable,
    copyable: optCopyable,
    showHandles: optShowHandles,
    showMidpoints: optShowMidpoints,
    showBarTrack: optShowBarTrack,
    ariaLabel = 'Gradient editor',
    showMockDebug = false,
    showMockHandlesOrder = false,
    onChange,
    onColorClick,
  } = options;

  const layout = optLayout;
  let resolvedSize = size;
  if (layout === 'responsive') {
    resolvedSize = /^strip-(s|m|l|responsive)$/.test(size) ? size : 'strip-responsive';
  } else {
    resolvedSize = size === 'responsive' ? 'responsive' : size;
  }

  const beh = resolvedSize === 'responsive' ? 'l' : resolvedSize;
  const draggable = optDraggable ?? true;
  const copyable = optCopyable ?? (layout === 'responsive');
  const showHandles = optShowHandles ?? (layout === 'responsive' || beh === 'l' || beh === 's');
  const showMidpoints = optShowMidpoints ?? (layout === 'static' && beh === 'l');
  const showBarTrack = optShowBarTrack ?? (layout !== 'responsive');

  const parts = ['gradient-editor', `gradient-editor--layout-${layout}`, `gradient-editor--size-${resolvedSize}`];
  if (layout === 'static' && resolvedSize === 'responsive') parts.push('gradient-editor--fluid-width');
  if (draggable) parts.push('gradient-editor--draggable');
  if (copyable) parts.push('gradient-editor--copyable');
  const wrapperClass = parts.join(' ');
  const isLayoutResponsive = layout === 'responsive';

  let data = normalizeGradient(initialGradient);
  const midpoints = [];
  for (let i = 0; i < data.colorStops.length - 1; i += 1) {
    midpoints.push((data.colorStops[i].position + data.colorStops[i + 1].position) / 2);
  }
  let barEl = null;
  let handlesWrap = null;
  let barRect = null;
  const eventListeners = {};
  const midHalf = 4.25;
  let selectedStopId = null;
  let isDragging = false;

  const wrapper = createTag('div', {
    class: wrapperClass,
    'data-size': resolvedSize,
    'data-show-bar-track': String(showBarTrack),
    role: 'group',
    'aria-label': ariaLabel,
    tabIndex: 0,
    'data-gradient-focus': 'outside',
  });
  if (height && !isLayoutResponsive) wrapper.style.setProperty('--gradient-editor-height', `${height}px`);

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
      const hex = typeof stop.color === 'string' ? stop.color : DEFAULT_HEX;
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
    'aria-hidden': 'true',
  });
  if (height && !isLayoutResponsive) barEl.style.height = `${height}px`;
  barEl.style.background = gradientToCSS(data, midpoints);

  handlesWrap = createTag('div', { class: 'gradient-editor-handles' });
  const showColorHandles = showHandles;

  function setSelectedStop(stop, colorAtPosition) {
    selectedStopId = stop ? stop.id : null;
    const handles = handlesWrap?.querySelectorAll('.gradient-editor-handle') || [];
    const fallbackHex = stop && (typeof stop.color === 'string' ? stop.color : DEFAULT_HEX);
    const displayHex = colorAtPosition != null ? colorAtPosition : fallbackHex;
    handles.forEach((handle) => {
      const isSelected = stop && String(handle.dataset.stopId) === String(stop.id);
      handle.setAttribute('data-selected', isSelected ? 'true' : 'false');
      if (isSelected) {
        const positionPct = Math.round((stop.position ?? 0) * 100);
        handle.setAttribute('data-color', displayHex);
        handle.setAttribute('data-position', String(positionPct));
        handle.style.setProperty('--handle-color', displayHex);
        const label = `Color handle for ${hexForA11y(displayHex)}`;
        handle.setAttribute('aria-label', label);
        if (copyable) handle.setAttribute('title', `Copy ${hexForA11y(displayHex)}`);
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

  function getFocusableHandles() {
    if (!handlesWrap) return [];
    return [...handlesWrap.querySelectorAll('.gradient-editor-handle, .gradient-editor-midpoint')];
  }

  function setHandlesTabIndex(val) {
    const focusables = getFocusableHandles();
    focusables.forEach((el) => { el.setAttribute('tabindex', String(val)); });
    wrapper.setAttribute('data-gradient-focus', val === 0 ? 'inside' : 'outside');
  }

  function isHandleOrMidpoint(el) {
    return el && (el.classList.contains('gradient-editor-handle') || el.classList.contains('gradient-editor-midpoint')) && wrapper.contains(el);
  }

  function reorderHandlesByPosition() {
    if (!handlesWrap) return;
    const active = document.activeElement;
    const wasHandle = active?.closest?.('.gradient-editor-handle, .gradient-editor-midpoint') && handlesWrap.contains(active);
    const handles = handlesWrap.querySelectorAll('.gradient-editor-handle');
    const midEls = handlesWrap.querySelectorAll('.gradient-editor-midpoint');
    const entries = [];
    handles.forEach((el) => {
      const stop = data.colorStops.find((s) => String(s.id) === el.dataset.stopId);
      if (stop) entries.push({ el, pos: stop.position ?? 0 });
    });
    midEls.forEach((el, i) => {
      if (midpoints[i] != null) entries.push({ el, pos: midpoints[i] });
    });
    entries.sort((a, b) => a.pos - b.pos);
    entries.forEach(({ el }) => handlesWrap.appendChild(el));
    if (wasHandle && active && document.contains(active)) active.focus();
  }

  function updateBarAndHandles() {
    data.colorStops.sort((a, b) => a.position - b.position);
    if (barEl) {
      barEl.style.background = gradientToCSS(data, midpoints);
    }
    const handles = handlesWrap?.querySelectorAll('.gradient-editor-handle');
    handles?.forEach((handle) => {
      const stop = data.colorStops.find((s) => String(s.id) === handle.dataset.stopId);
      if (stop) {
        const pos = stop.position ?? 0;
        const positionPct = pos * 100;
        const positionPctRounded = Math.round(positionPct);
        const colorAtPosition = sampleColorAtPosition(data, midpoints, pos);
        handle.style.setProperty('--handle-position-pct', String(positionPct));
        handle.style.setProperty('--handle-color', colorAtPosition);
        const label = `Color handle for ${hexForA11y(colorAtPosition)}`;
        handle.setAttribute('aria-label', label);
        if (copyable) handle.setAttribute('title', `Copy ${hexForA11y(colorAtPosition)}`);
        handle.setAttribute('data-color', colorAtPosition);
        handle.setAttribute('data-position', String(positionPctRounded));
      }
    });
    const midEls = handlesWrap?.querySelectorAll('.gradient-editor-midpoint');
    const sortedStops = [...data.colorStops].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    midEls?.forEach((el, i) => {
      if (midpoints[i] != null) {
        el.style.left = `calc(${midpoints[i] * 100}% - ${midHalf}px)`;
        const leftHex = sortedStops[i] && typeof sortedStops[i].color === 'string' ? sortedStops[i].color : DEFAULT_HEX;
        const rightHex = sortedStops[i + 1] && typeof sortedStops[i + 1].color === 'string' ? sortedStops[i + 1].color : DEFAULT_HEX;
        const label = `Gradient stop between ${hexForA11y(leftHex)} and ${hexForA11y(rightHex)}`;
        el.setAttribute('aria-label', label);
      }
    });
    if (!isDragging) reorderHandlesByPosition();
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
    const { width } = barRect;
    if (!width) return 0.5;
    const x = (clientX - barRect.left) / width;
    return Math.max(0, Math.min(1, x));
  }

  function startDragStop(e, stop) {
    if (!draggable) return;
    if (e.type === 'mousedown' && e.button !== 0) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    isDragging = true;
    const sampledHex = sampleColorAtPosition(data, midpoints, stop.position ?? 0);
    setSelectedStop(stop, sampledHex);
    setMockDebug(sampledHex, `${EVENT_PREFIX}change`, Math.round((stop.position ?? 0) * 100));
    barRect = barEl.getBoundingClientRect();
    const move = (ev) => {
      ev.preventDefault();
      barRect = barEl.getBoundingClientRect();
      const pos = positionFromEvent(ev);
      stop.position = Math.max(0, Math.min(1, pos));
      data.colorStops.sort((a, b) => a.position - b.position);
      midpoints.length = 0;
      for (let i = 0; i < data.colorStops.length - 1; i += 1) {
        midpoints.push((data.colorStops[i].position + data.colorStops[i + 1].position) / 2);
      }
      updateBarAndHandles();
      const displayHex = typeof stop.color === 'string' ? stop.color : DEFAULT_HEX;
      setMockDebug(displayHex, `${EVENT_PREFIX}change`, Math.round((stop.position ?? 0) * 100));
    };
    const end = () => {
      isDragging = false;
      barRect = null;
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', end);
      document.removeEventListener('touchmove', move, { passive: false });
      document.removeEventListener('touchend', end);
      reorderHandlesByPosition();
      const pct = Math.round((stop.position ?? 0) * 100);
      announceToScreenReader(`Color handle at ${pct}%`, 'polite');
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', end);
    document.addEventListener('touchmove', move, { passive: false });
    document.addEventListener('touchend', end);
  }

  function startDragMidpoint(e, midIndex) {
    if (!draggable) return;
    if (e.type === 'mousedown' && e.button !== 0) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    isDragging = true;
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
      isDragging = false;
      barRect = null;
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', end);
      document.removeEventListener('touchmove', move, { passive: false });
      document.removeEventListener('touchend', end);
      reorderHandlesByPosition();
      if (midpoints[midIndex] != null) {
        const pct = Math.round(midpoints[midIndex] * 100);
        announceToScreenReader(`Gradient stop at ${pct}%`, 'polite');
      }
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', end);
    document.addEventListener('touchmove', move, { passive: false });
    document.addEventListener('touchend', end);
  }

  function moveStopByKeyboard(stop, deltaOrAbsolute) {
    const current = stop.position ?? 0.5;
    const newPos = (deltaOrAbsolute === 0 || deltaOrAbsolute === 1)
      ? deltaOrAbsolute
      : Math.max(0, Math.min(1, current + deltaOrAbsolute));
    stop.position = newPos;
    data.colorStops.sort((a, b) => a.position - b.position);
    midpoints.length = 0;
    for (let i = 0; i < data.colorStops.length - 1; i += 1) {
      midpoints.push((data.colorStops[i].position + data.colorStops[i + 1].position) / 2);
    }
    updateBarAndHandles();
    const displayHex = typeof stop.color === 'string' ? stop.color : DEFAULT_HEX;
    const pct = Math.round((stop.position ?? 0) * 100);
    setMockDebug(displayHex, `${EVENT_PREFIX}change`, pct);
    announceToScreenReader(`Color handle at ${pct}%`, 'polite');
  }

  function handleKeydownStop(e, stop) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    const step = e.shiftKey ? KEYBOARD_STEP_SHIFT : KEYBOARD_STEP;
    if (e.key === 'ArrowLeft') moveStopByKeyboard(stop, -step);
    else if (e.key === 'ArrowRight') moveStopByKeyboard(stop, step);
    else if (e.key === 'Home') moveStopByKeyboard(stop, 0);
    else if (e.key === 'End') moveStopByKeyboard(stop, 1);
  }

  function moveMidpointByKeyboard(midIndex, delta) {
    const sorted = [...data.colorStops].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    const left = sorted[midIndex]?.position ?? 0;
    const right = sorted[midIndex + 1]?.position ?? 1;
    const current = midpoints[midIndex] ?? (left + right) / 2;
    midpoints[midIndex] = Math.max(left, Math.min(right, current + delta));
    updateBarAndHandles();
    setMockDebug('(midpoint)', `${EVENT_PREFIX}change`);
    const pct = Math.round(midpoints[midIndex] * 100);
    announceToScreenReader(`Gradient stop at ${pct}%`, 'polite');
  }

  function handleKeydownMidpoint(e, midIndex) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const step = e.shiftKey ? KEYBOARD_STEP_SHIFT : KEYBOARD_STEP;
    if (e.key === 'ArrowLeft') moveMidpointByKeyboard(midIndex, -step);
    else moveMidpointByKeyboard(midIndex, step);
  }

  wrapper.addEventListener('keydown', (e) => {
    const target = e.target?.closest?.('.gradient-editor-handle, .gradient-editor-midpoint') ?? e.target;
    const onHandle = isHandleOrMidpoint(target);

    if (e.target === wrapper && e.key === 'Enter') {
      e.preventDefault();
      const list = getFocusableHandles();
      if (list.length) {
        list[0].focus();
        setHandlesTabIndex(0);
        announceToScreenReader('Gradient editor. Use arrow keys to move stops. Press Escape to exit.', 'polite');
      }
      return;
    }

    if (onHandle && e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      wrapper.focus();
      setHandlesTabIndex(-1);
      announceToScreenReader('Left gradient editor.', 'polite');
      return;
    }

    if (onHandle && e.key === 'Tab') {
      const list = getFocusableHandles();
      const idx = list.indexOf(target);
      if (idx >= 0 && list.length > 0) {
        e.preventDefault();
        const next = e.shiftKey ? list[idx - 1] ?? list[list.length - 1] : list[idx + 1] ?? list[0];
        next.focus();
      }
      return;
    }

    if (onHandle && wrapper.classList.contains('gradient-editor--layout-responsive')
      && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (!onHandle) return;

    if (target.classList.contains('gradient-editor-handle')) {
      const stopId = target.getAttribute('data-stop-id');
      const stop = data.colorStops.find((s) => String(s.id) === stopId);
      if (stop && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        const step = e.shiftKey ? KEYBOARD_STEP_SHIFT : KEYBOARD_STEP;
        if (e.key === 'ArrowLeft') moveStopByKeyboard(stop, -step);
        else if (e.key === 'ArrowRight') moveStopByKeyboard(stop, step);
        else if (e.key === 'Home') moveStopByKeyboard(stop, 0);
        else if (e.key === 'End') moveStopByKeyboard(stop, 1);
      }
    } else if (target.classList.contains('gradient-editor-midpoint')) {
      const idx = target.getAttribute('data-midpoint-index');
      if (idx != null && ['ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const midIndex = parseInt(idx, 10);
        if (!Number.isNaN(midIndex)) {
          e.preventDefault();
          e.stopPropagation();
          const step = e.shiftKey ? KEYBOARD_STEP_SHIFT : KEYBOARD_STEP;
          if (e.key === 'ArrowLeft') moveMidpointByKeyboard(midIndex, -step);
          else moveMidpointByKeyboard(midIndex, step);
        }
      }
    }
  }, true);

  wrapper.addEventListener('focus', (e) => {
    if (e.target === wrapper) {
      announceToScreenReader('Gradient editor. Press Enter to adjust color stops.', 'polite');
    }
  });

  wrapper.addEventListener('focusin', (e) => {
    if (e.target !== wrapper && e.target?.closest?.('.gradient-editor-handle, .gradient-editor-midpoint') && wrapper.contains(e.target)) {
      setHandlesTabIndex(0);
    }
  });

  wrapper.addEventListener('contextmenu', () => {
    const active = document.activeElement;
    if (active && wrapper.contains(active) && active !== wrapper) {
      active.blur();
    }
  }, true);

  for (let index = 0; index < data.colorStops.length; index += 1) {
    const stop = data.colorStops[index];
    if (showColorHandles) {
      const positionPct = Math.round((stop.position ?? 0) * 100);
      const hex = typeof stop.color === 'string' ? stop.color : DEFAULT_HEX;
      const handleLabel = `Color handle for ${hexForA11y(hex)}`;
      const handle = createTag('button', {
        type: 'button',
        class: 'gradient-editor-handle',
        'aria-label': handleLabel,
        ...(copyable && { title: `Copy ${hexForA11y(hex)}` }),
        'data-stop-id': String(stop.id),
        'data-index': String(index),
        'data-color': hex,
        'data-position': String(positionPct),
        tabIndex: -1,
      });
      handle.style.setProperty('--handle-position-pct', String(positionPct));
      handle.style.setProperty('--handle-color', hex);
      /* eslint-disable-next-line no-loop-func -- click uses live data */
      handle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const sampledHex = sampleColorAtPosition(data, midpoints, stop.position ?? 0);
        setSelectedStop(stop, sampledHex);
        const detail = { stop, index };
        setMockDebug(
          sampledHex,
          `${EVENT_PREFIX}color-click`,
          Math.round((stop.position ?? 0) * 100),
        );
        if (copyable && navigator.clipboard?.writeText) {
          const copyHex = typeof stop.color === 'string' ? stop.color : sampledHex;
          navigator.clipboard.writeText(copyHex).then(() => {
            announceToScreenReader('Color copied', 'polite');
            showExpressToast({ message: 'Copied', variant: 'positive', timeout: 2000, anchor: wrapper.closest('[role="dialog"]') || undefined });
          }).catch(() => {});
        }
        onColorClick?.(stop, index);
        emit('color-click', detail);
      });
      if (draggable) {
        handle.addEventListener('mousedown', (e) => startDragStop(e, stop));
        handle.addEventListener(
          'touchstart',
          (e) => startDragStop(e, stop),
          { passive: false },
        );
      }
      handle.addEventListener('keydown', (e) => handleKeydownStop(e, stop));
      const stopColorHex = typeof stop.color === 'string'
        ? stop.color
        : sampleColorAtPosition(data, midpoints, stop.position ?? 0);
      const focusLabel = `Color handle for ${hexForA11y(stopColorHex)}`;
      handle.addEventListener('focus', () => announceToScreenReader(focusLabel, 'polite'));
      handlesWrap.appendChild(handle);
    }
    if (showMidpoints && index < midpoints.length) {
      const mid = midpoints[index];
      const i = index;
      const sortedStops = [...data.colorStops].sort(
        (a, b) => (a.position ?? 0) - (b.position ?? 0),
      );
      const leftHex = sortedStops[i] && typeof sortedStops[i].color === 'string'
        ? sortedStops[i].color
        : DEFAULT_HEX;
      const rightHex = sortedStops[i + 1] && typeof sortedStops[i + 1].color === 'string'
        ? sortedStops[i + 1].color
        : DEFAULT_HEX;
      const midLabel = `Gradient stop between ${hexForA11y(leftHex)} and ${hexForA11y(rightHex)}`;
      const midEl = createTag('div', {
        class: 'gradient-editor-midpoint',
        'data-midpoint-index': String(i),
        role: 'button',
        tabIndex: -1,
        'aria-label': midLabel,
      });
      midEl.style.left = `calc(${mid * 100}% - ${midHalf}px)`;
      const img = createTag('img', { src: MIDPOINT_SVG, alt: '' });
      midEl.appendChild(img);
      if (draggable) {
        midEl.addEventListener('mousedown', (e) => startDragMidpoint(e, i));
        midEl.addEventListener('touchstart', (e) => startDragMidpoint(e, i), { passive: false });
      }
      midEl.addEventListener('keydown', (e) => handleKeydownMidpoint(e, i));
      midEl.addEventListener('focus', () => announceToScreenReader(`Gradient stop between ${hexForA11y(leftHex)} and ${hexForA11y(rightHex)}`, 'polite'));
      handlesWrap.appendChild(midEl);
    }
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
      handlesWrap.innerHTML = '';
      for (let index = 0; index < data.colorStops.length; index += 1) {
        const stop = data.colorStops[index];
        if (showColorHandles) {
          const positionPct = Math.round((stop.position ?? 0) * 100);
          const hex = typeof stop.color === 'string' ? stop.color : DEFAULT_HEX;
          const handleLabel = `Color handle for ${hexForA11y(hex)}`;
          const handle = createTag('button', {
            type: 'button',
            class: 'gradient-editor-handle',
            'aria-label': handleLabel,
            ...(copyable && { title: `Copy ${hexForA11y(hex)}` }),
            'data-stop-id': String(stop.id),
            'data-index': String(index),
            'data-color': hex,
            'data-position': String(positionPct),
            tabIndex: -1,
          });
          handle.style.setProperty('--handle-position-pct', String(positionPct));
          handle.style.setProperty('--handle-color', hex);
          /* eslint-disable-next-line no-loop-func -- click uses live data */
          handle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const sampledHex = sampleColorAtPosition(data, midpoints, stop.position ?? 0);
            setSelectedStop(stop, sampledHex);
            const detail = { stop, index };
            setMockDebug(
              sampledHex,
              `${EVENT_PREFIX}color-click`,
              Math.round((stop.position ?? 0) * 100),
            );
            if (copyable && navigator.clipboard?.writeText) {
              const copyHex = typeof stop.color === 'string' ? stop.color : sampledHex;
              navigator.clipboard.writeText(copyHex).then(() => {
                announceToScreenReader('Color copied', 'polite');
                showExpressToast({ message: 'Copied', variant: 'positive', timeout: 2000, anchor: wrapper.closest('[role="dialog"]') || undefined });
              }).catch(() => {});
            }
            onColorClick?.(stop, index);
            emit('color-click', detail);
          });
          if (draggable) {
            handle.addEventListener('mousedown', (e) => startDragStop(e, stop));
            handle.addEventListener(
              'touchstart',
              (e) => startDragStop(e, stop),
              { passive: false },
            );
          }
          handle.addEventListener('keydown', (e) => handleKeydownStop(e, stop));
          const stopColorHexSet = typeof stop.color === 'string'
            ? stop.color
            : sampleColorAtPosition(data, midpoints, stop.position ?? 0);
          const focusLabelSet = `Color handle for ${hexForA11y(stopColorHexSet)}`;
          handle.addEventListener('focus', () => announceToScreenReader(focusLabelSet, 'polite'));
          handlesWrap.appendChild(handle);
        }
        if (showMidpoints && index < midpoints.length) {
          const mid = midpoints[index];
          const i = index;
          const sortedStops = [...data.colorStops].sort(
            (a, b) => (a.position ?? 0) - (b.position ?? 0),
          );
          const leftHex = sortedStops[i] && typeof sortedStops[i].color === 'string'
            ? sortedStops[i].color
            : DEFAULT_HEX;
          const rightHex = sortedStops[i + 1] && typeof sortedStops[i + 1].color === 'string'
            ? sortedStops[i + 1].color
            : DEFAULT_HEX;
          const midLabel = `Gradient stop between ${hexForA11y(leftHex)} and ${hexForA11y(rightHex)}`;
          const midEl = createTag('div', {
            class: 'gradient-editor-midpoint',
            'data-midpoint-index': String(i),
            role: 'button',
            tabIndex: -1,
            'aria-label': midLabel,
          });
          midEl.style.left = `calc(${mid * 100}% - ${midHalf}px)`;
          const img = createTag('img', { src: MIDPOINT_SVG, alt: '' });
          midEl.appendChild(img);
          if (draggable) {
            midEl.addEventListener('mousedown', (e) => startDragMidpoint(e, i));
            midEl.addEventListener('touchstart', (e) => startDragMidpoint(e, i), { passive: false });
          }
          midEl.addEventListener('keydown', (e) => handleKeydownMidpoint(e, i));
          midEl.addEventListener('focus', () => announceToScreenReader(`Gradient stop between ${hexForA11y(leftHex)} and ${hexForA11y(rightHex)}`, 'polite'));
          handlesWrap.appendChild(midEl);
        }
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
          handle.style.setProperty('--handle-color', color);
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
    destroy: () => { wrapper?.remove(); },
  };
}

export default createGradientEditor;
