import { createTag } from '../../utils.js';

const SWIPE_CLOSE_THRESHOLD_PX = 120;
const SWIPE_MAX_DRAG_PX = 400;

export function isMobileViewport() {
  return window.matchMedia('(max-width: 599px)').matches;
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
