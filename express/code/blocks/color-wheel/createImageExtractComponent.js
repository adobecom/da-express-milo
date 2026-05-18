/* eslint-disable */
import { createTag } from '../../scripts/utils.js';
import { DEFAULTS, MOODS } from '../../scripts/color-shared/utils/constants.js';
import { createUploadDropzone } from '../../scripts/color-shared/components/image-upload/image-upload.js';
import { DEFAULT_PLACEHOLDERS as COLOR_EXTRACT_DEFAULTS } from '../../scripts/color-shared/i18n/loadColorExtractPlaceholders.js';
import {
  isFileDrag, preventDefaults, drawImageToCanvas, toHex, samplePalette, syncMarkersToImage,
} from '../../scripts/color-shared/utils/imageExtractUtils.js';
import buildSuggestedImages from '../../scripts/color-shared/components/image-extract/buildSuggestedImages.js';


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

  async function runExtraction(canvas, mood, count) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const swatchCount = count || controller.getState().swatches?.length || maxColors;
    try {
      const { extractColorsFromImage } = await import('../color-extract/helpers/extractWorker.js');
      const result = await extractColorsFromImage(
        imageData,
        canvas.width,
        canvas.height,
        swatchCount,
        mood,
      );
      controller.replaceSwatchesFromHexes(result.colors, { baseIndex: 0, harmonyRule: 'CUSTOM' });
      if (markers) markers.setPositions(result.colors, result.points);
    } catch {
      const fallback = samplePalette(ctx, canvas.width, canvas.height, swatchCount);
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
    { strings: options.strings },
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
          if (currentCanvas) runExtraction(currentCanvas, currentMood, maxColors);
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

  if (options.initialSrc) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => onImageReady(img, options.initialSrc);
    img.src = options.initialSrc;
  }

  function destroy() {
    detachWindowDrag?.();
    markerResizeObserver?.disconnect();
    if (resizeHandler) window.removeEventListener('resize', resizeHandler);
    markers?.destroy?.();
    markers = null;
  }

  return { element: container, destroy, getCurrentSrc: () => currentSrc };
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
