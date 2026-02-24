/**
 * Mock (not for prod). Single file for all gradient + gradient-strip demo rendering in color-explore.
 * Delete this file and its import in createGradientsRenderer.js when mocks are no longer needed.
 */

import { createTag } from '../../../scripts/utils.js';
import { createGradientEditor } from '../../../scripts/color-shared/components/gradients/gradient-editor.js';
import { createGradientDetailSection } from '../../../scripts/color-shared/components/gradients/gradient-strip-tall.js';
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
  intro.textContent = 'Figma sizes (mock). Gradient editor S/L; strip tall (modal) S/M/L. See GRADIENT-FIGMA-SIZES.md.';

  const editorWrap = createTag('div', { class: 'gradient-sizes-demo-block' });
  const editorTitle = createTag('h3', { class: 'gradient-sizes-demo-title' });
  editorTitle.textContent = '1. Gradient editor';
  editorWrap.appendChild(editorTitle);
  const editorRow = createTag('div', { class: 'gradient-sizes-demo-row' });
  ['s', 'l'].forEach((size) => {
    const spec = GRADIENT_EDITOR_FIGMA_SIZES[size];
    const cell = createTag('div', { class: `gradient-sizes-demo-cell gradient-sizes-demo-cell--editor-${size}` });
    const label = createTag('span', { class: 'gradient-sizes-demo-label' });
    label.textContent = `Size ${size.toUpperCase()} — ${spec.width}×${spec.height}${spec.handles ? ' (handles)' : ''}`;
    const editor = createGradientEditor(MOCK_GRADIENT, { height: 80, size });
    cell.appendChild(label);
    cell.appendChild(editor.element);
    editorRow.appendChild(cell);
  });
  editorWrap.appendChild(editorRow);
  section.appendChild(intro);
  section.appendChild(editorWrap);

  const stripWrap = createTag('div', { class: 'gradient-sizes-demo-block' });
  const stripTitle = createTag('h3', { class: 'gradient-sizes-demo-title' });
  stripTitle.textContent = '2. Gradient strip tall (modal)';
  stripWrap.appendChild(stripTitle);
  const stripRow = createTag('div', { class: 'gradient-sizes-demo-row' });
  ['s', 'm', 'l', 'xl'].forEach((size) => {
    const spec = GRADIENT_STRIP_TALL_FIGMA_SIZES[size];
    const cell = createTag('div', { class: `gradient-sizes-demo-cell gradient-sizes-demo-cell--strip-${size}` });
    const label = createTag('span', { class: 'gradient-sizes-demo-label' });
    label.textContent = `Size ${size.toUpperCase()} — ${spec.width}×${spec.height}${size === 'xl' ? ' (modal expansion)' : ''}`;
    const strip = createGradientDetailSection(MOCK_GRADIENT, { size });
    cell.appendChild(label);
    cell.appendChild(strip);
    stripRow.appendChild(cell);
  });
  stripWrap.appendChild(stripRow);
  section.appendChild(stripWrap);

  return section;
}
