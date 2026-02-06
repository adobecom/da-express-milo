import { createTag, getIconElementDeprecated } from '../../scripts/utils.js';
import { rgbToHex } from '../../libs/color-components/utils/ColorConversions.js';
import ColorThemeController from '../../libs/color-components/controllers/ColorThemeController.js';
import { CSS_CLASSES, DEFAULTS, EVENTS, VARIANTS } from './helpers/constants.js';
import { parseBlockConfig } from './helpers/parseConfig.js';

import '../../libs/color-components/components/color-swatch-rail/index.js';

const SUPPORTED_IMAGE_TYPES = ['image/'];
const LOGO = 'adobe-express-logo';

function emitBlockEvent(block, eventName, detail) {
  block.dispatchEvent(new CustomEvent(`color-extract:${eventName}`, {
    detail,
    bubbles: true,
    composed: true,
  }));
}

function injectLogo() {
  const logo = getIconElementDeprecated(LOGO);
  logo.classList.add('express-logo');
  return logo;
}

function preventDefaults(event) {
  event.preventDefault();
  event.stopPropagation();
}

function isImageFile(file) {
  return file && SUPPORTED_IMAGE_TYPES.some((type) => file.type?.startsWith(type));
}

function getContentRows(rows) {
  const configKeys = new Set([
    'variant',
    'maxcolors',
    'enableimageupload',
    'enableurlinput',
  ]);

  return rows.filter((row) => {
    const cells = row.querySelectorAll(':scope > div');
    if (cells.length < 2) return true;
    const key = cells[0].textContent.trim().toLowerCase().replace(/\s+/g, '');
    return !configKeys.has(key);
  });
}

function samplePalette(context, width, height, count) {
  const imageData = context.getImageData(0, 0, width, height).data;
  const pixels = imageData.length / 4;
  const step = Math.max(1, Math.floor(pixels / count));
  const colors = [];

  for (let i = 0; i < count; i += 1) {
    const offset = Math.min(i * step * 4, imageData.length - 4);
    const red = imageData[offset];
    const green = imageData[offset + 1];
    const blue = imageData[offset + 2];
    colors.push(rgbToHex({ red, green, blue }));
  }

  return colors;
}

function extractFromImage(image, controller, swatchCount) {
  const maxWidth = 320;
  const ratio = image.naturalHeight / image.naturalWidth || 1;
  const width = Math.min(maxWidth, image.naturalWidth);
  const height = Math.round(width * ratio);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0, width, height);

  const palette = samplePalette(context, width, height, swatchCount);
  if (palette.length) {
    controller.setHarmonyRule('CUSTOM');
    controller.setBaseColorIndex(0);
    palette.forEach((hex, index) => controller.setSwatchHex(index, hex));
  }

  return palette;
}

function extractPaletteFromImageElement(image, swatchCount) {
  if (!image || !image.naturalWidth || !image.naturalHeight) {
    return null;
  }
  try {
    const maxWidth = 160;
    const ratio = image.naturalHeight / image.naturalWidth || 1;
    const width = Math.min(maxWidth, image.naturalWidth);
    const height = Math.round(width * ratio);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, width, height);
    return samplePalette(context, width, height, swatchCount);
  } catch (error) {
    return null;
  }
}

function extractPaletteFromSrc(src, swatchCount) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const image = new Image();
    image.onload = () => {
      const palette = extractPaletteFromImageElement(image, swatchCount);
      resolve(palette);
    };
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function applyPaletteToChips(colors, chips) {
  if (!colors || !chips?.length) {
    return;
  }
  colors.forEach((hex, index) => {
    if (chips[index]) {
      chips[index].style.background = hex;
    }
  });
}

function getPictureSource(picture) {
  const img = picture?.querySelector('img');
  const source = picture?.querySelector('source');
  const directSrc = img?.currentSrc
    || img?.getAttribute('src')
    || img?.dataset?.src
    || img?.dataset?.lazySrc;
  if (directSrc) {
    return directSrc;
  }
  const srcset = source?.getAttribute('srcset')
    || img?.getAttribute('srcset')
    || img?.dataset?.srcset;
  if (!srcset) {
    return '';
  }
  return srcset.split(',')[0].trim().split(' ')[0];
}

