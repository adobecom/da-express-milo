import { createTag } from '../../utils.js';

const SWIPE_CLOSE_THRESHOLD_PX = 120;
const SWIPE_MAX_DRAG_PX = 400;

export function isMobileViewport() {
  return window.matchMedia('(max-width: 599px)').matches;
}

export function isTabletViewport() {
  return window.matchMedia('(min-width: 600px) and (max-width: 1199px)').matches;
}

export function isMobileOrTabletViewport() {
  return isMobileViewport() || isTabletViewport();
}

/**
 * @param {string} className
 * @param {Function|null} onClose
 * @param {{ debounceMs?: number }} [opts]
 */
export function createCurtain(className, onClose, { debounceMs = 0 } = {}) {
  const curtain = createTag('div', { class: className, 'aria-hidden': 'true' });
  if (onClose) {
    const createdAt = Date.now();
    curtain.addEventListener('click', (e) => {
      if (e.target !== curtain) return;
      if (debounceMs && Date.now() - createdAt < debounceMs) return;
      onClose();
    });
  }
  return curtain;
}

/**
 * Adds touch-based swipe-to-close for mobile bottom-sheet drawers.
 * Only activates when viewport width < 600px and content is scrolled to top.
 * @returns cleanup function to remove listeners
 */
export function addSwipeToClose(container, { contentSelector, draggingClass, onClose }) {
  let startY = 0;
  let currentDragY = 0;

  function onStart(e) {
    startY = e.touches[0].clientY;
    currentDragY = 0;
  }

  function onMove(e) {
    if (!isMobileViewport()) return;
    const content = container.querySelector(contentSelector);
    if (!content || content.scrollTop > 2) return;
    const deltaY = e.touches[0].clientY - startY;
    if (deltaY <= 0) return;
    currentDragY = Math.min(deltaY, SWIPE_MAX_DRAG_PX);
    container.classList.add(draggingClass);
    container.style.setProperty('--drawer-drag-y', `${currentDragY}px`);
  }

  function onEnd() {
    if (!isMobileViewport()) return;
    container.classList.remove(draggingClass);
    if (currentDragY > SWIPE_CLOSE_THRESHOLD_PX) {
      onClose();
    } else {
      container.style.removeProperty('--drawer-drag-y');
    }
    currentDragY = 0;
  }

  container.addEventListener('touchstart', onStart, { passive: true });
  container.addEventListener('touchmove', onMove, { passive: true });
  container.addEventListener('touchend', onEnd, { passive: true });
  container.addEventListener('touchcancel', onEnd, { passive: true });

  return () => {
    container.removeEventListener('touchstart', onStart);
    container.removeEventListener('touchmove', onMove);
    container.removeEventListener('touchend', onEnd);
    container.removeEventListener('touchcancel', onEnd);
  };
}

export function lockBodyScroll(className = 'ax-drawer-body-locked') {
  document.body.classList.add(className);
}

export function unlockBodyScroll(className = 'ax-drawer-body-locked') {
  document.body.classList.remove(className);
}

export function saveFocusedElement() {
  const el = document.activeElement;
  return (el instanceof Node && document.body.contains(el)) ? el : null;
}

export function restoreFocusedElement(el) {
  if (el && typeof el.focus === 'function' && document.body.contains(el)) {
    el.focus();
  }
}

let overlayZCounter = 89;
const OVERLAY_Z_MAX = 98;

export function getNextOverlayZIndex() {
  if (overlayZCounter < OVERLAY_Z_MAX) overlayZCounter += 1;
  return overlayZCounter;
}

export function ensureHash(hex) {
  return hex.startsWith('#') ? hex : `#${hex}`;
}

