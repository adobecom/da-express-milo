import { createTag } from '../../../scripts/utils.js';

// eslint-disable-next-line import/prefer-default-export
export function createPreviewRenderer({ container, context }) {
  let unsubscribe = null;

  function updateColors(palette) {
    if (!palette?.colors?.length) return;
    const [fg, bg] = palette.colors;
    container.style.setProperty('--cc-preview-fg', fg);
    container.style.setProperty('--cc-preview-bg', bg);
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
    const heading = createTag('h2', { class: 'cc-preview-heading' }, 'Your heading here');
    const body = createTag('p', { class: 'cc-preview-body-text' }, 'Body text that demonstrates how your chosen color contrast looks in a real-world context with normal-sized paragraph text.');
    const cta = createTag('button', { class: 'cc-preview-cta', type: 'button' }, 'Shop now');
    content.appendChild(heading);
    content.appendChild(body);
    content.appendChild(cta);

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
    container.replaceChildren();
  }

  return { render, destroy };
}