function createSwatchRow(controller) {
  const swatchRow = createTag('div', { class: 'color-extract-swatch-row' });

  const copyHex = (value) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(value).catch(() => {});
    }
  };

  return {
    element: swatchRow,
    render(colors) {
      swatchRow.innerHTML = '';
      colors.forEach((hex) => {
        const button = createTag('button', {
          class: 'color-extract-swatch',
          type: 'button',
          'aria-label': `Copy ${hex}`,
        }, hex);
        button.style.setProperty('--swatch-color', hex);
        button.addEventListener('click', () => copyHex(hex));
        swatchRow.append(button);
      });
    },
    updateController(colors) {
      if (!colors?.length) return;
      controller.setHarmonyRule('CUSTOM');
      controller.setBaseColorIndex(0);
      colors.forEach((hex, index) => controller.setSwatchHex(index, hex));
    },
  };
}

function createDropzone(block, controller, onImage, config) {
  const container = createTag('div', { class: 'color-extract-dropzone-container' });
  const dropzone = createTag('div', {
    class: 'color-extract-dropzone',
    role: 'button',
    tabindex: '0',
    'aria-label': 'Upload an image to extract colors',
  });
  const uploadIcon = createTag('span', { class: 'color-extract-upload-icon', 'aria-hidden': 'true' }, `
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M10 3l4 4-1.4 1.4L11 6.8V14H9V6.8L7.4 8.4 6 7z" fill="currentColor"></path>
      <path d="M4 16h12v-2H4z" fill="currentColor"></path>
    </svg>
  `);
  const uploadButton = createTag('div', { class: 'color-extract-upload-button' }, [
    uploadIcon,
    createTag('span', { class: 'color-extract-upload-label' }, 'Upload your image'),
  ]);
  const dropzoneText = createTag('div', { class: 'color-extract-dropzone-text' });
  dropzoneText.append(
    createTag('span', { class: 'color-extract-dropzone-title' }, 'Or drag and drop here'),
    createTag('span', { class: 'color-extract-dropzone-subtitle' }, 'File must be JPEG, JPG, PNG or WebP and up to 40MB'),
  );
  dropzone.append(uploadButton, dropzoneText);

  const input = createTag('input', { type: 'file', accept: 'image/*' });
  input.disabled = !config.enableImageUpload;
  input.hidden = true;
  if (input.disabled) {
    container.classList.add('is-disabled');
    dropzone.setAttribute('aria-disabled', 'true');
    dropzone.setAttribute('tabindex', '-1');
  }

  const preview = createTag('img', {
    class: 'color-extract-preview',
    alt: 'Uploaded preview',
    hidden: true,
    role: 'button',
    tabindex: '0',
  });

  const loading = createTag('div', { class: 'color-extract-loading', hidden: true });
  loading.append(
    createTag('div', { class: 'color-extract-loading-spinner', 'aria-hidden': 'true' }),
    createTag('p', {}, 'Uploading image...'),
  );

  const swatchRow = createSwatchRow(controller);

  const setLoading = (value) => {
    loading.hidden = !value;
    block.classList.toggle('is-loading', value);
  };

  const showPreview = (src) => {
    preview.src = src;
    preview.hidden = false;
    container.classList.add('has-image');
    block.classList.add('has-image');
  };

  const handleImage = (image, src) => {
    showPreview(src);
    if (onImage) {
      onImage(src);
    }
    const palette = extractFromImage(image, controller, config.maxColors);
    swatchRow.render(palette);
    emitBlockEvent(block, EVENTS.COLOR_EXTRACT, { palette, src });
    setLoading(false);
  };

  const handleFile = (file) => {
    if (!isImageFile(file)) {
      return;
    }
    emitBlockEvent(block, EVENTS.IMAGE_UPLOAD, { file });
    setLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => handleImage(image, image.src);
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleUrl = (url) => {
    if (!url) return;
    if (!config.enableUrlInput) return;
    setLoading(true);
    emitBlockEvent(block, EVENTS.URL_INPUT, { url });
    const image = new Image();
    image.onload = () => handleImage(image, url);
    image.src = url;
  };

  container.append(dropzone, input, preview, loading, swatchRow.element);

  if (!input.disabled) {
    dropzone.addEventListener('click', () => input.click());
    dropzone.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        input.click();
      }
    });
    preview.addEventListener('click', () => input.click());
    preview.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        input.click();
      }
    });
  }

  ['dragenter', 'dragover'].forEach((eventName) => {
    dropzone.addEventListener(eventName, () => {
      container.classList.add('highlight');
      block.classList.add('is-dragging');
    });
  });

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
    dropzone.addEventListener(eventName, preventDefaults);
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropzone.addEventListener(eventName, () => {
      container.classList.remove('highlight');
      block.classList.remove('is-dragging');
    });
  });

  dropzone.addEventListener('drop', (event) => {
    if (input.disabled) return;
    const file = event.dataTransfer?.files?.[0];
    handleFile(file);
  });

  input.addEventListener('change', (event) => {
    if (input.disabled) return;
    const file = event.target.files?.[0];
    handleFile(file);
  });

  return {
    container,
    handleUrl,
    handleFile,
    swatchRow,
  };
}

