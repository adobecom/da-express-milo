import { createTag } from '../../../scripts/utils.js';

const REGION_CLASS_MAP = {
  heading: 'cc-preview-heading',
  body: 'cc-preview-body-text',
  ui: 'cc-preview-cta',
};

// eslint-disable-next-line import/prefer-default-export
export function createPreviewRenderer({ container, context }) {
  let unsubscribe = null;
  let activeHighlight = null;

  function updateColors(palette) {
    if (!palette?.colors?.length) return;
    const [fg, bg] = palette.colors;
    container.style.setProperty('--cc-preview-fg', fg);
    container.style.setProperty('--cc-preview-bg', bg);
  }

  function highlightRegion(region) {
    if (activeHighlight) {
      activeHighlight.classList.remove('cc-preview-highlight--active');
      activeHighlight = null;
    }
    if (!region) return;
    const cls = REGION_CLASS_MAP[region];
    if (!cls) return;
    const el = container.querySelector(`.${cls}`);
    if (el) {
      el.classList.add('cc-preview-highlight--active');
      activeHighlight = el;
    }
  }

  function render() {
    container.innerHTML = '';
    container.classList.add('cc-preview-panel');

    const label = createTag('div', { class: 'cc-preview-label' }, 'Preview');

    const previewFrame = createTag('div', { class: 'cc-preview-frame' });

    const browserBar = createTag('div', { class: 'cc-browser-bar' });
    const dots = createTag('div', { class: 'cc-browser-dots' });
    for (let i = 0; i < 3; i += 1) {
      dots.appendChild(createTag('span', { class: 'cc-browser-dot' }));
    }
    browserBar.appendChild(dots);

    const content = createTag('div', { class: 'cc-preview-content' });
    const imagePlaceholder = createTag('div', { class: 'cc-preview-image' });
    const textContent = createTag('div', { class: 'cc-preview-text-content' });

    const heading = createTag('h2', { class: 'cc-preview-heading cc-preview-highlight' }, 'Your heading here');
    const body = createTag('p', { class: 'cc-preview-body-text cc-preview-highlight' }, 'Body text that demonstrates how your chosen color contrast looks in a real-world context with normal-sized paragraph text.');
    const cta = createTag('button', { class: 'cc-preview-cta cc-preview-highlight', type: 'button' }, 'Shop now');

    textContent.appendChild(heading);
    textContent.appendChild(body);
    textContent.appendChild(cta);

    content.appendChild(imagePlaceholder);
    content.appendChild(textContent);

    previewFrame.appendChild(browserBar);
    previewFrame.appendChild(content);

    container.appendChild(label);
    container.appendChild(previewFrame);

    if (context) {
      const palette = context.get('palette');
      if (palette) updateColors(palette);

      unsubscribe = context.on('palette', updateColors);
    }
  }

  function destroy() {
    unsubscribe?.();
    activeHighlight = null;
    container.replaceChildren();
  }

  return { render, destroy, highlightRegion };
}
