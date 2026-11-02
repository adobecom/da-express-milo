import {
  createTag,
  decorateButtonsDeprecated,
  getIconElementDeprecated,
  convertToInlineSVG,
} from '../../scripts/utils.js';
import { announceToScreenReader } from '../../scripts/color-shared/spectrum/utils/a11y.js';

// Effects apply CSS filters to the single selected image; the filtered copy is
// clipped to the right of the slider. Duotone needs an SVG filter (see buildDuotoneFilter).
// Filter values per the designer-approved spec in MWPW-186599 (Jira comments).
const EFFECTS = [
  { key: 'grayscale', label: 'Greyscale' },
  { key: 'color-punch', label: 'Color punch' },
  { key: 'duotone', label: 'Duotone' },
];
const DUOTONE_SHADOW = [0x00, 0x13, 0xda];
const DUOTONE_HIGHLIGHT = [0x10, 0xff, 0xa8];
const KEY_STEP = 1;
const PAGE_STEP = 10;
// ≥1200px the Figma design stacks both control groups in the panel;
// below that they become tabs.
const DESKTOP_QUERY = '(min-width: 1200px)';

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

// 80px CSS thumbs at up to 2x DPR; reuse the pipeline's optimizer params when present.
function thumbSrc(picture) {
  const src = picture.querySelector('img')?.getAttribute('src') || '';
  return src.includes('width=') ? src.replace(/width=\d+/, 'width=160') : src;
}

function buildThumb({ name, value, label, imgSrc, checked, thumbClass }) {
  const input = createTag('input', {
    type: 'radio',
    name,
    value,
    class: 'image-reveal-thumb-input',
  });
  input.checked = checked;
  const thumb = createTag('span', { class: `image-reveal-thumb-img ${thumbClass}`, 'aria-hidden': 'true' });
  thumb.append(createTag('img', { src: imgSrc, alt: '' }));
  const option = createTag('label', { class: 'image-reveal-thumb' });
  option.append(input, thumb, createTag('span', { class: 'image-reveal-thumb-label' }, label));
  return { option, input, img: thumb.querySelector('img') };
}

