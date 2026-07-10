import { createTag } from '../../scripts/utils.js';
import initFilters, { buildPromo, fetchStrings } from './filters.js';
import {
  trapFocus,
  handleEscapeClose,
  disableBackgroundScroll,
  restoreBackgroundScroll,
} from '../../scripts/color-shared/spectrum/utils/a11y.js';

const CLOSE_ICON_SVG = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="currentColor" d="M7.39832 6L11.33 2.06836C11.7162 1.68262 11.7162 1.05566 11.33 0.669923C10.9442 0.283203 10.3173 0.283203 9.93152 0.669923L5.99988 4.60156L2.06824 0.669923C1.6825 0.283203 1.05554 0.283203 0.669799 0.669923C0.283569 1.05566 0.283569 1.68262 0.669799 2.06836L4.60144 6L0.669799 9.93164C0.283569 10.3174 0.283569 10.9443 0.669799 11.3301C0.862669 11.5234 1.11609 11.6201 1.36902 11.6201C1.62195 11.6201 1.87537 11.5234 2.06824 11.3301L5.99988 7.39844L9.93152 11.3301C10.1244 11.5234 10.3778 11.6201 10.6307 11.6201C10.8837 11.6201 11.1371 11.5234 11.33 11.3301C11.7162 10.9443 11.7162 10.3174 11.33 9.93164L7.39832 6Z"/></svg>';

function createCloseSvg() {
  return new DOMParser().parseFromString(CLOSE_ICON_SVG, 'image/svg+xml').documentElement;
}

export default async function init(block, { onOpenChange, panelId } = {}) {
  const strings = await fetchStrings({ 'fg-filters': 'Filters', 'fg-close-filters': 'Close filters' });

  const overlay = createTag('div', { class: 'fg-overlay', 'aria-hidden': 'true', inert: '' });

  const panel = createTag('div', {
    class: 'fg-panel',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': strings['fg-filters'],
    tabindex: '-1',
    ...(panelId ? { id: panelId } : {}),
  });

  // Close button — tablet panel only (hidden on mobile via CSS)
  const closeBtn = createTag('button', { class: 'fg-panel-close', 'aria-label': strings['fg-close-filters'] });
  closeBtn.appendChild(createCloseSvg());

  // Drag handle — mobile tray only (hidden on tablet via CSS)
  const handle = createTag('div', { class: 'fg-tray-handle', 'aria-hidden': 'true' });

  const filtersEl = createTag('div', { class: 'fg-filters' });

  panel.append(closeBtn, handle, filtersEl, buildPromo('button primary small fg-promo-btn'));
  overlay.appendChild(panel);
  block.appendChild(overlay);

  // ── Open / close ──────────────────────────────────────────────────

  let isOpen = false;
  let focusTrap = null;
  let escapeRelease = null;
  let previouslyFocused = null;

  function close() {
    if (!isOpen) return;
    isOpen = false;
    block.classList.remove('panel-open');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('inert', '');
    restoreBackgroundScroll();
    focusTrap?.release();
    focusTrap = null;
    escapeRelease?.release();
    escapeRelease = null;
    panel.style.transform = '';
    previouslyFocused?.focus();
    previouslyFocused = null;
    onOpenChange?.(false);
  }

  function open() {
    if (isOpen) return;
    isOpen = true;
    previouslyFocused = document.activeElement;
    block.classList.add('panel-open');
    overlay.removeAttribute('aria-hidden');
    overlay.removeAttribute('inert');
    disableBackgroundScroll();
    panel.focus();
    focusTrap = trapFocus(panel);
    escapeRelease = handleEscapeClose(panel, close);
    onOpenChange?.(true);
  }

  // Filters inside the panel: no strip CTA — the panel has its own card CTA above
  const teardownFilters = await initFilters([filtersEl], { showCTA: false, onSelect: close });

  // ── Event wiring ──────────────────────────────────────────────────

  const ac = new AbortController();
  const { signal } = ac;

  closeBtn.addEventListener('click', close, { signal });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); }, { signal });

  // Drag-to-close for the mobile tray
  function onDragStart(e) {
    const startY = e.touches?.[0]?.clientY ?? e.clientY;
    const dragAc = new AbortController();

    const onMove = (ev) => {
      const delta = (ev.touches?.[0]?.clientY ?? ev.clientY) - startY;
      if (delta > 0) panel.style.transform = `translateY(${delta}px)`;
    };

    const onEnd = (ev) => {
      const endY = ev.changedTouches?.[0]?.clientY ?? ev.clientY;
      panel.style.transform = '';
      if (endY - startY > 100) close();
      dragAc.abort();
    };

    window.addEventListener('touchmove', onMove, { passive: true, signal: dragAc.signal });
    window.addEventListener('touchend', onEnd, { signal: dragAc.signal });
    window.addEventListener('mousemove', onMove, { signal: dragAc.signal });
    window.addEventListener('mouseup', onEnd, { signal: dragAc.signal });
  }

  handle.addEventListener('touchstart', onDragStart, { passive: true, signal });
  handle.addEventListener('mousedown', onDragStart, { signal });

  return {
    open,
    close,
    destroy() {
      ac.abort();
      teardownFilters?.();
      close();
      overlay.remove();
    },
  };
}
