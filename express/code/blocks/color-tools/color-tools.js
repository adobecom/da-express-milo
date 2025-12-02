import { createTag } from '../../scripts/utils.js';
import { hslToHEX, rgbToHex } from '../../libs/color-components/utils/ColorConversions.js';
import ColorThemeController from '../../libs/color-components/controllers/ColorThemeController.js';

// Dynamically import the components to ensure they are registered
import '../../libs/color-components/components/color-palette/index.js';
import '../../libs/color-components/components/color-wheel/index.js';
import '../../libs/color-components/components/color-swatch-rail/index.js';
import '../../libs/color-components/components/color-harmony-toolbar/index.js';

const HARMONY_RULES = ['ANALOGOUS', 'MONOCHROMATIC', 'TRIAD', 'COMPLEMENTARY', 'SQUARE', 'COMPOUND', 'SHADES'];
const DEFAULT_BASE_HEX = '#FF0000';
const DEFAULT_RULE = HARMONY_RULES[0];
const NUMBER_OF_SWATCHES = 5;

function createWheelWorkspace({
  wrapperClass = 'color-wheel-tool',
  swatchHeading = 'Generated palette',
} = {}) {
  const toolWrapper = createTag('div', { class: wrapperClass });

  const wheelContainer = createTag('div', { class: 'wheel-container' });
  const colorWheel = createTag('color-wheel', {
    'aria-label': 'Color Wheel',
    'wheel-marker-size': '21',
  });

  const controller = new ColorThemeController({
    harmonyRule: DEFAULT_RULE,
    swatches: Array.from({ length: NUMBER_OF_SWATCHES }, () => DEFAULT_BASE_HEX),
  });

  colorWheel.color = DEFAULT_BASE_HEX;

  const applyWheelColor = (hslDetail) => {
    if (!hslDetail) {
      return;
    }
    const normalizedHex = hslToHEX(
      hslDetail.hue / 360,
      hslDetail.saturation / 100,
      hslDetail.lightness / 100,
    );

    colorWheel.color = normalizedHex;
    controller.setBaseColor(normalizedHex);
  };

  colorWheel.addEventListener('change', (e) => applyWheelColor(e.detail));

  colorWheel.addEventListener('change-end', (e) => {
    const event = new CustomEvent('express:color-selected', { detail: { color: e.detail, source: 'wheel' } });
    window.dispatchEvent(event);
  });

  const harmonyToolbar = createTag('color-harmony-toolbar');
  harmonyToolbar.controller = controller;

  wheelContainer.append(colorWheel);
  wheelContainer.append(harmonyToolbar);

  toolWrapper.append(wheelContainer);

  return { root: toolWrapper, controller };
}

function createImageExtractor(controller) {
  const wrapper = createTag('div', { class: 'image-extractor' });
  const dropZone = createTag('div', { class: 'image-dropzone' });
  dropZone.append(
    createTag('strong', {}, 'Drop an image'),
    createTag('span', {}, 'or click to upload a photo and capture its colors.'),
  );

  const fileInput = createTag('input', { type: 'file', accept: 'image/*' });
  fileInput.hidden = true;
  const preview = createTag('img', { class: 'image-preview', alt: 'Uploaded preview', hidden: true });
  const paletteRow = createTag('div', { class: 'image-swatches' });
  const canvas = createTag('canvas', { class: 'image-canvas' });
  canvas.hidden = true;

  wrapper.append(dropZone, fileInput, preview, paletteRow, canvas);

  const copyHex = (value) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(value).catch(() => {});
    }
  };

  const renderPalette = (colors) => {
    paletteRow.innerHTML = '';
    colors.forEach((hex) => {
      const swatch = createTag('button', {
        type: 'button',
        class: 'image-swatch',
        'aria-label': `Copy ${hex}`,
      }, hex);
      swatch.style.setProperty('--swatch-color', hex);
      swatch.addEventListener('click', () => copyHex(hex));
      paletteRow.append(swatch);
    });
  };

  const samplePalette = (context, width, height, count) => {
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
  };

  const extractFromImage = (image) => {
    const maxWidth = 240;
    const ratio = image.naturalHeight / image.naturalWidth;
    const width = Math.min(maxWidth, image.naturalWidth);
    const height = Math.round(width * ratio);
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, width, height);

    const palette = samplePalette(context, width, height, NUMBER_OF_SWATCHES);
    renderPalette(palette);
    palette.forEach((hex, index) => controller.setSwatchHex(index, hex));
    if (palette[0]) {
      controller.setBaseColor(palette[0]);
    }
  };

  const handleFile = (file) => {
    if (!file || !file.type?.startsWith('image/')) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        preview.src = image.src;
        preview.hidden = false;
        dropZone.classList.add('has-image');
        extractFromImage(image);
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    dropZone.classList.remove('drag-active');
    const file = event.dataTransfer?.files?.[0];
    handleFile(file);
  };

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZone.classList.add('drag-active');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-active'));
  dropZone.addEventListener('drop', handleDrop);
  fileInput.addEventListener('change', (event) => handleFile(event.target.files?.[0]));

  return wrapper;
}

