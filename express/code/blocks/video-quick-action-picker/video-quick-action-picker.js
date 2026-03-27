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

const ICONS_BASE = '/express/code/icons';

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

function setupDialogKeyboard(dialog, onEscape) {
  const focusableSelector = 'button, [role="link"][tabindex="0"], [tabindex="0"]';

  function handleKeydown(e) {
    if (e.key === 'Escape') { onEscape(); return; }
    if (e.key === 'Tab') {
      const focusable = [...dialog.querySelectorAll(focusableSelector)];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  document.addEventListener('keydown', handleKeydown);
  return () => document.removeEventListener('keydown', handleKeydown);
}

function createVideoPreview(file, strings) {
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
    'aria-label': strings.uploadedVideo,
  });
  video.style.display = 'none';
  video.src = URL.createObjectURL(file);

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
    const errorEl = createTag('div', { class: 'vqap-error' });
    errorEl.textContent = strings.previewUnavailable;
    previewContainer.append(errorEl);
  }, { once: true });

  previewContainer.append(video);
  return { previewContainer, video, durationPromise };
}

function buildActionCard(action) {
  const card = createTag('button', {
    class: 'vqap-action-card',
    'aria-label': action.label,
  });

  const actionTitle = createTag('div', { class: 'vqap-action-title' });

  const iconWrapper = createTag('span', { class: 'vqap-card-icon' });
  if (action.icon) {
    const icon = createTag('img', {
      src: `${ICONS_BASE}/${action.icon}.svg`,
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
 * @param {Object} sdkHandlers - { startSDKWithUnconvertedFiles }
 */
export async function showVideoQuickActionPicker(videoFile, block, sdkHandlers) {
  loadStyles();
  await loadPlaceholders();
  const strings = await getLocalizedStrings();
  const { startSDKWithUnconvertedFiles } = sdkHandlers;

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
    src: `${ICONS_BASE}/close-white.svg`,
    alt: '',
    'aria-hidden': 'true',
    width: '24',
    height: '24',
  });
  closeBtn.append(closeIcon);

  const { previewContainer, video, durationPromise } = createVideoPreview(videoFile, strings);
  hero.append(headerBar, previewContainer);

  const body = createTag('div', { class: 'vqap-body' });
  const contentContainer = createTag('div', { class: 'vqap-content-container' });

  function closeDialog() {
    removeFocusTrap();
    unlockBodyScroll();
    if (video.src) URL.revokeObjectURL(video.src);
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
  const removeFocusTrap = setupDialogKeyboard(dialog, closeDialog);

  closeBtn.focus();
}
