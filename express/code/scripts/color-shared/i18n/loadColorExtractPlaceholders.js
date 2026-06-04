import loadPlaceholders from './utils.js';

export const DEFAULT_PLACEHOLDERS = Object.freeze({
  // Dropzone / landing
  dropzoneAria: 'Upload an image to extract colors',
  extractingColors: 'Extracting colors...',
  landingAria: 'Upload an image for color extraction',
  dropOverlayText: 'Drop your image anywhere',
  uploadingImage: 'Uploading your image...',
  noImageTryOurs: 'Don\u2019t have an image? Try one of ours:',
  useThisImage: 'Use this image',
  // Mood selector
  moodLabel: 'Color mood',
  moodTriggerAria: 'Select color mood',
  moodPopoverAria: 'Color mood options',
  moodColorful: 'Colorful',
  moodBright: 'Bright',
  moodMuted: 'Muted',
  moodDeep: 'Deep',
  moodDark: 'Dark',
  moodNone: 'None',
  // Toolbar
  toolbarAria: 'Color extraction tools',
  toolbarAddColor: 'Add color',
  toolbarReset: 'Reset colors',
  toolbarReplaceImage: 'Replace image',
  toolbarUndo: 'Undo',
  toolbarRedo: 'Redo',
});

const PLACEHOLDER_KEY_MAP = Object.freeze({
  dropzoneAria: 'color-extract-upload-aria',
  extractingColors: 'color-extract-loading-extracting',
  landingAria: 'color-extract-landing-aria',
  dropOverlayText: 'color-extract-drop-overlay',
  uploadingImage: 'color-image-upload-loading',
  noImageTryOurs: 'color-extract-suggestions-label',
  useThisImage: 'color-extract-suggestion-use-image',
  moodLabel: 'color-extract-mood-label',
  moodTriggerAria: 'color-extract-mood-trigger-aria',
  moodPopoverAria: 'color-extract-mood-options-aria',
  moodColorful: 'color-extract-mood-colorful',
  moodBright: 'color-extract-mood-bright',
  moodMuted: 'color-extract-mood-muted',
  moodDeep: 'color-extract-mood-deep',
  moodDark: 'color-extract-mood-dark',
  moodNone: 'color-extract-mood-none',
  toolbarAria: 'color-extract-toolbar-aria',
  toolbarAddColor: 'color-extract-toolbar-add-color',
  toolbarReset: 'color-extract-toolbar-reset-colors',
  toolbarReplaceImage: 'color-extract-toolbar-replace-image',
  toolbarUndo: 'color-extract-toolbar-undo',
  toolbarRedo: 'color-extract-toolbar-redo',
});

export function createColorExtractPlaceholders(overrides = {}) {
  return { ...DEFAULT_PLACEHOLDERS, ...overrides };
}

export default function loadColorExtractPlaceholders() {
  return loadPlaceholders(PLACEHOLDER_KEY_MAP, createColorExtractPlaceholders);
}
