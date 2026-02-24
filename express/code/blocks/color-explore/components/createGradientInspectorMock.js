/**
 * Gradient Editor — inline component, placed BEFORE gradient strips (not in modal).
 * Mock (not for prod). Uses createGradientEditor (color-shared) — draggable, renderable anywhere.
 */

import { createTag } from '../../../scripts/utils.js';
import { createGradientEditor } from '../../../scripts/color-shared/components/gradients/gradient-editor.js';

const DEMO_GRADIENT = {
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
 * Create gradient editor element (inline, before strips — NOT in modal).
 * Mock (not for prod). Uses shared createGradientEditor — draggable color stops.
 * @param {Object} options
 * @param {Object} options.gradient - Optional gradient data; defaults to DEMO_GRADIENT
 * @param {string} options.size - 's' | 'm' | 'l' | 'responsive'
 * @returns {HTMLElement}
 */
export function createGradientInspectorMock(options = {}) {
  const { gradient = DEMO_GRADIENT, size = 'responsive' } = options;

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
    showMockHandlesOrder: true, /* mock only: shows handles order with HEX + swatch */
  });
  const editorEl = editor.element;
  editorEl.classList.add('gradient-editor-strip');

  wrapper.appendChild(label);
  wrapper.appendChild(editorEl);

  return wrapper;
}

export default createGradientInspectorMock;