function buildSuggestedImages(row, onSelect) {
  const wrapper = createTag('div', { class: 'color-extract-suggestions' });
  const label = row?.children?.[0] || createTag('div', {}, 'Don’t have an image? Try one of ours:');
  label.classList.add('color-extract-suggestions-label');
  wrapper.append(label);

  const list = row?.children?.[1] || createTag('div');
  list.classList.add('color-extract-suggestions-list');

  const pictures = [...(row?.querySelectorAll('picture') || [])];
  list.innerHTML = '';
  pictures.forEach((picture) => {
    const button = createTag('button', {
      class: 'color-extract-suggestion',
      type: 'button',
      'aria-label': 'Use this image',
      'aria-pressed': 'false',
    });
    const preview = createTag('div', { class: 'color-extract-suggestion-preview' });
    const palette = createTag('div', { class: 'color-extract-suggestion-bar' }, [
      createTag('span', { class: 'color-extract-suggestion-chip is-1' }),
      createTag('span', { class: 'color-extract-suggestion-chip is-2' }),
      createTag('span', { class: 'color-extract-suggestion-chip is-3' }),
      createTag('span', { class: 'color-extract-suggestion-chip is-4' }),
      createTag('span', { class: 'color-extract-suggestion-chip is-5' }),
    ]);
    const src = getPictureSource(picture);
    preview.append(picture.cloneNode(true));
    button.append(preview, palette);
    const chips = [...palette.querySelectorAll('.color-extract-suggestion-chip')];
    const previewImage = preview.querySelector('img');
    const hydratePalette = () => {
      const colors = extractPaletteFromImageElement(previewImage, chips.length);
      if (colors) {
        applyPaletteToChips(colors, chips);
        return;
      }
      extractPaletteFromSrc(src, chips.length).then((fallbackColors) => {
        applyPaletteToChips(fallbackColors, chips);
      });
    };
    if (previewImage?.complete && previewImage.naturalWidth) {
      hydratePalette();
    } else if (previewImage) {
      previewImage.addEventListener('load', hydratePalette, { once: true });
    } else {
      extractPaletteFromSrc(src, chips.length).then((colors) => {
        applyPaletteToChips(colors, chips);
      });
    }
    button.addEventListener('click', () => {
      list.querySelectorAll('.color-extract-suggestion.is-selected').forEach((item) => {
        item.classList.remove('is-selected');
        item.setAttribute('aria-pressed', 'false');
      });
      button.classList.add('is-selected');
      button.setAttribute('aria-pressed', 'true');
      onSelect(src);
    });
    list.append(button);
  });

  wrapper.append(list);
  return wrapper;
}

function buildEditStage(copyRow, imageRow, controller) {
  const wrapper = createTag('div', { class: 'color-extract-edit' });
  const copyWrapper = createTag('div', { class: 'color-extract-edit-copy' });
  const copySource = copyRow?.querySelector(':scope > div') || copyRow;
  if (copySource) {
    copyWrapper.append(...copySource.childNodes);
  }

  const stage = createTag('div', { class: 'color-extract-edit-stage' });
  const bgWrapper = createTag('div', { class: 'color-extract-edit-bg' });
  const picture = imageRow?.querySelector('picture') || imageRow?.querySelector('img');
  if (picture) {
    bgWrapper.append(picture.cloneNode(true));
  }

  const rail = createTag('color-swatch-rail', { class: 'color-extract-swatch-rail' });
  rail.setAttribute('layout', 'stacked');
  rail.controller = controller;

  stage.append(bgWrapper, rail);
  wrapper.append(copyWrapper, stage);
  return {
    wrapper,
    setBackground(src) {
      const bgPicture = bgWrapper.querySelector('picture');
      if (bgPicture) {
        bgPicture.querySelectorAll('source').forEach((source) => {
          source.setAttribute('srcset', src);
        });
      }
      const img = bgWrapper.querySelector('img');
      if (img) {
        img.src = src;
      }
    },
  };
}

