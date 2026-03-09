import { createTag } from '../../../scripts/utils.js';
import { createOverlayMask, removeOverlay } from '../utils/previewOverlayUtils.js';

const REGION_CLASS_MAP = {
  heading: 'cc-preview-heading',
  body: 'cc-preview-body-text',
  ui: 'cc-preview-cta',
};

/* eslint-disable max-len */
const LOGO_SVG = '<svg class="cc-preview-logo" viewBox="0 0 73.79 64.175" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M36.9 0L73.79 64.175H0L36.9 0z"/></svg>';
/* eslint-enable max-len */

// eslint-disable-next-line import/prefer-default-export
export function createPreviewRenderer({ container, context }) {
  let unsubscribe = null;
  let contentEl = null;
  let previewFrameEl = null;

  function updateColors(palette) {
    if (!palette?.colors?.length) return;
    const [fg, bg] = palette.colors;
    container.style.setProperty('--cc-preview-fg', fg);
    container.style.setProperty('--cc-preview-bg', bg);
  }

  function highlightRegion(region) {
    if (!contentEl || !previewFrameEl) return;

    removeOverlay(previewFrameEl);

    if (!region) return;

    const cls = REGION_CLASS_MAP[region];
    if (!cls) return;

    const targetEl = contentEl.querySelector(`.${cls}`);
    if (!targetEl) return;

    requestAnimationFrame(() => {
      const svg = createOverlayMask(targetEl, previewFrameEl);
      if (svg) previewFrameEl.appendChild(svg);
    });
  }

  function render() {
    container.innerHTML = '';
    container.classList.add('cc-preview-panel');

    const label = createTag('div', { class: 'cc-preview-label' }, 'Preview');

    previewFrameEl = createTag('div', { class: 'cc-preview-frame' });

    const browserBar = createTag('div', { class: 'cc-browser-bar' });
    const dots = createTag('div', { class: 'cc-browser-dots' });
    for (let i = 0; i < 3; i += 1) {
      dots.appendChild(createTag('span', { class: 'cc-browser-dot' }));
    }
    browserBar.appendChild(dots);

    contentEl = createTag('div', { class: 'cc-preview-content' });
    const imagePlaceholder = createTag('div', { class: 'cc-preview-image' });
    const textContent = createTag('div', { class: 'cc-preview-text-content' });

    const logo = createTag('div', { class: 'cc-preview-logo-wrap' }, LOGO_SVG);
    const heading = createTag('h2', { class: 'cc-preview-heading' }, 'Your heading here');
    const body = createTag('p', { class: 'cc-preview-body-text' }, 'Body text that demonstrates how your chosen color contrast looks in a real-world context with normal-sized paragraph text.');
    const cta = createTag('button', { class: 'cc-preview-cta', type: 'button' }, 'Shop now');

    textContent.appendChild(logo);
    textContent.appendChild(heading);
    textContent.appendChild(body);
    textContent.appendChild(cta);

    contentEl.appendChild(imagePlaceholder);
    contentEl.appendChild(textContent);

    previewFrameEl.appendChild(browserBar);
    previewFrameEl.appendChild(contentEl);

    container.appendChild(label);
    container.appendChild(previewFrameEl);

    if (context) {
      const palette = context.get('palette');
      if (palette) updateColors(palette);
      unsubscribe = context.on('palette', updateColors);
    }
  }

  function destroy() {
    unsubscribe?.();
    contentEl = null;
    previewFrameEl = null;
    container.replaceChildren();
  }

  return { render, destroy, highlightRegion };
}
