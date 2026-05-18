import { createTag } from '../../scripts/utils.js';
import { DEFAULTS, MOODS } from '../../scripts/color-shared/utils/constants.js';
import { createUploadDropzone } from '../../scripts/color-shared/components/image-upload/image-upload.js';
import { DEFAULT_PLACEHOLDERS as COLOR_EXTRACT_DEFAULTS } from '../../scripts/color-shared/i18n/loadColorExtractPlaceholders.js';
import {
  isFileDrag, preventDefaults, drawImageToCanvas, toHex, samplePalette, syncMarkersToImage,
} from '../../scripts/color-shared/utils/imageExtractUtils.js';
import buildSuggestedImages from '../../scripts/color-shared/components/image-extract/buildSuggestedImages.js';
import { buildDragOverlay, buildLoadingOverlay } from '../../scripts/color-shared/components/image-extract/buildExtractOverlays.js';

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

function attachWindowDragHandlers(container, dropzone, dragOverlay, loadingOverlay, viewportEl) {
  const ac = new AbortController();
  const { signal } = ac;
  const clearDrag = () => {
    container.classList.remove('is-dragging');
  };
  const anchorEl = viewportEl || container;
  const isInViewport = () => {
    const rect = anchorEl.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
  };
  // On macOS Chrome, dataTransfer.types is empty during dragleave for cross-monitor
  // external file drags, so isFileDrag() returns false and the overlay gets stuck.
  // Debounce clearDrag on null-relatedTarget dragleave: cancel if dragover fires within
  // 200ms (drag still in browser); otherwise clear. Spectrum shadow DOM crossings also
  // fire dragleave with null relatedTarget — the follow-up dragover cancels those.
  let clearDragTimer = null;
  const cancelClear = () => {
    if (clearDragTimer !== null) {
      clearTimeout(clearDragTimer);
      clearDragTimer = null;
    }
  };
  const scheduleClear = () => {
    cancelClear();
    clearDragTimer = setTimeout(() => {
      clearDragTimer = null;
      clearDrag();
    }, 200);
  };

  // Hoist before event listeners so the capture drop handler can reference it
  const dropzoneEl = dropzone.container?.querySelector('.image-upload-dropzone');

  // Suppress drag-and-drop while the OS file picker is open. input.click() triggers
  // a click event on the input; window.focus fires when the picker is dismissed.
  let isPickerOpen = false;
  dropzone.input?.addEventListener('click', () => { isPickerOpen = true; }, { signal });
  dropzone.input?.addEventListener('change', () => { isPickerOpen = false; }, { signal });
  window.addEventListener('focus', () => { isPickerOpen = false; }, { signal });

  window.addEventListener('dragenter', (e) => {
    if (isPickerOpen) return;
    cancelClear();
    if (isInViewport() && isFileDrag(e)) {
      preventDefaults(e);
      container.classList.add('is-dragging');
    }
  }, { signal });
  window.addEventListener('dragover', (e) => {
    cancelClear();
    if (isInViewport() && isFileDrag(e)) preventDefaults(e);
  }, { signal });
  window.addEventListener('dragleave', (e) => {
    preventDefaults(e);
    if (!e.relatedTarget) scheduleClear();
  }, { signal });
  window.addEventListener('dragend', (e) => {
    preventDefaults(e);
    cancelClear();
    clearDrag();
  }, { signal });
  // Use capture phase so Spectrum web components calling stopPropagation on 'drop'
  // (COLOR-SWATCH-RAIL, color-tool-layout, etc.) cannot block this handler. Capture fires
  // top-down before any element's bubble handler. Consequently we must NOT call
  // stopPropagation here — the event must continue down to the dropzone element so its
  // own handler (createUploadDropzone) can process the file and manage its loading state.
  // When the drop landed on the dropzone itself we skip handleFile to avoid double-processing.
  window.addEventListener('drop', (e) => {
    cancelClear();
    if (isPickerOpen || !isInViewport() || !isFileDrag(e)) {
      clearDrag();
      return;
    }
    e.preventDefault(); // allow drop — no stopPropagation, event must reach the target
    const onDropzone = !!dropzoneEl && (e.target === dropzoneEl || dropzoneEl.contains(e.target));
    if (!onDropzone) dropzone.handleFile(e.dataTransfer.files[0]);
    setTimeout(clearDrag, 200);
  }, { capture: true, signal });
  window.addEventListener('blur', () => {
    cancelClear();
    clearDrag();
  }, { signal });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelClear();
      clearDrag();
    }
  }, { signal });

  // Fires when the drop lands directly on the dropzone element. createUploadDropzone's
  // own handler (which processes the file) calls stopPropagation, so only this element-level
  // listener and the capture window handler above see the event.
  if (dropzoneEl) {
    dropzoneEl.addEventListener('drop', (e) => {
      if (isFileDrag(e)) {
        const file = e.dataTransfer?.files?.[0];
        if (file?.type?.startsWith('image/')) container.classList.add('is-loading');
      }
      // Delay so the loading overlay (0.2s fade-in) is opaque before the drag overlay fades out
      setTimeout(clearDrag, 200);
    }, { signal });
  }

  // Sync is-dragging / is-loading from container to body-level overlays
  const syncObserver = new MutationObserver(() => {
    if (dragOverlay) dragOverlay.classList.toggle('is-dragging', container.classList.contains('is-dragging'));
    if (loadingOverlay) loadingOverlay.classList.toggle('is-loading', container.classList.contains('is-loading'));
  });
  syncObserver.observe(container, { attributes: true, attributeFilter: ['class'] });

  const detach = () => {
    ac.abort();
    cancelClear();
    syncObserver.disconnect();
    dragOverlay?.remove();
    loadingOverlay?.remove();
  };
  // Use viewportEl (the block, always in the DOM) as the anchor for the disconnect observer.
  // `container` (image-extract div) lives inside an inactive tab panel and is not connected to
  // the document until the Image tab is selected — observing document.body instead caused
  // Spectrum overlay mutations to trigger detach() prematurely, removing all drag handlers.
  const observerAnchor = viewportEl || container;
  const observer = new MutationObserver(() => {
    if (!observerAnchor.isConnected) {
      detach();
      observer.disconnect();
    }
  });
  observer.observe(observerAnchor.parentElement || document.body, { childList: true });
  return detach;
}

