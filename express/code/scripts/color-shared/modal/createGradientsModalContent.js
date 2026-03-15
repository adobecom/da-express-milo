import { createTag, getLibs } from '../../utils.js';
import { createGradientEditor } from '../components/gradients/gradient-editor.js';
import { initFloatingToolbar } from '../toolbar/createFloatingToolbar.js';

let gradientsModalContentStylesLoaded = false;
const CREATOR_PLACEHOLDER_PATH = '/express/code/scripts/color-shared/modal/images/creator-placeholder.png';

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

function createMetadataSection(gradient = {}, options = {}) {
  const likesCount = options.likesCount ?? gradient?.likes ?? '1.2K';
  const creatorName = options.creatorName ?? gradient?.creator?.name ?? gradient?.creatorName ?? 'creator';
  const creatorImageUrl = options.creatorImageUrl
    ?? gradient?.creator?.imageUrl
    ?? gradient?.creatorImageUrl
    ?? CREATOR_PLACEHOLDER_PATH;
  const hasOptionTags = Array.isArray(options.tags) && options.tags.length;
  const hasGradientTags = Array.isArray(gradient?.tags) && gradient.tags.length;
  let tags = ['Color', 'Gradient'];
  if (hasOptionTags) tags = options.tags;
  else if (hasGradientTags) tags = gradient.tags;

  const section = createTag('section', { class: 'gradients-modal-content__meta' });

  const headerRow = createTag('div', { class: 'gradients-modal-content__meta-header' });
  const nameEl = createTag('h2', { class: 'gradients-modal-content__title' });
  nameEl.textContent = gradient?.name || 'Gradient';
  headerRow.appendChild(nameEl);

  const likes = createTag('div', { class: 'gradients-modal-content__likes' });
  const likeBtn = createTag('button', {
    type: 'button',
    class: 'gradients-modal-content__like-btn',
    'aria-label': 'Like gradient',
  });
  const likeIconTheme = createTag('sp-theme', {
    system: 'spectrum-two',
    color: 'light',
    scale: 'medium',
  });
  const likeIcon = createTag('sp-icon-heart', {
    size: 'm',
    'aria-hidden': 'true',
  });
  likeIconTheme.appendChild(likeIcon);
  likeBtn.appendChild(likeIconTheme);
  const likesText = createTag('p', { class: 'gradients-modal-content__likes-count' });
  likesText.textContent = String(likesCount);
  likes.appendChild(likeBtn);
  likes.appendChild(likesText);
  headerRow.appendChild(likes);
  section.appendChild(headerRow);

  const authorTagsRow = createTag('div', { class: 'gradients-modal-content__author-tags' });

  const author = createTag('div', { class: 'gradients-modal-content__author' });
  const avatarWrap = createTag('div', { class: 'gradients-modal-content__avatar-wrap' });
  const avatar = createTag('img', {
    class: 'gradients-modal-content__avatar',
    alt: creatorName,
    src: creatorImageUrl,
  });
  avatarWrap.appendChild(avatar);
  const authorName = createTag('p', { class: 'gradients-modal-content__author-name' });
  authorName.textContent = creatorName;
  author.appendChild(avatarWrap);
  author.appendChild(authorName);
  authorTagsRow.appendChild(author);

  const tagsEl = createTag('div', {
    class: 'gradients-modal-content__tags',
    'aria-label': 'Gradient tags',
    role: 'list',
  });
  tags.forEach((tag) => {
    const tagEl = createTag('span', { class: 'gradients-modal-content__tag', role: 'listitem' });
    tagEl.textContent = String(tag);
    tagsEl.appendChild(tagEl);
  });
  authorTagsRow.appendChild(tagsEl);
  section.appendChild(authorTagsRow);

  return section;
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
  root.appendChild(createGradientPreviewSection(gradient));
  root.appendChild(createMetadataSection(gradient, options));

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
    type: 'palette',
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
