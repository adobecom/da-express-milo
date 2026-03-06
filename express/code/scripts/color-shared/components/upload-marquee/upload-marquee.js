import { createTag } from '../../../utils.js';

const SUPPORTED_TYPES = ['image/'];
const CLS = 'upload-marquee-dropzone';

const UPLOAD_SVG = `<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
  <path d="M10 3l4 4-1.4 1.4L11 6.8V14H9V6.8L7.4 8.4 6 7z" fill="currentColor"/>
  <path d="M4 16h12v-2H4z" fill="currentColor"/>
</svg>`;

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function isImageFile(file) {
  return file && SUPPORTED_TYPES.some((t) => file.type?.startsWith(t));
}

/**
 * Create a reusable upload dropzone (dashed-border box with upload button, drag text, file hint).
 *
 * @param {object} options
 * @param {string} [options.uploadButtonText='Upload your image'] - Authorable button label
 * @param {string} [options.dragDropText='Or drag and drop here'] - Drag hint text
 * @param {string} [options.fileHintText] - File type/size hint
 * @param {string} [options.loadingText='Uploading your image...'] - Loading overlay text
 * @param {string} [options.ariaLabel='Upload an image'] - Accessible name for the dropzone
 * @param {boolean} [options.enabled=true] - Whether the dropzone is interactive
 * @param {function(HTMLImageElement, string): void} [options.onImageReady] - Image ready callback
 * @returns {{container: HTMLElement, handleUrl: function, handleFile: function,
 *   input: HTMLInputElement, setLoading: function}}
 */
export function createUploadDropzone(options = {}) {
  const opts = {
    uploadButtonText: 'Upload your image',
    dragDropText: 'Or drag and drop here',
    fileHintText: 'File must be JPEG, JPG, PNG or WebP and up to 40MB',
    loadingText: 'Uploading your image...',
    ariaLabel: 'Upload an image',
    enabled: true,
    ...options,
  };

  const container = createTag('div', { class: `${CLS}-container` });
  const dropzone = createTag('div', {
    class: CLS,
    role: 'button',
    tabindex: opts.enabled ? '0' : '-1',
    'aria-label': opts.ariaLabel,
    'aria-disabled': opts.enabled ? undefined : 'true',
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
    }, 120);
  };

  const handleFile = (file) => {
    if (!isImageFile(file)) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => processImage(image, image.src);
      image.onerror = () => setLoading(false);
      image.src = reader.result;
    };
    reader.onerror = () => setLoading(false);
    reader.readAsDataURL(file);
  };

  const handleUrl = (url) => {
    if (!url) return;
    setLoading(true);
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => processImage(image, url);
    image.onerror = () => setLoading(false);
    image.src = url;
  };

  container.append(dropzone, input, loading);

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
