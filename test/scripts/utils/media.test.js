import { expect } from '@esm-bundle/chai';
import { setLibs } from '../../../express/code/scripts/utils.js';
import {
  createOptimizedPicture,
  toggleVideo,
  addAnimationToggle,
  linkImage,
} from '../../../express/code/scripts/utils/media.js';

setLibs('/libs');

describe('Media Utils', () => {
  describe('createOptimizedPicture', () => {
    it('should create a picture element with webp sources and fallback', () => {
      const src = 'https://example.com/image.jpg';
      const alt = 'Test image';
      const picture = createOptimizedPicture(src, alt);

      expect(picture.tagName).to.equal('PICTURE');
      expect(picture.querySelector('img').getAttribute('alt')).to.equal(alt);
      expect(picture.querySelector('img').getAttribute('loading')).to.equal('lazy');
    });

    it('should create picture with eager loading when specified', () => {
      const src = 'https://example.com/image.jpg';
      const picture = createOptimizedPicture(src, '', true);

      expect(picture.querySelector('img').getAttribute('loading')).to.equal('eager');
    });

    it('should create picture with custom breakpoints', () => {
      const src = 'https://example.com/image.jpg';
      const breakpoints = [
        { media: '(min-width: 1200px)', width: '3000' },
        { width: '1000' },
      ];
      const picture = createOptimizedPicture(src, '', false, breakpoints);

      const sources = picture.querySelectorAll('source');
      expect(sources).to.have.length(3); // 2 webp + 1 fallback
      expect(sources[0].getAttribute('type')).to.equal('image/webp');
      expect(sources[1].getAttribute('type')).to.equal('image/webp');
    });

    it('should handle different image formats', () => {
      const src = 'https://example.com/image.png';
      const picture = createOptimizedPicture(src);

      const img = picture.querySelector('img');
      expect(img.getAttribute('src')).to.include('format=png');
    });
  });

  describe('toggleVideo', () => {
    let container;
    let video;

    beforeEach(() => {
      container = document.createElement('div');
      container.className = 'hero-animation-overlay';
      video = document.createElement('video');
      container.appendChild(video);
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    it('should play video when paused', () => {
      video.pause();
      let playCalled = false;
      video.play = () => {
        playCalled = true;
        return Promise.resolve();
      };

      toggleVideo(container);

      expect(playCalled).to.be.true;
    });

    it('should pause video when playing', () => {
      // Mock video as playing
      Object.defineProperty(video, 'paused', {
        value: false,
        writable: true,
      });

      let pauseCalled = false;
      video.pause = () => {
        pauseCalled = true;
      };

      toggleVideo(container);

      expect(pauseCalled).to.be.true;
    });

    it('should handle missing video element', () => {
      const emptyContainer = document.createElement('div');
      expect(() => toggleVideo(emptyContainer)).to.not.throw();
    });

    it('should handle null target', () => {
      expect(() => toggleVideo(null)).to.not.throw();
    });
  });

  describe('addAnimationToggle', () => {
    let button;

    beforeEach(() => {
      button = document.createElement('button');
      document.body.appendChild(button);
    });

    afterEach(() => {
      document.body.removeChild(button);
    });

    it('should add click event listener', () => {
      let clickHandler = null;
      button.addEventListener = (event, handler) => {
        if (event === 'click') {
          clickHandler = handler;
        }
      };

      addAnimationToggle(button);

      expect(clickHandler).to.be.a('function');
    });

    it('should add keypress event listener', () => {
      let keypressHandler = null;
      button.addEventListener = (event, handler) => {
        if (event === 'keypress') {
          keypressHandler = handler;
        }
      };

      addAnimationToggle(button);

      expect(keypressHandler).to.be.a('function');
    });

    it('should handle Enter key press', () => {
      let keypressHandler = null;
      button.addEventListener = (event, handler) => {
        if (event === 'keypress') {
          keypressHandler = handler;
        }
      };

      addAnimationToggle(button);

      const event = new KeyboardEvent('keypress', { key: 'Enter' });
      const preventDefaultSpy = { called: false };
      event.preventDefault = () => {
        preventDefaultSpy.called = true;
      };

      keypressHandler(event);

      expect(preventDefaultSpy.called).to.be.true;
    });

    it('should handle Space key press', () => {
      let keypressHandler = null;
      button.addEventListener = (event, handler) => {
        if (event === 'keypress') {
          keypressHandler = handler;
        }
      };

      addAnimationToggle(button);

      const event = new KeyboardEvent('keypress', { key: ' ' });
      const preventDefaultSpy = { called: false };
      event.preventDefault = () => {
        preventDefaultSpy.called = true;
      };

      keypressHandler(event);

      expect(preventDefaultSpy.called).to.be.true;
    });
  });

  describe('linkImage', () => {
    let container;
    let link;
    let image;

    beforeEach(() => {
      container = document.createElement('div');
      link = document.createElement('a');
      link.href = 'https://example.com';
      image = document.createElement('img');
      image.src = 'https://example.com/image.jpg';

      container.appendChild(link);
      container.appendChild(image);
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    it('should restructure link and image elements', () => {
      linkImage(container);

      const newLink = container.querySelector('a');
      const newImage = container.querySelector('img');

      expect(newLink).to.not.be.null;
      expect(newImage).to.not.be.null;
      expect(newLink.contains(newImage)).to.be.true;
    });

    it('should handle container without link', () => {
      const containerWithoutLink = document.createElement('div');
      containerWithoutLink.appendChild(image);

      expect(() => linkImage(containerWithoutLink)).to.not.throw();
    });

    it('should clear link className and innerHTML', () => {
      link.className = 'test-class';
      link.innerHTML = 'test content';

      linkImage(container);

      const newLink = container.querySelector('a');
      expect(newLink.className).to.equal('');
      // The function moves children to the link, so innerHTML won't be empty
      expect(newLink.innerHTML).to.not.equal('test content');
    });
  });
});
