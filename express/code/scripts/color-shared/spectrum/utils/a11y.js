let liveRegion = null;
let clearTimer = null;

function getOrCreateLiveRegion() {
  if (liveRegion && document.body.contains(liveRegion)) return liveRegion;
  liveRegion = document.createElement('div');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.setAttribute('role', 'status');
  Object.assign(liveRegion.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0,0,0,0)',
    whiteSpace: 'nowrap',
    border: '0',
  });
  document.body.appendChild(liveRegion);
  return liveRegion;
}

export function announceToScreenReader(message, politeness = 'polite', duration = 1500) {
  const region = getOrCreateLiveRegion();
  region.setAttribute('aria-live', politeness);
  if (clearTimer) clearTimeout(clearTimer);
  region.textContent = '';
  requestAnimationFrame(() => {
    region.textContent = message;
    clearTimer = setTimeout(() => {
      region.textContent = '';
      clearTimer = null;
    }, duration);
  });
}

export function ariaDescribedBy(targetEl, describedByEl) {
  if (!targetEl || !describedByEl) return null;
  if (!describedByEl.id) {
    describedByEl.id = `aria-desc-${Math.random().toString(36).slice(2, 9)}`;
  }
  const existing = targetEl.getAttribute('aria-describedby') || '';
  if (!existing.includes(describedByEl.id)) {
    targetEl.setAttribute('aria-describedby', `${existing} ${describedByEl.id}`.trim());
  }
  return describedByEl.id;
}
