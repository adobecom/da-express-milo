/**
 * Strip-container variant: uses <color-swatch-rail> (from color-poc), not <color-palette>.
 * Vertical rail with lock, hex label, copy — independent branch.
 */
/* eslint-disable import/prefer-default-export */
import { createBaseRenderer } from './createBaseRenderer.js';
import { createSwatchRailAdapter } from '../adapters/litComponentAdapters.js';

const MAX_VARIANTS = 3;

function orientationForIndex(index) {
  if (index === 0) return 'horizontal';
  if (index === 1) return 'stacked';
  return 'vertical';
}

export function createStripContainerRenderer(options) {
  const base = createBaseRenderer(options);
  const { getData } = base;

  let listElement = null;

  function render(container) {
    container.innerHTML = '';
    container.classList.add('color-explorer-strip-container');
    listElement = container;

    const data = getData().slice(0, MAX_VARIANTS);
    data.forEach((palette, index) => {
      const orientation = orientationForIndex(index);
      const adapter = createSwatchRailAdapter(palette, { orientation });
      listElement.appendChild(adapter.element);
    });
  }

  function update(newData) {
    if (!listElement) return;
    listElement.innerHTML = '';
    const data = (Array.isArray(newData) ? newData : getData()).slice(0, MAX_VARIANTS);
    data.forEach((palette, index) => {
      const orientation = orientationForIndex(index);
      const adapter = createSwatchRailAdapter(palette, { orientation });
      listElement.appendChild(adapter.element);
    });
  }

  function destroy() {
    listElement = null;
  }

  return {
    ...base,
    render,
    update,
    destroy,
  };
}
