/**
 * Mock (not for prod). Single file for all gradient + gradient-strip demo rendering in color-explore.
 * Delete this file and its import in createGradientsRenderer.js when mocks are no longer needed.
 */

import { createTag } from '../../../scripts/utils.js';
import { createGradientEditor } from '../../../scripts/color-shared/components/gradients/gradient-editor.js';
import { createGradientDetailSection } from '../../../scripts/color-shared/components/gradients/gradient-strip-tall.js';
import { createGradientStripElements } from '../../../scripts/color-shared/components/gradients/gradient-strip.js';
import { GRADIENT_EDITOR_FIGMA_SIZES, GRADIENT_STRIP_TALL_FIGMA_SIZES } from '../../../scripts/color-shared/components/gradients/gradient-figma-sizes.js';

const MOCK_GRADIENT = {
  type: 'linear',
  angle: 90,
  colorStops: [
    { color: '#bfcdd9', position: 0 },
    { color: '#3f8ebf', position: 0.25 },
    { color: '#49590b', position: 0.5 },
    { color: '#8da634', position: 0.75 },
    { color: '#818c2b', position: 1 },
  ],
};

/**
 * Inline gradient editor (before grid). Mock only.
 * @param {Object} options - { gradient?, size?: 's'|'m'|'l'|'responsive' }
 * @returns {HTMLElement}
 */
export function createGradientInspectorMock(options = {}) {
  const { gradient = MOCK_GRADIENT, size = 'responsive' } = options;

  const wrapper = createTag('div', {
    class: 'gradient-editor',
    'data-mock': 'true',
    'aria-label': 'Gradient editor (mock)',
    role: 'region',
  });

  const label = createTag('p', { class: 'gradient-editor-label' });
  label.textContent = 'Gradient editor';

  const editorSize = size === 'responsive' ? 'l' : size;
  const editor = createGradientEditor(gradient, {
    height: 80,
    size: editorSize,
    showMockHandlesOrder: true,
  });
  const editorEl = editor.element;
  editorEl.classList.add('gradient-editor-strip');

  wrapper.appendChild(label);
  wrapper.appendChild(editorEl);

  return wrapper;
}

/**
 * Figma sizes demo section: gradient editor S/L + gradient strip tall S/M/L. Mock only.
 * @returns {HTMLElement}
 */
