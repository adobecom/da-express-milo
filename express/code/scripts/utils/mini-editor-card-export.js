import {
  drawMiniEditorCard,
  drawMiniEditorText,
  MINI_EDITOR_EXPORT_HEIGHT,
  MINI_EDITOR_EXPORT_WIDTH,
} from './mini-editor-card-renderer.js';
import measureQuoteExportWidth from './mini-editor-quote-width.js';

const WORKER_TIMEOUT_MS = 10000;
const DEFAULT_DOWNLOAD_FILENAME = 'download.png';
const MiniEditorCardExporter = {};

function resolveFontFamily(family) {
  const bodyFont = getComputedStyle(document.documentElement)
    .getPropertyValue('--body-font-family')
    .trim() || 'sans-serif';
  return family.replace(/var\(--body-font-family(?:,\s*([^)]+))?\)/g, (_match, fallback) => (
    bodyFont || fallback || 'sans-serif'
  ));
}

function normalizeModel(model) {
  return {
    ...model,
    backgroundUrl: new URL(model.backgroundUrl, window.location.href).href,
    font: { ...model.font, family: resolveFontFamily(model.font.family) },
  };
}

async function waitForFont(model) {
  if (!document.fonts) return;
  const font = `${model.font.style} ${model.font.weight} 40px ${model.font.family}`;
  await Promise.all([document.fonts.load(font, model.quote), document.fonts.ready]);
}

function loadBackgroundImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.addEventListener('load', () => resolve(image), { once: true });
    image.addEventListener('error', () => reject(new Error('Mini-editor background image failed to load')), { once: true });
    image.src = url;
  });
}

function renderBackgroundInWorker(backgroundUrl) {
  return new Promise((resolve, reject) => {
    const worker = MiniEditorCardExporter.createWorker();
    let settled = false;
    let timeout;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      worker.terminate();
      callback(value);
    };
    timeout = setTimeout(() => {
      const error = new Error('Mini-editor worker timed out');
      error.recoverable = true;
      finish(reject, error);
    }, WORKER_TIMEOUT_MS);
    worker.addEventListener('message', ({ data }) => {
      if (data.type === 'complete') {
        finish(resolve, data.bitmap);
      } else if (data.type === 'error') {
        const error = new Error(data.message);
        error.code = data.code;
        finish(reject, error);
      }
    });
    worker.addEventListener('error', (event) => {
      const error = new Error(event.message || 'Mini-editor worker failed');
      error.recoverable = true;
      finish(reject, error);
    });
    worker.postMessage({ backgroundUrl });
  });
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Mini-editor canvas encoding returned no image'));
    }, 'image/png');
  });
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function supportsWorkerRendering() {
  // Safari without OffscreenCanvas uses the main-thread Canvas fallback below.
  // eslint-disable-next-line compat/compat
  const OffscreenCanvasConstructor = window.OffscreenCanvas;
  if (!window.Worker || !OffscreenCanvasConstructor || !window.createImageBitmap) return false;
  try {
    return !!new OffscreenCanvasConstructor(1, 1).getContext('2d');
  } catch {
    return false;
  }
}

async function createCardBlob(inputModel) {
  // Measure the live card's quote box (same width logic as the Express hand-off) so the image
  // wraps the quote at the card's current width, not a stale hardcoded column.
  const model = { ...normalizeModel(inputModel), quoteWidth: measureQuoteExportWidth() };
  const canvas = document.createElement('canvas');
  canvas.width = MINI_EDITOR_EXPORT_WIDTH;
  canvas.height = MINI_EDITOR_EXPORT_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D context is unavailable');

  const fontReady = waitForFont(model);
  if (MiniEditorCardExporter.supportsWorkerRendering()) {
    try {
      const background = await renderBackgroundInWorker(model.backgroundUrl);
      await fontReady;
      context.drawImage(background, 0, 0);
      background.close();
      drawMiniEditorText(context, model);
      return canvasToBlob(canvas);
    } catch (error) {
      if (!error.recoverable) throw error;
    }
  }

  const [background] = await Promise.all([loadBackgroundImage(model.backgroundUrl), fontReady]);
  drawMiniEditorCard(context, background, model);
  return canvasToBlob(canvas);
}

async function download(model) {
  const blob = await createCardBlob(model);
  const filename = DEFAULT_DOWNLOAD_FILENAME;
  triggerDownload(blob, filename);
  return { blob, filename };
}

Object.assign(MiniEditorCardExporter, {
  createWorker: () => new Worker(new URL('./mini-editor-card-worker.js', import.meta.url), { type: 'module' }),
  supportsWorkerRendering,
  createCardBlob,
  download,
});

export default MiniEditorCardExporter;
