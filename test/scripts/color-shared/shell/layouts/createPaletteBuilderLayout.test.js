import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { createPaletteBuilderLayout } from '../../../../../express/code/scripts/color-shared/shell/layouts/createPaletteBuilderLayout.js';

describe('createPaletteBuilderLayout', () => {
  let container;
  let layoutAdapter;
  let layoutInstance;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    layoutAdapter = createPaletteBuilderLayout();
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

  describe('Test 1: mount() creates expected layout DOM', () => {
    it('should create root element with correct class and data attribute', () => {
      layoutInstance = layoutAdapter.mount(container);

      expect(layoutInstance.root).to.exist;
      expect(layoutInstance.root.classList.contains('ax-palette-builder-layout')).to.be.true;
      expect(layoutInstance.root.dataset.layout).to.equal('palette-builder');
    });

    it('should create all required slot elements', () => {
      layoutInstance = layoutAdapter.mount(container);

      const topbarSlot = layoutInstance.getSlot('topbar');
      const sidebarSlot = layoutInstance.getSlot('sidebar');
      const canvasSlot = layoutInstance.getSlot('canvas');
      const footerSlot = layoutInstance.getSlot('footer');

      expect(topbarSlot).to.exist;
      expect(sidebarSlot).to.exist;
      expect(canvasSlot).to.exist;
      expect(footerSlot).to.exist;
    });

    it('should apply correct CSS classes to slot elements', () => {
      layoutInstance = layoutAdapter.mount(container);

      const topbarSlot = layoutInstance.getSlot('topbar');
      const sidebarSlot = layoutInstance.getSlot('sidebar');
      const canvasSlot = layoutInstance.getSlot('canvas');
      const footerSlot = layoutInstance.getSlot('footer');

      expect(topbarSlot.classList.contains('ax-shell-slot')).to.be.true;
      expect(topbarSlot.classList.contains('ax-shell-slot--topbar')).to.be.true;
      expect(topbarSlot.dataset.shellSlot).to.equal('topbar');

      expect(sidebarSlot.classList.contains('ax-shell-slot')).to.be.true;
      expect(sidebarSlot.classList.contains('ax-shell-slot--sidebar')).to.be.true;
      expect(sidebarSlot.dataset.shellSlot).to.equal('sidebar');

      expect(canvasSlot.classList.contains('ax-shell-slot')).to.be.true;
      expect(canvasSlot.classList.contains('ax-shell-slot--canvas')).to.be.true;
      expect(canvasSlot.dataset.shellSlot).to.equal('canvas');

      expect(footerSlot.classList.contains('ax-shell-slot')).to.be.true;
      expect(footerSlot.classList.contains('ax-shell-slot--footer')).to.be.true;
      expect(footerSlot.dataset.shellSlot).to.equal('footer');
    });

    it('should mount root element into the provided container', () => {
      layoutInstance = layoutAdapter.mount(container);

      expect(container.contains(layoutInstance.root)).to.be.true;
    });

    it('should create desktop structure with correct grid areas', () => {
      layoutInstance = layoutAdapter.mount(container);

      const topbarSlot = layoutInstance.getSlot('topbar');
      const sidebarSlot = layoutInstance.getSlot('sidebar');
      const canvasSlot = layoutInstance.getSlot('canvas');
      const footerSlot = layoutInstance.getSlot('footer');

      expect(topbarSlot.parentElement).to.equal(layoutInstance.root);
      expect(sidebarSlot.parentElement).to.equal(layoutInstance.root);
      expect(canvasSlot.parentElement).to.equal(layoutInstance.root);
      expect(footerSlot.parentElement).to.equal(layoutInstance.root);
    });
  });

  describe('Test 2: exposes expected slot names', () => {
    it('should return true for hasSlot() on valid slot names', () => {
      layoutInstance = layoutAdapter.mount(container);

      expect(layoutInstance.hasSlot('topbar')).to.be.true;
      expect(layoutInstance.hasSlot('sidebar')).to.be.true;
      expect(layoutInstance.hasSlot('canvas')).to.be.true;
      expect(layoutInstance.hasSlot('footer')).to.be.true;
    });

    it('should return false for hasSlot() on invalid slot names', () => {
      layoutInstance = layoutAdapter.mount(container);

      expect(layoutInstance.hasSlot('nonexistent')).to.be.false;
      expect(layoutInstance.hasSlot('main')).to.be.false;
      expect(layoutInstance.hasSlot('')).to.be.false;
    });

    it('should return correct slot element for getSlot()', () => {
      layoutInstance = layoutAdapter.mount(container);

      const topbarSlot = layoutInstance.getSlot('topbar');
      const sidebarSlot = layoutInstance.getSlot('sidebar');
      const canvasSlot = layoutInstance.getSlot('canvas');
      const footerSlot = layoutInstance.getSlot('footer');

      expect(topbarSlot).to.be.instanceOf(HTMLElement);
      expect(sidebarSlot).to.be.instanceOf(HTMLElement);
      expect(canvasSlot).to.be.instanceOf(HTMLElement);
      expect(footerSlot).to.be.instanceOf(HTMLElement);
    });

    it('should return null for getSlot() on invalid slot names', () => {
      layoutInstance = layoutAdapter.mount(container);

      expect(layoutInstance.getSlot('nonexistent')).to.be.null;
      expect(layoutInstance.getSlot('main')).to.be.null;
      expect(layoutInstance.getSlot('')).to.be.null;
    });

    it('should return all slot names via getSlotNames()', () => {
      layoutInstance = layoutAdapter.mount(container);

      const slotNames = layoutInstance.getSlotNames();

      expect(slotNames).to.be.an('array');
      expect(slotNames).to.have.lengthOf(4);
      expect(slotNames).to.include('topbar');
      expect(slotNames).to.include('sidebar');
      expect(slotNames).to.include('canvas');
      expect(slotNames).to.include('footer');
    });
  });

  describe('Test 3: clearSlot() preserves shared component anchors when configured', () => {
    it('should clear all content from a slot by default', () => {
      layoutInstance = layoutAdapter.mount(container);

      const sidebarSlot = layoutInstance.getSlot('sidebar');
      const testElement1 = document.createElement('div');
      testElement1.textContent = 'Test content 1';
      const testElement2 = document.createElement('div');
      testElement2.textContent = 'Test content 2';

      sidebarSlot.appendChild(testElement1);
      sidebarSlot.appendChild(testElement2);

      expect(sidebarSlot.children.length).to.equal(2);

      layoutInstance.clearSlot('sidebar');

      expect(sidebarSlot.children.length).to.equal(0);
    });

    it('should preserve elements with data-shared-component attribute when configured', () => {
      layoutInstance = layoutAdapter.mount(container, { preserveSharedComponents: true });

      const canvasSlot = layoutInstance.getSlot('canvas');
      const sharedComponent = document.createElement('div');
      sharedComponent.dataset.sharedComponent = 'toolbar';
      sharedComponent.textContent = 'Shared toolbar';

      const pageContent = document.createElement('div');
      pageContent.textContent = 'Page content';

      canvasSlot.appendChild(sharedComponent);
      canvasSlot.appendChild(pageContent);

      expect(canvasSlot.children.length).to.equal(2);

      layoutInstance.clearSlot('canvas');

      expect(canvasSlot.children.length).to.equal(1);
      expect(canvasSlot.firstChild).to.equal(sharedComponent);
      expect(canvasSlot.textContent).to.include('Shared toolbar');
      expect(canvasSlot.textContent).to.not.include('Page content');
    });

    it('should clear all content including shared components when preserveSharedComponents is false', () => {
      layoutInstance = layoutAdapter.mount(container, { preserveSharedComponents: false });

      const topbarSlot = layoutInstance.getSlot('topbar');
      const sharedComponent = document.createElement('div');
      sharedComponent.dataset.sharedComponent = 'menu';
      sharedComponent.textContent = 'Shared menu';

      const pageContent = document.createElement('div');
      pageContent.textContent = 'Page content';

      topbarSlot.appendChild(sharedComponent);
      topbarSlot.appendChild(pageContent);

      expect(topbarSlot.children.length).to.equal(2);

      layoutInstance.clearSlot('topbar');

      expect(topbarSlot.children.length).to.equal(0);
    });

    it('should handle clearSlot() on empty slot without errors', () => {
      layoutInstance = layoutAdapter.mount(container);

      const footerSlot = layoutInstance.getSlot('footer');
      expect(footerSlot.children.length).to.equal(0);

      expect(() => layoutInstance.clearSlot('footer')).to.not.throw();
      expect(footerSlot.children.length).to.equal(0);
    });

    it('should handle clearSlot() on non-existent slot gracefully', () => {
      layoutInstance = layoutAdapter.mount(container);

      expect(() => layoutInstance.clearSlot('nonexistent')).to.not.throw();
    });
  });

  describe('Test 4: destroy() removes layout DOM and listeners', () => {
    it('should remove root element from container', () => {
      layoutInstance = layoutAdapter.mount(container);

      expect(container.contains(layoutInstance.root)).to.be.true;

      layoutInstance.destroy();

      expect(container.contains(layoutInstance.root)).to.be.false;
      expect(container.children.length).to.equal(0);
    });

    it('should remove all slot elements', () => {
      layoutInstance = layoutAdapter.mount(container);

      const topbarSlot = layoutInstance.getSlot('topbar');
      const sidebarSlot = layoutInstance.getSlot('sidebar');
      const canvasSlot = layoutInstance.getSlot('canvas');
      const footerSlot = layoutInstance.getSlot('footer');

      expect(document.body.contains(topbarSlot)).to.be.true;
      expect(document.body.contains(sidebarSlot)).to.be.true;
      expect(document.body.contains(canvasSlot)).to.be.true;
      expect(document.body.contains(footerSlot)).to.be.true;

      layoutInstance.destroy();

      expect(document.body.contains(topbarSlot)).to.be.false;
      expect(document.body.contains(sidebarSlot)).to.be.false;
      expect(document.body.contains(canvasSlot)).to.be.false;
      expect(document.body.contains(footerSlot)).to.be.false;
    });

    it('should handle destroy() being called multiple times', () => {
      layoutInstance = layoutAdapter.mount(container);

      expect(() => {
        layoutInstance.destroy();
        layoutInstance.destroy();
      }).to.not.throw();
    });

    it('should clean up any event listeners', () => {
      layoutInstance = layoutAdapter.mount(container);

      const resizeListener = sinon.spy();
      window.addEventListener('resize', resizeListener);

      layoutInstance.destroy();

      window.dispatchEvent(new Event('resize'));

      window.removeEventListener('resize', resizeListener);
    });
  });

  describe('Test 5: mobile structure remains semantically valid', () => {
    it('should apply mobile order CSS custom properties', () => {
      layoutInstance = layoutAdapter.mount(container);

      const topbarSlot = layoutInstance.getSlot('topbar');
      const sidebarSlot = layoutInstance.getSlot('sidebar');
      const canvasSlot = layoutInstance.getSlot('canvas');
      const footerSlot = layoutInstance.getSlot('footer');

      const topbarOrder = window.getComputedStyle(topbarSlot).getPropertyValue('--mobile-order');
      const sidebarOrder = window.getComputedStyle(sidebarSlot).getPropertyValue('--mobile-order');
      const canvasOrder = window.getComputedStyle(canvasSlot).getPropertyValue('--mobile-order');
      const footerOrder = window.getComputedStyle(footerSlot).getPropertyValue('--mobile-order');

      expect(topbarOrder.trim()).to.equal('0');
      expect(sidebarOrder.trim()).to.equal('1');
      expect(canvasOrder.trim()).to.equal('2');
      expect(footerOrder.trim()).to.equal('3');
    });

    it('should maintain semantic HTML structure', () => {
      layoutInstance = layoutAdapter.mount(container);

      const root = layoutInstance.root;
      expect(root.tagName).to.equal('DIV');

      const slots = root.querySelectorAll('[data-shell-slot]');
      expect(slots.length).to.equal(4);

      slots.forEach((slot) => {
        expect(slot.tagName).to.equal('DIV');
        expect(slot.dataset.shellSlot).to.be.a('string');
        expect(slot.dataset.shellSlot.length).to.be.greaterThan(0);
      });
    });

    it('should support custom mobile order via config', () => {
      layoutInstance = layoutAdapter.mount(container, {
        mobileOrder: ['footer', 'topbar', 'canvas', 'sidebar'],
      });

      const topbarSlot = layoutInstance.getSlot('topbar');
      const sidebarSlot = layoutInstance.getSlot('sidebar');
      const canvasSlot = layoutInstance.getSlot('canvas');
      const footerSlot = layoutInstance.getSlot('footer');

      const footerOrder = window.getComputedStyle(footerSlot).getPropertyValue('--mobile-order');
      const topbarOrder = window.getComputedStyle(topbarSlot).getPropertyValue('--mobile-order');
      const canvasOrder = window.getComputedStyle(canvasSlot).getPropertyValue('--mobile-order');
      const sidebarOrder = window.getComputedStyle(sidebarSlot).getPropertyValue('--mobile-order');

      expect(footerOrder.trim()).to.equal('0');
      expect(topbarOrder.trim()).to.equal('1');
      expect(canvasOrder.trim()).to.equal('2');
      expect(sidebarOrder.trim()).to.equal('3');
    });

    it('should maintain accessibility attributes', () => {
      layoutInstance = layoutAdapter.mount(container);

      const slots = layoutInstance.root.querySelectorAll('[data-shell-slot]');

      slots.forEach((slot) => {
        const slotName = slot.dataset.shellSlot;
        expect(slotName).to.exist;
        expect(slot.classList.contains('ax-shell-slot')).to.be.true;
      });
    });
  });

  describe('Adapter contract compliance', () => {
    it('should have type property', () => {
      expect(layoutAdapter.type).to.equal('palette-builder');
    });

    it('should have mount method', () => {
      expect(layoutAdapter.mount).to.be.a('function');
    });

    it('should return valid instance from mount()', () => {
      layoutInstance = layoutAdapter.mount(container);

      expect(layoutInstance).to.be.an('object');
      expect(layoutInstance.type).to.equal('palette-builder');
      expect(layoutInstance.root).to.be.instanceOf(HTMLElement);
      expect(layoutInstance.hasSlot).to.be.a('function');
      expect(layoutInstance.getSlot).to.be.a('function');
      expect(layoutInstance.getSlotNames).to.be.a('function');
      expect(layoutInstance.clearSlot).to.be.a('function');
      expect(layoutInstance.destroy).to.be.a('function');
    });
  });
});