function createBaseColorTool(controller) {
  const wrapper = createTag('div', { class: 'base-color-tool' });
  const inputGroup = createTag('div', { class: 'input-group' });

  const label = createTag('label', { for: 'base-color-input' }, 'Primary Color');
  const input = createTag('input', {
    type: 'color',
    id: 'base-color-input',
    value: controller.getState().swatches[controller.getState().baseColorIndex]?.hex || '#FF0000',
  });

  input.addEventListener('input', (e) => {
    controller.setBaseColor(e.target.value);
  });

  controller.subscribe((state) => {
    const baseHex = state.swatches[state.baseColorIndex]?.hex;
    if (baseHex && baseHex !== input.value) {
      input.value = baseHex;
    }
  });

  inputGroup.append(label, input);
  wrapper.append(inputGroup);
  return wrapper;
}

function renderPaletteDemo(el) {
  const paletteData = {
    name: 'Demo Palette',
    colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF'],
  };

  const paletteEl = createTag('color-palette', {
    'palette-aria-label': 'Color Palette',
    'selection-source': 'author-block',
  });

  paletteEl.palette = paletteData;

  paletteEl.addEventListener('ac-palette-select', (e) => {
    const event = new CustomEvent('express:color-selected', { detail: e.detail });
    window.dispatchEvent(event);
  });

  el.append(paletteEl);
}

function renderColorWheel(el) {
  const { root } = createWheelWorkspace();
  el.append(root);
}

