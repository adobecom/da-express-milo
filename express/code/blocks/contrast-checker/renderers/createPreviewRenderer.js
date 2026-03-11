import { createTag } from '../../../scripts/utils.js';
import { createOverlayMask, removeOverlay } from '../utils/previewOverlayUtils.js';

/* eslint-disable max-len */
const VECTOR_SVG = '<svg width="74" height="65" viewBox="0 0 74 65" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M42.6635 25.7378C47.9015 21.4194 53.1415 17.089 58.5984 13.0017C61.2215 11.037 65.0899 8.04945 68.1197 6.7919C71.2907 5.47588 74.7827 8.40213 73.5282 11.4175C72.7783 13.2189 71.0414 13.6003 69.465 14.572C67.2073 15.9642 64.881 17.7498 62.7616 19.3359C57.7416 23.0928 52.8942 27.0557 48.1134 31.0631C48.3899 31.1188 48.6998 31.1095 48.9824 31.0966C54.4141 30.8553 59.8963 30.071 65.323 30.6882C69.3449 31.1457 69.6386 35.7834 65.9034 36.7022C61.2053 37.8586 55.6767 38.0674 50.799 38.3347C50.4609 38.3532 50.1167 38.3226 49.7787 38.3356C49.7312 38.4971 49.82 38.4516 49.8745 38.4952C53.2636 41.1635 57.1451 43.5691 59.9942 46.7951C62.3226 49.4308 59.2736 53.0337 55.8321 51.3882C54.7613 50.8759 53.526 50.1213 52.5097 49.5014C48.5686 47.1014 45.0281 44.1797 41.2253 41.6071C41.2142 41.8029 41.2414 42.0025 41.2233 42.1983C40.754 47.3185 40.4865 52.797 39.6993 57.8504C39.3108 60.3498 38.9767 64.5948 35.1496 64.1419C31.7909 63.7447 32.2047 60.218 31.9857 57.933C32.1613 53.2685 32.6891 48.6216 33.1231 43.9746L32.8193 44.1473C26.4691 49.4847 20.45 55.34 13.3923 59.9024C11.8381 60.9066 10.3212 61.6834 8.59843 60.2987C6.87565 58.914 7.31063 57.2759 8.52576 55.8448C9.98412 54.1279 11.715 52.4638 13.3278 50.8638C17.5343 47.3696 21.655 43.79 25.7808 40.2168C20.3127 40.7737 14.8497 41.3834 9.40583 42.1073C7.84049 42.3152 6.07229 42.7236 4.53925 42.8526C-0.719928 43.2962 -1.82404 36.5128 3.43715 35.5746C7.20164 34.9026 11.3385 34.4274 15.1565 33.9615C19.6709 33.4103 24.2064 33.0195 28.7329 32.5583C24.8513 29.6525 20.8688 26.8404 17.1508 23.7545C16.3888 23.1215 15.0657 22.1545 14.6145 21.3535C13.4277 19.2449 14.8648 16.4003 17.4253 16.0013C19.9857 15.6022 21.5198 17.5437 23.2809 18.9517C26.9415 21.877 30.7453 24.6547 34.5592 27.4074L35.847 11.5725C36.3527 8.77243 36.1932 5.50558 36.8644 2.76309C37.8474 -1.25458 44.3519 -0.666179 44.7052 3.07771C44.8626 4.74733 44.2813 7.25037 44.0976 8.99703C43.5102 14.5674 43.0601 20.1517 42.6594 25.7369L42.6635 25.7378Z" fill="currentColor"/></svg>';
/* eslint-enable max-len */

const REGION_CLASS_MAP = {
  heading: 'cc-preview-heading',
  body: 'cc-preview-small-text',
  ui: 'cc-preview-logo-wrap',
};

// eslint-disable-next-line import/prefer-default-export
export function createPreviewRenderer({ container, context, content = {} }) {
  let unsubscribe = null;
  let contentEl = null;
  let previewFrameEl = null;

  function updateColors(palette) {
    if (!palette) return;
    const fg = palette.selectedForeground ?? palette.colors?.[0];
    const bg = palette.selectedBackground ?? palette.colors?.[1];
    if (!fg || !bg) return;
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
    const imageEl = createTag('div', { class: 'cc-preview-image' });
    if (content.image) imageEl.appendChild(content.image);
    const textContent = createTag('div', { class: 'cc-preview-text-content' });

    const logo = createTag('div', { class: 'cc-preview-logo-wrap' }, VECTOR_SVG);
    const heading = createTag('h2', { class: 'cc-preview-heading' }, content.heading || 'Your heading here');
    const smallTextWrap = createTag('div', { class: 'cc-preview-small-text' });
    const body = createTag('p', { class: 'cc-preview-body-text' }, content.body || 'Body text that demonstrates how your chosen color contrast looks in a real-world context with normal-sized paragraph text.');
    const cta = createTag('button', { class: 'cc-preview-cta', type: 'button' }, content.ctaText || 'Shop now');

    smallTextWrap.appendChild(body);
    smallTextWrap.appendChild(cta);

    textContent.appendChild(logo);
    textContent.appendChild(heading);
    textContent.appendChild(smallTextWrap);

    contentEl.appendChild(imageEl);
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
