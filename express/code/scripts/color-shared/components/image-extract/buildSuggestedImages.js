import { createTag } from '../../../utils.js';
import {
  EXTRACT_CANVAS_MAX,
  extractPaletteFromImageElement,
  applyPaletteToChips,
  applyGradientToBar,
  getPictureSource,
} from '../../utils/imageExtractUtils.js';

export default function buildSuggestedImages(row, onSelect, options = {}) {
  const {
    strings = {},
    variant = 'palette',
    onError = null,
    decorateButton = null,
  } = options;

  const wrapper = createTag('div', { class: 'color-extract-suggestions' });
  const label = row?.children?.[0]
    || createTag('div', {}, strings.noImageTryOurs || "Don't have an image? Try one of ours:");
  label.classList.add('color-extract-suggestions-label');
  wrapper.append(label);

  const list = row?.children?.[1] || createTag('div');
  list.classList.add('color-extract-suggestions-list');

  const pictures = [...(row?.querySelectorAll('picture') || [])];
  list.replaceChildren();
  const isGradient = variant === 'gradient';

  pictures.forEach((picture) => {
    const button = createTag('button', {
      class: 'color-extract-suggestion',
      type: 'button',
      'aria-label': strings.useThisImage || 'Use this image',
      'aria-pressed': 'false',
    });
    decorateButton?.(button);
    const preview = createTag('div', { class: 'color-extract-suggestion-preview' });
    let colorBar;
    let chips = [];
    if (isGradient) {
      colorBar = createTag('div', { class: 'color-extract-suggestion-bar is-gradient' });
    } else {
      colorBar = createTag('div', { class: 'color-extract-suggestion-bar' }, [
        createTag('span', { class: 'color-extract-suggestion-chip is-1' }),
        createTag('span', { class: 'color-extract-suggestion-chip is-2' }),
        createTag('span', { class: 'color-extract-suggestion-chip is-3' }),
        createTag('span', { class: 'color-extract-suggestion-chip is-4' }),
        createTag('span', { class: 'color-extract-suggestion-chip is-5' }),
      ]);
      chips = [...colorBar.querySelectorAll('.color-extract-suggestion-chip')];
    }
    const src = getPictureSource(picture);
    preview.append(picture.cloneNode(true), colorBar);
    button.append(preview);
    const previewImage = preview.querySelector('img');
    if (previewImage) previewImage.draggable = false;

    const hydrateColorBar = async () => {
      const imgEl = previewImage?.naturalWidth ? previewImage : null;
      const loadImg = () => {
        if (imgEl) return Promise.resolve(imgEl);
        if (!src) return Promise.resolve(null);
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = src;
        });
      };
      const img = await loadImg();
      if (!img) return;
      try {
        const ratio = img.naturalHeight / img.naturalWidth || 1;
        const w = Math.min(EXTRACT_CANVAS_MAX, img.naturalWidth);
        const h = Math.round(w * ratio);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const context = canvas.getContext('2d');
        context.drawImage(img, 0, 0, w, h);
        const imageData = context.getImageData(0, 0, w, h);
        const { extractColorsFromImage } = await import('../../utils/extractWorker.js');
        const result = await extractColorsFromImage(imageData, w, h, isGradient ? 5 : chips.length);
        if (isGradient) {
          applyGradientToBar(result.colors, colorBar);
        } else {
          applyPaletteToChips(result.colors, chips);
        }
      } catch (err) {
        if (isGradient) {
          applyGradientToBar(extractPaletteFromImageElement(img, 5), colorBar);
        } else {
          applyPaletteToChips(extractPaletteFromImageElement(img, chips.length), chips);
        }
        await onError?.(err);
      }
    };

    const scheduleHydrate = () => {
      if (window.requestIdleCallback) {
        requestIdleCallback(hydrateColorBar, { timeout: 8000 });
      } else {
        setTimeout(hydrateColorBar, 100);
      }
    };

    if (previewImage?.complete && previewImage.naturalWidth) scheduleHydrate();
    else if (previewImage) previewImage.addEventListener('load', scheduleHydrate, { once: true });
    else scheduleHydrate();

    button.addEventListener('click', () => {
      list.querySelectorAll('.color-extract-suggestion.is-selected').forEach((item) => {
        item.classList.remove('is-selected');
        item.setAttribute('aria-pressed', 'false');
      });
      button.classList.add('is-selected');
      button.setAttribute('aria-pressed', 'true');
      const img = preview.querySelector('img');
      if (img?.complete && img.naturalWidth) {
        onSelect(img, src);
      } else if (img) {
        img.addEventListener('load', () => onSelect(img, src), { once: true });
      }
    });
    list.append(button);
  });

  wrapper.append(list);
  return wrapper;
}
