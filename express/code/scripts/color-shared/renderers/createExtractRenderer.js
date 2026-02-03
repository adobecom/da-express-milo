import { createBaseRenderer } from './createBaseRenderer.js';

export function createExtractRenderer(options) {
  const base = createBaseRenderer(options);

  function render(container) {
    container.innerHTML = '<p>Extract variant - Coming soon (Phase 3)</p>';
    console.warn('[ExtractRenderer] Not yet implemented');
  }

  return {
    ...base,
    render,
  };
}
