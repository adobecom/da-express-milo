import { createTag } from '../../scripts/utils.js';
import { setState, getState, subscribe } from './state.js';

const MIN_SIZE = 16;
const MAX_SIZE = 120;
const STEP = 4;

function buildLayoutToggle(container, { gridLabel = 'Grid', listLabel = 'List' } = {}) {
  const group = createTag('div', { class: 'fg-layout-toggle', role: 'group', 'aria-label': 'Card layout' });

  const gridBtn = createTag('button', {
    class: 'fg-layout-btn',
    type: 'button',
    'aria-pressed': 'true',
    'aria-label': gridLabel,
    'data-layout': 'grid',
  });
  gridBtn.textContent = gridLabel;

  const listBtn = createTag('button', {
    class: 'fg-layout-btn',
    type: 'button',
    'aria-pressed': 'false',
    'aria-label': listLabel,
    'data-layout': 'list',
  });
  listBtn.textContent = listLabel;

  function setActive(layout) {
    gridBtn.setAttribute('aria-pressed', String(layout === 'grid'));
    listBtn.setAttribute('aria-pressed', String(layout === 'list'));
    gridBtn.classList.toggle('fg-layout-btn--active', layout === 'grid');
    listBtn.classList.toggle('fg-layout-btn--active', layout === 'list');
  }

  setActive(getState().layout);

  function handleClick(e) {
    const btn = e.target.closest('[data-layout]');
    if (!btn) return;
    setState({ layout: btn.dataset.layout });
  }
  group.addEventListener('click', handleClick);

  subscribe((snap) => setActive(snap.layout));

  group.append(gridBtn, listBtn);
  container.append(group);
}

function buildFontSizeSlider(container, { sizeLabel = 'Font size' } = {}) {
  const wrapper = createTag('div', { class: 'fg-size-control' });

  const label = createTag('label', { class: 'fg-size-label', for: 'fg-size-slider' });
  label.textContent = sizeLabel;

  const slider = createTag('input', {
    id: 'fg-size-slider',
    class: 'fg-size-slider',
    type: 'range',
    min: String(MIN_SIZE),
    max: String(MAX_SIZE),
    step: String(STEP),
    'aria-label': sizeLabel,
  });
  slider.value = String(getState().fontSize);

  const display = createTag('span', { class: 'fg-size-display', 'aria-live': 'polite' });
  display.textContent = `${getState().fontSize}px`;

  slider.addEventListener('input', () => {
    const size = Number(slider.value);
    setState({ fontSize: size });
    display.textContent = `${size}px`;
  });

  subscribe((snap) => {
    if (slider.value !== String(snap.fontSize)) slider.value = String(snap.fontSize);
    display.textContent = `${snap.fontSize}px`;
  });

  wrapper.append(label, slider, display);
  container.append(wrapper);
}

/**
 * Initialises the toolbar: layout toggle + font-size slider.
 *
 * @param {HTMLElement} container - The `.fg-toolbar` div to populate.
 * @param {{
 *   gridLabel?: string,
 *   listLabel?: string,
 *   sizeLabel?: string
 * }} labels
 */
export function init(container, { gridLabel, listLabel, sizeLabel } = {}) {
  buildLayoutToggle(container, { gridLabel, listLabel });
  buildFontSizeSlider(container, { sizeLabel });
}