function buildLandingStage(imageRow) {
  const stage = createTag('div', { class: 'color-extract-landing' });
  const bgWrapper = createTag('div', { class: 'color-extract-landing-bg' });
  const picture = imageRow?.querySelector('picture') || imageRow?.querySelector('img');
  const background = picture?.cloneNode(true);
  if (background) {
    bgWrapper.append(background);
  }
  const fade = createTag('div', { class: 'color-extract-landing-fade' });
  const content = createTag('div', { class: 'color-extract-landing-content' });
  stage.append(bgWrapper, content, fade);
  return { stage, content };
}

function buildDragOverlay() {
  const overlay = createTag('div', { class: 'color-extract-drag-overlay', 'aria-hidden': 'true' });
  const icon = getIconElementDeprecated('hand');
  if (icon) {
    icon.classList.add('color-extract-drag-icon');
    overlay.append(icon);
  }
  overlay.append(createTag('p', { class: 'color-extract-drag-text' }, 'Drop your image anywhere'));
  return overlay;
}

function buildHeroSection(row, dropzone, logo) {
  const hero = createTag('div', { class: 'color-extract-hero' });
  const heroCopy = createTag('div', { class: 'color-extract-hero-copy' });
  const copySource = row?.querySelector(':scope > div') || row;
  if (copySource) {
    heroCopy.append(...copySource.childNodes);
  }
  if (logo) {
    heroCopy.prepend(logo);
  }
  hero.append(heroCopy, dropzone);
  return hero;
}

function renderColorVariant(block, rows, config) {
  const controller = new ColorThemeController();
  const maxColors = Math.max(1, Math.min(10, Number(config.maxColors) || DEFAULTS.MAX_COLORS));
  const resolvedConfig = {
    ...config,
    maxColors,
    enableImageUpload: config.enableImageUpload ?? DEFAULTS.ENABLE_IMAGE_UPLOAD,
    enableUrlInput: config.enableUrlInput ?? DEFAULTS.ENABLE_URL_INPUT,
  };

  const edit = buildEditStage(rows[2], rows[3], controller);
  const dropzone = createDropzone(block, controller, edit.setBackground, resolvedConfig);
  const logo = injectLogo();

  const hero = buildHeroSection(rows[0], dropzone.container, logo);
  const suggestions = resolvedConfig.enableUrlInput
    ? buildSuggestedImages(rows[1], dropzone.handleUrl)
    : null;
  const landing = buildLandingStage(rows[3]);
  const dragOverlay = buildDragOverlay();

  const container = createTag('div', { class: 'color-extract-inner' });
  landing.content.append(hero);
  if (suggestions) {
    landing.content.append(suggestions);
  }
  landing.stage.append(dragOverlay);
  container.append(landing.stage, edit.wrapper);

  block.innerHTML = '';
  block.append(container);

  const isBlockInViewport = () => {
    const rect = block.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
  };

  const handleWindowDragOver = (event) => {
    if (!isBlockInViewport()) return;
    preventDefaults(event);
    block.classList.add('is-dragging');
  };

  const handleWindowDragLeave = (event) => {
    preventDefaults(event);
    block.classList.remove('is-dragging');
  };

  const handleWindowDrop = (event) => {
    if (!isBlockInViewport()) return;
    preventDefaults(event);
    block.classList.remove('is-dragging');
    const file = event.dataTransfer?.files?.[0];
    dropzone.handleFile(file);
  };

  if (resolvedConfig.enableImageUpload) {
    window.addEventListener('dragenter', handleWindowDragOver);
    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('dragend', handleWindowDragLeave);
    window.addEventListener('drop', handleWindowDrop);
  }
}

function renderGradientStub(block) {
  block.innerHTML = '';
  const wrapper = createTag('div', { class: 'color-extract-gradient-stub' });
  wrapper.textContent = 'Gradient variant coming soon.';
  block.append(wrapper);
}

export default function decorate(block) {
  const rows = [...block.children];
  const config = parseBlockConfig(rows);
  const contentRows = getContentRows(rows);

  block.classList.add(CSS_CLASSES.BLOCK);

  const inferredVariant = block.classList.contains(VARIANTS.GRADIENT)
    ? VARIANTS.GRADIENT
    : VARIANTS.PALETTE;
  const variant = config.variant || inferredVariant || DEFAULTS.VARIANT;

  block.classList.remove(VARIANTS.GRADIENT, VARIANTS.PALETTE);
  block.classList.add(variant);

  if (variant === VARIANTS.PALETTE) {
    renderColorVariant(block, contentRows, config);
  } else {
    renderGradientStub(block);
  }
}
