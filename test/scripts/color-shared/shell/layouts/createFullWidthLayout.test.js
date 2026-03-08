import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { createFullWidthLayout } from '../../../../../express/code/scripts/color-shared/shell/layouts/createFullWidthLayout.js';

describe('createFullWidthLayout', () => {
  let container;
  let layoutAdapter;
  let layoutInstance;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    layoutAdapter = createFullWidthLayout();
  });

  afterEach(() => {
    if (layoutInstance && layoutInstance.destroy) {
      layoutInstance.destroy();
    }
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
    layoutInstance = null;
  });

  describe('Test 1: exposes a different slot set than palette-builder', () => {
    it('should expose header, main, and footer slots (not topbar/sidebar/canvas)', () => {
      layoutInstance = layoutAdapter.mount(container);

      expect(layoutInstance.hasSlot('header')).to.be.true;
      expect(layoutInstance.hasSlot('main')).to.be.true;
      expect(layoutInstance.hasSlot('footer')).to.be.true;
    });

    it('should NOT expose palette-builder slots', () => {
      layoutInstance = layoutAdapter.mount(container);

      expect(layoutInstance.hasSlot('topbar')).to.be.false;
      expect(layoutInstance.hasSlot('sidebar')).to.be.false;
      expect(layoutInstance.hasSlot('canvas')).to.be.false;
    });

    it('should return correct slot elements for the full-width topology', () => {
      layoutInstance = layoutAdapter.mount(container);

      const headerSlot = layoutInstance.getSlot('header');
      const mainSlot = layoutInstance.getSlot('main');
      const footerSlot = layoutInstance.getSlot('footer');

      expect(headerSlot).to.be.instanceOf(HTMLElement);
      expect(mainSlot).to.be.instanceOf(HTMLElement);
      expect(footerSlot).to.be.instanceOf(HTMLElement);
    });

    it('should return all slot names via getSlotNames()', () => {
      layoutInstance = layoutAdapter.mount(container);

      const slotNames = layoutInstance.getSlotNames();

      expect(slotNames).to.be.an('array');
      expect(slotNames).to.have.lengthOf(3);
      expect(slotNames).to.include('header');
      expect(slotNames).to.include('main');
      expect(slotNames).to.include('footer');
    });

    it('should return null for getSlot() on palette-builder slot names', () => {
      layoutInstance = layoutAdapter.mount(container);

      expect(layoutInstance.getSlot('topbar')).to.be.null;
      expect(layoutInstance.getSlot('sidebar')).to.be.null;
      expect(layoutInstance.getSlot('canvas')).to.be.null;
    });
  });

  describe('Test 2: pages can mount into its slots through the same shell API', () => {
    it('should mount root element into the provided container', () => {
      layoutInstance = layoutAdapter.mount(container);

      expect(container.contains(layoutInstance.root)).to.be.true;
    });

    it('should create root element with correct class and data attribute', () => {
      layoutInstance = layoutAdapter.mount(container);

      expect(layoutInstance.root).to.exist;
      expect(layoutInstance.root.classList.contains('ax-full-width-layout')).to.be.true;
      expect(layoutInstance.root.dataset.layout).to.equal('full-width');
    });

    it('should create all required slot elements with correct classes', () => {
      layoutInstance = layoutAdapter.mount(container);

      const headerSlot = layoutInstance.getSlot('header');
      const mainSlot = layoutInstance.getSlot('main');
      const footerSlot = layoutInstance.getSlot('footer');

      expect(headerSlot.classList.contains('ax-shell-slot')).to.be.true;
      expect(headerSlot.classList.contains('ax-shell-slot--header')).to.be.true;
      expect(headerSlot.dataset.shellSlot).to.equal('header');

      expect(mainSlot.classList.contains('ax-shell-slot')).to.be.true;
      expect(mainSlot.classList.contains('ax-shell-slot--main')).to.be.true;
      expect(mainSlot.dataset.shellSlot).to.equal('main');

      expect(footerSlot.classList.contains('ax-shell-slot')).to.be.true;
      expect(footerSlot.classList.contains('ax-shell-slot--footer')).to.be.true;
      expect(footerSlot.dataset.shellSlot).to.equal('footer');
    });

    it('should allow pages to mount content into slots', () => {
      layoutInstance = layoutAdapter.mount(container);

      const headerSlot = layoutInstance.getSlot('header');
      const mainSlot = layoutInstance.getSlot('main');
      const footerSlot = layoutInstance.getSlot('footer');

      const headerContent = document.createElement('div');
      headerContent.textContent = 'Header content';
      headerSlot.appendChild(headerContent);

      const mainContent = document.createElement('div');
      mainContent.textContent = 'Main content';
      mainSlot.appendChild(mainContent);

      const footerContent = document.createElement('div');
      footerContent.textContent = 'Footer content';
      footerSlot.appendChild(footerContent);

      expect(headerSlot.textContent).to.include('Header content');
      expect(mainSlot.textContent).to.include('Main content');
      expect(footerSlot.textContent).to.include('Footer content');
    });

    it('should support clearSlot() for page navigation', () => {
      layoutInstance = layoutAdapter.mount(container);

      const mainSlot = layoutInstance.getSlot('main');
      const pageContent = document.createElement('div');
      pageContent.textContent = 'Page content';
      mainSlot.appendChild(pageContent);

      expect(mainSlot.children.length).to.equal(1);

      layoutInstance.clearSlot('main');

      expect(mainSlot.children.length).to.equal(0);
    });
  });

  describe('Test 3: destroy() cleans up correctly', () => {
    it('should remove root element from container', () => {
      layoutInstance = layoutAdapter.mount(container);

      expect(container.contains(layoutInstance.root)).to.be.true;

      layoutInstance.destroy();

      expect(container.contains(layoutInstance.root)).to.be.false;
      expect(container.children.length).to.equal(0);
    });

    it('should remove all slot elements', () => {
      layoutInstance = layoutAdapter.mount(container);

      const headerSlot = layoutInstance.getSlot('header');
      const mainSlot = layoutInstance.getSlot('main');
      const footerSlot = layoutInstance.getSlot('footer');

      expect(document.body.contains(headerSlot)).to.be.true;
      expect(document.body.contains(mainSlot)).to.be.true;
      expect(document.body.contains(footerSlot)).to.be.true;

      layoutInstance.destroy();

      expect(document.body.contains(headerSlot)).to.be.false;
      expect(document.body.contains(mainSlot)).to.be.false;
      expect(document.body.contains(footerSlot)).to.be.false;
    });

    it('should handle destroy() being called multiple times', () => {
      layoutInstance = layoutAdapter.mount(container);

      expect(() => {
        layoutInstance.destroy();
        layoutInstance.destroy();
      }).to.not.throw();
    });

    it('should clean up content in slots before destroying', () => {
      layoutInstance = layoutAdapter.mount(container);

      const mainSlot = layoutInstance.getSlot('main');
      const content = document.createElement('div');
      content.textContent = 'Test content';
      mainSlot.appendChild(content);

      expect(mainSlot.children.length).to.equal(1);

      layoutInstance.destroy();

      expect(document.body.contains(content)).to.be.false;
    });
  });

  describe('Test 4: contract validation still passes', () => {
    it('should have type property', () => {
      expect(layoutAdapter.type).to.equal('full-width');
    });

    it('should have mount method', () => {
      expect(layoutAdapter.mount).to.be.a('function');
    });

    it('should return valid instance from mount()', () => {
      layoutInstance = layoutAdapter.mount(container);

      expect(layoutInstance).to.be.an('object');
      expect(layoutInstance.type).to.equal('full-width');
      expect(layoutInstance.root).to.be.instanceOf(HTMLElement);
      expect(layoutInstance.hasSlot).to.be.a('function');
      expect(layoutInstance.getSlot).to.be.a('function');
      expect(layoutInstance.getSlotNames).to.be.a('function');
      expect(layoutInstance.clearSlot).to.be.a('function');
      expect(layoutInstance.destroy).to.be.a('function');
    });

    it('should pass validateLayout() checks', () => {
      layoutInstance = layoutAdapter.mount(container);

      expect(layoutInstance.type).to.be.a('string');
      expect(layoutInstance.root).to.be.instanceOf(HTMLElement);

      expect(layoutInstance.hasSlot('header')).to.be.a('boolean');
      expect(layoutInstance.getSlot('header')).to.satisfy((slot) => 
        slot === null || slot instanceof HTMLElement
      );
      expect(layoutInstance.getSlotNames()).to.be.an('array');

      expect(() => layoutInstance.clearSlot('header')).to.not.throw();
      expect(() => layoutInstance.clearSlot('nonexistent')).to.not.throw();
    });
  });

  describe('Additional layout-specific features', () => {
    it('should preserve shared components when configured', () => {
      layoutInstance = layoutAdapter.mount(container, { preserveSharedComponents: true });

      const mainSlot = layoutInstance.getSlot('main');
      const sharedComponent = document.createElement('div');
      sharedComponent.dataset.sharedComponent = 'toolbar';
      sharedComponent.textContent = 'Shared toolbar';

      const pageContent = document.createElement('div');
      pageContent.textContent = 'Page content';

      mainSlot.appendChild(sharedComponent);
      mainSlot.appendChild(pageContent);

      expect(mainSlot.children.length).to.equal(2);

      layoutInstance.clearSlot('main');

      expect(mainSlot.children.length).to.equal(1);
      expect(mainSlot.firstChild).to.equal(sharedComponent);
      expect(mainSlot.textContent).to.include('Shared toolbar');
      expect(mainSlot.textContent).to.not.include('Page content');
    });

    it('should clear all content including shared components when preserveSharedComponents is false', () => {
      layoutInstance = layoutAdapter.mount(container, { preserveSharedComponents: false });

      const headerSlot = layoutInstance.getSlot('header');
      const sharedComponent = document.createElement('div');
      sharedComponent.dataset.sharedComponent = 'menu';
      sharedComponent.textContent = 'Shared menu';

      const pageContent = document.createElement('div');
      pageContent.textContent = 'Page content';

      headerSlot.appendChild(sharedComponent);
      headerSlot.appendChild(pageContent);

      expect(headerSlot.children.length).to.equal(2);

      layoutInstance.clearSlot('header');

      expect(headerSlot.children.length).to.equal(0);
    });

    it('should handle clearSlot() on empty slot without errors', () => {
      layoutInstance = layoutAdapter.mount(container);

      const footerSlot = layoutInstance.getSlot('footer');
      expect(footerSlot.children.length).to.equal(0);

      expect(() => layoutInstance.clearSlot('footer')).to.not.throw();
      expect(footerSlot.children.length).to.equal(0);
    });

    it('should maintain semantic HTML structure', () => {
      layoutInstance = layoutAdapter.mount(container);

      const root = layoutInstance.root;
      expect(root.tagName).to.equal('DIV');

      const slots = root.querySelectorAll('[data-shell-slot]');
      expect(slots.length).to.equal(3);

      slots.forEach((slot) => {
        expect(slot.tagName).to.equal('DIV');
        expect(slot.dataset.shellSlot).to.be.a('string');
        expect(slot.dataset.shellSlot.length).to.be.greaterThan(0);
      });
    });
  });
});
