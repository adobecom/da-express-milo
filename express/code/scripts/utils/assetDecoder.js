/**
 * AssetDecoder - Modern asset dimension detection for images and videos
 * Supports AbortController for cancellable operations
 * Targets modern browsers only
 */
export class AssetDecoder {
  /**
   * Get dimensions for any supported asset type (auto-detects image vs video)
   * @param {File} file - The file object to analyze
   * @param {Object} options - Configuration options
   * @param {AbortSignal} [options.signal] - AbortSignal for cancellation
   * @param {boolean} [options.validateMimeType=true] - Whether to validate MIME type
   * @returns {Promise<{width: number, height: number, duration?: number, type: 'image'|'video'}>}
   */
  static async getDimensions(file, options = {}) {
    const mimeType = file.type.toLowerCase();

    if (mimeType.startsWith('image/')) {
      const result = await this.getImageDimensions(file, options);
      return { ...result, type: 'image' };
    }
    if (mimeType.startsWith('video/')) {
      const result = await this.getVideoDimensions(file, options);
      return { ...result, type: 'video' };
    }
    throw new Error(`Unsupported asset type: ${mimeType}`);
  }

  /**
   * Get dimensions specifically for image files
   * @param {File} file - Image file
   * @param {Object} options - Configuration options
   * @param {AbortSignal} [options.signal] - AbortSignal for cancellation
   * @param {boolean} [options.validateMimeType=true] - Whether to validate MIME type
   * @returns {Promise<{width: number, height: number}>}
   */
  static async getImageDimensions(file, options = {}) {
    const { signal, validateMimeType = true } = options;

    if (validateMimeType && !file.type.startsWith('image/')) {
      throw new Error(`Invalid image type: ${file.type}`);
    }

    return this.createMediaElement('img', file, signal, (img) => ({
      width: img.naturalWidth,
      height: img.naturalHeight,
    }));
  }

  /**
   * Get dimensions specifically for video files
   * @param {File} file - Video file
   * @param {Object} options - Configuration options
   * @param {AbortSignal} [options.signal] - AbortSignal for cancellation
   * @param {boolean} [options.validateMimeType=true] - Whether to validate MIME type
   * @returns {Promise<{width: number, height: number, duration: number}>}
   */
  static async getVideoDimensions(file, options = {}) {
    const { signal, validateMimeType = true } = options;

    if (validateMimeType && !file.type.startsWith('video/')) {
      throw new Error(`Invalid video type: ${file.type}`);
    }

    return this.createMediaElement('video', file, signal, (video) => ({
      width: video.videoWidth,
      height: video.videoHeight,
      duration: video.duration,
    }));
  }

  /**
   * Check if a file type is supported
   * @param {File} file - The file to check
   * @returns {boolean}
   */
  static isSupported(file) {
    const type = file.type.toLowerCase();
    return type.startsWith('image/') || type.startsWith('video/');
  }

  /**
   * Generic media element creation and processing
   * @param {string} tagName - 'img' or 'video'
   * @param {File} file - File object
   * @param {AbortSignal} signal - Abort signal
   * @param {Function} extractor - Function to extract dimensions
   * @returns {Promise<Object>} Dimensions object
   */
  static async createMediaElement(tagName, file, signal, extractor) {
    const url = URL.createObjectURL(file);

    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        URL.revokeObjectURL(url);
        reject(new Error('Operation was aborted'));
        return;
      }

      const element = document.createElement(tagName);
      let cleanup;

      const handleAbort = () => {
        cleanup();
        reject(new Error('Operation was aborted'));
      };

      const handleSuccess = () => {
        let result;
        try {
          result = extractor(element);
        } catch (error) {
          cleanup();
          reject(new Error(`Failed to extract dimensions: ${error.message}`));
          return;
        }

        cleanup();
        resolve(result);
      };

      const handleError = (error) => {
        cleanup();
        reject(new Error(`${tagName} load failed: ${error?.message || 'Unknown error'}`));
      };

      let isCleanedUp = false;
      cleanup = () => {
        if (isCleanedUp) return;
        isCleanedUp = true;

        signal?.removeEventListener('abort', handleAbort);
        element.removeEventListener('load', handleSuccess);
        element.removeEventListener('loadedmetadata', handleSuccess);
        element.removeEventListener('error', handleError);
        element.src = '';
        URL.revokeObjectURL(url);
      };

      signal?.addEventListener('abort', handleAbort, { once: true });

      if (tagName === 'img') {
        if ('decode' in element) {
          element.src = url;
          element.decode()
            .then(() => {
              handleSuccess();
            })
            .catch(() => {
              element.addEventListener('load', handleSuccess, { once: true });
            });
        } else {
          element.addEventListener('load', handleSuccess, { once: true });
          element.src = url;
        }
      } else {
        element.preload = 'metadata';
        element.addEventListener('loadedmetadata', handleSuccess, { once: true });
        element.src = url;
      }

      element.addEventListener('error', handleError, { once: true });
    });
  }
}

export const getImageDimensions = (file, options) => AssetDecoder.getImageDimensions(file, options);
export const getVideoDimensions = (file, options) => AssetDecoder.getVideoDimensions(file, options);
export const getAssetDimensions = (file, options) => AssetDecoder.getDimensions(file, options);

export function decodeWithTimeout(promise, ms, message = 'Operation timed out') {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(message), ms);

  return Promise.race([
    promise,
    new Promise((_, reject) => {
      controller.signal.addEventListener('abort', () => {
        reject(new Error(message));
      });
    }),
  ]).finally(() => {
    clearTimeout(timeoutId);
  });
}

export default AssetDecoder;
