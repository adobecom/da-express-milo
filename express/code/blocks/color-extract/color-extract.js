import { createTag, getIconElementDeprecated, getLibs } from '../../scripts/utils.js';
import { trackColorBlockLoad } from '../../scripts/instrument.js';
import {
  CSS_CLASSES, DEFAULTS, EVENTS, MOODS, VARIANTS,
} from './helpers/constants.js';
import parseBlockConfig from './helpers/parseConfig.js';
import createHistoryManager from './helpers/historyManager.js';
import { createUploadDropzone } from '../../scripts/color-shared/components/image-upload/image-upload.js';
import { showExpressToast } from '../../scripts/color-shared/spectrum/components/express-toast.js';
import { decorateAnalyticsAttributes, createColorPaletteParamApi, PARAM_NAME } from '../../scripts/color-shared/utils/utilities.js';
import loadColorExtractPlaceholders, { DEFAULT_PLACEHOLDERS as COLOR_EXTRACT_DEFAULTS } from '../../scripts/color-shared/i18n/loadColorExtractPlaceholders.js';
import loadImageUploadPlaceholders, { DEFAULT_PLACEHOLDERS as IMAGE_UPLOAD_DEFAULTS } from '../../scripts/color-shared/i18n/loadImageUploadPlaceholders.js';
import loadColorSwatchRailPlaceholders, { DEFAULT_PLACEHOLDERS as COLOR_SWATCH_RAIL_DEFAULTS } from '../../scripts/color-shared/i18n/loadColorSwatchRailPlaceholders.js';

const placeholdersPromise = Promise.all([
  loadColorExtractPlaceholders(),
  loadImageUploadPlaceholders(),
  loadColorSwatchRailPlaceholders(),
]).then(([colorExtractStrings, imageUploadStrings, colorSwatchRailStrings]) => ({
  colorExtractStrings,
  imageUploadStrings,
  colorSwatchRailStrings,
})).catch(() => ({
  colorExtractStrings: COLOR_EXTRACT_DEFAULTS,
  imageUploadStrings: IMAGE_UPLOAD_DEFAULTS,
  colorSwatchRailStrings: COLOR_SWATCH_RAIL_DEFAULTS,
}));

let extractionErrorShown = false;
async function showExtractionError() {
  if (extractionErrorShown) return;
  extractionErrorShown = true;
  const [{ getConfig }, { replaceKey }] = await Promise.all([
    import(`${getLibs()}/utils/utils.js`),
    import(`${getLibs()}/features/placeholders.js`),
  ]);
  const key = 'color-extract-block-error';
  const raw = await replaceKey(key, getConfig());
  const message = (raw && raw !== key.replaceAll('-', ' ')) ? raw : 'Failed to load Color Extract.';
  showExpressToast({ message, variant: 'negative' });
}