function renderWheelPaletteMarquee(el) {
  const TAB_PARAM = 'color-tools-tab';
  const hasWindow = typeof window !== 'undefined';
  const marquee = createTag('div', { class: 'color-tools-marquee' });
  const leftCol = createTag('div', { class: 'marquee-left-col' });
  const copy = createTag('div', { class: 'marquee-copy' });
  const eyebrow = createTag('p', { class: 'eyebrow' }, 'Adobe Express');
  const title = createTag('h2', {}, 'Create a color palette');
  const body = createTag('p', {}, 'Use the color wheel to explore harmonious color combinations, extract hues, and build palettes that are ready for every Express project.');
  const ctaRow = createTag('div', { class: 'cta-row' });
  const primaryCTA = createTag('a', { class: 'cta button primary', href: '#' }, 'Start creating');
  const secondaryCTA = createTag('button', { class: 'cta ghost' }, 'Watch tutorial');
  ctaRow.append(primaryCTA, secondaryCTA);
  copy.append(eyebrow, title, body, ctaRow);

  const tabsRow = createTag('div', { class: 'marquee-tabs' });
  const panelsContainer = createTag('div', { class: 'tab-panels' });

  const wheelWorkspace = createWheelWorkspace({
    wrapperClass: 'color-wheel-tool marquee-embed',
    swatchHeading: null,
  });
  const sharedController = wheelWorkspace.controller;

  const tabs = [
    {
      id: 'base',
      label: 'Base color',
      icon: '<img src="/express/code/icons/color-tools/tabs/base-color.svg" alt="" />',
      mount: (panel) => panel.append(createBaseColorTool(sharedController)),
    },
    {
      id: 'image',
      label: 'Image',
      icon: '<img src="/express/code/icons/color-tools/tabs/image.svg" alt="" />',
      mount: (panel) => panel.append(createImageExtractor(sharedController)),
    },
    {
      id: 'wheel',
      label: 'Color wheel',
      icon: '<img src="/express/code/icons/color-tools/tabs/wheel.svg" alt="" />',
      mount: (panel) => panel.append(wheelWorkspace.root),
    },
  ];

  const tabButtons = new Map();
  const tabPanels = new Map();

  const getInitialTab = () => {
    if (!hasWindow) {
      return 'wheel';
    }
    try {
      const url = new URL(window.location.href);
      return url.searchParams.get(TAB_PARAM) || 'wheel';
    } catch (e) {
      return 'wheel';
    }
  };

  const updateUrl = (tabId) => {
    if (!hasWindow) {
      return;
    }
    try {
      const url = new URL(window.location.href);
      url.searchParams.set(TAB_PARAM, tabId);
      window.history.replaceState({}, '', `${url.pathname}${url.search}`);
    } catch (e) {
      // ignore – URL API not available
    }
  };

  const activateTab = (tabId, { skipUrl = false } = {}) => {
    const targetPanel = tabPanels.get(tabId) || tabPanels.get('wheel');
    const targetButton = tabButtons.get(tabId) || tabButtons.get('wheel');
    const id = targetPanel.dataset.tab;

    tabPanels.forEach((panel) => panel.classList.toggle('active', panel === targetPanel));
    tabButtons.forEach((button) => button.classList.toggle('active', button === targetButton));

    if (!skipUrl) {
      updateUrl(id);
      if (hasWindow) {
        window.dispatchEvent(new CustomEvent('express:color-tools-tab-change', { detail: { tab: id } }));

        // Analytics hook
        window.dispatchEvent(new CustomEvent('express:color-tools-action', {
          bubbles: true,
          detail: {
            action: 'tab-view',
            tab: id,
            workflow: 'color-tools',
            timestamp: Date.now(),
          },
        }));
      }
    }
  };

  tabs.forEach(({ id, label, icon, mount }) => {
    const button = createTag('button', { type: 'button', class: 'tab-button', 'data-tab': id });
    const iconSpan = createTag('span', { class: 'tab-icon' });
    iconSpan.innerHTML = icon || '';
    const labelSpan = createTag('span', { class: 'tab-label' }, label);
    button.append(iconSpan, labelSpan);

    button.addEventListener('click', () => activateTab(id));
    tabsRow.append(button);
    tabButtons.set(id, button);

    const panel = createTag('div', { class: 'tab-panel', 'data-tab': id });
    mount(panel);
    panelsContainer.append(panel);
    tabPanels.set(id, panel);
  });

  activateTab(getInitialTab(), { skipUrl: true });

  leftCol.append(copy, tabsRow, panelsContainer);

  // Right rail palette visualization
  const rightRail = createTag('div', { class: 'marquee-right-rail' });
  const paletteViz = createTag('color-swatch-rail', {
    class: 'rail-palette',
  });
  paletteViz.controller = sharedController;

  rightRail.append(paletteViz);

  marquee.append(leftCol, rightRail);
  el.append(marquee);
}

export default function init(el) {
  el.innerHTML = '';

  const isWheel = el.classList.contains('wheel');
  const isPalette = el.classList.contains('palette') || !isWheel;
  const isMarquee = el.classList.contains('wheel-palette-marquee');

  if (isMarquee) {
    renderWheelPaletteMarquee(el);
    return;
  }

  if (isPalette && !isWheel) {
    renderPaletteDemo(el);
  } else if (isWheel) {
    renderColorWheel(el);
  } else {
    el.textContent = 'Unknown tool type';
  }
}
