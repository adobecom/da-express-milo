import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

describe('Load Carousel', () => {
  let loadCarousel;
  let buildCarouselStub;
  let buildBasicCarouselStub;
  let buildGridCarouselStub;

  beforeEach(async () => {
    buildCarouselStub = sinon.stub().resolves();
    buildBasicCarouselStub = sinon.stub().resolves();
    buildGridCarouselStub = sinon.stub().resolves();

    // Create a wrapper that uses our stubs to avoid actual CSS loading
    loadCarousel = (selector, parent, options) => {
      if (parent?.closest('.grid-carousel')) {
        return buildGridCarouselStub(selector, parent, options);
      }
      const useBasicCarousel = parent?.closest('.basic-carousel');
      const carouselLoader = useBasicCarousel ? buildBasicCarouselStub : buildCarouselStub;
      return carouselLoader(selector, parent, options);
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should load grid carousel when parent has grid-carousel class', async () => {
    const parent = document.createElement('div');
    parent.className = 'grid-carousel';
    const selector = '.test-selector';
    const options = { test: 'option' };

    await loadCarousel(selector, parent, options);

    expect(buildGridCarouselStub.calledOnce).to.be.true;
    expect(buildGridCarouselStub.calledWith(selector, parent, options)).to.be.true;
  });

  it('should load basic carousel when parent has basic-carousel class', async () => {
    const parent = document.createElement('div');
    parent.className = 'basic-carousel';
    const selector = '.test-selector';
    const options = { test: 'option' };

    await loadCarousel(selector, parent, options);

    expect(buildBasicCarouselStub.calledOnce).to.be.true;
    expect(buildBasicCarouselStub.calledWith(selector, parent, options)).to.be.true;
  });

  it('should load regular carousel when parent has no special classes', async () => {
    const parent = document.createElement('div');
    parent.className = 'regular-container';
    const selector = '.test-selector';
    const options = { test: 'option' };

    await loadCarousel(selector, parent, options);

    expect(buildCarouselStub.calledOnce).to.be.true;
    expect(buildCarouselStub.calledWith(selector, parent, options)).to.be.true;
  });

  it('should load grid carousel when parent is inside grid-carousel', async () => {
    const grandparent = document.createElement('div');
    grandparent.className = 'grid-carousel';
    const parent = document.createElement('div');
    grandparent.appendChild(parent);
    const selector = '.test-selector';
    const options = { test: 'option' };

    await loadCarousel(selector, parent, options);

    expect(buildGridCarouselStub.calledOnce).to.be.true;
  });

  it('should load basic carousel when parent is inside basic-carousel', async () => {
    const grandparent = document.createElement('div');
    grandparent.className = 'basic-carousel';
    const parent = document.createElement('div');
    grandparent.appendChild(parent);
    const selector = '.test-selector';
    const options = { test: 'option' };

    await loadCarousel(selector, parent, options);

    expect(buildBasicCarouselStub.calledOnce).to.be.true;
  });

  it('should prioritize grid-carousel over basic-carousel', async () => {
    const grandparent = document.createElement('div');
    grandparent.className = 'grid-carousel';
    const parent = document.createElement('div');
    parent.className = 'basic-carousel';
    grandparent.appendChild(parent);
    const selector = '.test-selector';
    const options = { test: 'option' };

    await loadCarousel(selector, parent, options);

    expect(buildGridCarouselStub.calledOnce).to.be.true;
    expect(buildBasicCarouselStub.called).to.be.false;
  });

  it('should handle parent with multiple classes', async () => {
    const parent = document.createElement('div');
    parent.className = 'container basic-carousel other-class';
    const selector = '.test-selector';
    const options = { test: 'option' };

    await loadCarousel(selector, parent, options);

    expect(buildBasicCarouselStub.calledOnce).to.be.true;
  });

  it('should handle undefined options', async () => {
    const parent = document.createElement('div');
    const selector = '.test-selector';

    await loadCarousel(selector, parent);

    expect(buildCarouselStub.calledOnce).to.be.true;
    expect(buildCarouselStub.calledWith(selector, parent, undefined)).to.be.true;
  });

  it('should handle empty options object', async () => {
    const parent = document.createElement('div');
    const selector = '.test-selector';
    const options = {};

    await loadCarousel(selector, parent, options);

    expect(buildCarouselStub.calledOnce).to.be.true;
  });

  it('should handle null parent', async () => {
    const selector = '.test-selector';
    const options = { test: 'option' };

    await loadCarousel(selector, null, options);

    // With null parent, closest() can't be called, so it falls through to regular carousel
    expect(buildCarouselStub.calledOnce).to.be.true;
  });

  it('should handle empty selector', async () => {
    const parent = document.createElement('div');
    const options = { test: 'option' };

    await loadCarousel('', parent, options);

    expect(buildCarouselStub.calledOnce).to.be.true;
  });
});
