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
  // Render from the full-res JPEG when available (download/copy is high-res); fall back to the
  // preview URL used by the on-page card.
  const src = model.backgroundFullUrl || model.backgroundUrl;
  return {
    ...model,
    backgroundUrl: new URL(src, window.location.href).href,
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

function renderBackgroundInWorker(backgroundUrl, width, height) {
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
    worker.postMessage({ backgroundUrl, width, height });
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

// Resolution (DPI) written into the saved PNG. 96 matches the template rendition and Express's
// display density; canvas.toBlob() itself writes no resolution, hence the pHYs chunk below.
const EXPORT_DPI = 96;
const INCH_IN_METRES = 0.0254;

/* eslint-disable no-bitwise */
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
/* eslint-enable no-bitwise */

/**
 * Return a copy of a PNG blob with a `pHYs` chunk so the saved file reports `dpi` resolution.
 * The chunk (pixels-per-metre, unit=1) is inserted right after IHDR, which for a canvas PNG sits at
 * a fixed offset: 8-byte signature + IHDR (length 4 + type 4 + data 13 + CRC 4 = 25) = 33.
 */
async function withPngResolution(blob, dpi) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const insertAt = 33;
  const ppu = Math.round(dpi / INCH_IN_METRES);
  const chunk = new Uint8Array(21); // 4 length + 4 type + 9 data + 4 CRC
  const view = new DataView(chunk.buffer);
  view.setUint32(0, 9); // data length
  chunk.set([0x70, 0x48, 0x59, 0x73], 4); // 'pHYs'
  view.setUint32(8, ppu); // pixels per metre, X
  view.setUint32(12, ppu); // pixels per metre, Y
  chunk[16] = 1; // unit specifier: metre
  view.setUint32(17, crc32(chunk.subarray(4, 17))); // CRC over type + data
  const out = new Uint8Array(bytes.length + chunk.length);
  out.set(bytes.subarray(0, insertAt), 0);
  out.set(chunk, insertAt);
  out.set(bytes.subarray(insertAt), insertAt + chunk.length);
  return new Blob([out], { type: 'image/png' });
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
  const normalized = normalizeModel(inputModel);
  // Canvas is the background's native full-res size (falls back to the design basis when the model
  // has no dimensions). Text scales to it; the measured quote column is scaled by the same factor.
  const width = normalized.backgroundWidth || MINI_EDITOR_EXPORT_WIDTH;
  const height = normalized.backgroundHeight || MINI_EDITOR_EXPORT_HEIGHT;
  const scale = height / MINI_EDITOR_EXPORT_HEIGHT;
  const model = { ...normalized, quoteWidth: Math.round(measureQuoteExportWidth() * scale) };
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D context is unavailable');

  const fontReady = waitForFont(model);
  if (MiniEditorCardExporter.supportsWorkerRendering()) {
    try {
      const background = await renderBackgroundInWorker(model.backgroundUrl, width, height);
      await fontReady;
      context.drawImage(background, 0, 0);
      background.close();
      drawMiniEditorText(context, model, width, height);
      return withPngResolution(await canvasToBlob(canvas), EXPORT_DPI);
    } catch (error) {
      if (!error.recoverable) throw error;
    }
  }

  const [background] = await Promise.all([loadBackgroundImage(model.backgroundUrl), fontReady]);
  drawMiniEditorCard(context, background, model, width, height);
  return withPngResolution(await canvasToBlob(canvas), EXPORT_DPI);
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
