/**
 * Generic "capture an HTMLElement and download it as an image" utility.
 *
 * This module is headless: it never renders UI and never shows text to a
 * user, so the Errors it throws/rejects with are developer-facing (console,
 * lana logging, control flow) and are not subject to the no-hardcoded-text
 * rule. To surface a failure to a user, catch the rejection, log it, and
 * resolve any user-visible message via replaceKey, e.g.:
 *
 *   try {
 *     await downloadElementAsImage(cardEl, { filename: 'my-card' });
 *   } catch (err) {
 *     const tags = 'download-utils';
 *     window.lana?.log(`downloadElementAsImage failed: ${err.message}`, { tags });
 *     const { replaceKey } = await import(`${getLibs()}/features/placeholders.js`);
 *     showToast(await replaceKey('screenshot-download-failed', getConfig()));
 *   }
 *
 * Known limitation: cross-origin images embedded in the target element must
 * either be served with an Access-Control-Allow-Origin header, or have
 * crossorigin="anonymous" set on the <img> tag, or the resulting canvas will
 * be tainted and captureElementAsImage will reject (see canvasToBlob below).
 */

let html2canvasModulePromise;

async function loadHtml2Canvas() {
  if (!html2canvasModulePromise) {
    // Reset on failure so a later call retries instead of staying rejected forever.
    html2canvasModulePromise = import('../../libs/deps/html2canvas.js')
      .then((mod) => mod.default)
      .catch((err) => {
        html2canvasModulePromise = undefined;
        throw err;
      });
  }
  return html2canvasModulePromise;
}

// Exported so tests can stub the loader instead of exercising the real import.
export const Html2CanvasLoader = { load: loadHtml2Canvas };

function assertCapturable(element) {
  if (!(element instanceof HTMLElement)) {
    throw new TypeError('captureElementAsImage: element must be an HTMLElement');
  }
  if (!element.isConnected) {
    throw new Error('captureElementAsImage: element must be attached to the document');
  }
  const { width, height } = element.getBoundingClientRect();
  if (width <= 0 || height <= 0) {
    throw new Error('captureElementAsImage: element has zero rendered size (is it display:none or detached?)');
  }
}

function withTimeout(promise, ms, message) {
  let timer;
  const timeout = new Promise((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function createOffscreenClone(element) {
  const { width, height } = element.getBoundingClientRect();
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '-99999px';
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.style.pointerEvents = 'none';
  container.setAttribute('aria-hidden', 'true');
  const clone = element.cloneNode(true);
  container.append(clone);
  document.body.append(container);
  return { clone, cleanup: () => container.remove() };
}

function canvasToBlob(canvas, format, quality) {
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('captureElementAsImage: canvas.toBlob returned null'));
        }
      }, mimeType, format === 'jpeg' ? quality : undefined);
    } catch (err) {
      if (err?.name === 'SecurityError') {
        reject(new Error(
          'captureElementAsImage: canvas is tainted by a cross-origin image loaded without CORS. '
          + 'Ensure cross-origin <img>/background-image sources send Access-Control-Allow-Origin, '
          + 'set crossorigin="anonymous" on such <img> elements, or exclude them via '
          + 'options.html2canvasOptions.ignoreElements.',
        ));
      } else {
        reject(err);
      }
    }
  });
}

async function captureValidatedElementAsImage(element, options) {
  const {
    scale = Math.max(window.devicePixelRatio || 1, 2),
    format = 'png',
    quality = 0.92,
    backgroundColor = format === 'jpeg' ? '#ffffff' : null,
    useCORS = true,
    isolate = false,
    timeoutMs = 15000,
    html2canvasOptions = {},
  } = options;

  if (format !== 'png' && format !== 'jpeg') {
    throw new Error(`captureElementAsImage: unsupported format "${format}"`);
  }

  const html2canvas = await withTimeout(
    Html2CanvasLoader.load(),
    timeoutMs,
    'captureElementAsImage: timed out loading html2canvas',
  );

  const rendered = isolate ? createOffscreenClone(element) : null;
  const target = rendered ? rendered.clone : element;

  try {
    const canvas = await withTimeout(
      html2canvas(target, {
        scale,
        backgroundColor,
        useCORS,
        ...html2canvasOptions,
        foreignObjectRendering: false,
      }),
      timeoutMs,
      'captureElementAsImage: timed out rendering element to canvas',
    );
    return await canvasToBlob(canvas, format, quality);
  } finally {
    rendered?.cleanup();
  }
}

/**
 * Capture the current rendered appearance of `element` as an image Blob.
 * @param {HTMLElement} element - Must be connected to the document, non-zero rendered size.
 * @param {Object} [options]
 * @param {number} [options.scale] - Output resolution multiplier.
 *   Default: Math.max(devicePixelRatio, 2).
 * @param {'png'|'jpeg'} [options.format='png']
 * @param {number} [options.quality=0.92] - JPEG quality 0-1, ignored for png.
 * @param {string|null} [options.backgroundColor] - Default: null for png (transparent),
 *   '#ffffff' for jpeg.
 * @param {boolean} [options.useCORS=true] - Fetch cross-origin images in CORS mode.
 * @param {boolean} [options.isolate=false] - Render an off-screen cloneNode() copy
 *   instead of the live node.
 * @param {number} [options.timeoutMs=15000]
 * @param {Object} [options.html2canvasOptions] - Escape hatch spread into html2canvas();
 *   foreignObjectRendering is always forced false (Safari 15 support).
 * @returns {Promise<Blob>}
 */
export function captureElementAsImage(element, options = {}) {
  // Validate synchronously, outside the async function above, so misuse
  // throws immediately to the caller instead of surfacing as an unhandled
  // promise rejection.
  assertCapturable(element);
  return captureValidatedElementAsImage(element, options);
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function resolveFilename(requestedFilename, ext) {
  if (!requestedFilename) return `screenshot-${Date.now()}.${ext}`;
  if (/\.[a-z0-9]+$/i.test(requestedFilename)) return requestedFilename;
  return `${requestedFilename}.${ext}`;
}

/**
 * Capture `element` and immediately trigger a browser download of the result.
 * @param {HTMLElement} element
 * @param {Object} [options] - Same as captureElementAsImage, plus:
 * @param {string} [options.filename] - Extension appended automatically if omitted.
 *   Default: `screenshot-${Date.now()}.<ext>`.
 * @returns {Promise<{ blob: Blob, filename: string }>}
 */
export async function downloadElementAsImage(element, options = {}) {
  const { format = 'png' } = options;
  const blob = await captureElementAsImage(element, options);
  const ext = format === 'jpeg' ? 'jpg' : 'png';
  const filename = resolveFilename(options.filename, ext);
  triggerBlobDownload(blob, filename);
  return { blob, filename };
}
