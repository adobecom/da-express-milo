import { createTag } from '../../../scripts/utils.js';
import { rgbToHex } from '../../../libs/color-components/utils/ColorConversions.js';
import { MARKER, MOODS } from './constants.js';

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function readPixelAt(canvas, x, y) {
  const ctx = canvas.getContext('2d');
  const [r, g, b] = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
  return rgbToHex({ red: r, green: g, blue: b });
}

function getMarkerOffset(isActive) {
  return isActive ? MARKER.ACTIVE_RADIUS : MARKER.RADIUS;
}

/**
 * Create draggable color-pick markers overlaid on the extraction image.
 *
 * @param {HTMLElement} imageContainer
 * @param {HTMLCanvasElement} canvas
 * @param {import('../../../libs/color-components/controllers/ColorThemeController.js').default} controller
 * @param {object} options
 * @param {Function} options.onMoodOverride
 * @param {Function} options.onZoomStart
 * @param {Function} options.onZoomMove
 * @param {Function} options.onZoomEnd
 * @returns {{ container: HTMLElement, setPositions: Function, selectMarker: Function, destroy: Function }}
 */
export function createImageMarkers(imageContainer, canvas, controller, options = {}) {
  const overlay = createTag('div', { class: 'color-extract-markers' });
  const markers = [];
  let activeIndex = 0;
  let isDragging = false;

  function getContainerRect() {
    return overlay.getBoundingClientRect();
  }

  function pctToCanvas(pctX, pctY) {
    return {
      cx: pctX * canvas.width,
      cy: pctY * canvas.height,
    };
  }

  function positionMarker(el, pctX, pctY, isActive) {
    const offset = getMarkerOffset(isActive);
    el.style.left = `calc(${pctX * 100}% - ${offset}px)`;
    el.style.top = `calc(${pctY * 100}% - ${offset}px)`;
  }

  function setActiveMarker(index) {
    activeIndex = index;
    markers.forEach((m, i) => {
      const isActive = i === index;
      m.el.classList.toggle('is-active', isActive);
      m.el.style.zIndex = isActive ? 10 : 1;
      positionMarker(m.el, m.pctX, m.pctY, isActive);
    });
    controller.setBaseColorIndex(index);
  }

  function handlePointerDown(e, marker, index) {
    e.preventDefault();
    e.stopPropagation();
    isDragging = true;
    setActiveMarker(index);
    overlay.setPointerCapture(e.pointerId);

    const rect = getContainerRect();

    const onMove = (ev) => {
      ev.preventDefault();
      const pctX = clamp((ev.clientX - rect.left) / rect.width, 0, 1);
      const pctY = clamp((ev.clientY - rect.top) / rect.height, 0, 1);

      positionMarker(marker.el, pctX, pctY, true);
      marker.pctX = pctX;
      marker.pctY = pctY;

      const { cx, cy } = pctToCanvas(pctX, pctY);
      const hex = readPixelAt(canvas, cx, cy);
      marker.el.style.setProperty('--marker-color', hex);
      marker.el.setAttribute('aria-valuetext', hex);
      controller.setSwatchHex(index, hex);

      if (options.onZoomMove) options.onZoomMove(marker.el, cx, cy);
    };

    const onUp = (ev) => {
      isDragging = false;
      overlay.releasePointerCapture(ev.pointerId);
      overlay.removeEventListener('pointermove', onMove);
      overlay.removeEventListener('pointerup', onUp);
      overlay.removeEventListener('pointercancel', onUp);
      if (options.onMoodOverride) options.onMoodOverride(MOODS.CUSTOM);
      if (options.onZoomEnd) options.onZoomEnd();
    };

    overlay.addEventListener('pointermove', onMove);
    overlay.addEventListener('pointerup', onUp);
    overlay.addEventListener('pointercancel', onUp);

    if (options.onZoomStart) {
      const { cx, cy } = pctToCanvas(marker.pctX, marker.pctY);
      options.onZoomStart(marker.el, cx, cy);
    }
  }

  function handleKeyDown(e, marker, index) {
    const step = e.shiftKey ? 0.05 : 0.01;
    let { pctX, pctY } = marker;
    let handled = true;

    switch (e.key) {
      case 'ArrowLeft': pctX = clamp(pctX - step, 0, 1); break;
      case 'ArrowRight': pctX = clamp(pctX + step, 0, 1); break;
      case 'ArrowUp': pctY = clamp(pctY - step, 0, 1); break;
      case 'ArrowDown': pctY = clamp(pctY + step, 0, 1); break;
      default: handled = false;
    }

    if (!handled) return;
    e.preventDefault();

    marker.pctX = pctX;
    marker.pctY = pctY;
    positionMarker(marker.el, pctX, pctY, index === activeIndex);

    const { cx, cy } = pctToCanvas(pctX, pctY);
    const hex = readPixelAt(canvas, cx, cy);
    marker.el.style.setProperty('--marker-color', hex);
    marker.el.setAttribute('aria-valuetext', hex);
    controller.setSwatchHex(index, hex);
    if (options.onMoodOverride) options.onMoodOverride(MOODS.CUSTOM);
  }

  function createMarker(index, hex, pctX, pctY) {
    const isActive = index === activeIndex;
    const el = createTag('div', {
      class: `color-extract-marker ${isActive ? 'is-active' : ''}`,
      tabindex: '0',
      role: 'slider',
      'aria-label': `Color ${index + 1} picker handle`,
      'aria-valuetext': hex,
    });

    const dot = createTag('span', { class: 'color-extract-marker-dot', 'aria-hidden': 'true' });
    el.append(dot);

    el.style.setProperty('--marker-color', hex);
    el.style.zIndex = isActive ? 10 : 1;
    positionMarker(el, pctX, pctY, isActive);

    const marker = { el, pctX, pctY };

    el.addEventListener('pointerdown', (e) => handlePointerDown(e, marker, index));
    el.addEventListener('keydown', (e) => handleKeyDown(e, marker, index));
    el.addEventListener('focus', () => setActiveMarker(index));

    markers.push(marker);
    overlay.append(el);
    return marker;
  }

  function setPositions(colors, points) {
    overlay.innerHTML = '';
    markers.length = 0;

    colors.forEach((hex, i) => {
      const pt = points[i] || { x: (i + 1) / (colors.length + 1), y: 0.5 };
      createMarker(i, hex, pt.x, pt.y);
    });

    if (markers.length) setActiveMarker(0);
  }

  function selectMarker(index) {
    if (index >= 0 && index < markers.length) {
      setActiveMarker(index);
      markers[index].el.focus();
    }
  }

  function destroy() {
    overlay.innerHTML = '';
    markers.length = 0;
  }

  return {
    container: overlay,
    setPositions,
    selectMarker,
    get isDragging() { return isDragging; },
    destroy,
  };
}
