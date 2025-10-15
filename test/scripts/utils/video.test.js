import { expect } from '@esm-bundle/chai';
import { createOptimizedVideo, optimizeExistingVideo } from '../../../express/code/scripts/utils/video.js';

describe('Video Utility', () => {
  let container;

  beforeEach(() => {
    // Create a mock section first
    const section = document.createElement('div');
    section.className = 'section';
    document.body.appendChild(section);

    // Create a test container inside the section
    container = document.createElement('div');
    container.className = 'test-container';
    section.appendChild(container);
  });

  afterEach(() => {
    // Clean up
    document.body.innerHTML = '';
  });

  describe('createOptimizedVideo', () => {
    it('should create a video element with source', () => {
      const video = createOptimizedVideo({
        src: '/test/video.mp4',
        container,
      });

      expect(video.tagName).to.equal('VIDEO');
      expect(video.querySelector('source')).to.exist;
      expect(video.querySelector('source').src).to.include('video.mp4');
    });

    it('should have a preload strategy applied', () => {
      const video = createOptimizedVideo({
        src: '/test/video.mp4',
        container,
      });

      expect(video.getAttribute('preload')).to.be.oneOf(['metadata', 'none']);
    });

    it('should set preload="none" for hidden container videos', () => {
      container.setAttribute('aria-hidden', 'true');

      const video = createOptimizedVideo({
        src: '/test/video.mp4',
        container,
      });

      expect(video.getAttribute('preload')).to.equal('none');
    });

    it('should set preload="none" for videos in drawer containers', () => {
      container.classList.add('drawer');

      const video = createOptimizedVideo({
        src: '/test/video.mp4',
        container,
      });

      expect(video.getAttribute('preload')).to.equal('none');
    });

    it('should defer autoplay for below-fold autoplay videos', () => {
      container.classList.add('drawer');

      const video = createOptimizedVideo({
        src: '/test/video.mp4',
        container,
        attributes: { autoplay: '', muted: '' },
      });

      expect(video.getAttribute('preload')).to.equal('none');
      expect(video.hasAttribute('autoplay')).to.be.false;
    });

    it('should include autoplay attribute when created', () => {
      const video = createOptimizedVideo({
        src: '/test/video.mp4',
        container,
        attributes: { autoplay: '', muted: '' },
        autoOptimize: false, // Disable auto-optimization to test attribute merging
      });

      expect(video.hasAttribute('autoplay')).to.be.true;
    });

    it('should add poster attribute when provided', () => {
      const video = createOptimizedVideo({
        src: '/test/video.mp4',
        container,
        poster: '/test/poster.jpg',
      });

      expect(video.getAttribute('poster')).to.equal('/test/poster.jpg');
    });

    it('should add title attribute when provided', () => {
      const video = createOptimizedVideo({
        src: '/test/video.mp4',
        container,
        title: 'Test Video',
      });

      expect(video.getAttribute('title')).to.equal('Test Video');
    });

    it('should merge custom attributes', () => {
      const video = createOptimizedVideo({
        src: '/test/video.mp4',
        container,
        attributes: {
          playsinline: '',
          muted: '',
          loop: '',
          class: 'custom-video',
        },
      });

      expect(video.hasAttribute('playsinline')).to.be.true;
      expect(video.hasAttribute('muted')).to.be.true;
      expect(video.hasAttribute('loop')).to.be.true;
      expect(video.className).to.equal('custom-video');
    });

    it('should allow manual preload override when autoOptimize=false', () => {
      const video = createOptimizedVideo({
        src: '/test/video.mp4',
        container,
        attributes: { preload: 'auto' },
        autoOptimize: false,
      });

      expect(video.getAttribute('preload')).to.equal('auto');
    });
  });

  describe('optimizeExistingVideo', () => {
    it('should set a preload attribute on existing video', () => {
      const video = document.createElement('video');
      const source = document.createElement('source');
      source.src = '/test/video.mp4';
      video.appendChild(source);
      container.appendChild(video);

      optimizeExistingVideo(video);

      expect(video.getAttribute('preload')).to.be.oneOf(['metadata', 'none']);
    });

    it('should set preload="none" for videos in hidden containers', () => {
      container.classList.add('drawer');

      const video = document.createElement('video');
      const source = document.createElement('source');
      source.src = '/test/video.mp4';
      video.appendChild(source);
      container.appendChild(video);

      optimizeExistingVideo(video);

      expect(video.getAttribute('preload')).to.equal('none');
    });

    it('should handle null or invalid video elements', () => {
      expect(() => optimizeExistingVideo(null)).to.not.throw();
      expect(() => optimizeExistingVideo(document.createElement('div'))).to.not.throw();
    });
  });

  describe('Hidden Container Detection', () => {
    it('should detect drawer class', () => {
      container.classList.add('drawer');

      const video = createOptimizedVideo({
        src: '/test/video.mp4',
        container,
      });

      expect(video.getAttribute('preload')).to.equal('none');
    });

    it('should detect hide class', () => {
      container.classList.add('hide');

      const video = createOptimizedVideo({
        src: '/test/video.mp4',
        container,
      });

      expect(video.getAttribute('preload')).to.equal('none');
    });

    it('should detect aria-hidden attribute', () => {
      container.setAttribute('aria-hidden', 'true');

      const video = createOptimizedVideo({
        src: '/test/video.mp4',
        container,
      });

      expect(video.getAttribute('preload')).to.equal('none');
    });

    it('should detect hidden parent containers', () => {
      const hiddenParent = document.createElement('div');
      hiddenParent.classList.add('drawer');
      hiddenParent.appendChild(container);

      const video = createOptimizedVideo({
        src: '/test/video.mp4',
        container,
      });

      expect(video.getAttribute('preload')).to.equal('none');
    });
  });

  describe('First Section Detection', () => {
    it('should apply preload strategy based on section position', () => {
      const video = createOptimizedVideo({
        src: '/test/video.mp4',
        container,
      });

      // Should have some preload strategy applied
      expect(video.hasAttribute('preload')).to.be.true;
      expect(video.getAttribute('preload')).to.be.oneOf(['metadata', 'none']);
    });

    it('should set preload="none" for videos not in first section', () => {
      // Create a second section
      const secondSection = document.createElement('div');
      secondSection.className = 'section';
      const secondContainer = document.createElement('div');
      secondSection.appendChild(secondContainer);
      document.body.appendChild(secondSection);

      const video = createOptimizedVideo({
        src: '/test/video.mp4',
        container: secondContainer,
      });

      expect(video.getAttribute('preload')).to.equal('none');
    });
  });
});