function createImageExtractDropzone(block, controller, onImageReady, config = {}) {
  const {
    enableImageUpload = true, enableUrlInput = true,
    imageUploadStrings, ariaLabel,
  } = config;

  const dz = createUploadDropzone({
    enabled: enableImageUpload,
    strings: imageUploadStrings,
    ariaLabel: ariaLabel || COLOR_EXTRACT_DEFAULTS.dropzoneAria,
    onImageReady: (image, src) => {
      block.classList.remove('is-loading');
      block.classList.add('has-image');
      onImageReady(image, src);
    },
  });

  // The body-level overlay handles loading UX; the dropzone's built-in indicator is redundant
  dz.container.querySelector('.image-upload-dropzone-loading')?.remove();

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

  // The file picker's input.change calls the internal handleFile closure directly, bypassing
  // the wrapped dz.handleFile above. Listening on dz.container (a parent) with capture phase
  // fires before the event reaches the input target — before the internal handler runs and
  // before its input.value = '' clears input.files. Same-element capture listeners fire in
  // registration order (not before bubble ones), so the input itself cannot be used.
  const onInputChange = (e) => {
    if (e.target !== dz.input) return;
    if (e.target.files?.[0]?.type?.startsWith('image/')) block.classList.add('is-loading');
  };
  dz.container.addEventListener('change', onInputChange, { capture: true });

  // Mirror is-loading removal from the dropzone container to the IMAGE-EXTRACT block so that
  // error paths (image.onerror, reader.onerror) in createUploadDropzone — which only call
  // setLoading(false) on the dropzone container — also clear the block's is-loading class.
  const dzContainer = dz.container;
  const loadingObserver = new MutationObserver(() => {
    if (!dzContainer.classList.contains('is-loading')) block.classList.remove('is-loading');
  });
  loadingObserver.observe(dzContainer, { attributes: true, attributeFilter: ['class'] });
  dz.destroy = () => {
    loadingObserver.disconnect();
    dz.container.removeEventListener('change', onInputChange, { capture: true });
  };

  return dz;
}

