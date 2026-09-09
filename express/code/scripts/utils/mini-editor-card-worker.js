/* global globalThis */

import {
  drawCoverImage,
  MINI_EDITOR_EXPORT_HEIGHT,
  MINI_EDITOR_EXPORT_WIDTH,
} from './mini-editor-card-renderer.js';

globalThis.addEventListener('message', async ({ data }) => {
  try {
    const response = await fetch(data.backgroundUrl, { mode: 'cors', credentials: 'omit' });
    if (!response.ok) throw new Error(`Background request failed with status ${response.status}`);
    const source = await createImageBitmap(await response.blob());
    // Target the full-res canvas size sent by the main thread (falls back to the design basis).
    const width = data.width || MINI_EDITOR_EXPORT_WIDTH;
    const height = data.height || MINI_EDITOR_EXPORT_HEIGHT;
    // The worker is only created after the main thread detects OffscreenCanvas support.
    // eslint-disable-next-line compat/compat
    const canvas = new globalThis.OffscreenCanvas(width, height);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('OffscreenCanvas 2D context is unavailable');
    drawCoverImage(context, source, width, height);
    source.close();
    const bitmap = canvas.transferToImageBitmap();
    globalThis.postMessage({ type: 'complete', bitmap }, [bitmap]);
  } catch (error) {
    globalThis.postMessage({
      type: 'error',
      code: 'BACKGROUND_RENDER_FAILED',
      message: error?.message || String(error),
    });
  }
});