export const PALETTE_PRESETS = [
  { colors: ['#811B0E', '#D29500', '#FFEBE8', '#D7F7E1', '#1D3ECF'] },
  { colors: ['#D73220', '#F4DACB', '#1286CD', '#68150A', '#1F0062'] },
  { colors: ['#AF7400', '#FFF197', '#FF9D91', '#0E1843', '#120B00'] },
  { colors: ['#FF4885', '#CBE2FE', '#EDC4AC', '#10288C', '#4B0090'] },
  { colors: ['#2A0081', '#B7E7FC', '#FFD3F0', '#F5C700', '#BA1650'] },
  { colors: ['#ADEEC5', '#B72818', '#E86A00', '#3B63FB', '#480058'] },
  { colors: ['#1C3A16', '#04953D', '#482E0A', '#D0F1B7', '#FCFAFA', '#607F5D', '#1C221B'] },
  { colors: ['#911400', '#F7E7CB', '#3B0014', '#9AB6FF', '#00291B', '#F2B9A9'] },
  { colors: ['#2086F9', '#00428D', '#F1EDE5', '#FEFFB2', '#F04517', '#181B1E'] },
  { colors: ['#2B2D42', '#9DD8FF', '#B20D30', '#999CC0', '#FFB997', '#1D7874'] },
  { colors: ['#F1EEE1', '#1A1717', '#627E2E', '#D2AF9A', '#602222', '#B6DAF0'] },
];

export function pickRandomPalette() {
  const index = Math.floor(Math.random() * PALETTE_PRESETS.length);
  return PALETTE_PRESETS[index];
}

export const PARAM_NAME = 'color-palette';
export const PARAM_PALETTE_NAME = 'color-palette-name';

const HEX_3 = /^[0-9a-f]{3}$/i;
const HEX_6 = /^[0-9a-f]{6}$/i;

export function normalizeHex(segment) {
  if (segment == null) return null;
  const trimmed = String(segment).trim().replace(/^#/, '');
  if (HEX_6.test(trimmed)) return `#${trimmed.toUpperCase()}`;
  if (HEX_3.test(trimmed)) {
    const [r, g, b] = trimmed;
    return `#${(r + r + g + g + b + b).toUpperCase()}`;
  }
  return null;
}

export function createColorPaletteParamApi() {
  function getResolvedPalette(urlOrString) {
    let url;
    try {
      url = new URL(urlOrString || window.location.href);
    } catch {
      return pickRandomPalette().colors;
    }

    const raw = url.searchParams.get(PARAM_NAME);
    if (!raw || !raw.trim()) return pickRandomPalette().colors;

    const segments = raw.split(',');
    const normalized = [];
    for (const seg of segments) {
      const hex = normalizeHex(seg);
      if (!hex) return pickRandomPalette().colors;
      normalized.push(hex);
    }
    return normalized;
  }

  function getResolvedPaletteName(urlOrString) {
    let url;
    try {
      url = new URL(urlOrString || window.location.href);
    } catch {
      return undefined;
    }
    const raw = url.searchParams.get(PARAM_PALETTE_NAME);
    return (raw && raw.trim()) || undefined;
  }

  function setOnUrl(url, colors, { merge = 'replace', name } = {}) {
    const normalized = colors
      .map((c) => normalizeHex(c))
      .filter(Boolean)
      .map((hex) => hex.slice(1));

    if (!normalized.length) return;

    if (merge === 'append') {
      const existing = url.searchParams.get(PARAM_NAME);
      if (existing) {
        url.searchParams.set(PARAM_NAME, `${existing},${normalized.join(',')}`);
        return;
      }
    }

    url.searchParams.set(PARAM_NAME, normalized.join(','));

    if (name) {
      url.searchParams.set(PARAM_PALETTE_NAME, name);
    }
  }

  return {
    getResolvedPalette,
    getResolvedPaletteName,
    setOnUrl,
    PARAM_NAME,
    PARAM_PALETTE_NAME,
  };
}

export function normalizeTheme(theme) {
  return {
    id: theme.id ?? '',
    name: theme.name ?? 'My Color Theme',
    colors: (theme.swatches ?? []).map((s) => {
      if (typeof s === 'string') return ensureHash(s);
      if (s.hex) return ensureHash(s.hex);
      if (s.color) return ensureHash(s.color);
      if (s.values && s.values.length >= 3) {
        const [r, g, b] = s.values.map((v) => Math.round(Number.parseFloat(v) * 255));
        return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
      }
      return '#000000';
    }),
    tags: (theme.tags ?? []).map((t) => {
      if (typeof t === 'string') return t;
      return t?.tag ?? t?.name ?? '';
    }).filter(Boolean),
    author: theme.author ?? null,
    likes: theme.likes ?? 0,
  };
}