/**
 * Image extraction UI (dropzone, optional suggestions, edit stage + markers).
 * Mount inside any container.
 *
 * @param {object} options
 * @param {object} options.controller - ColorThemeExpressController instance
 * @param {number} [options.maxColors]
 * @param {HTMLElement | null} [options.suggestionsRowEl]
 * @returns {{ element: HTMLElement, destroy: Function }}
 */
export default function createImageExtractComponent(options = {}) {
  const { controller } = options;
  if (!controller) {
    throw new Error('createImageExtractComponent: controller is required');
  }

  const reqColors = Number(options.maxColors) || controller.getState().swatches?.length;
  const maxColors = Math.max(1, Math.min(10, reqColors || DEFAULTS.MAX_COLORS));

  const container = createTag('div', { class: 'image-extract' });

  let currentMood = controller.metadata?.mood || DEFAULTS.MOOD;
  let currentCanvas = null;
  let currentSrc = null;
  let markers = null;
  let markerResizeObserver = null;
  let resizeHandler = null;
  let imgLoadHandler = null;
  let moodSelectorRef = null;
  let isInitialLoad = !!options.initialSrc;

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

  function onMoodOverride(mood) {
    currentMood = mood;
    moodSelectorRef?.setMood(mood);
    controller.setMetadata({ mood });
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
    const wasInitial = isInitialLoad;
    isInitialLoad = false;
    currentSrc = src;
    setBackground(bgWrapper, src);

    currentCanvas = drawImageToCanvas(image);
    setupMarkers(currentCanvas).then(() => {
      runExtraction(currentCanvas, currentMood)
        .then(() => {
          container.classList.remove('is-loading');
          container.classList.add('has-image');
          if (!wasInitial) options.onImageProcessed?.();
        })
        .catch(() => {
          container.classList.remove('is-loading');
          window.lana?.log('Color wheel image extraction failed', { tags: 'color-wheel,extract' });
          if (!wasInitial) options.onImageProcessed?.();
        });
    });
  }

  const dropzone = createImageExtractDropzone(container, controller, onImageReady, {
    enableImageUpload: true,
    enableUrlInput: true,
    maxColors,
    imageUploadStrings: options.strings?.imageUploadStrings,
  });

  const topBar = createTag('div', { class: 'color-extract-top-bar' });
  const moodRow = createTag('div', { class: 'color-extract-mood-row' });
  const toolbarPlaceholder = createTag('div', { class: 'color-extract-toolbar-slot' });
  topBar.append(moodRow, toolbarPlaceholder);
  leftCol.append(topBar, bgWrapper);

  const suggestions = buildSuggestedImages(
    options.suggestionsRowEl || null,
    (img, src) => { dropzone.handleUrl(src); },
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
        toolbarPlaceholder.replaceWith(toolbar.element);
      });
    });
  }));

  const extractStrings = options.strings?.colorExtractStrings
    || options.strings
    || COLOR_EXTRACT_DEFAULTS;
  const dragOverlay = buildDragOverlay(extractStrings);
  const loadingOverlay = buildLoadingOverlay(extractStrings);
  document.body.append(dragOverlay, loadingOverlay);

  const detachWindowDrag = attachWindowDragHandlers(
    container,
    dropzone,
    dragOverlay,
    loadingOverlay,
    options.viewportEl || null,
  );

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
    dropzone.destroy?.();
  }

  return {
    element: container, destroy, getCurrentSrc: () => currentSrc, handleFile: dropzone.handleFile,
  };
}
