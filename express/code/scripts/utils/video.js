/**
 * Centralized video creation and optimization utility
 * All video elements should be created through this utility to ensure
 * consistent preload strategy and lazy loading behavior
 */

import { createTag } from './utils.js';

/**
 * Check if element is in a hidden container (drawer, accordion, tab, etc.)
 * @param {HTMLElement} element - Element to check
 * @returns {boolean}
 */
function isElementHidden(element) {
  return !!(
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
  const firstSection = document.querySelector('.section');
  return element.closest('.section') === firstSection;
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
  
  // Merge attributes with optimized preload
  const videoAttributes = {
    ...attributes,
    preload,
  };
  
  if (poster) videoAttributes.poster = poster;
  if (title) videoAttributes.title = title;
  
  // Create video element
  const video = createTag('video', videoAttributes);
  
  // Add source
  const source = createTag('source', { src, type: 'video/mp4' });
  video.appendChild(source);
  
  // Setup lazy loading for hidden videos
  if (preload === 'none') {
    setupLazyLoading(video, container);
  }
  
  return video;
}

/**
 * Setup lazy loading for hidden videos
 * Watches for visibility changes and loads video when it becomes visible
 * 
 * @param {HTMLVideoElement} video - Video element to lazy load
 * @param {HTMLElement} container - Container element
 */
function setupLazyLoading(video, container) {
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

