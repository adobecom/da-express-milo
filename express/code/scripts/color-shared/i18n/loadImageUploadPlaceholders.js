import loadPlaceholders from './utils.js';

export const DEFAULT_PLACEHOLDERS = Object.freeze({
  uploadButtonText: 'Upload your image',
  dragDropText: 'Or drag and drop here',
  fileHintText: 'File must be JPEG, JPG, PNG or WebP and up to 40MB',
  loadingText: 'Uploading your image...',
  ariaLabel: 'Upload an image',
  loadError: 'Unable to load image. Please try again.',
});

const PLACEHOLDER_KEY_MAP = Object.freeze({
  uploadButtonText: 'color-image-upload-button',
  dragDropText: 'color-image-upload-dragdrop',
  fileHintText: 'color-image-upload-file-hint',
  loadingText: 'color-image-upload-loading',
  ariaLabel: 'color-image-upload-aria',
  loadError: 'color-image-upload-error',
});

export function createImageUploadPlaceholders(overrides = {}) {
  return { ...DEFAULT_PLACEHOLDERS, ...overrides };
}

export default function loadImageUploadPlaceholders() {
  return loadPlaceholders(PLACEHOLDER_KEY_MAP, createImageUploadPlaceholders);
}