function injectStylesheet(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

const LOGO = 'adobe-express-logo';
const EXTRACT_CANVAS_MAX = 320;
const ICON_HAND = '<svg xmlns="http://www.w3.org/2000/svg" width="65" height="65" viewBox="0 0 65 65" fill="none"><path d="M53.3013 16.6594C52.1413 16.4619 51.009 16.5983 49.9624 16.9506V14.1204C49.9624 10.3118 46.8648 7.21412 43.0562 7.21412C41.7855 7.21412 40.7714 7.56801 39.957 8.1496C38.735 6.20165 36.5836 4.89404 34.1187 4.89404C30.9798 4.89404 28.3542 7.011 27.5171 9.88331C26.784 9.6175 26.0048 9.4485 25.1812 9.4485C21.3726 9.4485 18.2749 12.5461 18.2749 16.3547V28.3677C17.2244 27.0236 15.7537 26.1111 14.0633 25.8128C12.2383 25.4827 10.407 25.8985 8.90263 26.9553C7.38871 28.0122 6.38261 29.596 6.06206 31.4114C5.74152 33.23 6.14777 35.0613 7.20463 36.5752L16.1421 49.3023C22.128 57.0401 27.7203 60.1028 35.9405 60.1028C36.1182 60.1028 36.296 60.1028 36.4769 60.0996C46.9568 60.0076 54.4121 52.2825 56.4117 39.4729L58.9476 24.6289C59.5855 20.8743 57.0527 17.3006 53.3013 16.6594ZM51.6001 38.689C49.9719 49.1277 44.4431 55.1548 36.4165 55.2246C29.5103 55.3008 25.1653 53.0029 20.0681 46.4109L11.1973 33.7791C10.8863 33.3347 10.7657 32.7952 10.8609 32.2588C10.9561 31.7256 11.2512 31.2591 11.6956 30.948C12.6128 30.3069 13.8823 30.5259 14.5298 31.4527L18.7193 37.4004C19.4968 38.5017 21.0171 38.7747 22.1152 37.9907C22.7246 37.5623 23.0476 36.9037 23.1098 36.2158C23.1332 36.2007 23.1499 36.1484 23.1499 35.9976V16.3547C23.1499 15.2344 24.0608 14.3235 25.1812 14.3235C26.3015 14.3235 27.2124 15.2344 27.2124 16.3547V28.5676C27.2124 29.9133 28.3042 31.0051 29.6499 31.0051C30.9956 31.0051 32.0874 29.9133 32.0874 28.5676V11.8003C32.0874 10.6799 32.9983 9.76904 34.1187 9.76904C35.239 9.76904 36.1499 10.6799 36.1499 11.8003V28.1487C36.1499 29.4944 37.2417 30.5862 38.5874 30.5862C39.9331 30.5862 41.0249 29.4944 41.0249 28.1487V14.1203C41.0249 13 41.9358 12.0891 43.0562 12.0891C44.1765 12.0891 45.0874 13 45.0874 14.1203V23.1308C45.0874 23.2292 45.0846 23.7547 45.0846 23.7547L44.1638 29.1452C43.9385 30.4719 44.8303 31.7319 46.157 31.9572C47.4614 32.2016 48.7405 31.2939 48.969 29.9641L50.137 23.1245C50.3242 22.0231 51.3367 21.2773 52.4824 21.4646C53.5838 21.6518 54.3296 22.7055 54.1423 23.81L51.6001 38.689Z" fill="#131313"/></svg>';

/* ---------- Lightweight controller for extract ---------- */

function createExtractController(maxColors = 5, callbacks = {}) {
  let state = {
    swatches: Array.from({ length: maxColors }, () => ({ hex: '#808080' })),
    baseColorIndex: 0,
    name: 'Extracted Palette',
    mood: 'colorful',
  };
  const listeners = new Set();

  function notify(detail = {}) {
    const snap = { ...state, swatches: [...state.swatches] };
    listeners.forEach((fn) => fn(snap, detail));
  }

  return {
    subscribe(fn) {
      listeners.add(fn);
      fn({ ...state, swatches: [...state.swatches] });
      return () => listeners.delete(fn);
    },
    getState() {
      return { ...state, swatches: [...state.swatches] };
    },
    setState(next) {
      if (next.swatches) state.swatches = [...next.swatches];
      state = { ...state, ...next, swatches: state.swatches };
      notify({ source: 'setState' });
      if (next.baseColorIndex != null) callbacks.onBaseColorChange?.(next.baseColorIndex);
      if (next.swatches) callbacks.onSwatchesChange?.(state.swatches);
    },
    setSwatchHex(index, hex) {
      const normalized = (hex?.startsWith?.('#') ? hex : `#${hex || '000000'}`).toUpperCase();
      if (index >= 0 && index < state.swatches.length) {
        state.swatches = [...state.swatches];
        state.swatches[index] = { hex: normalized };
      }
      notify({ source: 'swatch', index });
    },
    setBaseColorIndex(index) {
      state = { ...state, baseColorIndex: index };
      notify({ source: 'base-index' });
    },
    addSwatch(hex = '#808080') {
      const normalized = (hex?.startsWith?.('#') ? hex : `#${hex || '808080'}`).toUpperCase();
      state.swatches = [...state.swatches, { hex: normalized }];
      const newIndex = state.swatches.length - 1;
      notify({ source: 'add-swatch', index: newIndex });
      return newIndex;
    },
    removeSwatch(index) {
      if (index < 0 || index >= state.swatches.length || state.swatches.length <= 2) return;
      state.swatches = state.swatches.filter((_, i) => i !== index);
      if (state.baseColorIndex >= state.swatches.length) {
        state.baseColorIndex = state.swatches.length - 1;
      }
      notify({ source: 'remove-swatch', index });
    },
    setHarmonyRule() { /* no-op for extract */ },
    setMetadata(updates = {}) {
      Object.assign(state, updates);
    },
    destroy() {
      listeners.clear();
    },
  };
}

/* ---------- Helpers ---------- */

function emitBlockEvent(block, eventName, detail) {
  block.dispatchEvent(new CustomEvent(`color-extract:${eventName}`, {
    detail,
    bubbles: true,
    composed: true,
  }));
}

function injectLogo() {
  const logo = getIconElementDeprecated(LOGO);
  logo.classList.add('express-logo');
  return logo;
}

function preventDefaults(event) {
  event.preventDefault();
  event.stopPropagation();
}

function isFileDrag(e) {
  return e.dataTransfer?.types?.includes('Files');
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

function getContentRows(rows) {
  const configKeys = new Set(['variant', 'maxcolors', 'enableimageupload', 'enableurlinput']);
  return rows.filter((row) => {
    const cells = row.querySelectorAll(':scope > div');
    if (cells.length < 2) return true;
    const key = cells[0].textContent.trim().toLowerCase().replace(/\s+/g, '');
    return !configKeys.has(key);
  });
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

function toHex(r, g, b) {
  /* eslint-disable no-bitwise */
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase()}`;
  /* eslint-enable no-bitwise */
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

/* ---------- Dropzone (uses shared createUploadDropzone) ---------- */

function createColorExtractDropzone(block, config, onImageReady, strings = {}) {
  const colorExtractStrings = { ...COLOR_EXTRACT_DEFAULTS, ...(strings.colorExtractStrings || {}) };
  const imageUploadStrings = { ...IMAGE_UPLOAD_DEFAULTS, ...(strings.imageUploadStrings || {}) };
  const dz = createUploadDropzone({
    enabled: config.enableImageUpload,
    strings: imageUploadStrings,
    loadingText: colorExtractStrings.extractingColors,
    ariaLabel: colorExtractStrings.dropzoneAria,
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
    emitBlockEvent(block, EVENTS.IMAGE_UPLOAD, { file });
    origHandleFile(file);
  };

  dz.handleUrl = (url) => {
    if (!url || !config.enableUrlInput) return;
    block.classList.add('is-loading');
    emitBlockEvent(block, EVENTS.URL_INPUT, { url });
    origHandleUrl(url);
  };

  // When dropping directly onto the dropzone element, its own `drop` listener calls
  // stopPropagation, so the window-level handler never fires — meaning `is-dragging`
  // is never removed and the wrapped handleFile (is-loading + analytics) is skipped.
  // stopPropagation only blocks parent propagation; same-element listeners still fire.
  const dropzoneEl = dz.container.querySelector('.image-upload-dropzone');
  if (dropzoneEl) {
    dropzoneEl.addEventListener('drop', (e) => {
      if (isFileDrag(e)) {
        const file = e.dataTransfer?.files?.[0];
        if (file?.type?.startsWith('image/')) {
          block.classList.add('is-loading');
          emitBlockEvent(block, EVENTS.IMAGE_UPLOAD, { file });
        }
      }
      // Delay removing is-dragging so the loading overlay (0.2s fade-in) is fully
      // opaque before the drag overlay starts fading out — no hero flash between states.
      setTimeout(() => block.classList.remove('is-dragging'), 200);
    });
  }

  return dz;
}

/* ---------- Suggested images ---------- */

function buildSuggestedImages(row, onSelect, strings = COLOR_EXTRACT_DEFAULTS) {
  const wrapper = createTag('div', { class: 'color-extract-suggestions' });
  const label = row?.children?.[0] || createTag('div', {}, strings.noImageTryOurs);
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
      'aria-label': strings.useThisImage,
      'aria-pressed': 'false',
    });
    decorateAnalyticsAttributes(button, { linkLabel: 'Use this image' });
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
        const maxWidth = EXTRACT_CANVAS_MAX;
        const ratio = img.naturalHeight / img.naturalWidth || 1;
        const w = Math.min(maxWidth, img.naturalWidth);
        const h = Math.round(w * ratio);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const context = canvas.getContext('2d');
        context.drawImage(img, 0, 0, w, h);
        const imageData = context.getImageData(0, 0, w, h);
        const { extractColorsFromImage } = await import('./helpers/extractWorker.js');
        const result = await extractColorsFromImage(imageData, w, h, chips.length);
        applyPaletteToChips(result.colors, chips);
      } catch (err) {
        window.lana?.log(`Color Extract: extraction failed — ${err?.message}`, { tags: 'color-extract', severity: 'error' });
        applyPaletteToChips(extractPaletteFromImageElement(img, chips.length), chips);
        await showExtractionError();
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

/* ---------- Edit stage (palette) ---------- */

function buildEditStage(copyRow, imageRow) {
  const wrapper = createTag('div', { class: 'color-extract-edit' });

  const copyWrapper = createTag('div', { class: 'color-extract-edit-copy' });
  const copySource = copyRow?.querySelector(':scope > div') || copyRow;
  if (copySource) copyWrapper.append(...copySource.childNodes);
  copyWrapper.prepend(injectLogo());

  const stage = createTag('div', { class: 'color-extract-edit-stage' });

  const leftCol = createTag('div', { class: 'color-extract-edit-left' });
  const bgWrapper = createTag('div', { class: 'color-extract-edit-bg' });
  const picture = imageRow?.querySelector('picture') || imageRow?.querySelector('img');
  if (picture) bgWrapper.append(picture.cloneNode(true));

  leftCol.append(bgWrapper);

  const railSlot = createTag('div', { class: 'color-extract-swatch-rail' });
  stage.append(leftCol, railSlot);
  wrapper.append(copyWrapper, stage);

  return {
    wrapper,
    stage,
    leftCol,
    bgWrapper,
    railSlot,
    setBackground(src) {
      const pic = bgWrapper.querySelector('picture');
      if (pic) pic.querySelectorAll('source').forEach((s) => s.setAttribute('srcset', src));
      const img = bgWrapper.querySelector('img');
      if (img) img.src = src;
    },
  };
}

/* ---------- Floating toolbar (shared: color-shared/toolbar) ---------- */

function createFloatingToolbarMount(controller, variant) {
  const container = createTag('div', { class: 'color-extract-floating-toolbar-mount' });
  let toolbarHandle = null;
  let mounted = false;

  function sync() {
    if (!toolbarHandle) return;
    const state = controller.getState();
    toolbarHandle.toolbar?.updateSwatches(state.swatches.map((s) => s.hex));
  }

  function destroy() {
    toolbarHandle?.destroy?.();
    toolbarHandle = null;
    mounted = false;
  }

  async function mount() {
    if (mounted) {
      sync();
      return;
    }
    mounted = true;

    try {
      const { initFloatingToolbar } = await import('../../scripts/color-shared/toolbar/createFloatingToolbar.js');
      const state = controller.getState();
      const palette = {
        name: state.name || 'Extracted Palette',
        colors: state.swatches.map((s) => s.hex),
        tags: [],
        ...(variant === VARIANTS.GRADIENT ? { angle: 90 } : {}),
      };

      toolbarHandle = await initFloatingToolbar(container, {
        type: variant === VARIANTS.GRADIENT ? 'gradient' : 'palette',
        variant: 'sticky',
        standaloneAppearance: 'raised',
        palette,
        showEdit: true,
        showPaletteName: true,
        editPaletteName: true,
      });

      controller.subscribe(() => sync());
    } catch (err) {
      const { default: lana } = await import(`${getLibs()}/utils/lana.js`);
      lana.log(`color-extract: floating toolbar load failed: ${err.message}`, { tags: 'color-extract' });
    }
  }

  return { element: container, mount, destroy };
}

/* ---------- Landing ---------- */

function buildLandingStage(imageRow, strings = COLOR_EXTRACT_DEFAULTS) {
  const stage = createTag('div', { class: 'color-extract-landing', role: 'region', 'aria-label': strings.landingAria });
  const bgWrapper = createTag('div', { class: 'color-extract-landing-bg' });
  const picture = imageRow?.querySelector('picture') || imageRow?.querySelector('img');
  if (picture) {
    bgWrapper.append(picture.cloneNode(true));
    const img = bgWrapper.querySelector('img');
    if (img) {
      img.loading = 'eager';
      img.fetchpriority = 'high';
      img.decoding = 'async';
    }
  }
  const fade = createTag('div', { class: 'color-extract-landing-fade' });
  const content = createTag('div', { class: 'color-extract-landing-content' });
  stage.append(bgWrapper, content, fade);
  return { stage, content };
}

function buildDragOverlay(strings = COLOR_EXTRACT_DEFAULTS) {
  const overlay = createTag('div', { class: 'color-extract-drag-overlay', 'aria-hidden': 'true' });
  const icon = createTag('div', { class: 'color-extract-drag-icon' }, ICON_HAND);
  overlay.append(icon);
  overlay.append(createTag('p', { class: 'color-extract-drag-text' }, strings.dropOverlayText));
  return overlay;
}

function buildLoadingOverlay(strings = COLOR_EXTRACT_DEFAULTS) {
  const overlay = createTag('div', { class: 'color-extract-loading-overlay', 'aria-live': 'polite' });
  const content = createTag('div', { class: 'color-extract-loading-content' });
  const label = createTag('p', { class: 'color-extract-loading-label' }, strings.uploadingImage);
  const track = createTag('div', { class: 'color-extract-loading-track' });
  const bar = createTag('div', { class: 'color-extract-loading-bar' });
  track.append(bar);
  content.append(label, track);
  overlay.append(content);
  return overlay;
}

/* ---------- Shared drag wiring ---------- */

function attachWindowDragHandlers(block, dropzone, dragOverlay, loadingOverlay) {
  const ac = new AbortController();
  const { signal } = ac;
  let dragCounter = 0;
  const clearDrag = () => {
    dragCounter = 0;
    block.classList.remove('is-dragging');
  };
  const isBlockInViewport = () => {
    const rect = block.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
  };
  window.addEventListener('dragenter', (e) => {
    if (isBlockInViewport() && isFileDrag(e)) {
      preventDefaults(e);
      dragCounter += 1;
      block.classList.add('is-dragging');
    }
  }, { signal });
  window.addEventListener('dragover', (e) => {
    if (isBlockInViewport() && isFileDrag(e)) {
      preventDefaults(e);
    }
  }, { signal });
  window.addEventListener('dragleave', (e) => {
    preventDefaults(e);
    if (isFileDrag(e)) {
      dragCounter -= 1;
      if (dragCounter <= 0) clearDrag();
    }
  }, { signal });
  window.addEventListener('dragend', (e) => {
    preventDefaults(e);
    clearDrag();
  }, { signal });
  window.addEventListener('drop', (e) => {
    if (!isBlockInViewport() || !isFileDrag(e)) {
      clearDrag();
      return;
    }
    preventDefaults(e);
    dropzone.handleFile(e.dataTransfer.files[0]);
    setTimeout(clearDrag, 200);
  }, { signal });
  window.addEventListener('blur', clearDrag, { signal });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearDrag();
  }, { signal });
  // Sync is-dragging and is-loading from block to body-level overlays
  const syncObserver = new MutationObserver(() => {
    if (dragOverlay) dragOverlay.classList.toggle('is-dragging', block.classList.contains('is-dragging'));
    if (loadingOverlay) loadingOverlay.classList.toggle('is-loading', block.classList.contains('is-loading'));
  });
  syncObserver.observe(block, { attributes: true, attributeFilter: ['class'] });
  const detach = () => {
    ac.abort();
    if (dragOverlay) dragOverlay.remove();
    if (loadingOverlay) loadingOverlay.remove();
    syncObserver.disconnect();
  };
  const observer = new MutationObserver(() => {
    if (!block.isConnected) {
      detach();
      observer.disconnect();
    }
  });
  observer.observe(block.parentElement || document.body, { childList: true });
  return detach;
}

/* ---------- Palette variant ---------- */

function hoistLandingDecorations(block, landing) {
  const marqueeWrapper = block.closest('.color-extract-marquee-wrapper');
  if (!marqueeWrapper) return;
  const section = marqueeWrapper.closest('.section');
  if (!section) return;
  const landingBg = landing.stage.querySelector('.color-extract-landing-bg');
  const landingFade = landing.stage.querySelector('.color-extract-landing-fade');
  if (landingBg) section.insertBefore(landingBg, marqueeWrapper);
  if (landingFade) marqueeWrapper.after(landingFade);
}

function renderColorVariant(block, rows, config, strings = {}) {
  const colorExtractStrings = { ...COLOR_EXTRACT_DEFAULTS, ...(strings.colorExtractStrings || {}) };
  const colorSwatchRailStrings = {
    ...COLOR_SWATCH_RAIL_DEFAULTS,
    ...(strings.colorSwatchRailStrings || {}),
  };
  const imageUploadStrings = { ...IMAGE_UPLOAD_DEFAULTS, ...(strings.imageUploadStrings || {}) };
  const maxColors = Math.max(1, Math.min(10, Number(config.maxColors) || DEFAULTS.MAX_COLORS));
  const resolvedConfig = {
    ...config,
    maxColors,
    enableImageUpload: config.enableImageUpload ?? DEFAULTS.ENABLE_IMAGE_UPLOAD,
    enableUrlInput: config.enableUrlInput ?? DEFAULTS.ENABLE_URL_INPUT,
  };
  let currentMood = DEFAULTS.MOOD;
  let currentCanvas = null;
  let currentSrc = null;
  let markers = null;
  let markerResizeObserver = null;

  const controller = createExtractController(maxColors, {
    onBaseColorChange: (index) => {
      if (markers) markers.selectMarker(index);
    },
  });

  const edit = buildEditStage(rows[1], rows[2]);

  function getHistoryState() {
    const state = controller.getState();
    return {
      swatches: state.swatches.map((s) => s.hex),
      positions: markers ? markers.getPositions() : [],
      mood: currentMood,
    };
  }

  let moodSelectorRef = null;

  function restoreFromHistory(snapshot) {
    if (snapshot.swatches) {
      controller.setState({
        swatches: snapshot.swatches.map((hex) => ({ hex })),
        baseColorIndex: 0,
      });
      if (markers && snapshot.positions) {
        const points = snapshot.positions.map((p) => ({ x: p.pctX, y: p.pctY }));
        markers.setPositions(snapshot.swatches, points);
      }
    }
    if (snapshot.mood) {
      currentMood = snapshot.mood;
      moodSelectorRef?.setMood(snapshot.mood);
      controller.setMetadata({ mood: snapshot.mood });
    }
  }

  let toolbarRef = null;

  const history = createHistoryManager(
    restoreFromHistory,
    (canUndo, canRedo) => {
      toolbarRef?.setUndoEnabled(canUndo);
      toolbarRef?.setRedoEnabled(canRedo);
    },
  );

  function historySnapshot() {
    history.push(getHistoryState());
  }

  async function runExtraction(canvas, mood, count) {
    const swatchCount = count || controller.getState().swatches.length || resolvedConfig.maxColors;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    try {
      const { extractColorsFromImage } = await import('./helpers/extractWorker.js');
      const result = await extractColorsFromImage(
        imageData,
        canvas.width,
        canvas.height,
        swatchCount,
        mood,
      );
      controller.setState({
        swatches: result.colors.map((hex) => ({ hex })),
        baseColorIndex: 0,
      });

      if (markers) markers.setPositions(result.colors, result.points);

      emitBlockEvent(block, EVENTS.COLOR_EXTRACT, {
        palette: result.colors,
        points: result.points,
        mood,
        src: currentSrc,
      });
    } catch (err) {
      window.lana?.log(`Color Extract: extraction failed — ${err?.message}`, { tags: 'color-extract', severity: 'error' });
      const fallback = samplePalette(ctx, canvas.width, canvas.height, swatchCount);
      controller.setState({
        swatches: fallback.map((hex) => ({ hex })),
        baseColorIndex: 0,
      });
      if (markers) {
        const pts = fallback.map((_, i) => ({ x: (i + 1) / (fallback.length + 1), y: 0.5 }));
        markers.setPositions(fallback, pts);
      }
      await showExtractionError();
    }
  }

  function onMoodOverride(mood) {
    currentMood = mood;
    moodSelectorRef?.setMood(mood);
    controller.setMetadata({ mood });
  }

  let resizeHandler = null;
  let imgLoadHandler = null;

  async function setupMarkers(canvas) {
    const createImageMarkers = (await import('./helpers/imageMarkers.js')).default;
    markers = createImageMarkers(edit.bgWrapper, canvas, controller, {
      onMoodOverride,
      onDragStart: () => historySnapshot(),
    });

    edit.bgWrapper.style.position = 'relative';
    edit.bgWrapper.append(markers.container);

    const doSync = () => syncMarkersToImage(markers.container, edit.bgWrapper);

    const bgImg = edit.bgWrapper.querySelector('img');
    if (bgImg) {
      imgLoadHandler = doSync;
      bgImg.addEventListener('load', doSync);
      if (bgImg.complete && bgImg.naturalWidth) doSync();
    }

    requestAnimationFrame(() => requestAnimationFrame(doSync));
    markerResizeObserver = new ResizeObserver(doSync);
    markerResizeObserver.observe(edit.bgWrapper);
    resizeHandler = doSync;
    window.addEventListener('resize', resizeHandler);
  }

  const floatingToolbar = createFloatingToolbarMount(controller, VARIANTS.PALETTE);

  const popstateAc = new AbortController();

  function goToLanding() {
    block.classList.remove('has-image', 'is-loading');
    if (markerResizeObserver) markerResizeObserver.disconnect();
    if (resizeHandler) window.removeEventListener('resize', resizeHandler);
    if (markers) {
      markers.destroy();
      markers = null;
    }
    floatingToolbar.destroy();
    history.clear();
    currentCanvas = null;
    currentSrc = null;
    popstateAc.abort();
    block.querySelectorAll('.color-extract-suggestion.is-selected').forEach((el) => {
      el.classList.remove('is-selected');
      el.setAttribute('aria-pressed', 'false');
    });
  }

  async function onImageReady(image, src) {
    window.history.pushState({ colorExtract: 'results' }, '');
    currentSrc = src;
    edit.setBackground(src);
    history.clear();

    if (markerResizeObserver) markerResizeObserver.disconnect();
    if (resizeHandler) window.removeEventListener('resize', resizeHandler);
    const oldImg = edit.bgWrapper.querySelector('img');
    if (oldImg && imgLoadHandler) oldImg.removeEventListener('load', imgLoadHandler);
    if (markers) markers.destroy();

    if (!edit.bgWrapper.isConnected) {
      edit.leftCol.querySelector('.image-upload-dropzone-container')?.replaceWith(edit.bgWrapper);
    }
    currentCanvas = drawImageToCanvas(image);
    await setupMarkers(currentCanvas);

    runExtraction(currentCanvas, currentMood);
    floatingToolbar.mount();
  }

  const dropzone = createColorExtractDropzone(
    block,
    resolvedConfig,
    onImageReady,
    { colorExtractStrings, imageUploadStrings },
  );

  async function addColorToImage() {
    if (!currentCanvas || !markers) return;
    const totalLimit = DEFAULTS.MAX_TOTAL_COLORS;
    if (markers.markerCount >= totalLimit) return;

    historySnapshot();

    const pctX = 0.1 + Math.random() * 0.8;
    const pctY = 0.1 + Math.random() * 0.8;
    const cx = Math.round(pctX * currentCanvas.width);
    const cy = Math.round(pctY * currentCanvas.height);
    const ctx = currentCanvas.getContext('2d');
    const [r, g, b] = ctx.getImageData(cx, cy, 1, 1).data;
    const { rgbToHex } = await import('../../libs/color-components/utils/ColorConversions.js');
    const hex = rgbToHex({ red: r, green: g, blue: b });

    const newIndex = controller.addSwatch(hex);
    markers.addMarker(hex, pctX, pctY);
    controller.setBaseColorIndex(newIndex);
    onMoodOverride(MOODS.CUSTOM);
  }

  function handleSuggestionClick(imgEl, src) {
    block.classList.add('has-image');
    onImageReady(imgEl, src);
  }

  const suggestions = resolvedConfig.enableUrlInput
    ? buildSuggestedImages(rows[0], handleSuggestionClick, colorExtractStrings)
    : null;
  const landing = buildLandingStage(rows[2], colorExtractStrings);
  const dragOverlay = buildDragOverlay(colorExtractStrings);
  const loadingOverlay = buildLoadingOverlay(colorExtractStrings);

  const innerContainer = createTag('div', { class: 'color-extract-inner' });
  landing.content.append(dropzone.container);
  if (suggestions) landing.content.append(suggestions);
  document.body.append(dragOverlay, loadingOverlay);

  // Defer UI component imports until after LCP paint settles
  const toolbarPlaceholder = createTag('div', { class: 'color-extract-toolbar-slot' });
  edit.leftCol.prepend(toolbarPlaceholder);
  edit.wrapper.append(floatingToolbar.element);

  requestAnimationFrame(() => requestAnimationFrame(() => {
    Promise.all([
      import('../../scripts/color-shared/adapters/litComponentAdapters.js'),
      import('./helpers/moodSelector.js'),
      import('./helpers/toolbar.js'),
    ]).then(([
      { createSwatchRailAdapter },
      { default: createMoodSelector },
      { default: createToolbar },
    ]) => {
      const railAdapter = createSwatchRailAdapter(controller, {
        orientation: 'stacked',
        swatchFeatures: {
          copy: true,
          hexCode: true,
          trash: true,
          minSwatches: 2,
          editColorDisabled: true,
          copyFromHex: false,
        },
        strings: colorSwatchRailStrings,
      });
      railAdapter.element.classList.add('color-extract-swatch-rail');
      edit.railSlot.replaceWith(railAdapter.element);

      railAdapter.rail.addEventListener('color-swatch-rail-delete', (e) => {
        historySnapshot();
        const deletedIndex = e.detail?.index ?? -1;
        const oldPositions = markers ? markers.getPositions() : [];
        queueMicrotask(() => {
          if (!markers) return;
          const state = controller.getState();
          const newPositions = oldPositions.filter((_, i) => i !== deletedIndex);
          const points = newPositions.map((p) => ({ x: p.pctX, y: p.pctY }));
          markers.setPositions(state.swatches.map((s) => s.hex), points);
        });
      });

      moodSelectorRef = createMoodSelector(currentMood, (mood) => {
        historySnapshot();
        currentMood = mood;
        controller.setMetadata({ mood });
        emitBlockEvent(block, EVENTS.MOOD_CHANGE, { mood });
        if (currentCanvas) runExtraction(currentCanvas, mood);
      }, { strings: colorExtractStrings });

      createToolbar({
        strings: colorExtractStrings,
        moodElement: moodSelectorRef.element,
        onAddColor: addColorToImage,
        onReset: () => {
          if (currentCanvas) {
            historySnapshot();
            runExtraction(currentCanvas, currentMood, resolvedConfig.maxColors);
          }
        },
        onReplace: () => {
          dropzone.input.value = '';
          dropzone.input.click();
        },
        onUndo: () => history.undo(getHistoryState()),
        onRedo: () => history.redo(getHistoryState()),
      }).then((toolbar) => {
        toolbarRef = toolbar;
        toolbarPlaceholder.replaceWith(toolbar.element);
      });
    });
  }));

  // Move decorative full-bleed elements to section level when inside marquee wrapper.
  // Must happen before innerContainer.append so landing.stage loses bg/fade before mounting.
  hoistLandingDecorations(block, landing);

  innerContainer.append(landing.stage, edit.wrapper);

  block.replaceChildren(innerContainer);

  if (resolvedConfig.enableImageUpload) {
    attachWindowDragHandlers(block, dropzone, dragOverlay, loadingOverlay);
  }

  if (new URLSearchParams(window.location.search).has(PARAM_NAME)) {
    const { getResolvedPalette, getResolvedPaletteName } = createColorPaletteParamApi();
    const colors = getResolvedPalette();
    const paletteName = getResolvedPaletteName();
    controller.setState({ swatches: colors.map((hex) => ({ hex })), baseColorIndex: 0 });
    if (paletteName) controller.setMetadata({ name: paletteName });
    edit.bgWrapper.replaceWith(dropzone.container);
    block.classList.add('has-image');
    window.history.replaceState({ colorExtract: 'results' }, '');
    floatingToolbar.mount();
  }

  window.addEventListener('popstate', (e) => {
    if (block.classList.contains('has-image') && e.state?.colorExtract !== 'results') {
      goToLanding();
    }
  }, { signal: popstateAc.signal });
}

/* ---------- Gradient edit stage ---------- */

function buildGradientEditStage(copyRow, imageRow) {
  const wrapper = createTag('div', { class: 'color-extract-edit' });

  const copyWrapper = createTag('div', { class: 'color-extract-edit-copy' });
  const copySource = copyRow?.querySelector(':scope > div') || copyRow;
  if (copySource) copyWrapper.append(...copySource.childNodes);
  copyWrapper.prepend(injectLogo());

  const stage = createTag('div', { class: 'color-extract-edit-stage color-extract-edit-stage--gradient' });

  const leftCol = createTag('div', { class: 'color-extract-edit-left' });
  const bgWrapper = createTag('div', { class: 'color-extract-edit-bg' });
  const picture = imageRow?.querySelector('picture') || imageRow?.querySelector('img');
  if (picture) bgWrapper.append(picture.cloneNode(true));
  leftCol.append(bgWrapper);

  const rightCol = createTag('div', { class: 'color-extract-gradient-right-col' });
  const editorCol = createTag('div', { class: 'color-extract-gradient-editor-col' });

  const railSlot = createTag('div', { class: 'color-extract-swatch-rail color-extract-swatch-rail--gradient' });
  rightCol.append(editorCol, railSlot);
  stage.append(leftCol, rightCol);
  wrapper.append(copyWrapper, stage);

  return {
    wrapper,
    stage,
    leftCol,
    bgWrapper,
    editorCol,
    rightCol,
    railSlot,
    setBackground(src) {
      const pic = bgWrapper.querySelector('picture');
      if (pic) pic.querySelectorAll('source').forEach((s) => s.setAttribute('srcset', src));
      const img = bgWrapper.querySelector('img');
      if (img) img.src = src;
    },
  };
}

/* ---------- Gradient controller proxy ---------- */

function createGradientControllerProxy(editor) {
  return {
    setSwatchHex(index, hex) {
      editor.updateColorStop(index, hex);
    },
    setBaseColorIndex() {},
    getState() {
      return editor.getGradient();
    },
    setHarmonyRule() {},
    setMetadata() {},
  };
}

/* ---------- Gradient variant renderer ---------- */

async function renderGradientVariant(block, rows, config, strings = {}) {
  const colorExtractStrings = { ...COLOR_EXTRACT_DEFAULTS, ...(strings.colorExtractStrings || {}) };
  const colorSwatchRailStrings = {
    ...COLOR_SWATCH_RAIL_DEFAULTS,
    ...(strings.colorSwatchRailStrings || {}),
  };
  const imageUploadStrings = { ...IMAGE_UPLOAD_DEFAULTS, ...(strings.imageUploadStrings || {}) };
  injectStylesheet(new URL('../../scripts/color-shared/components/gradients/gradient-editor.css', import.meta.url).href);
  const { createGradientEditor } = await import('../../scripts/color-shared/components/gradients/gradient-editor.js');
  const maxColors = Math.max(2, Math.min(10, Number(config.maxColors) || DEFAULTS.MAX_COLORS));
  const resolvedConfig = {
    ...config,
    maxColors,
    enableImageUpload: config.enableImageUpload ?? DEFAULTS.ENABLE_IMAGE_UPLOAD,
    enableUrlInput: config.enableUrlInput ?? DEFAULTS.ENABLE_URL_INPUT,
  };

  let currentCanvas = null;
  let currentSrc = null;
  let markers = null;
  let markerResizeObserver = null;
  let gradientEditor = null;

  const initialGradient = {
    type: 'linear',
    angle: 90,
    colorStops: [
      { color: '#808080', position: 0 },
      { color: '#808080', position: 1 },
    ],
  };

  const swatchController = createExtractController(maxColors);

  function syncSwatchesFromGradient(gradientData) {
    const stops = gradientData?.colorStops || [];
    swatchController.setState({
      swatches: stops.map((stop) => ({ hex: stop.color })),
      baseColorIndex: 0,
    });
  }

  let gradientInteracting = false;

  gradientEditor = createGradientEditor(initialGradient, {
    layout: 'static',
    size: 'responsive',
    draggable: true,
    copyable: false,
    ariaLabel: 'Extracted gradient editor',
    onChange: (payload) => {
      syncSwatchesFromGradient(payload);
      if (markers?.setConnectorOrder && payload?.colorStops) {
        markers.setConnectorOrder(payload.colorStops.map((s) => s.id));
      }
      emitBlockEvent(block, EVENTS.GRADIENT_CLICK, { gradient: payload });
    },
  });

  const controllerProxy = createGradientControllerProxy(gradientEditor);

  const edit = buildGradientEditStage(rows[1], rows[2]);
  edit.editorCol.append(gradientEditor.element);

  // Swatch rail loaded lazily — wired up in Promise.all below

  function getHistoryState() {
    const grad = gradientEditor.getGradient();
    return {
      colorStops: grad.colorStops.map((s) => ({ id: s.id, color: s.color, position: s.position })),
      positions: markers ? markers.getPositions() : [],
      angle: grad.angle,
      type: grad.type,
      midpoints: grad.midpoints ? [...grad.midpoints] : [],
    };
  }

  function restoreFromHistory(snapshot) {
    if (snapshot.colorStops) {
      gradientEditor.setGradient({
        type: snapshot.type || 'linear',
        angle: snapshot.angle ?? 90,
        colorStops: snapshot.colorStops,
        midpoints: snapshot.midpoints || [],
      });
      syncSwatchesFromGradient(snapshot);
      if (markers && snapshot.positions) {
        const colors = snapshot.colorStops.map((s) => s.color);
        const points = snapshot.positions.map((p) => ({ x: p.pctX, y: p.pctY }));
        markers.setPositions(colors, points);
      }
    }
  }

  let toolbarRef = null;

  const history = createHistoryManager(
    restoreFromHistory,
    (canUndo, canRedo) => {
      toolbarRef?.setUndoEnabled(canUndo);
      toolbarRef?.setRedoEnabled(canRedo);
    },
  );

  function historySnapshot() {
    history.push(getHistoryState());
  }

  gradientEditor.element.addEventListener('pointerdown', () => {
    if (!gradientInteracting) {
      gradientInteracting = true;
      historySnapshot();
    }
  });
  gradientEditor.element.addEventListener('pointerup', () => { gradientInteracting = false; });
  gradientEditor.element.addEventListener('pointercancel', () => { gradientInteracting = false; });

  async function runGradientExtraction(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    try {
      const { extractColorsFromImage } = await import('./helpers/extractWorker.js');
      const result = await extractColorsFromImage(
        imageData,
        canvas.width,
        canvas.height,
        resolvedConfig.maxColors,
        'colorful',
      );

      const colorStops = result.colors.map((hex, i) => ({
        color: hex,
        position: result.colors.length > 1 ? i / (result.colors.length - 1) : 0.5,
      }));

      const gradientData = { type: 'linear', angle: 90, colorStops };
      gradientEditor.setGradient(gradientData);

      swatchController.setState({
        swatches: result.colors.map((hex) => ({ hex })),
        baseColorIndex: 0,
      });

      if (markers) markers.setPositions(result.colors, result.points);

      emitBlockEvent(block, EVENTS.COLOR_EXTRACT, {
        gradient: gradientData,
        points: result.points,
        src: currentSrc,
      });
    } catch (err) {
      window.lana?.log(`Color Extract: gradient extraction failed — ${err?.message}`, { tags: 'color-extract', severity: 'error' });
      const fallback = samplePalette(ctx, canvas.width, canvas.height, resolvedConfig.maxColors);
      const colorStops = fallback.map((hex, i) => ({
        color: hex,
        position: fallback.length > 1 ? i / (fallback.length - 1) : 0.5,
      }));
      gradientEditor.setGradient({ type: 'linear', angle: 90, colorStops });
      swatchController.setState({
        swatches: fallback.map((hex) => ({ hex })),
        baseColorIndex: 0,
      });
      if (markers) {
        const pts = fallback.map((_, i) => ({ x: (i + 1) / (fallback.length + 1), y: 0.5 }));
        markers.setPositions(fallback, pts);
      }
      await showExtractionError();
    }
  }

  let resizeHandler = null;
  let imgLoadHandler = null;

  async function setupMarkers(canvas) {
    const createImageMarkers = (await import('./helpers/imageMarkers.js')).default;
    markers = createImageMarkers(edit.bgWrapper, canvas, controllerProxy, {
      showConnectors: true,
      onMoodOverride: () => {},
      onDragStart: () => historySnapshot(),
    });

    edit.bgWrapper.style.position = 'relative';
    edit.bgWrapper.append(markers.container);

    const doSync = () => syncMarkersToImage(markers.container, edit.bgWrapper);

    const bgImg = edit.bgWrapper.querySelector('img');
    if (bgImg) {
      imgLoadHandler = doSync;
      bgImg.addEventListener('load', doSync);
      if (bgImg.complete && bgImg.naturalWidth) doSync();
    }

    requestAnimationFrame(() => requestAnimationFrame(doSync));
    markerResizeObserver = new ResizeObserver(doSync);
    markerResizeObserver.observe(edit.bgWrapper);
    resizeHandler = doSync;
    window.addEventListener('resize', resizeHandler);
  }

  const floatingToolbar = createFloatingToolbarMount(swatchController, VARIANTS.GRADIENT);
  const popstateAc = new AbortController();

  function goToLanding() {
    block.classList.remove('has-image', 'is-loading');
    if (markerResizeObserver) markerResizeObserver.disconnect();
    if (resizeHandler) window.removeEventListener('resize', resizeHandler);
    if (markers) {
      markers.destroy();
      markers = null;
    }
    floatingToolbar.destroy();
    history.clear();
    currentCanvas = null;
    currentSrc = null;
    popstateAc.abort();
    gradientEditor.setGradient(initialGradient);
    block.querySelectorAll('.color-extract-suggestion.is-selected').forEach((el) => {
      el.classList.remove('is-selected');
      el.setAttribute('aria-pressed', 'false');
    });
  }

  async function onImageReady(image, src) {
    window.history.pushState({ colorExtract: 'results' }, '');
    currentSrc = src;
    edit.setBackground(src);
    history.clear();

    if (markerResizeObserver) markerResizeObserver.disconnect();
    if (resizeHandler) window.removeEventListener('resize', resizeHandler);
    const oldImg = edit.bgWrapper.querySelector('img');
    if (oldImg && imgLoadHandler) oldImg.removeEventListener('load', imgLoadHandler);
    if (markers) markers.destroy();

    if (!edit.bgWrapper.isConnected) {
      edit.leftCol.querySelector('.image-upload-dropzone-container')?.replaceWith(edit.bgWrapper);
    }
    currentCanvas = drawImageToCanvas(image);
    await setupMarkers(currentCanvas);
    runGradientExtraction(currentCanvas);
    floatingToolbar.mount();
  }

  const dropzone = createColorExtractDropzone(
    block,
    resolvedConfig,
    onImageReady,
    { colorExtractStrings, imageUploadStrings },
  );

  async function addColorToImage() {
    if (!currentCanvas || !markers || !gradientEditor) return;
    const totalLimit = DEFAULTS.MAX_TOTAL_COLORS;
    if (markers.markerCount >= totalLimit) return;

    historySnapshot();

    const pctX = 0.1 + Math.random() * 0.8;
    const pctY = 0.1 + Math.random() * 0.8;
    const cx = Math.round(pctX * currentCanvas.width);
    const cy = Math.round(pctY * currentCanvas.height);
    const ctx = currentCanvas.getContext('2d');
    const [r, g, b] = ctx.getImageData(cx, cy, 1, 1).data;
    const { rgbToHex } = await import('../../libs/color-components/utils/ColorConversions.js');
    const hex = rgbToHex({ red: r, green: g, blue: b });

    // Add a new color stop and redistribute all stops evenly
    const grad = gradientEditor.getGradient();
    grad.colorStops.push({ color: hex, position: 1 });
    const total = grad.colorStops.length;
    grad.colorStops.forEach((stop, i) => {
      stop.position = total > 1 ? i / (total - 1) : 0.5;
    });
    gradientEditor.setGradient(grad);

    // Add new swatch to the swatch controller (updates the swatch rail)
    const newIndex = swatchController.addSwatch(hex);

    // Add new draggable marker on the image
    markers.addMarker(hex, pctX, pctY);

    // Set it as active
    swatchController.setBaseColorIndex(newIndex);
  }

  function handleSuggestionClick(imgEl, src) {
    block.classList.add('has-image');
    onImageReady(imgEl, src);
  }

  const suggestions = resolvedConfig.enableUrlInput
    ? buildSuggestedImages(rows[0], handleSuggestionClick, colorExtractStrings)
    : null;
  const landing = buildLandingStage(rows[2], colorExtractStrings);
  const dragOverlay = buildDragOverlay(colorExtractStrings);
  const loadingOverlay = buildLoadingOverlay(colorExtractStrings);

  const innerContainer = createTag('div', { class: 'color-extract-inner' });
  landing.content.append(dropzone.container);
  if (suggestions) landing.content.append(suggestions);
  document.body.append(dragOverlay, loadingOverlay);

  const toolbarPlaceholder = createTag('div', { class: 'color-extract-toolbar-slot' });
  edit.leftCol.prepend(toolbarPlaceholder);
  edit.wrapper.append(floatingToolbar.element);

  // Defer UI component imports until after LCP paint settles
  requestAnimationFrame(() => requestAnimationFrame(() => {
    Promise.all([
      import('../../scripts/color-shared/adapters/litComponentAdapters.js'),
      import('./helpers/toolbar.js'),
    ]).then(([
      { createSwatchRailAdapter },
      { default: createToolbar },
    ]) => {
      const railAdapter = createSwatchRailAdapter(swatchController, {
        orientation: 'stacked',
        swatchFeatures: {
          copy: true,
          hexCode: true,
          trash: true,
          minSwatches: 2,
          editColorDisabled: true,
          copyFromHex: false,
        },
        strings: colorSwatchRailStrings,
      });
      railAdapter.element.classList.add('color-extract-swatch-rail', 'color-extract-swatch-rail--gradient');
      edit.railSlot.replaceWith(railAdapter.element);

      railAdapter.rail.addEventListener('color-swatch-rail-delete', (e) => {
        historySnapshot();
        const deletedIndex = e.detail?.index ?? -1;
        const oldPositions = markers ? markers.getPositions() : [];
        queueMicrotask(() => {
          const grad = gradientEditor.getGradient();
          const canDelete = deletedIndex >= 0
            && deletedIndex < grad.colorStops.length
            && grad.colorStops.length > 2;
          if (canDelete) {
            grad.colorStops.splice(deletedIndex, 1);
            delete grad.midpoints;
            gradientEditor.setGradient(grad);
          }
          if (markers) {
            const state = swatchController.getState();
            const newPositions = oldPositions.filter((_, i) => i !== deletedIndex);
            const points = newPositions.map((p) => ({ x: p.pctX, y: p.pctY }));
            markers.setPositions(state.swatches.map((s) => s.hex), points);
          }
        });
      });

      createToolbar({
        strings: colorExtractStrings,
        moodElement: null,
        onAddColor: addColorToImage,
        onReset: () => {
          if (currentCanvas) {
            historySnapshot();
            runGradientExtraction(currentCanvas);
          }
        },
        onReplace: () => {
          dropzone.input.value = '';
          dropzone.input.click();
        },
        onUndo: () => history.undo(getHistoryState()),
        onRedo: () => history.redo(getHistoryState()),
      }).then((toolbar) => {
        toolbarRef = toolbar;
        toolbarPlaceholder.replaceWith(toolbar.element);
      });
    });
  }));

  // Move decorative full-bleed elements to section level when inside marquee wrapper.
  // Must happen before innerContainer.append so landing.stage loses bg/fade before mounting.
  hoistLandingDecorations(block, landing);

  innerContainer.append(landing.stage, edit.wrapper);

  block.replaceChildren(innerContainer);

  if (resolvedConfig.enableImageUpload) {
    attachWindowDragHandlers(block, dropzone, dragOverlay, loadingOverlay);
  }

  if (new URLSearchParams(window.location.search).has(PARAM_NAME)) {
    const { getResolvedPalette } = createColorPaletteParamApi();
    const colors = getResolvedPalette();
    const colorStops = colors.map((color, i) => ({
      color,
      position: colors.length <= 1 ? 0.5 : i / (colors.length - 1),
    }));
    const gradientData = { type: 'linear', angle: 90, colorStops };
    gradientEditor.setGradient(gradientData);
    syncSwatchesFromGradient(gradientData);
    edit.bgWrapper.replaceWith(dropzone.container);
    block.classList.add('has-image');
    window.history.replaceState({ colorExtract: 'results' }, '');
    floatingToolbar.mount();
  }

  window.addEventListener('popstate', (e) => {
    if (block.classList.contains('has-image') && e.state?.colorExtract !== 'results') {
      goToLanding();
    }
  }, { signal: popstateAc.signal });
}

export default async function decorate(block) {
  injectStylesheet(new URL('../../scripts/color-shared/components/image-upload/image-upload.css', import.meta.url).href);
  const rows = [...block.children];
  const config = parseBlockConfig(rows);
  const contentRows = getContentRows(rows);

  block.classList.add(CSS_CLASSES.BLOCK);

  const inferredVariant = block.classList.contains(VARIANTS.GRADIENT)
    ? VARIANTS.GRADIENT
    : VARIANTS.PALETTE;
  const variant = config.variant || inferredVariant || DEFAULTS.VARIANT;

  block.classList.remove(VARIANTS.GRADIENT, VARIANTS.PALETTE);
  block.classList.add(variant);

  const strings = await placeholdersPromise;

  if (variant === VARIANTS.PALETTE) {
    renderColorVariant(block, contentRows, config, strings);
  } else {
    await renderGradientVariant(block, contentRows, config, strings);
  }
  trackColorBlockLoad('color-extract');
}
