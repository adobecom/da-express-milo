/**
 * Template Image Optimizer
 * Provides optimized image URLs and LCP optimization for template images
 */

/**
 * Get optimized image URL with WebP format and appropriate sizing
 * @param {string} originalUrl - Original image URL
 * @param {number} width - Desired width
 * @returns {string} Optimized URL with format and size parameters
 */
export function getOptimizedImageUrl(originalUrl, width = 400) {
  if (!originalUrl) return originalUrl;

  try {
    const url = new URL(originalUrl, window.location.href);
    const { pathname, origin, searchParams } = url;

    // Check if URL already has optimization params
    if (searchParams.has('format') && searchParams.has('width')) {
      return originalUrl;
    }

    // For AEM/Helix URLs, add optimization params
    if (pathname.includes('/media_') || pathname.includes('.jpeg') || pathname.includes('.jpg') || pathname.includes('.png')) {
      const optimizedUrl = new URL(pathname, origin);
      optimizedUrl.searchParams.set('width', width);
      optimizedUrl.searchParams.set('format', 'webply');
      optimizedUrl.searchParams.set('optimize', 'medium');
      return optimizedUrl.toString();
    }

    // Return original for API URLs (they handle their own optimization)
    return originalUrl;
  } catch (e) {
    return originalUrl;
  }
}

/**
 * Get responsive image sizes based on viewport
 * @returns {{ thumbnail: number, preview: number }}
 */
export function getResponsiveImageSizes() {
  const viewportWidth = window.innerWidth;

  if (viewportWidth <= 600) {
    return { thumbnail: 200, preview: 400 };
  }
  if (viewportWidth <= 900) {
    return { thumbnail: 300, preview: 600 };
  }
  return { thumbnail: 400, preview: 800 };
}

/**
 * Preload LCP image
 * @param {string} imageUrl - Image URL to preload
 */
export function preloadLCPImage(imageUrl) {
  if (!imageUrl || document.head.querySelector(`link[rel="preload"][href="${imageUrl}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = imageUrl;
  link.fetchPriority = 'high';
  document.head.appendChild(link);
}

/**
 * Setup image for optimal loading
 * @param {HTMLImageElement} img - Image element
 * @param {string} src - Image source URL
 * @param {Object} options - Options
 * @param {boolean} options.eager - If true, load immediately (for LCP images)
 * @returns {HTMLImageElement}
 */
export function setupLazyImage(img, src, options = {}) {
  if (!img || !src) return img;

  const { eager = false } = options;

  // Set the source - let browser handle the actual loading
  img.src = src;

  if (eager) {
    // LCP optimization - load immediately with high priority
    img.loading = 'eager';
    img.setAttribute('fetchpriority', 'high');
    preloadLCPImage(src);
  } else {
    // Use native lazy loading - it has good browser support now
    img.loading = 'lazy';
  }

  return img;
}

/**
 * Preload critical template images
 * @param {string[]} imageUrls - Array of image URLs to preload
 * @param {number} maxPreload - Maximum number of images to preload
 */
export function preloadTemplateImages(imageUrls, maxPreload = 4) {
  imageUrls.slice(0, maxPreload).forEach((url) => {
    preloadLCPImage(url);
  });
}

export default {
  setupLazyImage,
  preloadTemplateImages,
  preloadLCPImage,
  getOptimizedImageUrl,
  getResponsiveImageSizes,
};
