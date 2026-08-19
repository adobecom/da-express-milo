export const EXTRACT_CANVAS_MAX = 320;

export function isFileDrag(e) {
  return e.dataTransfer?.types?.includes('Files');
}

export function preventDefaults(event) {
  event.preventDefault();
  event.stopPropagation();
}

export function drawImageToCanvas(image) {
  const ratio = image.naturalHeight / image.naturalWidth || 1;
  const width = Math.min(EXTRACT_CANVAS_MAX, image.naturalWidth);
  const height = Math.round(width * ratio);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(image, 0, 0, width, height);
  return canvas;
}

export function toHex(r, g, b) {
  /* eslint-disable no-bitwise */
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase()}`;
  /* eslint-enable no-bitwise */
}

export function samplePalette(context, width, height, count) {
  const imageData = context.getImageData(0, 0, width, height).data;
  const pixels = imageData.length / 4;
  const step = Math.max(1, Math.floor(pixels / count));
  const colors = [];
  for (let i = 0; i < count; i += 1) {
    const offset = Math.min(i * step * 4, imageData.length - 4);
    colors.push(toHex(imageData[offset], imageData[offset + 1], imageData[offset + 2]));
  }
  return colors;
}

export function extractPaletteFromImageElement(image, swatchCount) {
  if (!image?.naturalWidth || !image?.naturalHeight) return null;
  try {
    const maxWidth = 160;
    const ratio = image.naturalHeight / image.naturalWidth || 1;
    const width = Math.min(maxWidth, image.naturalWidth);
    const height = Math.round(width * ratio);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(image, 0, 0, width, height);
    return samplePalette(canvas.getContext('2d'), width, height, swatchCount);
  } catch { return null; }
}

export function applyPaletteToChips(colors, chips) {
  if (!colors || !chips?.length) return;
  colors.forEach((hex, i) => { if (chips[i]) chips[i].style.background = hex; });
}

export function applyGradientToBar(colors, bar) {
  if (!colors?.length || !bar) return;
  const stops = colors.map((hex, i) => `${hex} ${Math.round((i / (colors.length - 1)) * 100)}%`).join(', ');
  bar.style.backgroundImage = `linear-gradient(90deg, ${stops})`;
}

export function getPictureSource(picture) {
  const img = picture?.querySelector('img');
  const source = picture?.querySelector('source');
  const directSrc = img?.currentSrc || img?.getAttribute('src') || img?.dataset?.src || img?.dataset?.lazySrc;
  if (directSrc) return directSrc;
  const srcset = source?.getAttribute('srcset') || img?.getAttribute('srcset') || img?.dataset?.srcset;
  if (!srcset) return '';
  return srcset.split(',')[0].trim().split(' ')[0];
}

/**
 * Sync the markers overlay to the actual rendered image area.
 *
 * Why this exists: the img element may be larger than the visible image
 * (object-fit: contain leaves dead space), or the bgWrapper may be taller
 * than the image (min-height on mobile). Without sync, markers map to the
 * wrong area and appear shifted.
 *
 * Falls back to CSS inset: 16px if the image hasn't laid out yet.
 */
export function syncMarkersToImage(overlay, container) {
  const img = container.querySelector('img');
  if (!img || !img.naturalWidth || !img.naturalHeight) return;

  const containerRect = container.getBoundingClientRect();
  const imgRect = img.getBoundingClientRect();

  // Guard: layout not settled yet — leave CSS fallback in place
  if (!imgRect.width || !imgRect.height || !containerRect.width || !containerRect.height) return;

  const imgRatio = img.naturalWidth / img.naturalHeight;
  const boxW = imgRect.width;
  const boxH = imgRect.height;
  const boxRatio = boxW / boxH;

  let renderW;
  let renderH;
  let offsetX;
  let offsetY;

  if (imgRatio > boxRatio) {
    renderW = boxW;
    renderH = boxW / imgRatio;
    offsetX = 0;
    offsetY = (boxH - renderH) / 2;
  } else {
    renderH = boxH;
    renderW = boxH * imgRatio;
    offsetX = (boxW - renderW) / 2;
    offsetY = 0;
  }

  // Guard: computed size too small — image probably hasn't loaded yet
  if (renderW < 10 || renderH < 10) return;

  // Absolute children are positioned relative to the padding box.
  // getBoundingClientRect returns the border box, so subtract the border.
  const cs = getComputedStyle(container);
  const borderL = parseFloat(cs.borderLeftWidth) || 0;
  const borderT = parseFloat(cs.borderTopWidth) || 0;

  const relLeft = (imgRect.left - containerRect.left - borderL) + offsetX;
  const relTop = (imgRect.top - containerRect.top - borderT) + offsetY;

  overlay.style.inset = 'auto';
  overlay.style.left = `${relLeft}px`;
  overlay.style.top = `${relTop}px`;
  overlay.style.width = `${renderW}px`;
  overlay.style.height = `${renderH}px`;
}
