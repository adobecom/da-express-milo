/* eslint-disable */
import { createTag } from '../../scripts/utils.js';
import { rgbToHex } from '../../libs/color-components/utils/ColorConversions.js';
import { DEFAULTS, MOODS } from '../color-extract/helpers/constants.js';
import { extractColorsFromImage } from '../color-extract/helpers/extractWorker.js';
import { createImageMarkers } from '../color-extract/helpers/imageMarkers.js';
import { createZoomLens } from '../color-extract/helpers/zoomLens.js';
import { createMoodSelector } from '../color-extract/helpers/moodSelector.js';
import { createToolbar } from '../color-extract/helpers/toolbar.js';
import { createHistoryManager } from '../color-extract/helpers/historyManager.js';
import { createUploadDropzone } from '../../scripts/color-shared/components/image-upload/image-upload.js';

const EXTRACT_CANVAS_MAX = 320;

const DEFAULT_SUGGESTIONS_EMPTY_HINT =
  'No sample images yet. Add sample <picture> elements where your page or block defines suggestions (see your authoring documentation).';

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
  } catch {
    return null;
  }
}

function extractPaletteFromSrc(src, swatchCount) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const image = new Image();
    image.onload = () => resolve(extractPaletteFromImageElement(image, swatchCount));
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function applyPaletteToChips(colors, chips) {
  if (!colors || !chips?.length) return;
  colors.forEach((hex, i) => {
    if (chips[i]) chips[i].style.background = hex;
  });
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
 * Suggested images strip (same structure as color-extract block suggestions row).
 * @param {HTMLElement | null} row - Row with label cell + list cell with <picture> nodes, or null
 * @param {(url: string) => void} onSelect
 * @param {{ showEmptyHint?: boolean, emptyHintText?: string }} [options] - If showEmptyHint, append authoring hint when there are no pictures
 */
export function buildSuggestedImages(row, onSelect, options = {}) {
  const { showEmptyHint = false, emptyHintText } = options;
  const wrapper = createTag('div', { class: 'color-extract-suggestions' });
  const label = row?.children?.[0]
    || createTag('div', {}, 'Don\u2019t have an image? Try one of ours:');
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
      if (colors) {
        applyPaletteToChips(colors, chips);
        return;
      }
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

  if (!pictures.length && showEmptyHint) {
    const hint = createTag('p', {
      class: 'color-extract-suggestions-hint',
    }, emptyHintText || DEFAULT_SUGGESTIONS_EMPTY_HINT);
    hint.setAttribute('role', 'note');
    wrapper.append(hint);
  }

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

/**
 * Image extraction UI (dropzone, optional suggestions, edit stage + markers). Mount inside any container.
 *
 * @param {object} options
 * @param {object} options.controller - ColorThemeExpressController instance
 * @param {number} [options.maxColors]
 * @param {HTMLElement | null} [options.suggestionsRowEl]
 * @param {boolean} [options.suggestionsShowEmptyHint] - When true and there are no pictures, show an authoring hint
 * @param {string} [options.suggestionsEmptyHintText] - Overrides default empty-suggestions copy
 * @returns {{ element: HTMLElement, destroy: Function }}
 */
export function createImageExtractComponent(options = {}) {
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
  let zoomLens = null;

  const landing = createTag('div', { class: 'color-extract-landing' });
  const landingContent = createTag('div', { class: 'color-extract-landing-content' });

  const edit = createTag('div', { class: 'color-extract-edit' });
  const stage = createTag('div', {
    class: 'color-extract-edit-stage',
  });
  const leftCol = createTag('div', { class: 'color-extract-edit-left' });
  const bgWrapper = createTag('div', { class: 'color-extract-edit-bg' });
  stage.append(leftCol);
  edit.append(stage);

  function getHistoryState() {
    const state = controller.getState();
    return {
      swatches: state.swatches.map((s) => s.hex),
      mood: currentMood,
    };
  }

  function restoreFromHistory(snapshot) {
    if (snapshot.swatches?.length) {
      controller.replaceSwatchesFromHexes(snapshot.swatches, { baseIndex: 0, harmonyRule: 'CUSTOM' });
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

  const moodSelector = createMoodSelector(currentMood, (mood) => {
    historySnapshot();
    currentMood = mood;
    controller.setMetadata({ mood });
    if (currentCanvas) runExtraction(currentCanvas, mood);
  });

  function onMoodOverride(mood) {
    currentMood = mood;
    moodSelector.setMood(mood);
    controller.setMetadata({ mood });
  }

  function setupMarkers(canvas) {
    if (zoomLens?.element) zoomLens.element.remove();
    if (markers?.container) markers.destroy();

    zoomLens = createZoomLens(canvas);
    zoomLens.element.hidden = true;

    markers = createImageMarkers(bgWrapper, canvas, controller, {
      onMoodOverride,
      onZoomStart: (el, cx, cy) => zoomLens.show(el, cx, cy),
      onZoomMove: (el, cx, cy) => zoomLens.move(el, cx, cy),
      onZoomEnd: () => zoomLens.hide(),
    });

    bgWrapper.style.position = 'relative';
    bgWrapper.append(markers.container, zoomLens.element);
  }

  function showHasImageState() {
    container.classList.remove('is-loading');
    container.classList.add('has-image');
  }

  function onImageReady(image, src) {
    currentSrc = src;
    setBackground(bgWrapper, src);
    history.clear();

    currentCanvas = drawImageToCanvas(image);
    setupMarkers(currentCanvas);

    runExtraction(currentCanvas, currentMood)
      .then(() => {
        showHasImageState();
      })
      .catch(() => {
        container.classList.remove('is-loading');
        window.lana?.log('Color wheel image extraction failed', { tags: 'color-wheel,extract' });
      });
  }

  const dropzone = createUploadDropzone({
    enabled: true,
    loadingText: 'Extracting colors...',
    ariaLabel: 'Upload an image to extract colors for your theme',
    onImageReady: (image, src) => {
      onImageReady(image, src);
    },
  });

  const origHandleFile = dropzone.handleFile.bind(dropzone);
  const origHandleUrl = dropzone.handleUrl.bind(dropzone);

  dropzone.handleFile = (file) => {
    container.classList.add('is-loading');
    origHandleFile(file);
  };

  dropzone.handleUrl = (url) => {
    if (!url) return;
    container.classList.add('is-loading');
    origHandleUrl(url);
  };

  const moodRow = createTag('div', { class: 'color-extract-mood-row' });
  moodRow.append(moodSelector.element);

  const toolbar = createToolbar({
    moodElement: null,
    onAddColor: () => {},
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

  leftCol.append(moodRow, bgWrapper, toolbar.element);

  const suggestions = buildSuggestedImages(
    options.suggestionsRowEl || null,
    (url) => {
      dropzone.handleUrl(url);
    },
    {
      showEmptyHint: options.suggestionsShowEmptyHint === true,
      emptyHintText: options.suggestionsEmptyHintText,
    },
  );

  landingContent.append(dropzone.container, suggestions);
  landing.append(landingContent);

  container.append(landing, edit);

  const ac = new AbortController();
  const { signal } = ac;

  const isContainerInViewport = () => {
    const rect = container.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
  };

  window.addEventListener(
    'dragenter',
    (e) => {
      if (isContainerInViewport()) {
        preventDefaults(e);
        container.classList.add('is-dragging');
      }
    },
    { signal },
  );
  window.addEventListener(
    'dragover',
    (e) => {
      if (isContainerInViewport()) {
        preventDefaults(e);
        container.classList.add('is-dragging');
      }
    },
    { signal },
  );
  window.addEventListener('dragleave', (e) => {
    preventDefaults(e);
    container.classList.remove('is-dragging');
  }, { signal });
  window.addEventListener('dragend', (e) => {
    preventDefaults(e);
    container.classList.remove('is-dragging');
  }, { signal });
  window.addEventListener(
    'drop',
    (e) => {
      if (!isContainerInViewport()) return;
      preventDefaults(e);
      container.classList.remove('is-dragging');
      dropzone.handleFile(e.dataTransfer?.files?.[0]);
    },
    { signal },
  );

  function destroy() {
    ac.abort();
    markers?.destroy?.();
    markers = null;
    zoomLens = null;
  }

  return { element: container, destroy };
}

export default createImageExtractComponent;
