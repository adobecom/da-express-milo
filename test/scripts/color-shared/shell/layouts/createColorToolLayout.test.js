import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../../../express/code/scripts/utils.js';
import createColorToolLayout from '../../../../../express/code/scripts/color-shared/shell/layouts/createColorToolLayout.js';

setLibs('/libs');

describe('createColorToolLayout', () => {
  let container;
  const toolbarDeps = {
    initServices: sinon.stub().resolves(),
    loadStyles: sinon.stub().resolves(),
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container?.remove();
    sinon.restore();
  });

  describe('Test 1: Creates DOM structure with all four slots (topbar, sidebar, canvas, footer)', () => {
    it('should create root with ax-color-tool-layout class and data-layout', async () => {
      await createColorToolLayout(container);
      const root = container.querySelector('.ax-color-tool-layout');
      expect(root).to.exist;
      expect(root.dataset.layout).to.equal('color-tool');
    });

    it('should create all four slots with correct data-shell-slot attributes', async () => {
      await createColorToolLayout(container);
      const slotNames = ['topbar', 'sidebar', 'canvas', 'footer'];
      slotNames.forEach((name) => {
        const slot = container.querySelector(`[data-shell-slot="${name}"]`);
        expect(slot).to.exist;
        expect(slot.classList.contains(`ax-shell-slot--${name}`)).to.be.true;
      });
    });
  });

  describe('Test 2: Exposes slots, context, getSlot, getSlotNames, hasSlot, clearSlot, destroy', () => {
    it('should expose all required API properties and methods', async () => {
      const layout = await createColorToolLayout(container);
      expect(layout.slots).to.be.an('object');
      expect(layout.context).to.be.an('object');
      expect(layout.actionMenu).to.be.null;
      expect(layout.getSlot).to.be.a('function');
      expect(layout.getSlotNames).to.be.a('function');
      expect(layout.hasSlot).to.be.a('function');
      expect(layout.clearSlot).to.be.a('function');
      expect(layout.destroy).to.be.a('function');
    });

    it('should have slots for topbar, sidebar, canvas, footer', async () => {
      const layout = await createColorToolLayout(container);
      expect(layout.slots.topbar).to.exist;
      expect(layout.slots.sidebar).to.exist;
      expect(layout.slots.canvas).to.exist;
      expect(layout.slots.footer).to.exist;
    });

    it('getSlotNames should return all slot names', async () => {
      const layout = await createColorToolLayout(container);
      expect(layout.getSlotNames()).to.have.members(['topbar', 'sidebar', 'canvas', 'footer']);
    });
  });

  describe('Test 3: Seeds palette into context when config.palette is provided', () => {
    it('should not set palette when config.palette is not provided', async () => {
      const layout = await createColorToolLayout(container);
      expect(layout.context.get('palette')).to.be.undefined;
    });

    it('should allow palette to be set and retrieved via the context API', async () => {
      const layout = await createColorToolLayout(container);
      const palette = { colors: ['#ff0000', '#00ff00'], name: 'Test' };

      layout.context.set('palette', palette);
      expect(layout.context.get('palette')).to.deep.equal(palette);
    });

    it('should notify listeners when palette changes via context', async () => {
      const layout = await createColorToolLayout(container);
      let received;
      layout.context.on('palette', (val) => { received = val; });

      const palette = { colors: ['#ff0000'], name: 'Updated' };
      layout.context.set('palette', palette);
      expect(received).to.deep.equal(palette);
    });
  });

  describe('Test 4: clearSlot removes children from a slot', () => {
    it('should remove children when clearSlot is called', async () => {
      const layout = await createColorToolLayout(container);
      const slot = layout.slots.canvas;
      const child = document.createElement('span');
      child.textContent = 'test';
      slot.appendChild(child);
      expect(slot.childNodes.length).to.equal(1);

      layout.clearSlot('canvas');
      expect(slot.childNodes.length).to.equal(0);
    });

    it('should be a no-op for non-existent slot names', async () => {
      const layout = await createColorToolLayout(container);
      expect(() => layout.clearSlot('nonexistent')).to.not.throw();
    });
  });

  describe('Test 5: destroy removes DOM from container', () => {
    it('should remove root from container when destroy is called', async () => {
      const layout = await createColorToolLayout(container);
      const root = container.querySelector('.ax-color-tool-layout');
      expect(root).to.exist;
      expect(container.contains(root)).to.be.true;

      layout.destroy();
      expect(container.querySelector('.ax-color-tool-layout')).to.be.null;
      expect(container.children.length).to.equal(0);
    });
  });

  describe('Test 6: getSlot returns null for unknown slot names', () => {
    it('should return null for unknown slot name', async () => {
      const layout = await createColorToolLayout(container);
      expect(layout.getSlot('unknown')).to.be.null;
      expect(layout.getSlot('')).to.be.null;
    });
  });

  describe('Test 7: hasSlot returns correct boolean values', () => {
    it('should return true for valid slot names', async () => {
      const layout = await createColorToolLayout(container);
      expect(layout.hasSlot('topbar')).to.be.true;
      expect(layout.hasSlot('sidebar')).to.be.true;
      expect(layout.hasSlot('canvas')).to.be.true;
      expect(layout.hasSlot('footer')).to.be.true;
    });

    it('should return false for unknown slot names', async () => {
      const layout = await createColorToolLayout(container);
      expect(layout.hasSlot('unknown')).to.be.false;
      expect(layout.hasSlot('')).to.be.false;
    });
  });

  describe('Test 8: Sets mobile order CSS custom properties on slots', () => {
    it('should set --mobile-order on slots with default order', async () => {
      const layout = await createColorToolLayout(container);
      expect(layout.slots.topbar.style.getPropertyValue('--mobile-order')).to.equal('0');
      expect(layout.slots.sidebar.style.getPropertyValue('--mobile-order')).to.equal('1');
      expect(layout.slots.canvas.style.getPropertyValue('--mobile-order')).to.equal('2');
      expect(layout.slots.footer.style.getPropertyValue('--mobile-order')).to.equal('3');
    });

    it('should use custom mobileOrder when provided', async () => {
      const layout = await createColorToolLayout(container, {
        mobileOrder: ['footer', 'canvas', 'sidebar', 'topbar'],
      });
      expect(layout.slots.footer.style.getPropertyValue('--mobile-order')).to.equal('0');
      expect(layout.slots.canvas.style.getPropertyValue('--mobile-order')).to.equal('1');
      expect(layout.slots.sidebar.style.getPropertyValue('--mobile-order')).to.equal('2');
      expect(layout.slots.topbar.style.getPropertyValue('--mobile-order')).to.equal('3');
    });
  });

  describe('Test 9: Supports canvas-footer layout variant and hybrid toolbar mounting', () => {
    it('should hide topbar and sidebar slots in canvas-footer layout variant', async () => {
      const layout = await createColorToolLayout(container, {
        layoutVariant: 'canvas-footer',
      });

      const root = container.querySelector('.ax-color-tool-layout');
      expect(root.dataset.layoutVariant).to.equal('canvas-footer');
      expect(root.classList.contains('ax-color-tool-layout--canvas-footer')).to.be.true;
      expect(layout.slots.topbar.hidden).to.be.true;
      expect(layout.slots.sidebar.hidden).to.be.true;
    });

    it('should derive inline footer behavior from toolbar.mode="inline"', async () => {
      await createColorToolLayout(container, {
        toolbar: {
          mode: 'inline',
        },
      });

      const root = container.querySelector('.ax-color-tool-layout');
      expect(root.dataset.toolbarMode).to.equal('inline');
    });

    it('should derive sticky footer behavior from toolbar.mode="sticky"', async () => {
      await createColorToolLayout(container, {
        toolbar: {
          mode: 'sticky',
        },
      });

      const root = container.querySelector('.ax-color-tool-layout');
      expect(root.dataset.toolbarMode).to.equal('sticky');
    });

    it('should reuse one toolbar instance when toolbar.mode is sticky-on-scroll', async () => {
      const OriginalIntersectionObserver = window.IntersectionObserver;
      const observers = [];
      window.IntersectionObserver = function MockIntersectionObserver(cb, opts) {
        const instance = {
          observe: sinon.stub(),
          disconnect: sinon.stub(),
          opts,
          trigger(entry) {
            cb([entry]);
          },
        };
        observers.push(instance);
        return instance;
      };

      const layout = await createColorToolLayout(container, {
        layoutVariant: 'canvas-footer',
        palette: { colors: ['#111111', '#ffffff'], name: 'Contrast Pair' },
        toolbar: {
          mode: 'sticky-on-scroll',
          deps: toolbarDeps,
        },
      });

      // If a viewport-deferred IO was created (mobile/tablet), trigger it to unblock toolbar
      const viewportObserver = observers.find((o) => o.opts?.threshold === undefined);
      if (viewportObserver) {
        viewportObserver.trigger({ isIntersecting: true });
      }

      await layout.ready;
      expect(layout.toolbar).to.exist;
      expect(layout.stickyToolbar).to.exist;
      expect(layout.stickyToolbar).to.equal(layout.toolbar);
      expect(container.querySelector('.ax-color-tool-layout')?.dataset.toolbarMode).to.equal('sticky-on-scroll');
      expect(container.querySelectorAll('.color-floating-toolbar-container')).to.have.length(1);

      const floatingHost = container.querySelector('.ax-toolbar-floating-host');
      const toolbarWrapper = layout.slots.footer.querySelector('.color-floating-toolbar-container');

      expect(toolbarWrapper).to.exist;
      expect(floatingHost.hidden).to.be.true;

      // The sticky observer uses { threshold: 0 }
      const stickyObserver = observers.find((o) => o.opts?.threshold === 0);
      expect(stickyObserver).to.exist;
      expect(stickyObserver.observe.calledOnce).to.be.true;

      stickyObserver.trigger({
        isIntersecting: false,
        boundingClientRect: { top: -1 },
      });
      expect(floatingHost.hidden).to.be.false;
      expect(floatingHost.querySelector('.color-floating-toolbar-container')).to.equal(toolbarWrapper);
      expect(layout.slots.footer.querySelector('.color-floating-toolbar-container')).to.not.exist;
      expect(toolbarWrapper.querySelector('.ax-toolbar')?.classList.contains('ax-toolbar-sticky')).to.be.true;

      stickyObserver.trigger({
        isIntersecting: true,
        boundingClientRect: { top: 12 },
      });
      expect(floatingHost.hidden).to.be.true;
      expect(layout.slots.footer.querySelector('.color-floating-toolbar-container')).to.equal(toolbarWrapper);
      expect(toolbarWrapper.querySelector('.ax-toolbar')?.classList.contains('ax-toolbar-sticky')).to.be.false;

      layout.destroy();
      expect(stickyObserver.disconnect.calledOnce).to.be.true;
      window.IntersectionObserver = OriginalIntersectionObserver;
    });
  });
});
