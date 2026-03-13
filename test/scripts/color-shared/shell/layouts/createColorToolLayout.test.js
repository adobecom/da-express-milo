import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import createColorToolLayout from '../../../../../express/code/scripts/color-shared/shell/layouts/createColorToolLayout.js';

describe('createColorToolLayout', () => {
  let container;

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

  describe('Test 9: Renders text content block in sidebar when content is provided', () => {
    it('should not render text content when no content config is provided', async () => {
      await createColorToolLayout(container);
      const textContent = container.querySelector('.ax-text-content');
      expect(textContent).to.be.null;
    });

    it('should not render text content when content has no heading or paragraph', async () => {
      await createColorToolLayout(container, { content: {} });
      const textContent = container.querySelector('.ax-text-content');
      expect(textContent).to.be.null;
    });

    it('should render text content with heading only', async () => {
      const headingEl = document.createElement('h2');
      headingEl.textContent = 'Test Heading';

      await createColorToolLayout(container, {
        content: { heading: headingEl },
      });
      const textContent = container.querySelector('.ax-text-content');
      expect(textContent).to.exist;

      const heading = textContent.querySelector('.ax-text-content__heading');
      expect(heading).to.exist;
      expect(heading.textContent).to.equal('Test Heading');

      const paragraph = textContent.querySelector('.ax-text-content__paragraph');
      expect(paragraph).to.be.null;
    });

    it('should render text content with paragraph only', async () => {
      const paragraphEl = document.createElement('p');
      paragraphEl.textContent = 'Test paragraph text';

      await createColorToolLayout(container, {
        content: { paragraph: paragraphEl },
      });
      const textContent = container.querySelector('.ax-text-content');
      expect(textContent).to.exist;

      const paragraph = textContent.querySelector('.ax-text-content__paragraph');
      expect(paragraph).to.exist;
      expect(paragraph.textContent).to.equal('Test paragraph text');

      const heading = textContent.querySelector('.ax-text-content__heading');
      expect(heading).to.be.null;
    });

    it('should render text content with both heading and paragraph', async () => {
      const headingEl = document.createElement('h2');
      headingEl.textContent = 'Test Heading';
      const paragraphEl = document.createElement('p');
      paragraphEl.textContent = 'Test paragraph text';

      await createColorToolLayout(container, {
        content: {
          heading: headingEl,
          paragraph: paragraphEl,
        },
      });
      const textContent = container.querySelector('.ax-text-content');
      expect(textContent).to.exist;

      const heading = textContent.querySelector('.ax-text-content__heading');
      expect(heading).to.exist;
      expect(heading.textContent).to.equal('Test Heading');

      const paragraph = textContent.querySelector('.ax-text-content__paragraph');
      expect(paragraph).to.exist;
      expect(paragraph.textContent).to.equal('Test paragraph text');
    });

    it('should render Adobe Express logo by default when content is provided', async () => {
      const headingEl = document.createElement('h2');
      headingEl.textContent = 'Test';

      await createColorToolLayout(container, {
        content: { heading: headingEl },
      });
      const logoContainer = container.querySelector('.ax-text-content__logo');
      expect(logoContainer).to.exist;

      const logoIcon = logoContainer.querySelector('.ax-text-content__logo-icon');
      expect(logoIcon).to.exist;
    });

    it('should render Adobe Express logo when icon is explicitly true', async () => {
      const headingEl = document.createElement('h2');
      headingEl.textContent = 'Test';

      await createColorToolLayout(container, {
        content: { icon: true, heading: headingEl },
      });
      const logoContainer = container.querySelector('.ax-text-content__logo');
      expect(logoContainer).to.exist;
    });

    it('should not render logo when icon is false', async () => {
      const headingEl = document.createElement('h2');
      headingEl.textContent = 'Test';

      await createColorToolLayout(container, {
        content: { icon: false, heading: headingEl },
      });
      const logoContainer = container.querySelector('.ax-text-content__logo');
      expect(logoContainer).to.be.null;
    });

    it('should render text content inside sidebar slot', async () => {
      const headingEl = document.createElement('h2');
      headingEl.textContent = 'Test';

      await createColorToolLayout(container, {
        content: { heading: headingEl },
      });
      const sidebar = container.querySelector('[data-shell-slot="sidebar"]');
      const textContent = sidebar.querySelector('.ax-text-content');
      expect(textContent).to.exist;
    });
  });
});
