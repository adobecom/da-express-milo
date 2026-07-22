/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import createImageExtractComponent, { saveImageSrc } from '../../../express/code/blocks/color-wheel/createImageExtractComponent.js';

const STORAGE_KEY = 'color-wheel-image-src';

function makeController(swatchCount = 5) {
  const swatches = Array.from({ length: swatchCount }, () => ({ hex: '#808080' }));
  return {
    metadata: { mood: 'colorful' },
    getState: () => ({ swatches: [...swatches], baseColorIndex: 0 }),
    subscribe: () => () => {},
    replaceSwatchesFromHexes: () => {},
    setMetadata: () => {},
  };
}

const tick = () => new Promise((resolve) => { setTimeout(resolve); });

describe('createImageExtractComponent', () => {
  let component;

  afterEach(() => {
    component?.destroy();
    component = null;
    document.querySelectorAll(
      '.color-extract-drag-overlay, .color-extract-loading-overlay',
    ).forEach((el) => el.remove());
  });

  describe('validation', () => {
    it('throws when controller is not provided', () => {
      expect(() => createImageExtractComponent({})).to.throw('controller is required');
    });
  });

  describe('returned API', () => {
    it('returns an element with class image-extract', () => {
      component = createImageExtractComponent({ controller: makeController() });
      expect(component.element.classList.contains('image-extract')).to.be.true;
    });

    it('exposes a destroy function', () => {
      component = createImageExtractComponent({ controller: makeController() });
      expect(component.destroy).to.be.a('function');
    });

    it('exposes getCurrentSrc returning null initially', () => {
      component = createImageExtractComponent({ controller: makeController() });
      expect(component.getCurrentSrc()).to.be.null;
    });
  });

  describe('DOM structure', () => {
    it('contains a landing section', () => {
      component = createImageExtractComponent({ controller: makeController() });
      expect(component.element.querySelector('.color-extract-landing')).to.exist;
    });

    it('contains an edit stage', () => {
      component = createImageExtractComponent({ controller: makeController() });
      expect(component.element.querySelector('.color-extract-edit')).to.exist;
    });
  });

  describe('overlays', () => {
    it('appends a drag overlay to document.body on creation', () => {
      component = createImageExtractComponent({ controller: makeController() });
      expect(document.body.querySelector('.color-extract-drag-overlay')).to.exist;
    });

    it('appends a loading overlay to document.body on creation', () => {
      component = createImageExtractComponent({ controller: makeController() });
      expect(document.body.querySelector('.color-extract-loading-overlay')).to.exist;
    });

    it('destroy removes the drag overlay from the DOM', () => {
      component = createImageExtractComponent({ controller: makeController() });
      component.destroy();
      expect(document.body.querySelector('.color-extract-drag-overlay')).to.not.exist;
      component = null;
    });

    it('destroy removes the loading overlay from the DOM', () => {
      component = createImageExtractComponent({ controller: makeController() });
      component.destroy();
      expect(document.body.querySelector('.color-extract-loading-overlay')).to.not.exist;
      component = null;
    });

    it('syncs is-dragging to the drag overlay when the class is added to the container', async () => {
      component = createImageExtractComponent({ controller: makeController() });
      const dragOverlay = document.body.querySelector('.color-extract-drag-overlay');
      component.element.classList.add('is-dragging');
      await tick();
      expect(dragOverlay.classList.contains('is-dragging')).to.be.true;
    });

    it('removes is-dragging from the drag overlay when the class is removed from the container', async () => {
      component = createImageExtractComponent({ controller: makeController() });
      const dragOverlay = document.body.querySelector('.color-extract-drag-overlay');
      component.element.classList.add('is-dragging');
      await tick();
      component.element.classList.remove('is-dragging');
      await tick();
      expect(dragOverlay.classList.contains('is-dragging')).to.be.false;
    });

    it('syncs is-loading to the loading overlay when the class is added to the container', async () => {
      component = createImageExtractComponent({ controller: makeController() });
      const loadingOverlay = document.body.querySelector('.color-extract-loading-overlay');
      component.element.classList.add('is-loading');
      await tick();
      expect(loadingOverlay.classList.contains('is-loading')).to.be.true;
    });

    it('removes is-loading from the loading overlay when the class is removed from the container', async () => {
      component = createImageExtractComponent({ controller: makeController() });
      const loadingOverlay = document.body.querySelector('.color-extract-loading-overlay');
      component.element.classList.add('is-loading');
      await tick();
      component.element.classList.remove('is-loading');
      await tick();
      expect(loadingOverlay.classList.contains('is-loading')).to.be.false;
    });

    it('does not set is-dragging on drag overlay when container has no is-dragging class', async () => {
      component = createImageExtractComponent({ controller: makeController() });
      const dragOverlay = document.body.querySelector('.color-extract-drag-overlay');
      await tick();
      expect(dragOverlay.classList.contains('is-dragging')).to.be.false;
    });
  });

  describe('viewportEl option', () => {
    it('uses viewportEl for the viewport check when provided', () => {
      const viewportEl = document.createElement('div');
      document.body.append(viewportEl);
      // Stub so viewportEl appears in-viewport (JSDOM always returns zero rects)
      viewportEl.getBoundingClientRect = () => ({
        top: 0, bottom: 100, left: 0, right: 100, width: 100, height: 100,
      });
      component = createImageExtractComponent({ controller: makeController(), viewportEl });
      const dragEvent = new DragEvent('dragenter', { bubbles: true, cancelable: true });
      Object.defineProperty(dragEvent, 'dataTransfer', {
        value: { types: { includes: (t) => t === 'Files' } },
      });
      window.dispatchEvent(dragEvent);
      expect(component.element.classList.contains('is-dragging')).to.be.true;
      component.element.classList.remove('is-dragging');
      viewportEl.remove();
    });

    it('falls back to the container element when viewportEl is not provided', () => {
      component = createImageExtractComponent({ controller: makeController() });
      // Container is not in the DOM, so getBoundingClientRect returns zeros → isInViewport false
      const dragEvent = new DragEvent('dragenter', { bubbles: true, cancelable: true });
      Object.defineProperty(dragEvent, 'dataTransfer', {
        value: { types: { includes: (t) => t === 'Files' } },
      });
      window.dispatchEvent(dragEvent);
      expect(component.element.classList.contains('is-dragging')).to.be.false;
    });
  });

  describe('suggestions', () => {
    it('renders suggestions component inside the landing', () => {
      component = createImageExtractComponent({ controller: makeController() });
      expect(component.element.querySelector('.color-extract-suggestions')).to.exist;
    });
  });

  describe('picker guard', () => {
    function makeViewportEl() {
      const el = document.createElement('div');
      document.body.append(el);
      el.getBoundingClientRect = () => ({
        top: 0, bottom: 100, left: 0, right: 100, width: 100, height: 100,
      });
      return el;
    }

    function makeDragEnterEvent() {
      const e = new DragEvent('dragenter', { bubbles: true, cancelable: true });
      Object.defineProperty(e, 'dataTransfer', {
        value: { types: { includes: (t) => t === 'Files' } },
      });
      return e;
    }

    it('does not add is-dragging while the file picker is open', () => {
      const viewportEl = makeViewportEl();
      component = createImageExtractComponent({ controller: makeController(), viewportEl });
      const input = component.element.querySelector('input[type="file"]');
      input.dispatchEvent(new MouseEvent('click'));
      window.dispatchEvent(makeDragEnterEvent());
      expect(component.element.classList.contains('is-dragging')).to.be.false;
      viewportEl.remove();
    });

    it('allows drag-and-drop again after the picker is dismissed', () => {
      const viewportEl = makeViewportEl();
      component = createImageExtractComponent({ controller: makeController(), viewportEl });
      const input = component.element.querySelector('input[type="file"]');
      input.dispatchEvent(new MouseEvent('click'));
      window.dispatchEvent(new Event('focus'));
      window.dispatchEvent(makeDragEnterEvent());
      expect(component.element.classList.contains('is-dragging')).to.be.true;
      component.element.classList.remove('is-dragging');
      viewportEl.remove();
    });
  });
});

