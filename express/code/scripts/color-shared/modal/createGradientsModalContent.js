import { createTag, getLibs } from '../../utils.js';
import { createGradientEditor } from '../components/gradients/gradient-editor.js';
import { initFloatingToolbar } from '../toolbar/createFloatingToolbar.js';

let gradientsModalContentStylesLoaded = false;

function extractColorsFromGradient(gradient = {}) {
  if (Array.isArray(gradient.colorStops) && gradient.colorStops.length > 0) {
    return gradient.colorStops
      .map((stop) => stop?.color)
      .filter(Boolean);
  }

  if (typeof gradient.gradient === 'string') {
    return [...gradient.gradient.matchAll(/(#[A-Fa-f0-9]{3,8}|rgba?\([^)]+\))/g)]
      .map((match) => match[1])
      .filter(Boolean);
  }

  return [];
}

function createGradientPreviewSection(gradient) {
  const previewSection = createTag('section', { class: 'gradients-modal-content__preview' });

  const gradientData = {
    type: gradient?.type || 'linear',
    angle: gradient?.angle ?? 90,
    colorStops: Array.isArray(gradient?.colorStops) && gradient.colorStops.length > 0
      ? gradient.colorStops
      : [{ color: '#ccc', position: 0 }, { color: '#999', position: 1 }],
  };

  const editor = createGradientEditor(gradientData, {
    layout: 'responsive',
    size: 'strip-responsive',
    copyable: true,
    draggable: false,
    ariaLabel: 'Gradient preview',
  });

  previewSection.appendChild(editor.element);
  return previewSection;
}

export async function ensureGradientsModalContentStyles() {
  if (gradientsModalContentStylesLoaded) return;
  try {
    const { loadStyle, getConfig } = await import(`${getLibs()}/utils/utils.js`);
    const codeRoot = getConfig?.()?.codeRoot || '/express/code';
    await Promise.all([
      loadStyle(`${codeRoot}/scripts/color-shared/components/gradients/gradient-editor.css`),
      loadStyle(`${codeRoot}/scripts/color-shared/modal/modal-gradients-content.css`),
    ]);
    gradientsModalContentStylesLoaded = true;
  } catch {
    gradientsModalContentStylesLoaded = true;
  }
}

export function createGradientsModalContent(gradient = {}, options = {}) {
  const {
    ctaText = 'Open gradient in Adobe Express',
  } = options;

  const root = createTag('main', { class: 'gradients-modal-content' });
  const title = createTag('h2', { class: 'gradients-modal-content__title' });
  title.textContent = gradient?.name || 'Gradient';

  root.appendChild(title);
  root.appendChild(createGradientPreviewSection(gradient));

  const toolbarMount = createTag('nav', {
    class: 'gradients-modal-content__toolbar',
    'aria-label': 'Gradient actions',
  });
  root.appendChild(toolbarMount);

  const toolbarPalette = {
    id: gradient?.id ?? '',
    name: gradient?.name ?? 'Gradient',
    colors: extractColorsFromGradient(gradient),
  };

  initFloatingToolbar(toolbarMount, {
    palette: toolbarPalette,
    type: 'gradient',
    ctaText,
    showPaletteName: false,
  }).catch((error) => {
    window.lana?.log(`Gradients modal toolbar init failed: ${error?.message}`, {
      tags: 'color-modal,toolbar',
      severity: 'error',
    });
  });

  return root;
}
