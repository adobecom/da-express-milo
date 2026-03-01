/**
 * Strip-container variant: uses <color-swatch-rail> (from color-poc), not <color-palette>.
 * Vertical rail with lock, hex label, copy — independent branch.
 */
/* eslint-disable import/prefer-default-export */
import { createBaseRenderer } from './createBaseRenderer.js';
import { createSwatchRailAdapter } from '../adapters/litComponentAdapters.js';

const MAX_VARIANTS = 3;

const DEFAULT_ORIENTATIONS = ['horizontal', 'stacked', 'vertical'];

export function createStripContainerRenderer(options) {
  const base = createBaseRenderer(options);
  const { getData, config } = base;
  /** When set (e.g. demo), use only these rails; else default horizontal + stacked + vertical. */
  const orientations = config?.stripContainerOrientations ?? DEFAULT_ORIENTATIONS;

  let listElement = null;

  function render(container) {
    container.innerHTML = '';
    container.classList.add('color-explorer-strip-container');
    listElement = container;

    const data = getData().slice(0, orientations.length);
    data.forEach((palette, index) => {
      const orientation = orientations[index];
      const adapter = createSwatchRailAdapter(palette, { orientation });
      listElement.appendChild(adapter.element);
    });
  }

  function update(newData) {
    if (!listElement) return;
    listElement.innerHTML = '';
    const data = (Array.isArray(newData) ? newData : getData()).slice(0, orientations.length);
    data.forEach((palette, index) => {
      const orientation = orientations[index];
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
