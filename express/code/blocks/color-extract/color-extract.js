import { createTag, getIconElementDeprecated } from '../../scripts/utils.js';
import { rgbToHex } from '../../libs/color-components/utils/ColorConversions.js';
import ColorThemeController from '../../libs/color-components/controllers/ColorThemeController.js';
import {
  CSS_CLASSES, DEFAULTS, EVENTS, VARIANTS, MOODS,
} from './helpers/constants.js';
import { parseBlockConfig } from './helpers/parseConfig.js';
import { extractColorsFromImage, terminateWorker } from './helpers/extractWorker.js';
import { createImageMarkers } from './helpers/imageMarkers.js';
import { createZoomLens } from './helpers/zoomLens.js';
import { createMoodSelector } from './helpers/moodSelector.js';
import { createToolbar } from './helpers/toolbar.js';
import { createHistoryManager } from './helpers/historyManager.js';
import {
  downloadAsJPEG, downloadAsASE, copyAsCSS, copyAsSASS,
} from './helpers/downloadPalette.js';
import { createGradientEditor, gradientDataToCSS } from '../../scripts/color-shared/components/gradients/gradient-editor.js';
import { createUploadDropzone } from '../../scripts/color-shared/components/image-upload/image-upload.js';

import '../../libs/color-components/components/color-swatch-rail/index.js';

const LOGO = 'adobe-express-logo';
const EXTRACT_CANVAS_MAX = 320;

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

