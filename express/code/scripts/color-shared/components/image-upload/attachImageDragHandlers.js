import { isFileDrag, preventDefaults } from '../../utils/imageExtractUtils.js';

export default function attachImageDragHandlers(block, dropzone, dragLayer, loadOverlay, onRemove) {
  const ac = new AbortController();
  const { signal } = ac;
  const clearDrag = () => block.classList.remove('is-dragging');
  const inViewport = () => {
    const rect = block.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
  };
  let clearTimer;
  let fadeTimer;
  let pickerOpen = false;
  const cancelClear = () => clearTimeout(clearTimer);
  const dropzoneEl = dropzone.container.querySelector('.image-upload-dropzone');

  dropzone.input.addEventListener('click', () => { pickerOpen = true; }, { signal });
  dropzone.input.addEventListener('change', () => { pickerOpen = false; }, { signal });
  window.addEventListener('focus', () => { pickerOpen = false; }, { signal });
  window.addEventListener('dragenter', (event) => {
    if (pickerOpen) return;
    cancelClear();
    if (inViewport() && isFileDrag(event)) {
      preventDefaults(event);
      block.classList.add('is-dragging');
    }
  }, { signal });
  window.addEventListener('dragover', (event) => {
    cancelClear();
    if (!pickerOpen && inViewport() && isFileDrag(event)) preventDefaults(event);
  }, { signal });
  window.addEventListener('dragleave', (event) => {
    preventDefaults(event);
    // Cross-monitor macOS drags can have empty types and null relatedTarget.
    if (!event.relatedTarget) {
      cancelClear();
      clearTimer = setTimeout(clearDrag, 200);
    }
  }, { signal });
  window.addEventListener('dragend', (event) => {
    preventDefaults(event);
    cancelClear();
    clearDrag();
  }, { signal });
  window.addEventListener('drop', (event) => {
    cancelClear();
    if (pickerOpen || !inViewport() || !isFileDrag(event)) {
      clearDrag();
      return;
    }
    // Capture sees drops inside Spectrum; the dropzone must still process its own drop.
    event.preventDefault();
    if (!dropzoneEl.contains(event.target)) dropzone.handleFile(event.dataTransfer.files[0]);
    clearTimeout(fadeTimer);
    fadeTimer = setTimeout(clearDrag, 200);
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

  const syncObserver = new MutationObserver(() => {
    dragLayer.classList.toggle('is-dragging', block.classList.contains('is-dragging'));
    loadOverlay.classList.toggle('is-loading', block.classList.contains('is-loading'));
  });
  syncObserver.observe(block, { attributes: true, attributeFilter: ['class'] });
  let removalObserver;
  const detach = () => {
    ac.abort();
    cancelClear();
    clearTimeout(fadeTimer);
    syncObserver.disconnect();
    removalObserver.disconnect();
    clearDrag();
    dragLayer.remove();
    loadOverlay.remove();
  };
  removalObserver = new MutationObserver(() => {
    if (!block.isConnected) {
      detach();
      onRemove?.();
    }
  });
  removalObserver.observe(document.body, { childList: true, subtree: true });
  return detach;
}
