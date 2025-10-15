/**
 * Centralized video utility for lazy loading optimization
 */

import { createTag } from '../utils.js';

let cachedFirstSection;

function isElementHidden(element) {
  return !!(
    element.classList.contains('drawer')
    || element.classList.contains('hide')
    || element.closest('[aria-hidden="true"]')
    || element.closest('.drawer')
    || element.closest('.hide')
    || element.closest('[style*="display: none"]')
    || element.closest('[style*="display:none"]')
  );
}

function isInFirstSection(element) {
  if (!cachedFirstSection) {
    cachedFirstSection = document.querySelector('.section');
  }
  return element.closest('.section') === cachedFirstSection;
}

function getPreloadStrategy(container) {
  const isHidden = isElementHidden(container);
  const isFirstSection = isInFirstSection(container);
  return (isFirstSection && !isHidden) ? 'metadata' : 'none';
}

/**
 * Set video dimensions to prevent CLS (Cumulative Layout Shift)
 * @param {HTMLVideoElement} video - Video element
 */
function setVideoDimensions(video) {
  // Skip if dimensions already set
  if (video.hasAttribute('width') && video.hasAttribute('height')) {
    return;
  }

  // If video metadata is already loaded, set dimensions immediately
  if (video.videoWidth && video.videoHeight) {
    video.setAttribute('width', video.videoWidth);
    video.setAttribute('height', video.videoHeight);
    return;
  }

  // Otherwise, wait for metadata to load
  video.addEventListener('loadedmetadata', () => {
    if (video.videoWidth && video.videoHeight) {
      video.setAttribute('width', video.videoWidth);
      video.setAttribute('height', video.videoHeight);
    }
  }, { once: true });
}

function setupLazyLoading(video, container, shouldAutoplay = false) {
  const hiddenParent = container.closest('[aria-hidden="true"]')
                       || container.closest('.drawer')
                       || container.closest('.hide');

  if (hiddenParent) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'aria-hidden') {
          const isHidden = hiddenParent.getAttribute('aria-hidden') === 'true';
          if (!isHidden && video.getAttribute('preload') === 'none') {
            video.setAttribute('preload', 'metadata');
            if (shouldAutoplay) {
              video.setAttribute('autoplay', '');
            }
            video.load();
            observer.disconnect();
          }
        }
      });
    });

    observer.observe(hiddenParent, {
      attributes: true,
      attributeFilter: ['aria-hidden', 'class'],
    });
  } else {
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && video.getAttribute('preload') === 'none') {
            video.setAttribute('preload', 'metadata');
            if (shouldAutoplay) {
              video.setAttribute('autoplay', '');
            }
            video.load();
            intersectionObserver.disconnect();
          }
        });
      },
      { rootMargin: '300px 0px' },
    );

    intersectionObserver.observe(video);
  }
}

/**
 * Create optimized video with lazy loading
 * @param {Object} options - Video configuration
 * @param {string} options.src - Video source URL
 * @param {HTMLElement} options.container - Container element
 * @param {Object} [options.attributes={}] - Video attributes
 * @param {string} [options.poster] - Poster image
 * @param {string} [options.title] - Video title
 * @param {boolean} [options.autoOptimize=true] - Auto-optimize preload
 * @returns {HTMLVideoElement}
 */
export function createOptimizedVideo({
  src,
  container,
  attributes = {},
  poster,
  title,
  autoOptimize = true,
}) {
  const preload = autoOptimize ? getPreloadStrategy(container) : (attributes.preload || 'metadata');
  const hasAutoplay = 'autoplay' in attributes;
  const shouldDeferAutoplay = hasAutoplay && preload === 'none';

  const videoAttributes = {
    ...attributes,
    preload,
  };

  if (shouldDeferAutoplay) {
    delete videoAttributes.autoplay;
  }

  if (poster) videoAttributes.poster = poster;
  if (title) videoAttributes.title = title;

  const video = createTag('video', videoAttributes);
  const source = createTag('source', { src, type: 'video/mp4' });
  video.appendChild(source);

  // Set dimensions to prevent CLS
  setVideoDimensions(video);

  if (preload === 'none') {
    setupLazyLoading(video, container, shouldDeferAutoplay);
  }

  return video;
}

/**
 * Optimize existing video element
 * @param {HTMLVideoElement} video - Video to optimize
 */
export function optimizeExistingVideo(video) {
  if (!video || video.tagName !== 'VIDEO') return;

  const container = video.parentElement;
  if (!container) return;

  // Set dimensions to prevent CLS
  setVideoDimensions(video);

  const preload = getPreloadStrategy(container);
  video.setAttribute('preload', preload);

  if (preload === 'none') {
    setupLazyLoading(video, container);
  }
}

/**
 * Optimize all videos in container
 * @param {HTMLElement} [container=document] - Container to search
 */
export function optimizeAllVideos(container = document) {
  const videos = container.querySelectorAll('video');
  videos.forEach(optimizeExistingVideo);
}