export default async function decorate(block) {
  const images = [];
  let headerRow = null;
  let ctaRow = null;
  [...block.children].forEach((row) => {
    const picture = row.querySelector('picture');
    if (picture) {
      const labelCell = [...row.children].find((cell) => !cell.contains(picture));
      const label = labelCell?.textContent.trim() || picture.querySelector('img')?.alt?.trim() || '';
      images.push({ label, picture });
    } else if (row.querySelector('a[href]')) {
      ctaRow = row;
    } else if (row.textContent.trim() && !headerRow) {
      headerRow = row;
    }
  });

  if (!images.length) {
    block.remove();
    return;
  }

  instanceId += 1;
  const id = `image-reveal-${instanceId}`;
  let effect = EFFECTS[0];
  let selected = 0;

  block.style.setProperty('--image-reveal-duotone', `url(#${id}-duotone)`);

  // --- Comparison stage ---
  const stage = createTag('div', { class: 'image-reveal-stage', 'data-effect': effect.key });
  // Layers are clipped by an inner wrapper so the slider grip can overflow the stage edges.
  const clip = createTag('div', { class: 'image-reveal-clip' });
  const base = createTag('div', { class: 'image-reveal-layer image-reveal-original' });
  const filtered = createTag('div', { class: 'image-reveal-layer image-reveal-filtered', 'aria-hidden': 'true' });
  const handle = createTag('div', {
    class: 'image-reveal-handle',
    role: 'slider',
    tabindex: '0',
    'aria-label': 'Before and after comparison',
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    'aria-orientation': 'horizontal',
  });
  const grip = createTag('span', { class: 'image-reveal-grip', 'aria-hidden': 'true' });
  handle.append(grip);
  clip.append(base, filtered);
  stage.append(clip, handle, buildDuotoneFilter(`${id}-duotone`));
  const slider = initSlider(stage, handle, () => effect.label.toLowerCase());

  const effectThumbImgs = [];
  const paintStage = () => {
    const { picture } = images[selected];
    const fxClone = picture.cloneNode(true);
    fxClone.querySelectorAll('img').forEach((img) => { img.alt = ''; });
    base.replaceChildren(picture.cloneNode(true));
    filtered.replaceChildren(fxClone);
    const src = thumbSrc(picture);
    effectThumbImgs.forEach((img) => { img.src = src; });
  };

  const applyEffect = (key) => {
    effect = EFFECTS.find((e) => e.key === key) || EFFECTS[0];
    stage.dataset.effect = effect.key;
    slider.refresh();
    announceToScreenReader(`${effect.label} effect applied`);
  };

  const swapImage = (index) => {
    if (index === selected || !images[index]) return;
    selected = index;
    paintStage();
    announceToScreenReader(`${images[selected].label} image selected`);
  };

  // --- Control groups ---
  const effectsRow = createTag('div', { class: 'image-reveal-thumbs' });
  EFFECTS.forEach(({ key, label }, i) => {
    const { option, img } = buildThumb({
      name: `${id}-effect`,
      value: key,
      label,
      imgSrc: thumbSrc(images[selected].picture),
      checked: i === 0,
      thumbClass: `image-reveal-thumb-img--${key}`,
    });
    effectThumbImgs.push(img);
    effectsRow.append(option);
  });
  effectsRow.addEventListener('change', (event) => applyEffect(event.target.value));

  const swapRow = createTag('div', { class: 'image-reveal-thumbs' });
  images.forEach(({ label, picture }, i) => {
    const { option } = buildThumb({
      name: `${id}-image`,
      value: i,
      label,
      imgSrc: thumbSrc(picture),
      checked: i === 0,
      thumbClass: '',
    });
    swapRow.append(option);
  });
  swapRow.addEventListener('change', (event) => swapImage(Number(event.target.value)));

  const effectsGroup = createTag('div', { class: 'image-reveal-group', id: `${id}-effects`, role: 'tabpanel' });
  effectsGroup.append(createTag('p', { class: 'image-reveal-group-title' }, 'Add an image effect'), effectsRow);
  const tabDefs = [{ label: 'Image effects', icon: 'S2_Icon_Filters_20_N', panel: effectsGroup }];
  if (images.length > 1) {
    const swapGroup = createTag('div', { class: 'image-reveal-group', id: `${id}-swap`, role: 'tabpanel' });
    swapGroup.append(createTag('p', { class: 'image-reveal-group-title' }, 'Try a different image'), swapRow);
    tabDefs.push({ label: 'Change image', icon: 'S2_Icon_Image_20_N', panel: swapGroup });
  }

  const tabList = createTag('div', { class: 'image-reveal-tabs', role: 'tablist', 'aria-label': 'Image sandbox controls' });
  const tabButtons = tabDefs.map(({ label, icon, panel }, i) => {
    const tabId = `${id}-tab-${i}`;
    panel.setAttribute('aria-labelledby', tabId);
    const button = createTag('button', {
      class: 'image-reveal-tab',
      type: 'button',
      role: 'tab',
      id: tabId,
      'aria-selected': String(i === 0),
      'aria-controls': panel.id,
    });
    button.tabIndex = i === 0 ? 0 : -1;
    const iconSpan = createTag('span', { class: 'image-reveal-tab-icon', 'aria-hidden': 'true' });
    convertToInlineSVG(getIconElementDeprecated(icon)).then((svg) => iconSpan.append(svg));
    button.append(iconSpan, label);
    tabList.append(button);
    return button;
  });
  tabList.hidden = tabDefs.length < 2;

  function activateTab(index, focus = false) {
    tabButtons.forEach((tab, i) => {
      const active = i === index;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      tabDefs[i].panel.hidden = !active;
    });
    if (focus) tabButtons[index].focus();
  }

  tabButtons.forEach((tab, i) => tab.addEventListener('click', () => activateTab(i)));
  tabList.addEventListener('keydown', (event) => {
    if (!['ArrowRight', 'ArrowLeft'].includes(event.key)) return;
    event.preventDefault();
    const current = tabButtons.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
    if (current === -1) return;
    const next = (current + (event.key === 'ArrowLeft' ? -1 : 1) + tabButtons.length) % tabButtons.length;
    activateTab(next, true);
  });

  const desktopMedia = window.matchMedia(DESKTOP_QUERY);
  const syncPanels = () => {
    if (desktopMedia.matches) {
      tabDefs.forEach(({ panel }) => { panel.hidden = false; });
    } else {
      const current = tabButtons.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
      activateTab(current === -1 ? 0 : current);
    }
  };
  desktopMedia.addEventListener('change', syncPanels);

  // --- CTA ---
  const ctaContainer = createTag('div', { class: 'image-reveal-cta' });
  const ctaCell = ctaRow?.querySelector(':scope > div');
  if (ctaCell) ctaContainer.append(...[...ctaCell.children]);

  // --- Assemble ---
  const panel = createTag('div', { class: 'image-reveal-panel' });
  panel.append(tabList, ...tabDefs.map(({ panel: p }) => p), ctaContainer);

  const headerContainer = createTag('div', { class: 'image-reveal-header' });
  const headerCell = headerRow?.querySelector(':scope > div');
  if (headerCell) headerContainer.append(...[...headerCell.children]);

  const sandbox = createTag('div', { class: 'image-reveal-sandbox' });
  sandbox.append(panel, stage);
  block.replaceChildren(headerContainer, sandbox);

  convertToInlineSVG(getIconElementDeprecated('S2_Icon_ArrowLeftRight_20_N')).then((svg) => grip.append(svg));

  paintStage();
  syncPanels();

  await decorateButtonsDeprecated(block);
  ctaContainer.querySelectorAll('p:not(.action-area)').forEach((p) => p.classList.add('image-reveal-cta-subtext'));
}
