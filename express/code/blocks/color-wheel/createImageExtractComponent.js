/* eslint-disable */
import { createTag } from '../../scripts/utils.js';
import { DEFAULTS, MOODS } from '../color-extract/helpers/constants.js';
import { createUploadDropzone } from '../../scripts/color-shared/components/image-upload/image-upload.js';
import { DEFAULT_PLACEHOLDERS as COLOR_EXTRACT_DEFAULTS } from '../../scripts/color-shared/i18n/loadColorExtractPlaceholders.js';

const EXTRACT_CANVAS_MAX = 320;

function isFileDrag(e) {
  return e.dataTransfer?.types?.includes('Files');
}

function toHex(r, g, b) {
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase()}`;
}

function preventDefaults(event) {
  event.preventDefault();
  event.stopPropagation();
}

function drawImageToCanvas(image) {
  const ratio = image.naturalHeight / image.naturalWidth || 1;
  const width = Math.min(EXTRACT_CANVAS_MAX, image.naturalWidth);
  const height = Math.round(width * ratio);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(image, 0, 0, width, height);
  return canvas;
}

function samplePalette(context, width, height, count) {
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

function extractPaletteFromImageElement(image, swatchCount) {
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

function extractPaletteFromSrc(src, swatchCount) {
  return new Promise((resolve) => {
    if (!src) { resolve(null); return; }
    const image = new Image();
    image.onload = () => resolve(extractPaletteFromImageElement(image, swatchCount));
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function applyPaletteToChips(colors, chips) {
  if (!colors || !chips?.length) return;
  colors.forEach((hex, i) => { if (chips[i]) chips[i].style.background = hex; });
}

function getPictureSource(picture) {
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
function syncMarkersToImage(overlay, container) {
  const img = container.querySelector('img');
  if (!img || !img.naturalWidth || !img.naturalHeight) return;

  const containerRect = container.getBoundingClientRect();
  const imgRect = img.getBoundingClientRect();

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

  if (renderW < 10 || renderH < 10) return;

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

/**
 * Suggested images strip (same structure as color-extract block suggestions row).
 * @param {HTMLElement | null} row - Row with label cell + list cell with <picture> nodes, or null
 * @param {(img: HTMLImageElement, url: string) => void} onSelect
 */
export function buildSuggestedImages(row, onSelect, strings = {}) {
  const wrapper = createTag('div', { class: 'color-extract-suggestions' });
  const label = row?.children?.[0]
    || createTag('div', {}, strings.noImageTryOurs || 'Don\u2019t have an image? Try one of ours:');
  label.classList.add('color-extract-suggestions-label');
  wrapper.append(label);

  const list = row?.children?.[1] || createTag('div');
  list.classList.add('color-extract-suggestions-list');

  const pictures = [...(row?.querySelectorAll('picture') || [])];
  list.replaceChildren();
  pictures.forEach((picture) => {
    const button = createTag('button', {
      class: 'color-extract-suggestion',
      type: 'button',
      'aria-label': strings.useThisImage || 'Use this image',
      'aria-pressed': 'false',
    });
    const preview = createTag('div', { class: 'color-extract-suggestion-preview' });
    const palette = createTag('div', { class: 'color-extract-suggestion-bar' }, [
      createTag('span', { class: 'color-extract-suggestion-chip is-1' }),
      createTag('span', { class: 'color-extract-suggestion-chip is-2' }),
      createTag('span', { class: 'color-extract-suggestion-chip is-3' }),
      createTag('span', { class: 'color-extract-suggestion-chip is-4' }),
      createTag('span', { class: 'color-extract-suggestion-chip is-5' }),
    ]);
    const src = getPictureSource(picture);
    preview.append(picture.cloneNode(true), palette);
    button.append(preview);
    const chips = [...palette.querySelectorAll('.color-extract-suggestion-chip')];
    const previewImage = preview.querySelector('img');
    if (previewImage) previewImage.draggable = false;

    const hydratePalette = async () => {
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
        const { extractColorsFromImage } = await import('../color-extract/helpers/extractWorker.js');
        const result = await extractColorsFromImage(imageData, w, h, chips.length);
        applyPaletteToChips(result.colors, chips);
      } catch {
        applyPaletteToChips(extractPaletteFromImageElement(img, chips.length), chips);
      }
    };

    const scheduleHydrate = () => {
      if (window.requestIdleCallback) {
        requestIdleCallback(hydratePalette, { timeout: 8000 });
      } else {
        setTimeout(hydratePalette, 100);
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

function setBackground(bgWrapper, src) {
  const pic = bgWrapper.querySelector('picture');
  if (pic) pic.querySelectorAll('source').forEach((s) => s.setAttribute('srcset', src));
  const img = bgWrapper.querySelector('img');
  if (img) img.src = src;
  if (!pic && !img && src) {
    const next = createTag('img', { src, alt: '' });
    bgWrapper.append(next);
  }
}

function attachWindowDragHandlers(container, dropzone) {
  const ac = new AbortController();
  const { signal } = ac;
  let dragCounter = 0;
  const clearDrag = () => {
    dragCounter = 0;
    container.classList.remove('is-dragging');
  };
  const isInViewport = () => {
    const rect = container.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
  };
  window.addEventListener('dragenter', (e) => { if (isInViewport() && isFileDrag(e)) { preventDefaults(e); dragCounter += 1; container.classList.add('is-dragging'); } }, { signal });
  window.addEventListener('dragover', (e) => { if (isInViewport() && isFileDrag(e)) { preventDefaults(e); } }, { signal });
  window.addEventListener('dragleave', (e) => {
    preventDefaults(e);
    if (isFileDrag(e)) { 
      dragCounter = Math.max(0, dragCounter - 1);
      if (dragCounter === 0) clearDrag();
    }
  }, { signal });
  window.addEventListener('dragend', (e) => { preventDefaults(e); clearDrag(); }, { signal });
  window.addEventListener('drop', (e) => { if (!isInViewport() || !isFileDrag(e)) { clearDrag(); return; } preventDefaults(e); dropzone.handleFile(e.dataTransfer.files[0]); setTimeout(clearDrag, 200); }, { signal });
  window.addEventListener('blur', clearDrag, { signal });
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearDrag(); }, { signal });

  // When dropping directly onto the dropzone element, its own `drop` listener calls
  // stopPropagation, so the window-level handler never fires — meaning `is-dragging`
  // is never removed and the wrapped handleFile (is-loading) is skipped.
  const dropzoneEl = dropzone.container?.querySelector('.image-upload-dropzone');
  if (dropzoneEl) {
    dropzoneEl.addEventListener('drop', (e) => {
      if (isFileDrag(e)) {
        const file = e.dataTransfer?.files?.[0];
        if (file?.type?.startsWith('image/')) {
          container.classList.add('is-loading');
        }
      }
      setTimeout(clearDrag, 200);
    }, { signal });
  }

  const detach = () => ac.abort();
  const observer = new MutationObserver(() => { if (!container.isConnected) { detach(); observer.disconnect(); } });
  observer.observe(container.parentElement || document.body, { childList: true });
  return detach;
}

/**
 * Image extraction UI (dropzone, optional suggestions, edit stage + markers). Mount inside any container.
 *
 * @param {object} options
 * @param {object} options.controller - ColorThemeExpressController instance
 * @param {number} [options.maxColors]
 * @param {HTMLElement | null} [options.suggestionsRowEl]
 * @returns {{ element: HTMLElement, destroy: Function }}
 */
export default function createImageExtractComponent(options = {}) {
  const controller = options.controller;
  if (!controller) {
    throw new Error('createImageExtractComponent: controller is required');
  }

  const maxColors = Math.max(
    1,
    Math.min(10, Number(options.maxColors) || controller.getState().swatches?.length || DEFAULTS.MAX_COLORS),
  );

  const container = createTag('div', { class: 'image-extract' });

  let currentMood = controller.metadata?.mood || DEFAULTS.MOOD;
  let currentCanvas = null;
  let currentSrc = null;
  let markers = null;
  let markerResizeObserver = null;
  let resizeHandler = null;
  let imgLoadHandler = null;
  let moodSelectorRef = null;
  let toolbarRef = null;

  const landing = createTag('div', { class: 'color-extract-landing' });
  const landingContent = createTag('div', { class: 'color-extract-landing-content' });

  const edit = createTag('div', { class: 'color-extract-edit' });
  const stage = createTag('div', { class: 'color-extract-edit-stage' });
  const leftCol = createTag('div', { class: 'color-extract-edit-left' });
  const bgWrapper = createTag('div', { class: 'color-extract-edit-bg' });
  stage.append(leftCol);
  edit.append(stage);

  async function runExtraction(canvas, mood) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    try {
      const { extractColorsFromImage } = await import('../color-extract/helpers/extractWorker.js');
      const result = await extractColorsFromImage(
        imageData,
        canvas.width,
        canvas.height,
        maxColors,
        mood,
      );
      controller.replaceSwatchesFromHexes(result.colors, { baseIndex: 0, harmonyRule: 'CUSTOM' });
      if (markers) markers.setPositions(result.colors, result.points);
    } catch {
      const fallback = samplePalette(ctx, canvas.width, canvas.height, maxColors);
      controller.replaceSwatchesFromHexes(fallback, { baseIndex: 0, harmonyRule: 'CUSTOM' });
      if (markers) {
        const pts = fallback.map((_, i) => ({ x: (i + 1) / (fallback.length + 1), y: 0.5 }));
        markers.setPositions(fallback, pts);
      }
    }
  }

  function addColorToImage() {
    if (!currentCanvas || !markers) return;
    const state = controller.getState();
    const currentSwatches = state.swatches || [];
    if (currentSwatches.length >= DEFAULTS.MAX_TOTAL_COLORS) return;
    const pctX = 0.1 + Math.random() * 0.8;
    const pctY = 0.1 + Math.random() * 0.8;
    const cx = Math.round(pctX * currentCanvas.width);
    const cy = Math.round(pctY * currentCanvas.height);
    const [r, g, b] = currentCanvas.getContext('2d').getImageData(cx, cy, 1, 1).data;
    const hex = toHex(r, g, b);
    const newHexes = [...currentSwatches.map((s) => s.hex), hex];
    controller.replaceSwatchesFromHexes(newHexes, { baseIndex: 0, harmonyRule: 'CUSTOM' });
    markers.addMarker(hex, pctX, pctY);
    onMoodOverride(MOODS.CUSTOM);
  }

  function onMoodOverride(mood) {
    currentMood = mood;
    moodSelectorRef?.setMood(mood);
    controller.setMetadata({ mood });
  }

  async function setupMarkers(canvas) {
    if (markerResizeObserver) markerResizeObserver.disconnect();
    if (resizeHandler) window.removeEventListener('resize', resizeHandler);
    const oldImg = bgWrapper.querySelector('img');
    if (oldImg && imgLoadHandler) oldImg.removeEventListener('load', imgLoadHandler);
    if (markers) markers.destroy();

    const { default: createImageMarkers } = await import('../color-extract/helpers/imageMarkers.js');
    markers = createImageMarkers(bgWrapper, canvas, controller, {
      onMoodOverride,
    });

    bgWrapper.style.position = 'relative';
    bgWrapper.append(markers.container);

    const doSync = () => syncMarkersToImage(markers.container, bgWrapper);

    const bgImg = bgWrapper.querySelector('img');
    if (bgImg) {
      imgLoadHandler = doSync;
      bgImg.addEventListener('load', doSync);
      if (bgImg.complete && bgImg.naturalWidth) doSync();
    }

    requestAnimationFrame(() => requestAnimationFrame(doSync));
    markerResizeObserver = new ResizeObserver(doSync);
    markerResizeObserver.observe(bgWrapper);
    resizeHandler = doSync;
    window.addEventListener('resize', resizeHandler);
  }

  function onImageReady(image, src) {
    currentSrc = src;
    setBackground(bgWrapper, src);

    currentCanvas = drawImageToCanvas(image);
    setupMarkers(currentCanvas).then(() => {
      runExtraction(currentCanvas, currentMood)
        .then(() => {
          container.classList.remove('is-loading');
          container.classList.add('has-image');
        })
        .catch(() => {
          container.classList.remove('is-loading');
          window.lana?.log('Color wheel image extraction failed', { tags: 'color-wheel,extract' });
        });
    });
  }

  const dropzone = createImageExtractDropzone(container, controller, onImageReady, {
    enableImageUpload: true,
    enableUrlInput: true,
    maxColors,
    loadingText: options.strings?.extractingColors,
    imageUploadStrings: options.strings?.imageUploadStrings,
  });

  const topBar = createTag('div', { class: 'color-extract-top-bar' });
  const moodRow = createTag('div', { class: 'color-extract-mood-row' });
  const toolbarPlaceholder = createTag('div', { class: 'color-extract-toolbar-slot' });
  topBar.append(moodRow, toolbarPlaceholder);
  leftCol.append(topBar, bgWrapper);

  const suggestions = buildSuggestedImages(
    options.suggestionsRowEl || null,
    (img, src) => {
      container.classList.add('has-image');
      onImageReady(img, src);
    },
    options.strings,
  );

  landingContent.append(dropzone.container, suggestions);
  landing.append(landingContent);
  container.append(landing, edit);

  // Defer UI component imports until after LCP paint settles
  requestAnimationFrame(() => requestAnimationFrame(() => {
    Promise.all([
      import('../color-extract/helpers/moodSelector.js'),
      import('../color-extract/helpers/toolbar.js'),
    ]).then(([{ default: createMoodSelector }, { default: createToolbar }]) => {
      moodSelectorRef = createMoodSelector(currentMood, (mood) => {
        currentMood = mood;
        controller.setMetadata({ mood });
        if (currentCanvas) runExtraction(currentCanvas, mood);
      }, { strings: options.strings?.colorExtractStrings });
      moodRow.append(moodSelectorRef.element);

      createToolbar({
        strings: options.strings?.colorExtractStrings,
        moodElement: null,
        onAddColor: addColorToImage,
        onReset: () => {
          if (currentCanvas) runExtraction(currentCanvas, currentMood);
        },
        onReplace: () => {
          dropzone.input.value = '';
          dropzone.input.click();
        },
      }).then((toolbar) => {
        // Undo/redo is handled by the action menu — remove the toolbar's history buttons
        toolbar.element.querySelector('.action-menu-history')?.remove();
        toolbar.element.querySelectorAll('svg [id]').forEach((node) => {
          const oldId = node.id;
          const newId = `${oldId}-extract`;
          node.id = newId;
          toolbar.element.querySelectorAll(`[mask="url(#${oldId})"]`).forEach((ref) => {
            ref.setAttribute('mask', `url(#${newId})`);
          });
        });
        toolbarRef = toolbar;
        toolbarPlaceholder.replaceWith(toolbar.element);
      });
    });
  }));

  const detachWindowDrag = attachWindowDragHandlers(container, dropzone);

  function destroy() {
    detachWindowDrag?.();
    markerResizeObserver?.disconnect();
    if (resizeHandler) window.removeEventListener('resize', resizeHandler);
    markers?.destroy?.();
    markers = null;
  }

  return { element: container, destroy };
}

function createImageExtractDropzone(block, controller, onImageReady, config = {}) {
  const {
    enableImageUpload = true, enableUrlInput = true,
    loadingText = COLOR_EXTRACT_DEFAULTS.extractingColors,
    imageUploadStrings, ariaLabel,
  } = config;

  const dz = createUploadDropzone({
    enabled: enableImageUpload,
    strings: imageUploadStrings,
    loadingText,
    ariaLabel: ariaLabel || COLOR_EXTRACT_DEFAULTS.dropzoneAria,
    onImageReady: (image, src) => {
      block.classList.remove('is-loading');
      block.classList.add('has-image');
      onImageReady(image, src);
    },
  });

  const origHandleFile = dz.handleFile;
  const origHandleUrl = dz.handleUrl;

  dz.handleFile = (file) => {
    if (!file?.type?.startsWith('image/')) return;
    block.classList.add('is-loading');
    origHandleFile(file);
  };

  dz.handleUrl = (url) => {
    if (!url || !enableUrlInput) return;
    block.classList.add('is-loading');
    origHandleUrl(url);
  };

  return dz;
}
