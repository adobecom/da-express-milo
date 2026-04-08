import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const [, { default: decorate, isCarouselNeeded, buildCarousel, toggleChevronVisibility }] = await Promise.all([
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/link-blade/link-blade.js'),
]);

const testBody = await readFile({ path: './mocks/body.html' });

// Minimal createTag for unit tests that don't need the full milo util
const createTag = (tag, attrs = {}) => {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
};

describe('Link Blade', () => {
  let block;
  let linksContainer;

  beforeEach(async () => {
    document.body.innerHTML = testBody;
    block = document.querySelector('.link-blade');
    await decorate(block);
    linksContainer = block.querySelector('.link-blade-links');
  });

  it('should create basic structure', () => {
    expect(block.querySelector('h2.link-blade-header').textContent).to.equal('Header');
    expect(linksContainer.querySelectorAll('a').length).to.equal(16);
  });

  it('should not build carousel before ResizeObserver fires with real dimensions', () => {
    // Immediately after decorate(), ResizeObserver has not yet fired.
    // With jsdom/zero dimensions, no chevrons should be in the DOM.
    expect(block.querySelector('.link-blade-chevron')).to.not.exist;
  });

  describe('isCarouselNeeded', () => {
    it('returns true when links overflow the container', () => {
      const el = document.createElement('div');
      Object.defineProperty(el, 'scrollWidth', { value: 2000, configurable: true });
      Object.defineProperty(el, 'clientWidth', { value: 500, configurable: true });
      expect(isCarouselNeeded(el)).to.be.true;
    });

    it('returns false when links fit exactly', () => {
      const el = document.createElement('div');
      Object.defineProperty(el, 'scrollWidth', { value: 500, configurable: true });
      Object.defineProperty(el, 'clientWidth', { value: 500, configurable: true });
      expect(isCarouselNeeded(el)).to.be.false;
    });

    it('returns false when links are narrower than the container', () => {
      const el = document.createElement('div');
      Object.defineProperty(el, 'scrollWidth', { value: 300, configurable: true });
      Object.defineProperty(el, 'clientWidth', { value: 500, configurable: true });
      expect(isCarouselNeeded(el)).to.be.false;
    });
  });

  describe('buildCarousel', () => {
    it('appends left and right chevron buttons to linksRow', () => {
      const linksRow = block.querySelector('.link-blade-link-row');
      const { leftChev, rightChev } = buildCarousel(createTag, linksContainer, linksRow);
      expect(leftChev.classList.contains('link-blade-chevron')).to.be.true;
      expect(leftChev.classList.contains('left')).to.be.true;
      expect(rightChev.classList.contains('link-blade-chevron')).to.be.true;
      expect(linksRow.contains(leftChev)).to.be.true;
      expect(linksRow.contains(rightChev)).to.be.true;
    });

    it('returns left and right chevron references', () => {
      const linksRow = block.querySelector('.link-blade-link-row');
      const result = buildCarousel(createTag, linksContainer, linksRow);
      expect(result).to.have.property('leftChev');
      expect(result).to.have.property('rightChev');
    });
  });

  describe('toggleChevronVisibility', () => {
    let leftChev;
    let rightChev;

    beforeEach(() => {
      leftChev = document.createElement('button');
      rightChev = document.createElement('button');
      Object.defineProperty(linksContainer, 'scrollLeft', { value: 0, configurable: true });
      Object.defineProperty(linksContainer, 'scrollWidth', { value: 2000, configurable: true });
      Object.defineProperty(linksContainer, 'clientWidth', { value: 500, configurable: true });
    });

    it('hides left chevron when at scroll start', () => {
      toggleChevronVisibility(linksContainer, leftChev, rightChev);
      expect(leftChev.classList.contains('hidden')).to.be.true;
      expect(rightChev.classList.contains('hidden')).to.be.false;
    });

    it('hides right chevron when at scroll end', () => {
      Object.defineProperty(linksContainer, 'scrollLeft', { value: 1500, configurable: true });
      toggleChevronVisibility(linksContainer, leftChev, rightChev);
      expect(leftChev.classList.contains('hidden')).to.be.false;
      expect(rightChev.classList.contains('hidden')).to.be.true;
    });
  });
});