describe('saveImageSrc', () => {
  afterEach(() => {
    sinon.restore(); // restore stubs before touching storage
    sessionStorage.removeItem(STORAGE_KEY);
  });

  it('stores the src in sessionStorage', () => {
    saveImageSrc('https://example.com/image.jpg');
    expect(sessionStorage.getItem(STORAGE_KEY)).to.equal('https://example.com/image.jpg');
  });

  it('overwrites a previously stored value with the new src', () => {
    sessionStorage.setItem(STORAGE_KEY, 'old-value');
    saveImageSrc('new-value');
    expect(sessionStorage.getItem(STORAGE_KEY)).to.equal('new-value');
  });

  it('clears a stale entry when the write fails (quota exceeded)', () => {
    sessionStorage.setItem(STORAGE_KEY, 'stale-suggestion-url');
    sinon.stub(Storage.prototype, 'setItem').throws(new DOMException('QuotaExceededError'));
    saveImageSrc('data:image/png;base64,verylarge');
    expect(sessionStorage.getItem(STORAGE_KEY)).to.be.null;
  });

  it('does not throw when both setItem and removeItem fail', () => {
    sinon.stub(Storage.prototype, 'setItem').throws(new DOMException('QuotaExceededError'));
    sinon.stub(Storage.prototype, 'removeItem').throws(new Error('storage error'));
    expect(() => saveImageSrc('data:image/png;base64,test')).to.not.throw();
  });
});
