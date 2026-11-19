// Effects apply CSS filters to the single selected image; the filtered copy is
// clipped to the right of the slider. Duotone needs an SVG filter.
// Filter values per the designer-approved spec in MWPW-186599 (Jira comments).
const DUOTONE_SHADOW = [0x00, 0x13, 0xda];
const DUOTONE_HIGHLIGHT = [0x10, 0xff, 0xa8];
const KEY_STEP = 1;
const PAGE_STEP = 10;

export function buildDuotoneFilter(id) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'image-reveal-defs');
  const filter = document.createElementNS(ns, 'filter');
  filter.id = id;
  filter.setAttribute('color-interpolation-filters', 'sRGB');
  // Luminance → gray, then map dark→shadow and light→highlight per channel.
  const matrix = document.createElementNS(ns, 'feColorMatrix');
  matrix.setAttribute('type', 'matrix');
  const lum = '0.2126 0.7152 0.0722 0 0';
  matrix.setAttribute('values', `${lum} ${lum} ${lum} 0 0 0 1 0`);
  const transfer = document.createElementNS(ns, 'feComponentTransfer');
  ['R', 'G', 'B'].forEach((channel, i) => {
    const fn = document.createElementNS(ns, `feFunc${channel}`);
    fn.setAttribute('type', 'table');
    fn.setAttribute('tableValues', `${DUOTONE_SHADOW[i] / 255} ${DUOTONE_HIGHLIGHT[i] / 255}`);
    transfer.append(fn);
  });
  filter.append(matrix, transfer);
  svg.append(filter);
  return svg;
}

// valueText(value) returns the aria-valuetext for the current position.
export function initSlider(stage, handle, valueText) {
  let value = 50;
  const set = (next) => {
    value = Math.min(100, Math.max(0, Math.round(next)));
    stage.style.setProperty('--image-reveal-position', `${value}%`);
    stage.classList.toggle('is-at-edge', value === 0 || value === 100);
    handle.setAttribute('aria-valuenow', value);
    handle.setAttribute('aria-valuetext', valueText(value));
  };

  const fromPointer = (event) => {
    const rect = stage.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const ratio = rect.width ? x / rect.width : 0.5;
    const rtl = getComputedStyle(stage).direction === 'rtl';
    set((rtl ? 1 - ratio : ratio) * 100);
  };

  stage.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    stage.setPointerCapture(event.pointerId);
    stage.classList.add('is-dragging');
    fromPointer(event);
    handle.focus({ preventScroll: true });
  });
  stage.addEventListener('pointermove', (event) => {
    if (stage.hasPointerCapture(event.pointerId)) fromPointer(event);
  });
  const end = (event) => {
    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    stage.classList.remove('is-dragging');
  };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);

  handle.addEventListener('keydown', (event) => {
    const rtl = getComputedStyle(stage).direction === 'rtl';
    const forward = rtl ? -1 : 1;
    const steps = {
      ArrowRight: KEY_STEP * forward,
      ArrowUp: KEY_STEP,
      ArrowLeft: -KEY_STEP * forward,
      ArrowDown: -KEY_STEP,
      PageUp: PAGE_STEP,
      PageDown: -PAGE_STEP,
    };
    if (event.key in steps) set(value + steps[event.key]);
    else if (event.key === 'Home') set(0);
    else if (event.key === 'End') set(100);
    else return;
    event.preventDefault();
  });

  set(value);
  return { refresh: () => set(value) };
}
