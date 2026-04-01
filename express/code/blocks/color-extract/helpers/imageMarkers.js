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

/**
 * Create draggable color-pick markers overlaid on the extraction image.
 * Desktop (mouse): handle magnifies on drag — grows to show zoomed canvas.
 * Mobile (touch):  handle stays normal; teardrop color loupe appears above.
 */

/* ═══════════════ Connector lines (gradient variant) ═══════════════ */

function createConnectorSVG() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'color-extract-connector-lines');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;';
  return svg;
}

function drawConnectorLines(svg, markerList, order) {
  svg.innerHTML = '';
  if (!order || order.length < 2) return;
  for (let i = 0; i < order.length - 1; i += 1) {
    const from = markerList[order[i]];
    const to = markerList[order[i + 1]];
    if (!from || !to) continue;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', `${from.pctX * 100}%`);
    line.setAttribute('y1', `${from.pctY * 100}%`);
    line.setAttribute('x2', `${to.pctX * 100}%`);
    line.setAttribute('y2', `${to.pctY * 100}%`);
    line.setAttribute('stroke', 'rgba(255,255,255,0.9)');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-linecap', 'round');
    svg.appendChild(line);
  }
}

/* ═══════════════ Desktop handle magnification ═══════════════ */

function createZoomCanvas() {
  const c = document.createElement('canvas');
  c.className = 'color-extract-marker-zoom';
  c.width = MARKER.MAGNIFIED_DIAMETER;
  c.height = MARKER.MAGNIFIED_DIAMETER;
  c.setAttribute('aria-hidden', 'true');
  return c;
}

function renderMagnification(zoomCanvas, sourceCanvas, cx, cy) {
  const size = MARKER.MAGNIFIED_DIAMETER; // 80
  const scale = MARKER.ZOOM_SCALE;        // 8
  const sampleR = Math.floor(size / scale / 2); // 5
  const ctx = zoomCanvas.getContext('2d');

  ctx.clearRect(0, 0, size, size);
  ctx.imageSmoothingEnabled = false;

  const sx = Math.max(0, Math.round(cx) - sampleR);
  const sy = Math.max(0, Math.round(cy) - sampleR);
  const sw = Math.min(sampleR * 2, sourceCanvas.width - sx);
  const sh = Math.min(sampleR * 2, sourceCanvas.height - sy);

  if (sw > 0 && sh > 0) {
    ctx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, size, size);
  }
}

/* ═══════════════ Mobile color loupe (Spectrum SVG teardrop) ═══════════════ */
/*
 * Uses the exact SVG path from Spectrum CSS (colorloupe component).
 * Path viewBox: 48×64 (44×60 path + 2px translate for stroke padding).
 * Rendered at 70×93 CSS px to match the Express Figma spec (12871:645832).
 *
 * References:
 *   Spectrum CSS: colorloupe/stories/template.js
 *   Spectrum S2 Figma: Mngz9H7WZLbrCvGQf3GnsY node 125275-56759
 *   Express Figma:  mcJuQTxJdWsL0dMmqaecpn node 12871-645831
 */

// Canonical Spectrum color-loupe path (44×60 units)
const LOUPE_PATH = 'M 22 60 C 18.2 56 14.6 51.7 11.3 47.2 '
  + 'C 8.3 43.3 5.7 39.1 3.5 34.7 C 1.2 30 0 25.9 0 22.4 '
  + 'C 0 17.2 1.8 12.2 5 8.2 C 8.2 4.2 12.7 1.5 17.6 0.4 '
  + 'C 22.6 -0.6 27.8 0.2 32.3 2.6 C 36.8 5 40.3 8.9 42.3 13.7 '
  + 'C 43.4 16.4 44 19.4 44 22.4 C 44 25.9 42.8 30 40.5 34.7 '
  + 'C 38.3 39.1 35.7 43.3 32.7 47.3 C 29.4 51.7 25.8 56 22 60 Z';

