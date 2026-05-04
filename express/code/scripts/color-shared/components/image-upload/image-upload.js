import { createTag } from '../../../utils.js';
import { decorateAnalyticsAttributes } from '../../utils/utilities.js';
import { DEFAULT_PLACEHOLDERS as IMAGE_UPLOAD_DEFAULTS } from '../../i18n/loadImageUploadPlaceholders.js';

const SUPPORTED_TYPES = ['image/'];
const CLS = 'image-upload-dropzone';

const UPLOAD_SVG = `<svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <path d="M17.5856 13.6386L13.6824 9.74109C13.3015 9.36023 12.6852 9.36023 12.3043 9.74109L8.40747 13.6386C8.02661 14.0194 8.02661 14.6364 8.40747 15.0173C8.5979 15.2077 8.84737 15.3029 9.09682 15.3029C9.34628 15.3029 9.59575 15.2077 9.78617 15.0173L12.025 12.7784V23.4127C12.025 23.951 12.4617 24.3877 13 24.3877C13.5383 24.3877 13.975 23.951 13.975 23.4127V12.788L16.2081 15.0173C16.589 15.3981 17.206 15.3981 17.5868 15.0173C17.967 14.6364 17.967 14.0182 17.5856 13.6386Z" fill="white"/>
  <path d="M20.4751 22.1H16.8366C16.2983 22.1 15.8616 21.6633 15.8616 21.125C15.8616 20.5867 16.2983 20.15 16.8366 20.15H20.4751C21.0127 20.15 21.4501 19.712 21.4501 19.175V5.52498C21.4501 4.98796 21.0127 4.54998 20.4751 4.54998H5.5251C4.98746 4.54998 4.5501 4.98796 4.5501 5.52498V19.175C4.5501 19.712 4.98746 20.15 5.5251 20.15H9.06836C9.60664 20.15 10.0434 20.5867 10.0434 21.125C10.0434 21.6633 9.60664 22.1 9.06836 22.1H5.5251C3.91216 22.1 2.6001 20.7873 2.6001 19.175V5.52498C2.6001 3.91268 3.91216 2.59998 5.5251 2.59998H20.4751C22.088 2.59998 23.4001 3.91268 23.4001 5.52498V19.175C23.4001 20.7873 22.088 22.1 20.4751 22.1Z" fill="white"/>
</svg>`;

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function isImageFile(file) {
  return file && SUPPORTED_TYPES.some((t) => file.type?.startsWith(t));
}

async function showLoadError(message) {
  const { showExpressToast } = await import('../../spectrum/components/express-toast.js');
  showExpressToast({
    message: message || IMAGE_UPLOAD_DEFAULTS.loadError,
    variant: 'negative',
    timeout: 3000,
  });
}

/**
 * Create a reusable upload dropzone (dashed-border box with upload button, drag text, file hint).
 *
 * @param {object} options
 * @param {object} [options.strings] - Localized strings (image-upload placeholder bundle).
 *   When provided, supplies defaults for uploadButtonText/dragDropText/fileHintText/loadingText/ariaLabel/loadError.
 *   Per-key options on `options` still override `strings`.
 * @param {string} [options.uploadButtonText] - Authorable button label
 * @param {string} [options.dragDropText] - Drag hint text
 * @param {string} [options.fileHintText] - File type/size hint
 * @param {string} [options.loadingText] - Loading overlay text
 * @param {string} [options.ariaLabel] - Accessible name for the dropzone
 * @param {boolean} [options.enabled=true] - Whether the dropzone is interactive
 * @param {function(HTMLImageElement, string): void} [options.onImageReady] - Image ready callback
 * @returns {{container: HTMLElement, handleUrl: function, handleFile: function,
 *   input: HTMLInputElement, setLoading: function}}
 */
