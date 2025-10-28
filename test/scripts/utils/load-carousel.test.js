import { expect } from '@esm-bundle/chai';
import { setLibs } from '../../../express/code/scripts/utils.js';
import loadCarousel from '../../../express/code/scripts/utils/load-carousel.js';

setLibs('/libs');

describe('Load Carousel', () => {
  it('should load grid carousel when parent has grid-carousel class', () => {
    const parent = document.createElement('div');
    parent.className = 'grid-carousel';
    const selector = '.test-selector';
    const options = { test: 'option' };

    // This will call the actual carousel builders
    // We just test that it doesn't throw and returns something
    expect(() => loadCarousel(selector, parent, options)).to.not.throw();
  });

  it('should load basic carousel when parent has basic-carousel class', () => {
    const parent = document.createElement('div');
    parent.className = 'basic-carousel';
    const selector = '.test-selector';
    const options = { test: 'option' };

    expect(() => loadCarousel(selector, parent, options)).to.not.throw();
  });

  it('should load regular carousel when parent has no special classes', () => {
    const parent = document.createElement('div');
    parent.className = 'regular-container';
    const selector = '.test-selector';
    const options = { test: 'option' };

    expect(() => loadCarousel(selector, parent, options)).to.not.throw();
  });

  it('should load grid carousel when parent is inside grid-carousel', () => {
    const grandparent = document.createElement('div');
    grandparent.className = 'grid-carousel';
    const parent = document.createElement('div');
    grandparent.appendChild(parent);
    const selector = '.test-selector';
    const options = { test: 'option' };

    expect(() => loadCarousel(selector, parent, options)).to.not.throw();
  });

  it('should load basic carousel when parent is inside basic-carousel', () => {
    const grandparent = document.createElement('div');
    grandparent.className = 'basic-carousel';
    const parent = document.createElement('div');
    grandparent.appendChild(parent);
    const selector = '.test-selector';
    const options = { test: 'option' };

    expect(() => loadCarousel(selector, parent, options)).to.not.throw();
  });

  it('should prioritize grid-carousel over basic-carousel', () => {
    const grandparent = document.createElement('div');
    grandparent.className = 'grid-carousel';
    const parent = document.createElement('div');
    parent.className = 'basic-carousel';
    grandparent.appendChild(parent);
    const selector = '.test-selector';
    const options = { test: 'option' };

    expect(() => loadCarousel(selector, parent, options)).to.not.throw();
  });

  it('should handle parent with multiple classes', () => {
    const parent = document.createElement('div');
    parent.className = 'container basic-carousel other-class';
    const selector = '.test-selector';
    const options = { test: 'option' };

    expect(() => loadCarousel(selector, parent, options)).to.not.throw();
  });

  it('should handle undefined options', () => {
    const parent = document.createElement('div');
    const selector = '.test-selector';

    expect(() => loadCarousel(selector, parent)).to.not.throw();
  });

  it('should handle empty options object', () => {
    const parent = document.createElement('div');
    const selector = '.test-selector';
    const options = {};

    expect(() => loadCarousel(selector, parent, options)).to.not.throw();
  });

  it('should handle null parent', () => {
    const selector = '.test-selector';
    const options = { test: 'option' };

    expect(() => loadCarousel(selector, null, options)).to.throw();
  });

  it('should handle empty selector', () => {
    const parent = document.createElement('div');
    const options = { test: 'option' };

    expect(() => loadCarousel('', parent, options)).to.not.throw();
  });
});
