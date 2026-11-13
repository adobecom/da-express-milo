import {
  createTag,
  decorateButtonsDeprecated,
  getIconElementDeprecated,
  convertToInlineSVG,
} from '../../scripts/utils.js';
import { announceToScreenReader } from '../../scripts/color-shared/spectrum/utils/a11y.js';
import { interpolate } from '../../scripts/color-shared/utils/utilities.js';
import loadImageRevealPlaceholders from '../../scripts/color-shared/i18n/loadImageRevealPlaceholders.js';
import { buildDuotoneFilter, initSlider } from './helpers/slider.js';

const EFFECTS = [
  { key: 'grayscale', labelKey: 'effectGrayscale' },
  { key: 'color-punch', labelKey: 'effectColorPunch' },
  { key: 'duotone', labelKey: 'effectDuotone' },
];
// ≥1200px the Figma design stacks both control groups in the panel;
// below that they become tabs.
const DESKTOP_QUERY = '(min-width: 1200px)';
const THUMB_SIZE = '80';

let instanceId = 0;

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
  thumb.append(createTag('img', {
    src: imgSrc, alt: '', loading: 'lazy', width: THUMB_SIZE, height: THUMB_SIZE,
  }));
  const option = createTag('label', { class: 'image-reveal-thumb' });
  option.append(input, thumb, createTag('span', { class: 'image-reveal-thumb-label' }, label));
  return { option, input, img: thumb.querySelector('img') };
}

function buildGroup(id, title, row) {
  const titleId = `${id}-title`;
  row.setAttribute('role', 'radiogroup');
  row.setAttribute('aria-labelledby', titleId);
  const group = createTag('div', { class: 'image-reveal-group', id });
  group.append(createTag('p', { class: 'image-reveal-group-title', id: titleId }, title), row);
  return group;
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
    } else if (!headerRow && !images.length && row.textContent.trim()) {
      // The header precedes the image rows; inline links in it stay part of it.
      headerRow = row;
    } else if (row.querySelector('a[href]')) {
      ctaRow = row;
    }
  });

  if (!images.length) {
    block.remove();
    return;
  }

  instanceId += 1;
  const id = `image-reveal-${instanceId}`;
  const text = await loadImageRevealPlaceholders();
  const effects = EFFECTS.map(({ key, labelKey }) => ({ key, label: text[labelKey] }));
  let effect = effects[0];
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
    'aria-label': text.sliderAria,
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    'aria-orientation': 'horizontal',
  });
  const grip = createTag('span', { class: 'image-reveal-grip', 'aria-hidden': 'true' });
  handle.append(grip);
  clip.append(base, filtered);
  stage.append(clip, handle, buildDuotoneFilter(`${id}-duotone`));
  const slider = initSlider(stage, handle, (value) => interpolate(text.sliderValueText, {
    original: value,
    effect: 100 - value,
    effectName: effect.label.toLowerCase(),
  }));

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
    effect = effects.find((e) => e.key === key) || effects[0];
    stage.dataset.effect = effect.key;
    slider.refresh();
    announceToScreenReader(interpolate(text.effectApplied, { effectName: effect.label }));
  };

  const swapImage = (index) => {
    if (index === selected || !images[index]) return;
    selected = index;
    paintStage();
    announceToScreenReader(interpolate(text.imageSelected, { imageName: images[selected].label }));
  };

  // --- Control groups ---
  const effectsRow = createTag('div', { class: 'image-reveal-thumbs' });
  effects.forEach(({ key, label }, i) => {
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

  const effectsGroup = buildGroup(`${id}-effects`, text.effectsTitle, effectsRow);
  const tabDefs = [{ label: text.tabEffects, icon: 'S2_Icon_Filters_20_N', panel: effectsGroup }];
  if (images.length > 1) {
    const swapGroup = buildGroup(`${id}-swap`, text.imagesTitle, swapRow);
    tabDefs.push({ label: text.tabImages, icon: 'S2_Icon_Image_20_N', panel: swapGroup });
  }

  const tabList = createTag('div', { class: 'image-reveal-tabs', role: 'tablist', 'aria-label': text.tablistAria });
  const tabButtons = tabDefs.map(({ label, icon, panel }, i) => {
    const button = createTag('button', {
      class: 'image-reveal-tab',
      type: 'button',
      role: 'tab',
      id: `${id}-tab-${i}`,
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

  // Tab semantics only apply while the tablist is shown; otherwise the groups
  // are plain regions named by their radiogroup titles.
  const setTabSemantics = (on) => {
    tabDefs.forEach(({ panel }, i) => {
      if (on) {
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', tabButtons[i].id);
      } else {
        panel.removeAttribute('role');
        panel.removeAttribute('aria-labelledby');
      }
    });
  };

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
    const current = tabButtons.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
    if (current === -1) return;
    const last = tabButtons.length - 1;
    const step = getComputedStyle(tabList).direction === 'rtl' ? -1 : 1;
    const targets = {
      ArrowRight: (current + step + tabButtons.length) % tabButtons.length,
      ArrowLeft: (current - step + tabButtons.length) % tabButtons.length,
      Home: 0,
      End: last,
    };
    if (!(event.key in targets)) return;
    event.preventDefault();
    activateTab(targets[event.key], true);
  });

  const desktopMedia = window.matchMedia(DESKTOP_QUERY);
  // Reserve the two-row height (CSS .has-thumbs-reflow) only when the longest
  // thumb row actually wraps at the current width. Thumbs are fixed-width, so
  // the hidden tab's row is computed from the visible row's metrics.
  const thumbRows = [effectsRow, swapRow];
  const maxThumbs = Math.max(...thumbRows.map((row) => row.children.length));
  const syncReflow = () => {
    const row = thumbRows.find((r) => r.getClientRects().length);
    const thumb = row?.firstElementChild;
    if (desktopMedia.matches || !thumb) {
      block.classList.remove('has-thumbs-reflow');
      return;
    }
    const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    const needed = maxThumbs * thumb.offsetWidth + (maxThumbs - 1) * gap;
    block.classList.toggle('has-thumbs-reflow', needed > row.clientWidth);
  };
  const syncPanels = () => {
    const tabsActive = !desktopMedia.matches && !tabList.hidden;
    setTabSemantics(tabsActive);
    if (tabsActive) {
      const current = tabButtons.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
      activateTab(current === -1 ? 0 : current);
    } else {
      tabDefs.forEach(({ panel }) => { panel.hidden = false; });
    }
    syncReflow();
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
  new ResizeObserver(syncReflow).observe(panel);

  await decorateButtonsDeprecated(block);
  ctaContainer.querySelectorAll('p:not(.action-area)').forEach((p) => p.classList.add('image-reveal-cta-subtext'));
}