export function createUploadDropzone(options = {}) {
  const strings = { ...IMAGE_UPLOAD_DEFAULTS, ...(options.strings || {}) };
  const opts = {
    uploadButtonText: strings.uploadButtonText,
    dragDropText: strings.dragDropText,
    fileHintText: strings.fileHintText,
    loadingText: strings.loadingText,
    ariaLabel: strings.ariaLabel,
    loadError: strings.loadError,
    enabled: true,
    ...options,
  };

  const container = createTag('div', { class: `${CLS}-container` });
  const borderSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  borderSvg.setAttribute('class', `${CLS}-border-svg`);
  borderSvg.setAttribute('width', '100%');
  borderSvg.setAttribute('height', '100%');
  borderSvg.setAttribute('aria-hidden', 'true');
  borderSvg.setAttribute('focusable', 'false');
  const borderRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  borderRect.setAttribute('x', '0.5');
  borderRect.setAttribute('y', '0.5');
  borderRect.setAttribute('width', 'calc(100% - 1px)');
  borderRect.setAttribute('height', 'calc(100% - 1px)');
  borderRect.setAttribute('rx', '16');
  borderRect.setAttribute('ry', '16');
  borderRect.setAttribute('fill', 'none');
  borderSvg.appendChild(borderRect);

  const dropzone = createTag('div', {
    class: CLS,
    role: 'button',
    tabindex: opts.enabled ? '0' : '-1',
    'aria-label': opts.ariaLabel,
    ...(!opts.enabled && { 'aria-disabled': 'true' }),
  });

  const uploadIcon = createTag('span', { class: `${CLS}-upload-icon`, 'aria-hidden': 'true' }, UPLOAD_SVG);
  const uploadButton = createTag('div', { class: `${CLS}-upload-button` }, [
    uploadIcon,
    createTag('span', { class: `${CLS}-upload-label` }, opts.uploadButtonText),
  ]);
  const dropzoneText = createTag('div', { class: `${CLS}-text` });
  dropzoneText.append(
    createTag('span', { class: `${CLS}-title` }, opts.dragDropText),
    createTag('span', { class: `${CLS}-subtitle` }, opts.fileHintText),
  );
  decorateAnalyticsAttributes(dropzone, { linkLabel: 'Upload image' });
  dropzone.append(uploadButton, dropzoneText);

  const input = createTag('input', { type: 'file', accept: 'image/*' });
  input.disabled = !opts.enabled;
  input.hidden = true;

  if (!opts.enabled) {
    container.classList.add('is-disabled');
  }

  const loadingText = createTag('p', {}, opts.loadingText);
  const progressTrack = createTag('div', { class: `${CLS}-loading-track`, 'aria-hidden': 'true' });
  const progressBar = createTag('div', { class: `${CLS}-loading-bar` });
  progressTrack.append(progressBar);
  const loading = createTag('div', {
    class: `${CLS}-loading`,
    role: 'status',
    'aria-live': 'polite',
    hidden: true,
  });
  loading.append(loadingText, progressTrack);

  const setLoading = (value) => {
    loading.hidden = !value;
    container.classList.toggle('is-loading', value);
    if (value) {
      progressBar.style.width = '0%';
      let pct = 0;
      const tick = () => {
        if (loading.hidden) return;
        pct = Math.min(pct + (100 - pct) * 0.08, 95);
        progressBar.style.width = `${pct}%`;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  };

  const processImage = (image, src) => {
    container.classList.add('has-image');
    progressBar.style.width = '100%';
    setTimeout(() => {
      setLoading(false);
      if (typeof opts.onImageReady === 'function') opts.onImageReady(image, src);
    }, 1000);
  };

  const handleFile = (file) => {
    if (!isImageFile(file)) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => processImage(image, image.src);
      image.onerror = () => {
        setLoading(false);
        showLoadError(opts.loadError);
      };
      image.src = reader.result;
    };
    reader.onerror = () => {
      setLoading(false);
      showLoadError(opts.loadError);
    };
    reader.readAsDataURL(file);
  };

  const handleUrl = (url) => {
    if (!url) return;
    setLoading(true);
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => processImage(image, url);
    image.onerror = () => {
      setLoading(false);
      showLoadError(opts.loadError);
    };
    image.src = url;
  };

  container.append(borderSvg, dropzone, input, loading);

  if (opts.enabled) {
    dropzone.addEventListener('click', () => input.click());
    dropzone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        input.click();
      }
    });
  }

  ['dragenter', 'dragover'].forEach((n) => {
    dropzone.addEventListener(n, () => container.classList.add('highlight'));
  });
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((n) => {
    dropzone.addEventListener(n, preventDefaults);
  });
  ['dragleave', 'drop'].forEach((n) => {
    dropzone.addEventListener(n, () => container.classList.remove('highlight'));
  });
  dropzone.addEventListener('drop', (e) => {
    if (!opts.enabled) return;
    handleFile(e.dataTransfer?.files?.[0]);
  });
  input.addEventListener('change', (e) => {
    if (!opts.enabled) return;
    handleFile(e.target.files?.[0]);
    input.value = '';
  });

  return {
    container,
    handleUrl,
    handleFile,
    input,
    setLoading,
  };
}

export default createUploadDropzone;