function samplePalette(context, width, height, count) {
  const imageData = context.getImageData(0, 0, width, height).data;
  const pixels = imageData.length / 4;
  const step = Math.max(1, Math.floor(pixels / count));
  const colors = [];
  for (let i = 0; i < count; i += 1) {
    const offset = Math.min(i * step * 4, imageData.length - 4);
    colors.push(rgbToHex({
      red: imageData[offset],
      green: imageData[offset + 1],
      blue: imageData[offset + 2],
    }));
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

/* ---------- Dropzone (uses shared createUploadDropzone) ---------- */

function createColorExtractDropzone(block, config, onImageReady) {
  const dz = createUploadDropzone({
    enabled: config.enableImageUpload,
    loadingText: 'Extracting colors...',
    ariaLabel: 'Upload an image to extract colors',
    onImageReady: (image, src) => {
      block.classList.remove('is-loading');
      block.classList.add('has-image');
      onImageReady(image, src);
    },
  });

  const origHandleFile = dz.handleFile;
  const origHandleUrl = dz.handleUrl;

  dz.handleFile = (file) => {
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

  return dz;
}

/* ---------- Suggested images ---------- */

function buildSuggestedImages(row, onSelect) {
  const wrapper = createTag('div', { class: 'color-extract-suggestions' });
  const label = row?.children?.[0] || createTag('div', {}, '\u2019t have an image? Try one of ours:');
  label.classList.add('color-extract-suggestions-label');
  wrapper.append(label);

  const list = row?.children?.[1] || createTag('div');
  list.classList.add('color-extract-suggestions-list');

  const pictures = [...(row?.querySelectorAll('picture') || [])];
  list.innerHTML = '';
  pictures.forEach((picture) => {
    const button = createTag('button', {
      class: 'color-extract-suggestion',
      type: 'button',
      'aria-label': 'Use this image',
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
    preview.append(picture.cloneNode(true));
    button.append(preview, palette);
    const chips = [...palette.querySelectorAll('.color-extract-suggestion-chip')];
    const previewImage = preview.querySelector('img');
    const hydratePalette = () => {
      const colors = extractPaletteFromImageElement(previewImage, chips.length);
      if (colors) { applyPaletteToChips(colors, chips); return; }
      extractPaletteFromSrc(src, chips.length).then((c) => applyPaletteToChips(c, chips));
    };
    if (previewImage?.complete && previewImage.naturalWidth) hydratePalette();
    else if (previewImage) previewImage.addEventListener('load', hydratePalette, { once: true });
    else extractPaletteFromSrc(src, chips.length).then((c) => applyPaletteToChips(c, chips));

    button.addEventListener('click', () => {
      list.querySelectorAll('.color-extract-suggestion.is-selected').forEach((item) => {
        item.classList.remove('is-selected');
        item.setAttribute('aria-pressed', 'false');
      });
      button.classList.add('is-selected');
      button.setAttribute('aria-pressed', 'true');
      onSelect(src);
    });
    list.append(button);
  });

  wrapper.append(list);
  return wrapper;
}

/* ---------- Edit stage ---------- */

function buildEditStage(copyRow, imageRow, controller) {
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

  const rail = createTag('color-swatch-rail', { class: 'color-extract-swatch-rail' });
  rail.controller = controller;

  stage.append(leftCol, rail);
  wrapper.append(copyWrapper, stage);

  return {
    wrapper,
    stage,
    leftCol,
    bgWrapper,
    rail,
    setBackground(src) {
      const pic = bgWrapper.querySelector('picture');
      if (pic) pic.querySelectorAll('source').forEach((s) => s.setAttribute('srcset', src));
      const img = bgWrapper.querySelector('img');
      if (img) img.src = src;
    },
  };
}

/* ---------- Action bar ---------- */

function buildActionBar(controller) {
  const bar = createTag('div', { class: 'color-extract-actions' });

  const downloadJpegBtn = createTag('button', {
    class: 'color-extract-action-btn',
    type: 'button',
    'aria-label': 'Download palette as JPEG',
  }, 'Download JPEG');

  const downloadAseBtn = createTag('button', {
    class: 'color-extract-action-btn',
    type: 'button',
    'aria-label': 'Download palette as ASE',
  }, 'Download ASE');

  const copyCssBtn = createTag('button', {
    class: 'color-extract-action-btn',
    type: 'button',
    'aria-label': 'Copy palette as CSS',
  }, 'Copy CSS');

  const copySassBtn = createTag('button', {
    class: 'color-extract-action-btn',
    type: 'button',
    'aria-label': 'Copy palette as SASS',
  }, 'Copy SASS');

  function showCopied(btn) {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    btn.classList.add('is-copied');
    setTimeout(() => { btn.textContent = orig; btn.classList.remove('is-copied'); }, 1500);
  }

  downloadJpegBtn.addEventListener('click', () => {
    const state = controller.getState();
    downloadAsJPEG(state.swatches, state.name);
  });

  downloadAseBtn.addEventListener('click', () => {
    const state = controller.getState();
    downloadAsASE(state.swatches, state.name);
  });

  copyCssBtn.addEventListener('click', () => {
    const state = controller.getState();
    copyAsCSS(state.swatches).then(() => showCopied(copyCssBtn));
  });

  copySassBtn.addEventListener('click', () => {
    const state = controller.getState();
    copyAsSASS(state.swatches).then(() => showCopied(copySassBtn));
  });

  bar.append(downloadJpegBtn, downloadAseBtn, copyCssBtn, copySassBtn);
  return bar;
}

/* ---------- Landing ---------- */

function buildLandingStage(imageRow) {
  const stage = createTag('div', { class: 'color-extract-landing' });
  const bgWrapper = createTag('div', { class: 'color-extract-landing-bg' });
  const picture = imageRow?.querySelector('picture') || imageRow?.querySelector('img');
  if (picture) bgWrapper.append(picture.cloneNode(true));
  const fade = createTag('div', { class: 'color-extract-landing-fade' });
  const content = createTag('div', { class: 'color-extract-landing-content' });
  stage.append(bgWrapper, content, fade);
  return { stage, content };
}

function buildDragOverlay() {
  const overlay = createTag('div', { class: 'color-extract-drag-overlay', 'aria-hidden': 'true' });
  const icon = getIconElementDeprecated('hand');
  if (icon) { icon.classList.add('color-extract-drag-icon'); overlay.append(icon); }
  overlay.append(createTag('p', { class: 'color-extract-drag-text' }, 'Drop your image anywhere'));
  return overlay;
}

function buildHeroSection(row, dropzoneContainer, logo) {
  const hero = createTag('div', { class: 'color-extract-hero' });
  const heroCopy = createTag('div', { class: 'color-extract-hero-copy' });
  const copySource = row?.querySelector(':scope > div') || row;
  if (copySource) heroCopy.append(...copySource.childNodes);
  if (logo) heroCopy.prepend(logo);
  hero.append(heroCopy, dropzoneContainer);
  return hero;
}

/* ---------- Main render ---------- */

function renderColorVariant(block, rows, config) {
  const controller = new ColorThemeController();
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
  let zoomLens = null;

  const edit = buildEditStage(rows[2], rows[3], controller);

  edit.rail.onSwatchSelect = (index) => {
    if (markers) markers.selectMarker(index);
  };

  edit.rail.onSwatchDelete = (index) => {
    const state = controller.getState();
    if (state.swatches.length <= 1) return;
    historySnapshot();
    const swatches = state.swatches.filter((_, i) => i !== index);
    swatches.forEach((s, i) => controller.setSwatchHex(i, s.hex));
    if (index >= swatches.length) controller.setBaseColorIndex(swatches.length - 1);
  };

  function getHistoryState() {
    const state = controller.getState();
    return {
      swatches: state.swatches.map((s) => s.hex),
      mood: currentMood,
    };
  }

  function restoreFromHistory(snapshot) {
    if (snapshot.swatches) {
      controller.setHarmonyRule('CUSTOM');
      controller.setBaseColorIndex(0);
      snapshot.swatches.forEach((hex, i) => controller.setSwatchHex(i, hex));
    }
    if (snapshot.mood) {
      currentMood = snapshot.mood;
      moodSelector.setMood(snapshot.mood);
      controller.setMetadata({ mood: snapshot.mood });
    }
  }

  const history = createHistoryManager(
    restoreFromHistory,
    (canUndo, canRedo) => {
      toolbar.setUndoEnabled(canUndo);
      toolbar.setRedoEnabled(canRedo);
    },
  );

  function historySnapshot() {
    history.push(getHistoryState());
  }

  async function runExtraction(canvas, mood) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    try {
      const result = await extractColorsFromImage(
        imageData,
        canvas.width,
        canvas.height,
        resolvedConfig.maxColors,
        mood,
      );
      controller.setHarmonyRule('CUSTOM');
      controller.setBaseColorIndex(0);
      result.colors.forEach((hex, i) => controller.setSwatchHex(i, hex));

      if (markers) markers.setPositions(result.colors, result.points);

      emitBlockEvent(block, EVENTS.COLOR_EXTRACT, {
        palette: result.colors,
        points: result.points,
        mood,
        src: currentSrc,
      });
    } catch {
      const fallback = samplePalette(ctx, canvas.width, canvas.height, resolvedConfig.maxColors);
      controller.setHarmonyRule('CUSTOM');
      controller.setBaseColorIndex(0);
      fallback.forEach((hex, i) => controller.setSwatchHex(i, hex));
      if (markers) {
        const pts = fallback.map((_, i) => ({ x: (i + 1) / (fallback.length + 1), y: 0.5 }));
        markers.setPositions(fallback, pts);
      }
    }
  }

  const moodSelector = createMoodSelector(currentMood, (mood) => {
    historySnapshot();
    currentMood = mood;
    controller.setMetadata({ mood });
    emitBlockEvent(block, EVENTS.MOOD_CHANGE, { mood });
    if (currentCanvas) runExtraction(currentCanvas, mood);
  });

  function onMoodOverride(mood) {
    currentMood = mood;
    moodSelector.setMood(mood);
    controller.setMetadata({ mood });
  }

  function setupMarkers(canvas) {
    zoomLens = createZoomLens(canvas);
    zoomLens.element.hidden = true;

    markers = createImageMarkers(edit.bgWrapper, canvas, controller, {
      onMoodOverride,
      onZoomStart: (el, cx, cy) => zoomLens.show(el, cx, cy),
      onZoomMove: (el, cx, cy) => zoomLens.move(el, cx, cy),
      onZoomEnd: () => zoomLens.hide(),
    });

    edit.bgWrapper.style.position = 'relative';
    edit.bgWrapper.append(markers.container, zoomLens.element);
  }

  function onImageReady(image, src) {
    currentSrc = src;
    edit.setBackground(src);
    history.clear();

    currentCanvas = drawImageToCanvas(image);
    setupMarkers(currentCanvas);

    runExtraction(currentCanvas, currentMood);
  }

  const dropzone = createColorExtractDropzone(block, resolvedConfig, onImageReady);
  const actionBar = buildActionBar(controller);
  const logo = injectLogo();

  const toolbar = createToolbar({
    moodElement: moodSelector.element,
    onAddColor: () => {
      // Placeholder: future eyedropper / add-color-from-image
    },
    onReset: () => {
      if (currentCanvas) {
        historySnapshot();
        runExtraction(currentCanvas, currentMood);
      }
    },
    onReplace: () => {
      dropzone.input.value = '';
      dropzone.input.click();
    },
    onUndo: () => history.undo(getHistoryState()),
    onRedo: () => history.redo(getHistoryState()),
  });

  const hero = buildHeroSection(rows[0], dropzone.container, logo);
  const suggestions = resolvedConfig.enableUrlInput
    ? buildSuggestedImages(rows[1], dropzone.handleUrl)
    : null;
  const landing = buildLandingStage(rows[3]);
  const dragOverlay = buildDragOverlay();

  const innerContainer = createTag('div', { class: 'color-extract-inner' });
  landing.content.append(hero);
  if (suggestions) landing.content.append(suggestions);
  landing.stage.append(dragOverlay);

  edit.leftCol.prepend(toolbar.element);
  edit.wrapper.append(actionBar);
  innerContainer.append(landing.stage, edit.wrapper);

  block.innerHTML = '';
  block.append(innerContainer);

  const isBlockInViewport = () => {
    const rect = block.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
  };

  if (resolvedConfig.enableImageUpload) {
    window.addEventListener('dragenter', (e) => { if (isBlockInViewport()) { preventDefaults(e); block.classList.add('is-dragging'); } });
    window.addEventListener('dragover', (e) => { if (isBlockInViewport()) { preventDefaults(e); block.classList.add('is-dragging'); } });
    window.addEventListener('dragleave', (e) => { preventDefaults(e); block.classList.remove('is-dragging'); });
    window.addEventListener('dragend', (e) => { preventDefaults(e); block.classList.remove('is-dragging'); });
    window.addEventListener('drop', (e) => {
      if (!isBlockInViewport()) return;
      preventDefaults(e);
      block.classList.remove('is-dragging');
      dropzone.handleFile(e.dataTransfer?.files?.[0]);
    });
  }
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

  const editorCol = createTag('div', { class: 'color-extract-gradient-editor-col' });

  stage.append(leftCol, editorCol);
  wrapper.append(copyWrapper, stage);

  return {
    wrapper,
    stage,
    leftCol,
    bgWrapper,
    editorCol,
    setBackground(src) {
      const pic = bgWrapper.querySelector('picture');
      if (pic) pic.querySelectorAll('source').forEach((s) => s.setAttribute('srcset', src));
      const img = bgWrapper.querySelector('img');
      if (img) img.src = src;
    },
  };
}

/* ---------- Gradient action bar ---------- */

function buildGradientActionBar(getGradientFn) {
  const bar = createTag('div', { class: 'color-extract-actions color-extract-actions--gradient' });

  const copyCssGradientBtn = createTag('button', {
    class: 'color-extract-action-btn',
    type: 'button',
    'aria-label': 'Copy CSS gradient',
  }, 'Copy CSS Gradient');

  const downloadBtn = createTag('button', {
    class: 'color-extract-action-btn',
    type: 'button',
    'aria-label': 'Download gradient as image',
  }, 'Download');

  function showCopied(btn) {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    btn.classList.add('is-copied');
    setTimeout(() => { btn.textContent = orig; btn.classList.remove('is-copied'); }, 1500);
  }

  copyCssGradientBtn.addEventListener('click', () => {
    const data = getGradientFn();
    const css = gradientDataToCSS(data);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(css).then(() => showCopied(copyCssGradientBtn));
    }
  });

  downloadBtn.addEventListener('click', () => {
    const data = getGradientFn();
    const css = gradientDataToCSS(data);
    const width = 1200;
    const height = 400;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const sorted = [...(data.colorStops || [])].sort((a, b) => a.position - b.position);
    const grad = ctx.createLinearGradient(0, 0, width, 0);
    sorted.forEach((stop) => {
      grad.addColorStop(Math.max(0, Math.min(1, stop.position)), stop.color);
    });
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, height - 48, width, 48);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px "Adobe Clean", Helvetica, Arial, sans-serif';
    ctx.fillText(css, 16, height - 18);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'gradient.jpg';
      document.body.append(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }, 'image/jpeg', 0.95);
  });

  bar.append(copyCssGradientBtn, downloadBtn);
  return bar;
}

/* ---------- Gradient controller proxy ---------- */

function createGradientControllerProxy(editor) {
  let baseIndex = 0;
  return {
    setSwatchHex(index, hex) {
      editor.updateColorStop(index, hex);
    },
    setBaseColorIndex(index) {
      baseIndex = index;
    },
    getState() {
      return editor.getGradient();
    },
    setHarmonyRule() {},
    setMetadata() {},
  };
}

/* ---------- Gradient variant renderer ---------- */

function renderGradientVariant(block, rows, config) {
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
  let zoomLens = null;
  let gradientEditor = null;

  const initialGradient = {
    type: 'linear',
    angle: 90,
    colorStops: [
      { color: '#808080', position: 0 },
      { color: '#808080', position: 1 },
    ],
  };

  gradientEditor = createGradientEditor(initialGradient, {
    layout: 'static',
    size: 'l',
    draggable: true,
    copyable: false,
    ariaLabel: 'Extracted gradient editor',
    onChange: (payload) => {
      emitBlockEvent(block, EVENTS.GRADIENT_CLICK, { gradient: payload });
    },
  });

  const controllerProxy = createGradientControllerProxy(gradientEditor);

  const edit = buildGradientEditStage(rows[2], rows[3]);
  edit.editorCol.append(gradientEditor.element);

  function getHistoryState() {
    const grad = gradientEditor.getGradient();
    return {
      colorStops: grad.colorStops.map((s) => ({ color: s.color, position: s.position })),
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
    }
  }

  const history = createHistoryManager(
    restoreFromHistory,
    (canUndo, canRedo) => {
      toolbar.setUndoEnabled(canUndo);
      toolbar.setRedoEnabled(canRedo);
    },
  );

  function historySnapshot() {
    history.push(getHistoryState());
  }

  async function runGradientExtraction(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    try {
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

      if (markers) markers.setPositions(result.colors, result.points);

      emitBlockEvent(block, EVENTS.COLOR_EXTRACT, {
        gradient: gradientData,
        points: result.points,
        src: currentSrc,
      });
    } catch {
      const fallback = samplePalette(ctx, canvas.width, canvas.height, resolvedConfig.maxColors);
      const colorStops = fallback.map((hex, i) => ({
        color: hex,
        position: fallback.length > 1 ? i / (fallback.length - 1) : 0.5,
      }));
      gradientEditor.setGradient({ type: 'linear', angle: 90, colorStops });
      if (markers) {
        const pts = fallback.map((_, i) => ({ x: (i + 1) / (fallback.length + 1), y: 0.5 }));
        markers.setPositions(fallback, pts);
      }
    }
  }

  function setupMarkers(canvas) {
    zoomLens = createZoomLens(canvas);
    zoomLens.element.hidden = true;

    markers = createImageMarkers(edit.bgWrapper, canvas, controllerProxy, {
      onMoodOverride: () => {},
      onZoomStart: (el, cx, cy) => zoomLens.show(el, cx, cy),
      onZoomMove: (el, cx, cy) => zoomLens.move(el, cx, cy),
      onZoomEnd: () => zoomLens.hide(),
    });

    edit.bgWrapper.style.position = 'relative';
    edit.bgWrapper.append(markers.container, zoomLens.element);
  }

  function onImageReady(image, src) {
    currentSrc = src;
    edit.setBackground(src);
    history.clear();

    currentCanvas = drawImageToCanvas(image);
    setupMarkers(currentCanvas);
    runGradientExtraction(currentCanvas);
  }

  const dropzone = createColorExtractDropzone(block, resolvedConfig, onImageReady);
  const actionBar = buildGradientActionBar(() => gradientEditor.getGradient());
  const logo = injectLogo();

  const toolbar = createToolbar({
    moodElement: null,
    onAddColor: () => {},
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
  });

  const hero = buildHeroSection(rows[0], dropzone.container, logo);
  const suggestions = resolvedConfig.enableUrlInput
    ? buildSuggestedImages(rows[1], dropzone.handleUrl)
    : null;
  const landing = buildLandingStage(rows[3]);
  const dragOverlay = buildDragOverlay();

  const innerContainer = createTag('div', { class: 'color-extract-inner' });
  landing.content.append(hero);
  if (suggestions) landing.content.append(suggestions);
  landing.stage.append(dragOverlay);

  edit.leftCol.prepend(toolbar.element);
  edit.wrapper.append(actionBar);
  innerContainer.append(landing.stage, edit.wrapper);

  block.innerHTML = '';
  block.append(innerContainer);

  const isBlockInViewport = () => {
    const rect = block.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
  };

  if (resolvedConfig.enableImageUpload) {
    window.addEventListener('dragenter', (e) => { if (isBlockInViewport()) { preventDefaults(e); block.classList.add('is-dragging'); } });
    window.addEventListener('dragover', (e) => { if (isBlockInViewport()) { preventDefaults(e); block.classList.add('is-dragging'); } });
    window.addEventListener('dragleave', (e) => { preventDefaults(e); block.classList.remove('is-dragging'); });
    window.addEventListener('dragend', (e) => { preventDefaults(e); block.classList.remove('is-dragging'); });
    window.addEventListener('drop', (e) => {
      if (!isBlockInViewport()) return;
      preventDefaults(e);
      block.classList.remove('is-dragging');
      dropzone.handleFile(e.dataTransfer?.files?.[0]);
    });
  }
}

export default function decorate(block) {
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

  if (variant === VARIANTS.PALETTE) {
    renderColorVariant(block, contentRows, config);
  } else {
    renderGradientVariant(block, contentRows, config);
  }
}
