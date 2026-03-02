/**
 * Color Blindness Simulator modal content.
 * Figma: 7500-496585 (Failing > show warnings and icons), 7674-544174 (Color Blindness Page)
 * Demo: dev/tickets/MWPW-186754/demo/index.html
 *
 * Editable palette with real-time pass/fail per Deuteranopia, Protanopia, Tritanopia.
 */

import { createTag, getLibs } from '../../utils.js';
import {
  TYPE_ORDER,
  TYPE_LABELS,
  DEFECT_DEFINITIONS,
  getConflictPairs,
  getConflictingIndices,
  simulateHex,
} from '../services/createColorBlindnessService.js';

const CONFLICT_ICON_SVG = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1l7 14H1L8 1zm0 4v4m0 2v1"/></svg>';

/**
 * Create Color Blindness simulator modal content.
 * Palette is editable; pass/fail updates in real time.
 * @param {string[]} colors - Hex color strings
 * @returns {{ element: HTMLElement, destroy: () => void, update: (colors: string[]) => void }}
 */
export function createColorBlindnessModalContent(colors = []) {
  let hexColors = colors.map((c) => (String(c).startsWith('#') ? String(c) : `#${c}`));
  if (!hexColors.length) hexColors = ['#ccc', '#999'];

  const main = createTag('main', { class: 'ax-color-blindness-modal-content' });

  /* Conflict status bar */
  const conflictBar = createTag('div', {
    class: 'ax-color-blindness-conflict-bar',
    role: 'status',
    'aria-live': 'polite',
  });
  const conflictLabel = createTag('span', { class: 'ax-color-blindness-conflict-bar__label' });
  conflictLabel.textContent = 'Potential color blind conflicts';
  const conflictStatus = createTag('span', {
    class: 'ax-color-blindness-conflict-bar__status',
    'aria-label': 'Status',
  });
  const iconSpan = createTag('span', { class: 'ax-color-blindness-conflict-bar__icon', 'aria-hidden': 'true' });
  iconSpan.innerHTML = CONFLICT_ICON_SVG;
  const statusText = createTag('span', { class: 'ax-color-blindness-conflict-bar__text' });
  conflictStatus.appendChild(iconSpan);
  conflictStatus.appendChild(statusText);
  conflictBar.appendChild(conflictLabel);
  conflictBar.appendChild(conflictStatus);
  main.appendChild(conflictBar);

  /* Original palette (editable) */
  const originalSection = createTag('section', { 'aria-labelledby': 'ax-cb-original-head' });
  const originalTitle = createTag('h2', { id: 'ax-cb-original-head', class: 'ax-color-blindness-section-title' });
  originalTitle.textContent = 'Original palette';
  const originalRow = createTag('div', { class: 'ax-color-blindness-original-row' });
  originalSection.appendChild(originalTitle);
  originalSection.appendChild(originalRow);
  main.appendChild(originalSection);

  /* Simulation grid */
  const simSection = createTag('section', { 'aria-labelledby': 'ax-cb-sim-head' });
  const simTitle = createTag('h2', { id: 'ax-cb-sim-head', class: 'ax-color-blindness-section-title' });
  simTitle.textContent = 'Color blindness simulator';
  const simGrid = createTag('div', { class: 'ax-color-blindness-sim-grid' });
  simSection.appendChild(simTitle);
  simSection.appendChild(simGrid);
  main.appendChild(simSection);

  function renderPalette() {
    originalRow.innerHTML = '';
    hexColors.forEach((hex, i) => {
      const card = createTag('div', { class: 'ax-color-blindness-swatch-card' });
      const colorDiv = createTag('div', { class: 'ax-color-blindness-swatch-card__color' });
      colorDiv.style.backgroundColor = hex;
      const input = createTag('input', {
        type: 'color',
        class: 'ax-color-blindness-swatch-card__picker',
        value: hex,
        'aria-label': `Edit color ${i + 1}`,
      });
      input.addEventListener('input', (e) => {
        const v = e.target?.value || '#000000';
        hexColors[i] = v.startsWith('#') ? v.toUpperCase() : `#${v.toUpperCase()}`;
        updateAll();
      });
      const hexSpan = createTag('span', { class: 'ax-color-blindness-swatch-card__hex' });
      hexSpan.textContent = hex;
      const copyBtn = createTag('button', {
        type: 'button',
        class: 'ax-color-blindness-swatch-card__copy',
        'aria-label': `Copy ${hex}`,
      });
      copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>';
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const h = e.target.closest('.ax-color-blindness-swatch-card')?.querySelector('.ax-color-blindness-swatch-card__hex')?.textContent;
        if (h) navigator.clipboard?.writeText(h);
      });
      colorDiv.appendChild(input);
      colorDiv.appendChild(copyBtn);
      card.appendChild(colorDiv);
      card.appendChild(hexSpan);
      originalRow.appendChild(card);
    });
  }

  function updateAll() {
    const typePairs = TYPE_ORDER.map((t) => getConflictPairs(hexColors, t));
    const hasConflict = typePairs.some((p) => p.length > 0);

    /* Conflict bar */
    conflictStatus.className = `ax-color-blindness-conflict-bar__status ${hasConflict ? 'has-conflict' : 'no-conflict'}`;
    conflictStatus.setAttribute('aria-label', hasConflict ? 'Conflicts found' : 'No conflicts');
    statusText.textContent = hasConflict ? 'Conflicts found' : 'No conflicts';

    /* Original palette hex labels */
    const cards = originalRow.querySelectorAll('.ax-color-blindness-swatch-card');
    hexColors.forEach((hex, i) => {
      const colorDiv = cards[i]?.querySelector('.ax-color-blindness-swatch-card__color');
      const hexSpan = cards[i]?.querySelector('.ax-color-blindness-swatch-card__hex');
      const picker = cards[i]?.querySelector('.ax-color-blindness-swatch-card__picker');
      if (colorDiv) colorDiv.style.backgroundColor = hex;
      if (hexSpan) hexSpan.textContent = hex;
      if (picker) picker.value = hex;
    });

    /* Sim grid: rows with Pass/Fail + swatches */
    simGrid.innerHTML = '';
    TYPE_ORDER.forEach((type, rowIndex) => {
      const pairs = typePairs[rowIndex] || [];
      const conflicting = getConflictingIndices(pairs);
      const rowFails = pairs.length > 0;
      const simColors = hexColors.map((hex) => simulateHex(hex, type));

      const row = createTag('div', {
        class: `ax-color-blindness-sim-row ${rowFails ? 'ax-color-blindness-sim-row--fail' : 'ax-color-blindness-sim-row--pass'}`,
      });
      const label = createTag('div', { class: 'ax-color-blindness-sim-row__label' });
      const labelSpan = createTag('span', {
        'data-tooltip': '',
        'aria-label': DEFECT_DEFINITIONS[type],
        title: DEFECT_DEFINITIONS[type],
      });
      labelSpan.textContent = TYPE_LABELS[type];
      label.appendChild(labelSpan);
      row.appendChild(label);

      const passFail = createTag('span', {
        class: `ax-color-blindness-sim-row__pass-fail ${rowFails ? 'fail' : 'pass'}`,
        'aria-label': rowFails ? 'Fails' : 'Passes',
      });
      passFail.textContent = rowFails ? 'Fail' : 'Pass';
      row.appendChild(passFail);

      const swatches = createTag('div', { class: 'ax-color-blindness-sim-row__swatches' });
      simColors.forEach((hex, i) => {
        const wrap = createTag('div', {
          class: `ax-color-blindness-sim-swatch${conflicting.has(i) ? ' conflict' : ''}`,
          'aria-label': `Simulated ${TYPE_LABELS[type]} swatch ${i + 1}${conflicting.has(i) ? '; conflict' : ''}`,
        });
        wrap.style.backgroundColor = hex;
        swatches.appendChild(wrap);
      });
      row.appendChild(swatches);
      simGrid.appendChild(row);
    });
  }

  function update(colors) {
    hexColors = (colors || []).map((c) => (String(c).startsWith('#') ? String(c) : `#${c}`));
    if (!hexColors.length) hexColors = ['#ccc', '#999'];
    renderPalette();
    updateAll();
  }

  renderPalette();
  updateAll();

  return {
    element: main,
    destroy: () => {},
    update,
  };
}

let colorBlindnessStylesLoaded = false;

export async function loadColorBlindnessModalStyles() {
  if (colorBlindnessStylesLoaded) return;
  try {
    const { loadStyle, getConfig } = (await import(`${getLibs()}/utils/utils.js`));
    const codeRoot = getConfig?.()?.codeRoot || '/express/code';
    await loadStyle(`${codeRoot}/scripts/color-shared/modal/modal-color-blindness.css`);
    colorBlindnessStylesLoaded = true;
  } catch {
    colorBlindnessStylesLoaded = true;
  }
}