function createMobileLoupe() {
  const W = MARKER.LOUPE_WIDTH;  // 70
  const H = MARKER.LOUPE_HEIGHT; // 93
  const GAP = 12; // px between loupe tip and handle top edge

  const loupe = createTag('div', {
    class: 'color-extract-loupe',
    'aria-hidden': 'true',
  });

  // Build SVG with two copies of the path: fill + white border stroke
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 48 64');
  svg.setAttribute('width', String(W));
  svg.setAttribute('height', String(H));
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.style.display = 'block';

  const fillPath = document.createElementNS(NS, 'path');
  fillPath.setAttribute('d', LOUPE_PATH);
  fillPath.setAttribute('transform', 'translate(2,2)');
  fillPath.setAttribute('fill', '#808080');

  const strokePath = document.createElementNS(NS, 'path');
  strokePath.setAttribute('d', LOUPE_PATH);
  strokePath.setAttribute('transform', 'translate(2,2)');
  strokePath.setAttribute('fill', 'none');
  strokePath.setAttribute('stroke', '#fff');
  strokePath.setAttribute('stroke-width', '3');

  svg.append(fillPath, strokePath);
  loupe.append(svg);
  loupe.hidden = true;

  /** Update fill color — one attribute change, no redraw needed. */
  function setColor(hex) {
    fillPath.setAttribute('fill', hex || '#808080');
  }

  /** Position loupe ABOVE the handle, centered, with GAP px clearance. */
  function position(markerEl, flipped) {
    const mr = markerEl.getBoundingClientRect();
    const pr = markerEl.closest('.color-extract-markers')?.getBoundingClientRect();
    if (!pr) return;

    const mCenterX = mr.left - pr.left + mr.width / 2;
    const mCenterY = mr.top - pr.top + mr.height / 2;
    const mHalfH = mr.height / 2;
    const handleTop = mCenterY - mHalfH;

    let lx = mCenterX - W / 2;
    let ly = handleTop - GAP - H;
    let flip = false;

    // If loupe would go off the top, place below handle and flip the SVG
    if (ly < 0) {
      ly = mCenterY + mHalfH + GAP;
      flip = true;
    }

    // Clamp horizontally
    if (pr.width > W) {
      lx = Math.max(0, Math.min(lx, pr.width - W));
    }

    loupe.style.left = `${Math.round(lx)}px`;
    loupe.style.top = `${Math.round(ly)}px`;
    loupe.style.transform = flip ? 'scaleY(-1)' : '';
  }

  return {
    element: loupe,
    show(markerEl, hex) { setColor(hex); position(markerEl); loupe.hidden = false; },
    move(markerEl, hex) { setColor(hex); position(markerEl); },
    hide() { loupe.hidden = true; },
  };
}

/* ═══════════════ Main factory ═══════════════ */