export function createGradientSizesDemoSection() {
  const section = createTag('section', {
    class: 'color-explore-gradient-sizes-demo',
    'data-mock': 'true',
    'aria-label': 'Gradient Figma sizes (mock — not for prod)',
  });

  const intro = createTag('p', { class: 'gradient-sizes-demo-intro' });
  intro.textContent = 'Sizes here are to illustrate Design intent at breakpoints. Full UX review and testing is in integration (e.g. Extract Page > Gradient Editor; Explore Page > Gradients: grid and modal).';

  const inScopeWrap = createTag('div', { class: 'gradient-sizes-demo-in-scope' });
  const inScopeTitle = createTag('h3', { class: 'gradient-sizes-demo-title' });
  inScopeTitle.textContent = 'In scope to test and review';
  const inScopeList = createTag('ul', { class: 'gradient-sizes-demo-in-scope-list' });
  [
    'Gradient editor: sizes S (343×80, bar only) and L (668×80, bar + 22×22 handles).',
    'Gradient strip tall (modal): sizes S (343×200), M (488×300), L (834×400). Content stops at L.',
    'Focus-visible: .gradient-strip-action-btn outline not clipped (strip overflow: visible).',
    'Full UX: review and test in integration (e.g. Extract Page > Gradient Editor; Explore Page > Gradients: grid and modal).',
  ].forEach((text) => {
    const li = createTag('li', {});
    li.textContent = text;
    inScopeList.appendChild(li);
  });
  inScopeWrap.appendChild(inScopeTitle);
  inScopeWrap.appendChild(inScopeList);
  section.appendChild(intro);
  section.appendChild(inScopeWrap);

  const editorWrap = createTag('div', { class: 'gradient-sizes-demo-block' });
  const editorTitle = createTag('h3', { class: 'gradient-sizes-demo-title' });
  editorTitle.textContent = '1. Gradient editor';
  editorWrap.appendChild(editorTitle);
  const editorRow = createTag('div', { class: 'gradient-sizes-demo-row' });
  ['s', 'l'].forEach((size) => {
    const spec = GRADIENT_EDITOR_FIGMA_SIZES[size];
    const cell = createTag('div', { class: `gradient-sizes-demo-cell gradient-sizes-demo-cell--editor-${size}` });
    const label = createTag('span', { class: 'gradient-sizes-demo-label' });
    label.textContent = `Size ${size.toUpperCase()} — ${spec.width}×${spec.height}${spec.handles ? ' (handles)' : ' (bar only)'}`;
    const editor = createGradientEditor(MOCK_GRADIENT, {
      height: 80,
      size,
      showMockHandlesOrder: size === 'l',
    });
    const editorEl = editor.element;
    editorEl.classList.add('gradient-editor-strip');
    cell.appendChild(label);
    cell.appendChild(editorEl);
    editorRow.appendChild(cell);
  });
  editorWrap.appendChild(editorRow);
  section.appendChild(editorWrap);

  const stripWrap = createTag('div', { class: 'gradient-sizes-demo-block gradient-sizes-demo-block--strip-tall' });
  const stripTitle = createTag('h3', { class: 'gradient-sizes-demo-title' });
  stripTitle.textContent = '2. Gradient strip tall (modal)';
  stripWrap.appendChild(stripTitle);
  const stripRow = createTag('div', { class: 'gradient-sizes-demo-row gradient-sizes-demo-row--one-row' });
  ['s', 'm', 'l'].forEach((size) => {
    const spec = GRADIENT_STRIP_TALL_FIGMA_SIZES[size];
    const cell = createTag('div', { class: `gradient-sizes-demo-cell gradient-sizes-demo-cell--strip-${size}` });
    const label = createTag('span', { class: 'gradient-sizes-demo-label' });
    label.textContent = `Size ${size.toUpperCase()} — ${spec.width}×${spec.height}`;
    const strip = createGradientDetailSection(MOCK_GRADIENT, { size });
    cell.appendChild(label);
    cell.appendChild(strip);
    stripRow.appendChild(cell);
  });
  stripWrap.appendChild(stripRow);
  section.appendChild(stripWrap);

  /* 3. Gradient strip (grid card) — static hardcoded S, M, L; same component as grid */
  const gridStripDataBySize = {
    s: { id: 'demo-s', name: 'Strip S', colorStops: MOCK_GRADIENT.colorStops, angle: 90 },
    m: { id: 'demo-m', name: 'Strip M', gradient: 'linear-gradient(90deg, #F07DF2 0%, #6A65D9 50%, #1D64F2 100%)' },
    l: { id: 'demo-l', name: 'Strip L (Eternal Sunshine)', colorStops: [{ color: '#7B9EA6', position: 0 }, { color: '#D0ECF2', position: 0.5 }, { color: '#F34822', position: 1 }], angle: 90 },
  };
  /* Bar height per Figma: Mobile/Tablet 50px, Desktop L 80px. L width = 1/3 column at 1360px content (≈437px). */
  const gridStripSizes = [
    { key: 's', width: 343, height: 50, label: 'S' },
    { key: 'm', width: 488, height: 50, label: 'M' },
    { key: 'l', width: 437, height: 80, label: 'L' },
  ];
  const gridStripWrap = createTag('div', { class: 'gradient-sizes-demo-block gradient-sizes-demo-grid-strip' });
  const gridStripTitle = createTag('h3', { class: 'gradient-sizes-demo-title' });
  gridStripTitle.textContent = '3. Gradient strip (grid card)';
  const gridStripLabel = createTag('p', { class: 'gradient-sizes-demo-intro' });
  gridStripLabel.textContent = 'Static example — same component as in the gradients grid. Bar height: 50px (S, M), 80px (L) per Figma. L width = 1/3 column at 1360px content + gutter.';
  const gridStripRow = createTag('div', { class: 'gradient-sizes-demo-grid-strip-row' });
  gridStripSizes.forEach(({ key, width, height, label }) => {
    const cell = createTag('div', { class: `gradient-sizes-demo-cell gradient-sizes-demo-cell--grid-strip-${key}` });
    const cellLabel = createTag('span', { class: 'gradient-sizes-demo-label' });
    const widthLabel = label === 'L' ? '~437px' : `${width}px`;
    cellLabel.textContent = `Size ${label} — Width ${widthLabel}, Bar height ${height}px`;
    const [stripEl] = createGradientStripElements([gridStripDataBySize[key]], {});
    cell.appendChild(cellLabel);
    cell.appendChild(stripEl);
    gridStripRow.appendChild(cell);
  });
  gridStripWrap.appendChild(gridStripTitle);
  gridStripWrap.appendChild(gridStripLabel);
  gridStripWrap.appendChild(gridStripRow);
  section.appendChild(gridStripWrap);

  return section;
}
