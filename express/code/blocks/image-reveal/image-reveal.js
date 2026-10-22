import { createTag } from '../../scripts/utils.js';
import { announceToScreenReader } from '../../scripts/color-shared/spectrum/utils/a11y.js';

// Effects apply CSS filters to the single authored image; the filtered copy is
// clipped to the right of the slider. Duotone needs an SVG filter (see buildDuotoneFilter).
const EFFECTS = [
  { key: 'grayscale', label: 'Grayscale' },
  { key: 'color-punch', label: 'Color punch' },
  { key: 'duotone', label: 'Duotone' },
];
const DUOTONE_SHADOW = [0x00, 0x13, 0xda];
const DUOTONE_HIGHLIGHT = [0x10, 0xff, 0xa8];
const KEY_STEP = 1;
const PAGE_STEP = 10;

let instanceId = 0;

function buildDuotoneFilter(id) {
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

function buildEffectControls(name, onChange) {
  const fieldset = createTag('fieldset', { class: 'image-reveal-effects' });
  fieldset.append(createTag('legend', { class: 'image-reveal-effects-legend' }, 'Effect'));
  EFFECTS.forEach(({ key, label }, index) => {
    const input = createTag('input', {
      type: 'radio',
      name,
      value: key,
      id: `${name}-${key}`,
      class: 'image-reveal-effect-input',
    });
    input.checked = index === 0;
    const option = createTag('label', { class: 'image-reveal-effect', for: input.id });
    option.append(input, createTag('span', { class: 'image-reveal-effect-label' }, label));
    fieldset.append(option);
  });
  fieldset.addEventListener('change', (event) => onChange(event.target.value));
  return fieldset;
}

function initSlider(stage, handle, effectLabel) {
  let value = 50;
  const set = (next) => {
    value = Math.min(100, Math.max(0, Math.round(next)));
    stage.style.setProperty('--image-reveal-position', `${value}%`);
    handle.setAttribute('aria-valuenow', value);
    handle.setAttribute('aria-valuetext', `${value}% original, ${100 - value}% ${effectLabel()}`);
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

export default function decorate(block) {
  const picture = block.querySelector('picture');
  if (!picture) {
    block.remove();
    return;
  }

  instanceId += 1;
  const id = `image-reveal-${instanceId}`;
  const duotoneId = `${id}-duotone`;
  let effect = EFFECTS[0];

  const stage = createTag('div', { class: 'image-reveal-stage' });
  stage.style.setProperty('--image-reveal-duotone', `url(#${duotoneId})`);
  const base = createTag('div', { class: 'image-reveal-layer image-reveal-original' });
  base.append(picture);
  // Same picture/src, so the browser reuses the already-fetched image.
  const filtered = createTag('div', { class: 'image-reveal-layer image-reveal-filtered', 'aria-hidden': 'true' });
  const clone = picture.cloneNode(true);
  clone.querySelectorAll('img').forEach((img) => { img.alt = ''; });
  filtered.append(clone);

  const handle = createTag('div', {
    class: 'image-reveal-handle',
    role: 'slider',
    tabindex: '0',
    'aria-label': 'Before and after comparison',
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    'aria-orientation': 'horizontal',
  });
  handle.append(createTag('span', { class: 'image-reveal-grip', 'aria-hidden': 'true' }));
  stage.append(base, filtered, handle, buildDuotoneFilter(duotoneId));

  const slider = initSlider(stage, handle, () => effect.label.toLowerCase());
  const applyEffect = (key) => {
    effect = EFFECTS.find((e) => e.key === key) || EFFECTS[0];
    stage.dataset.effect = effect.key;
    slider.refresh();
    announceToScreenReader(`${effect.label} effect applied`);
  };
  const controls = buildEffectControls(`${id}-effect`, applyEffect);
  stage.dataset.effect = effect.key;

  const panel = createTag('div', { class: 'image-reveal-panel' });
  const copy = [...block.children].find((row) => !row.querySelector('picture') && row.textContent.trim());
  if (copy) {
    const text = createTag('div', { class: 'image-reveal-copy' });
    text.append(...copy.querySelectorAll(':scope > div > *'));
    panel.append(text);
  }
  panel.append(controls);

  block.replaceChildren(panel, stage);
}