export function createImageMarkers(imageContainer, canvas, controller, options = {}) {
  const overlay = createTag('div', { class: 'color-extract-markers' });
  const markers = [];
  const connectorSvg = options.showConnectors ? createConnectorSVG() : null;
  const loupe = createMobileLoupe();
  let connectorOrder = null;
  let activeIndex = 0;
  let isDragging = false;
  let keyboardSnapshotPending = true;

  overlay.append(loupe.element);

  function getContainerRect() { return overlay.getBoundingClientRect(); }

  function pctToCanvas(pctX, pctY) {
    return { cx: pctX * canvas.width, cy: pctY * canvas.height };
  }

  /** Center-based positioning via CSS transform — size-independent. */
  function positionMarker(el, pctX, pctY) {
    el.style.left = `${pctX * 100}%`;
    el.style.top = `${pctY * 100}%`;
  }

  function setActiveMarker(index) {
    activeIndex = index;
    markers.forEach((m, i) => {
      const active = i === index;
      m.el.classList.toggle('is-active', active);
      m.el.style.zIndex = active ? 10 : 1;
      positionMarker(m.el, m.pctX, m.pctY);
    });
    controller.setBaseColorIndex(index);
  }

  function updateConnectors() {
    if (connectorSvg && connectorOrder) drawConnectorLines(connectorSvg, markers, connectorOrder);
  }

  /* ── Magnification + loupe ──
   * Desktop (mouse): handle magnifies with zoomed image.
   * Mobile (touch):  handle magnifies with zoomed image AND loupe shows solid color above.
   */

  function startMag(marker, cx, cy, touch) {
    // Handle magnification (both desktop and mobile)
    marker.el.classList.add('is-magnified');
    const zc = marker.el.querySelector('.color-extract-marker-zoom');
    if (zc) renderMagnification(zc, canvas, cx, cy);

    // Loupe (mobile only — solid color teardrop above the handle)
    if (touch) {
      loupe.show(marker.el, marker.el.style.getPropertyValue('--marker-color'));
    }
  }

  function updateMag(marker, cx, cy, touch) {
    const zc = marker.el.querySelector('.color-extract-marker-zoom');
    if (zc) renderMagnification(zc, canvas, cx, cy);

    if (touch) {
      loupe.move(marker.el, marker.el.style.getPropertyValue('--marker-color'));
    }
  }

  function endMag(marker) {
    marker.el.classList.remove('is-magnified');
    loupe.hide();
  }

  /* ── Pointer / keyboard handlers ── */

  function handlePointerDown(e, marker, index) {
    e.preventDefault();
    e.stopPropagation();
    isDragging = true;
    setActiveMarker(index);
    overlay.setPointerCapture(e.pointerId);

    const touch = e.pointerType === 'touch';
    if (options.onDragStart) options.onDragStart();

    const rect = getContainerRect();
    const { cx: sCx, cy: sCy } = pctToCanvas(marker.pctX, marker.pctY);
    startMag(marker, sCx, sCy, touch);

    const onMove = (ev) => {
      ev.preventDefault();
      const pctX = clamp((ev.clientX - rect.left) / rect.width, 0, 1);
      const pctY = clamp((ev.clientY - rect.top) / rect.height, 0, 1);

      positionMarker(marker.el, pctX, pctY);
      marker.pctX = pctX;
      marker.pctY = pctY;

      const { cx, cy } = pctToCanvas(pctX, pctY);
      const hex = readPixelAt(canvas, cx, cy);
      marker.el.style.setProperty('--marker-color', hex);
      marker.el.setAttribute('aria-valuetext', hex);
      controller.setSwatchHex(index, hex);
      updateConnectors();
      updateMag(marker, cx, cy, touch);
    };

    const onUp = (ev) => {
      isDragging = false;
      overlay.releasePointerCapture(ev.pointerId);
      overlay.removeEventListener('pointermove', onMove);
      overlay.removeEventListener('pointerup', onUp);
      overlay.removeEventListener('pointercancel', onUp);
      endMag(marker);
      if (options.onMoodOverride) options.onMoodOverride(MOODS.CUSTOM);
    };

    overlay.addEventListener('pointermove', onMove);
    overlay.addEventListener('pointerup', onUp);
    overlay.addEventListener('pointercancel', onUp);
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
    if (keyboardSnapshotPending && options.onDragStart) { options.onDragStart(); keyboardSnapshotPending = false; }
    marker.pctX = pctX;
    marker.pctY = pctY;
    positionMarker(marker.el, pctX, pctY);
    const { cx, cy } = pctToCanvas(pctX, pctY);
    const hex = readPixelAt(canvas, cx, cy);
    marker.el.style.setProperty('--marker-color', hex);
    marker.el.setAttribute('aria-valuetext', hex);
    controller.setSwatchHex(index, hex);
    updateConnectors();
    if (options.onMoodOverride) options.onMoodOverride(MOODS.CUSTOM);
  }

  /* ── Marker creation ── */

  function createMarker(index, hex, pctX, pctY) {
    const active = index === activeIndex;
    const el = createTag('div', {
      class: `color-extract-marker ${active ? 'is-active' : ''}`,
      tabindex: '0',
      role: 'slider',
      'aria-label': `Color ${index + 1} picker handle`,
      'aria-valuetext': hex,
    });

    el.append(createZoomCanvas());
    el.append(createTag('span', { class: 'color-extract-marker-dot', 'aria-hidden': 'true' }));

    el.style.setProperty('--marker-color', hex);
    el.style.zIndex = active ? 10 : 1;
    positionMarker(el, pctX, pctY);

    const marker = { el, pctX, pctY };
    el.addEventListener('pointerdown', (e) => handlePointerDown(e, marker, index));
    el.addEventListener('keydown', (e) => handleKeyDown(e, marker, index));
    el.addEventListener('focus', () => { keyboardSnapshotPending = true; setActiveMarker(index); });

    markers.push(marker);
    overlay.append(el);
    return marker;
  }

  /* ── Public API ── */

  function setPositions(colors, points) {
    overlay.innerHTML = '';
    markers.length = 0;
    if (connectorSvg) overlay.append(connectorSvg);
    overlay.append(loupe.element);
    colors.forEach((hex, i) => {
      const pt = points[i] || { x: (i + 1) / (colors.length + 1), y: 0.5 };
      createMarker(i, hex, pt.x, pt.y);
    });
    connectorOrder = colors.map((_, i) => i);
    updateConnectors();
    if (markers.length) setActiveMarker(0);
  }

  /**
   * Add a single new marker without resetting existing ones.
   * Returns the new marker index.
   */
  function addMarker(hex, pctX = 0.5, pctY = 0.5) {
    const index = markers.length;
    createMarker(index, hex, pctX, pctY);
    if (connectorOrder) {
      connectorOrder.push(index);
      updateConnectors();
    }
    setActiveMarker(index);
    return index;
  }

  function getPositions() {
    return markers.map((m) => ({ pctX: m.pctX, pctY: m.pctY }));
  }

  return {
    container: overlay,
    setPositions,
    addMarker,
    getPositions,
    selectMarker(index) {
      if (index >= 0 && index < markers.length) { setActiveMarker(index); markers[index].el.focus(); }
    },
    setConnectorOrder(order) { connectorOrder = order; updateConnectors(); },
    get isDragging() { return isDragging; },
    get markerCount() { return markers.length; },
    destroy() { overlay.innerHTML = ''; markers.length = 0; overlay.remove(); },
  };
}
