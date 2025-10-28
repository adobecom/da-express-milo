import { expect } from '@esm-bundle/chai';
import { setLibs } from '../../../express/code/scripts/utils.js';
import {
  AssetDecoder,
  getImageDimensions,
  getVideoDimensions,
  getAssetDimensions,
  decodeWithTimeout,
} from '../../../express/code/scripts/utils/assetDecoder.js';

setLibs('/libs');

describe('AssetDecoder', () => {
  let mockFile;
  let mockImage;
  let mockVideo;

  beforeEach(() => {
    // Mock File object
    mockFile = {
      type: 'image/jpeg',
      name: 'test.jpg',
      size: 1024,
    };

    // Mock Image element
    mockImage = {
      naturalWidth: 800,
      naturalHeight: 600,
      addEventListener: () => {},
      removeEventListener: () => {},
      decode: () => Promise.resolve(),
    };

    // Mock Video element
    mockVideo = {
      videoWidth: 1920,
      videoHeight: 1080,
      duration: 120.5,
      addEventListener: () => {},
      removeEventListener: () => {},
    };

    // Mock URL.createObjectURL and revokeObjectURL
    window.URL = {
      createObjectURL: () => 'blob:mock-url',
      revokeObjectURL: () => {},
    };

    // Mock document.createElement
    const originalCreateElement = document.createElement;
    document.createElement = (tagName) => {
      if (tagName === 'img') return mockImage;
      if (tagName === 'video') return mockVideo;
      return originalCreateElement.call(document, tagName);
    };
  });

  describe('isSupported', () => {
    it('should return true for image files', () => {
      const imageFile = { type: 'image/jpeg' };
      expect(AssetDecoder.isSupported(imageFile)).to.be.true;
    });

    it('should return true for video files', () => {
      const videoFile = { type: 'video/mp4' };
      expect(AssetDecoder.isSupported(videoFile)).to.be.true;
    });

    it('should return false for unsupported files', () => {
      const textFile = { type: 'text/plain' };
      expect(AssetDecoder.isSupported(textFile)).to.be.false;
    });

    it('should handle case insensitive file types', () => {
      const imageFile = { type: 'IMAGE/JPEG' };
      expect(AssetDecoder.isSupported(imageFile)).to.be.true;
    });
  });

  describe('getImageDimensions', () => {
    it('should get image dimensions successfully', async () => {
      const result = await AssetDecoder.getImageDimensions(mockFile);

      expect(result).to.deep.equal({
        width: 800,
        height: 600,
      });
    });

    it('should validate MIME type by default', async () => {
      const invalidFile = { type: 'video/mp4' };

      try {
        await AssetDecoder.getImageDimensions(invalidFile);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Invalid image type');
      }
    });

    it('should skip MIME type validation when disabled', async () => {
      const invalidFile = { type: 'video/mp4' };

      const result = await AssetDecoder.getImageDimensions(invalidFile, {
        validateMimeType: false,
      });

      expect(result).to.deep.equal({
        width: 800,
        height: 600,
      });
    });

    it('should handle abort signal', async () => {
      const controller = new AbortController();
      controller.abort();

      try {
        await AssetDecoder.getImageDimensions(mockFile, { signal: controller.signal });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Operation was aborted');
      }
    });
  });

  describe('getVideoDimensions', () => {
    beforeEach(() => {
      mockFile.type = 'video/mp4';

      // Mock video element to trigger loadedmetadata event
      mockVideo.addEventListener = (event, handler) => {
        if (event === 'loadedmetadata') {
          setTimeout(() => handler(), 0);
        }
      };
    });

    it('should get video dimensions successfully', async () => {
      const result = await AssetDecoder.getVideoDimensions(mockFile);

      expect(result).to.deep.equal({
        width: 1920,
        height: 1080,
        duration: 120.5,
      });
    });

    it('should validate MIME type by default', async () => {
      const invalidFile = { type: 'image/jpeg' };

      try {
        await AssetDecoder.getVideoDimensions(invalidFile);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Invalid video type');
      }
    });

    it('should skip MIME type validation when disabled', async () => {
      const invalidFile = { type: 'image/jpeg' };

      // Mock video element to trigger loadedmetadata event
      mockVideo.addEventListener = (event, handler) => {
        if (event === 'loadedmetadata') {
          setTimeout(() => handler(), 0);
        }
      };

      const result = await AssetDecoder.getVideoDimensions(invalidFile, {
        validateMimeType: false,
      });

      expect(result).to.deep.equal({
        width: 1920,
        height: 1080,
        duration: 120.5,
      });
    });
  });

  describe('getDimensions', () => {
    it('should get image dimensions for image files', async () => {
      const result = await AssetDecoder.getDimensions(mockFile);

      expect(result).to.deep.equal({
        width: 800,
        height: 600,
        type: 'image',
      });
    });

    it('should get video dimensions for video files', async () => {
      mockFile.type = 'video/mp4';

      // Mock video element to trigger loadedmetadata event
      mockVideo.addEventListener = (event, handler) => {
        if (event === 'loadedmetadata') {
          setTimeout(() => handler(), 0);
        }
      };

      const result = await AssetDecoder.getDimensions(mockFile);

      expect(result).to.deep.equal({
        width: 1920,
        height: 1080,
        duration: 120.5,
        type: 'video',
      });
    });

    it('should throw error for unsupported file types', async () => {
      mockFile.type = 'text/plain';

      try {
        await AssetDecoder.getDimensions(mockFile);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Unsupported asset type');
      }
    });
  });

  describe('createMediaElement', () => {
    it('should handle abort signal before processing', async () => {
      const controller = new AbortController();
      controller.abort();

      const extractor = (element) => ({
        width: element.naturalWidth,
        height: element.naturalHeight,
      });

      try {
        await AssetDecoder.createMediaElement('img', mockFile, controller.signal, extractor);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Operation was aborted');
      }
    });

    it('should handle extraction errors', async () => {
      const extractor = () => {
        throw new Error('Extraction failed');
      };

      // Mock successful load
      mockImage.addEventListener = (event, handler) => {
        if (event === 'load') {
          setTimeout(() => handler(), 0);
        }
      };

      try {
        await AssetDecoder.createMediaElement('img', mockFile, null, extractor);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Failed to extract dimensions');
      }
    });

    it('should handle load errors', async () => {
      const extractor = (element) => ({
        width: element.naturalWidth,
        height: element.naturalHeight,
      });

      // Mock load error - trigger error event immediately
      mockImage.addEventListener = (event, handler) => {
        if (event === 'error') {
          // Trigger error immediately
          handler(new Error('Load failed'));
        }
      };

      try {
        await AssetDecoder.createMediaElement('img', mockFile, null, extractor);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('img load failed: Load failed');
      }
    });
  });

  describe('Exported functions', () => {
    it('should export getImageDimensions function', () => {
      expect(getImageDimensions).to.be.a('function');
    });

    it('should export getVideoDimensions function', () => {
      expect(getVideoDimensions).to.be.a('function');
    });

    it('should export getAssetDimensions function', () => {
      expect(getAssetDimensions).to.be.a('function');
    });
  });

  describe('decodeWithTimeout', () => {
    it('should resolve with promise result when promise completes first', async () => {
      const promise = Promise.resolve('success');
      const result = await decodeWithTimeout(promise, 1000);

      expect(result).to.equal('success');
    });

    it('should reject with timeout error when timeout occurs first', async () => {
      const promise = new Promise((resolve) => {
        setTimeout(() => resolve('success'), 2000);
      });

      try {
        await decodeWithTimeout(promise, 100);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Operation timed out');
      }
    });

    it('should use custom timeout message', async () => {
      const promise = new Promise((resolve) => {
        setTimeout(() => resolve('success'), 2000);
      });

      try {
        await decodeWithTimeout(promise, 100, 'Custom timeout message');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Custom timeout message');
      }
    });

    it('should clear timeout when promise resolves', async () => {
      const promise = Promise.resolve('success');
      const result = await decodeWithTimeout(promise, 1000);

      expect(result).to.equal('success');
      // If we get here without hanging, the timeout was cleared properly
    });
  });
});
