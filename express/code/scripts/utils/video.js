/**
 * Centralized video creation and optimization utility
 * All video elements should be created through this utility to ensure
 * consistent preload strategy and lazy loading behavior
 */

import { createTag } from '../utils.js';

// Cache first section lookup (won't change after page load)
let cachedFirstSection;

/**
 * Check if element is in a hidden container (drawer, accordion, tab, etc.)
 * @param {HTMLElement} element - Element to check
 * @returns {boolean}
 */
function isElementHidden(element) {
  // Check if element itself or any ancestor is hidden
  return !!(
    element.classList.contains('drawer') ||
    element.classList.contains('hide') ||
    element.closest('[aria-hidden="true"]') ||
    element.closest('.drawer') ||
    element.closest('.hide') ||
    element.closest('[style*="display: none"]') ||
    element.closest('[style*="display:none"]')
  );
}

/**
 * Check if element is in the first section (Phase E)
 * @param {HTMLElement} element - Element to check
 * @returns {boolean}
 */
function isInFirstSection(element) {
  // Cache the first section lookup for performance
  if (!cachedFirstSection) {
    cachedFirstSection = document.querySelector('.section');
  }
  return element.closest('.section') === cachedFirstSection;
}

/**
 * Determine optimal preload strategy based on video position and visibility
 * Follows AEM Three-Phase Loading Strategy:
 * - Phase E (Eager): Visible first-section videos → 'metadata'
 * - Phase L (Lazy): Below-fold or hidden videos → 'none'
 * 
 * @param {HTMLElement} container - Container element where video will be placed
 * @returns {'metadata'|'none'}
 */
function getPreloadStrategy(container) {
  const isHidden = isElementHidden(container);
  const isFirstSection = isInFirstSection(container);
  
  // Only preload metadata for visible videos in the first section
  return (isFirstSection && !isHidden) ? 'metadata' : 'none';
}

/**
 * Create an optimized video element with automatic preload strategy
 * 
 * @param {Object} options - Video configuration
 * @param {string} options.src - Video source URL
 * @param {HTMLElement} options.container - Container where video will be placed
 * @param {Object} [options.attributes={}] - Additional video attributes
 * @param {string} [options.poster] - Poster image URL
 * @param {string} [options.title] - Video title
 * @param {boolean} [options.autoOptimize=true] - Whether to auto-optimize preload
 * @returns {HTMLVideoElement}
 * 
 * @example
 * const video = createOptimizedVideo({
 *   src: '/path/to/video.mp4',
 *   container: document.querySelector('.my-container'),
 *   attributes: { playsinline: '', muted: '', loop: '' },
 *   poster: '/path/to/poster.jpg',
 *   title: 'My Video'
 * });
 */
export function createOptimizedVideo({
  src,
  container,
  attributes = {},
  poster,
  title,
  autoOptimize = true,
}) {
  // Determine preload strategy based on position and visibility
  const preload = autoOptimize ? getPreloadStrategy(container) : (attributes.preload || 'metadata');
  
  // CRITICAL: Autoplay videos ignore preload attribute and always load full video
  // For below-fold autoplay videos, we need to defer the autoplay until visible
  const hasAutoplay = 'autoplay' in attributes;
  const shouldDeferAutoplay = hasAutoplay && preload === 'none';
  
  // Merge attributes with optimized preload
  const videoAttributes = {
    ...attributes,
    preload,
  };
  
  // Remove autoplay temporarily for below-fold videos
  // We'll add it back when the video becomes visible
  if (shouldDeferAutoplay) {
    delete videoAttributes.autoplay;
  }
  
  if (poster) videoAttributes.poster = poster;
  if (title) videoAttributes.title = title;
  
  // Create video element
  const video = createTag('video', videoAttributes);
  
  // Add source
  const source = createTag('source', { src, type: 'video/mp4' });
  video.appendChild(source);
  
  // Setup lazy loading for videos with preload="none"
  if (preload === 'none') {
    setupLazyLoading(video, container, shouldDeferAutoplay);
  }
  
  return video;
}

/**
 * Setup lazy loading for hidden or below-fold videos
 * Watches for visibility changes and loads video when it becomes visible
 * For autoplay videos, adds autoplay attribute when ready
 * 
 * @param {HTMLVideoElement} video - Video element to lazy load
 * @param {HTMLElement} container - Container element
 * @param {boolean} shouldAutoplay - Whether to add autoplay when visible
 */
function setupLazyLoading(video, container, shouldAutoplay = false) {
  // Find the hidden parent (drawer, accordion, etc.)
  const hiddenParent = container.closest('[aria-hidden="true"]') || 
                       container.closest('.drawer') ||
                       container.closest('.hide');
  
  if (hiddenParent) {
    // Watch for drawer/accordion opening
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'aria-hidden') {
          const isHidden = hiddenParent.getAttribute('aria-hidden') === 'true';
          if (!isHidden && video.getAttribute('preload') === 'none') {
            // Load video when container becomes visible
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
      attributeFilter: ['aria-hidden', 'class'] 
    });
  } else {
    // Use Intersection Observer for below-fold videos
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
      { rootMargin: '300px 0px' } // Start loading 300px before viewport
    );
    
    intersectionObserver.observe(video);
  }
}

/**
 * Optimize existing video elements that were created elsewhere
 * Use this to retrofit videos that weren't created with createOptimizedVideo()
 * 
 * @param {HTMLVideoElement} video - Video element to optimize
 */
export function optimizeExistingVideo(video) {
  if (!video || video.tagName !== 'VIDEO') return;
  
  const container = video.parentElement;
  if (!container) return;
  
  const preload = getPreloadStrategy(container);
  video.setAttribute('preload', preload);
  
  if (preload === 'none') {
    setupLazyLoading(video, container);
  }
}

/**
 * Optimize all video elements in a container
 * Useful for optimizing videos after dynamic content loads
 * 
 * @param {HTMLElement} [container=document] - Container to search for videos
 */
export function optimizeAllVideos(container = document) {
  const videos = container.querySelectorAll('video');
  videos.forEach(optimizeExistingVideo);
}

