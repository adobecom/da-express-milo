import { createTag } from '../../scripts/utils.js';
import { createMetadataMap } from '../../scripts/utils/mobile-fork-button-utils.js';
import {
  ACTION_TYPES,
  loadPlaceholders,
  getLocalizedStrings,
  getVideoActions,
} from './video-quick-action-picker-config.js';

const STYLES_URL = '/express/code/blocks/video-quick-action-picker/video-quick-action-picker.css';

function loadStyles() {
  if (document.querySelector(`link[href="${STYLES_URL}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLES_URL;
  document.head.append(link);
}

const CLOSE_ICON_PATH = '/express/code/icons/close-white.svg';

function getAppInstallLink() {
  const metadataMap = createMetadataMap();
  return metadataMap['fork-cta-1-link'] || metadataMap['fork-cta-1-link-frictionless'] || '';
}

function lockBodyScroll() {
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.width = '100%';
  document.body.dataset.vqapScrollY = window.scrollY;
  document.body.style.top = `-${window.scrollY}px`;
}

function unlockBodyScroll() {
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.width = '';
  document.body.style.top = '';
  const scrollY = document.body.dataset.vqapScrollY;
  if (scrollY) window.scrollTo(0, parseInt(scrollY, 10));
  delete document.body.dataset.vqapScrollY;
}

function createVideoPreview(blobUrl, strings) {
  const previewContainer = createTag('div', { class: 'vqap-preview-container' });

  const loading = createTag('div', {
    class: 'vqap-loading',
    role: 'status',
    'aria-label': strings.openingPreview,
  });
  loading.append(createTag('div', { class: 'vqap-spinner' }));
  previewContainer.append(loading);

  const video = createTag('video', {
    autoplay: '',
    muted: '',
    playsinline: '',
    src: blobUrl,
    'aria-label': strings.uploadedVideo,
  });
  video.style.display = 'none';

  // Resolve duration from the same video element to avoid a separate load
  const durationPromise = new Promise((resolve) => {
    video.addEventListener('loadedmetadata', () => resolve(video.duration), { once: true });
    video.addEventListener('error', () => resolve(0), { once: true });
  });

  video.addEventListener('loadeddata', () => {
    loading.remove();
    video.style.display = 'block';
  }, { once: true });

  video.addEventListener('error', () => {
    loading.remove();
    video.remove();
  }, { once: true });

  previewContainer.append(video);
  return { previewContainer, durationPromise };
}

function buildActionCard(action) {
  const card = createTag('button', {
    class: 'vqap-action-card',
    'aria-label': action.label,
  });

  const actionTitle = createTag('div', { class: 'vqap-action-title' });

  const iconWrapper = createTag('span', { class: 'vqap-card-icon' });
  if (action.iconPath) {
    const icon = createTag('img', {
      src: action.iconPath,
      alt: '',
      'aria-hidden': 'true',
      width: '28',
      height: '28',
    });
    iconWrapper.append(icon);
  }

  const textSpan = createTag('span');
  const title = createTag('strong', { 'aria-hidden': 'true' });
  title.textContent = action.label;
  textSpan.append(title);

  if (action.badge) {
    const badge = createTag('span', { class: 'vqap-badge' });
    const badgeText = createTag('strong');
    badgeText.textContent = action.badge;
    badge.append(badgeText);
    textSpan.append(badge);
  }

  actionTitle.append(iconWrapper, textSpan);
  card.append(actionTitle);
  return card;
}

/**
 * @param {File} videoFile - the selected video blob
 * @param {HTMLElement} block - the frictionless-quick-action-mobile block
 * @param {Object} sdkHandlers - { startSDKWithUnconvertedFiles, blobUrl }
 */
export default async function showVideoQuickActionPicker(videoFile, block, sdkHandlers) {
  loadStyles();
  await loadPlaceholders();
  const strings = await getLocalizedStrings();
  const { startSDKWithUnconvertedFiles, blobUrl } = sdkHandlers;

  const dialog = createTag('div', {
    class: 'vqap-dialog',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': strings.startFromYourVideo,
  });

  const hero = createTag('div', { class: 'vqap-hero' });
  const headerBar = createTag('div', { class: 'vqap-header-bar' });

  const closeBtn = createTag('button', {
    class: 'vqap-close-btn',
    'aria-label': strings.closeDialog,
  });
  const closeIcon = createTag('img', {
    src: CLOSE_ICON_PATH,
    alt: '',
    'aria-hidden': 'true',
    width: '18',
    height: '18',
  });
  closeBtn.append(closeIcon);

  const { previewContainer, durationPromise } = createVideoPreview(blobUrl, strings);
  hero.append(headerBar, previewContainer);

  const body = createTag('div', { class: 'vqap-body' });
  const contentContainer = createTag('div', { class: 'vqap-content-container' });

  function closeDialog() {
    unlockBodyScroll();
    URL.revokeObjectURL(blobUrl);
    dialog.remove();
  }

  const videoDuration = await durationPromise;
  const videoActions = getVideoActions(strings, videoFile, videoDuration);
  videoActions.forEach((action) => {
    const card = buildActionCard(action);
    card.addEventListener('click', () => {
      closeDialog();
      if (action.type === ACTION_TYPES.APP_INSTALL) {
        const appLink = getAppInstallLink();
        if (appLink) window.location.href = appLink;
      } else {
        startSDKWithUnconvertedFiles([videoFile], action.id, block);
      }
    });
    contentContainer.append(card);
  });

  body.append(contentContainer);

  closeBtn.addEventListener('click', closeDialog);

  dialog.append(closeBtn, hero, body);
  document.body.append(dialog);

  lockBodyScroll();
}
