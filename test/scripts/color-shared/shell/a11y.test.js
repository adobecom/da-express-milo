import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import createColorToolLayout from '../../../../express/code/scripts/color-shared/shell/layouts/createColorToolLayout.js';

describe('Shell ARIA & Semantics [H3]', () => {
  let container;
  let sandbox;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    if (container.parentNode) {
      container.remove();
    }
    sandbox.restore();
  });

  describe('Test 1: Layout slots have appropriate ARIA landmark roles', () => {
    it('should add role="banner" to topbar slot', async () => {
      const layout = await createColorToolLayout(container);

      const topbarSlot = layout.getSlot('topbar');
      expect(topbarSlot.getAttribute('role')).to.equal('banner');

      layout.destroy();
    });

    it('should add role="complementary" to sidebar slot', async () => {
      const layout = await createColorToolLayout(container);

      const sidebarSlot = layout.getSlot('sidebar');
      expect(sidebarSlot.getAttribute('role')).to.equal('complementary');

      layout.destroy();
    });

    it('should add role="main" to canvas slot', async () => {
      const layout = await createColorToolLayout(container);

      const canvasSlot = layout.getSlot('canvas');
      expect(canvasSlot.getAttribute('role')).to.equal('main');

      layout.destroy();
    });

    it('should add role="contentinfo" to footer slot', async () => {
      const layout = await createColorToolLayout(container);

      const footerSlot = layout.getSlot('footer');
      expect(footerSlot.getAttribute('role')).to.equal('contentinfo');

      layout.destroy();
    });
  });

  describe('Test 2: Layout slots have appropriate aria-labels', () => {
    it('should add aria-label to topbar slot', async () => {
      const layout = await createColorToolLayout(container);

      const topbarSlot = layout.getSlot('topbar');
      expect(topbarSlot.getAttribute('aria-label')).to.exist;
      expect(topbarSlot.getAttribute('aria-label')).to.equal('Top navigation');

      layout.destroy();
    });

    it('should add aria-label to sidebar slot', async () => {
      const layout = await createColorToolLayout(container);

      const sidebarSlot = layout.getSlot('sidebar');
      expect(sidebarSlot.getAttribute('aria-label')).to.exist;
      expect(sidebarSlot.getAttribute('aria-label')).to.equal('Tool controls');

      layout.destroy();
    });

    it('should add aria-label to canvas slot', async () => {
      const layout = await createColorToolLayout(container);

      const canvasSlot = layout.getSlot('canvas');
      expect(canvasSlot.getAttribute('aria-label')).to.exist;
      expect(canvasSlot.getAttribute('aria-label')).to.equal('Main content');

      layout.destroy();
    });

    it('should add aria-label to footer slot', async () => {
      const layout = await createColorToolLayout(container);

      const footerSlot = layout.getSlot('footer');
      expect(footerSlot.getAttribute('aria-label')).to.exist;
      expect(footerSlot.getAttribute('aria-label')).to.equal('Toolbar');

      layout.destroy();
    });
  });

  describe('Test 3: Slot containers use semantic elements appropriate to their role', () => {
    it('should use semantic HTML or ARIA roles for layout slots', async () => {
      const layout = await createColorToolLayout(container);

      const topbarSlot = layout.getSlot('topbar');
      const sidebarSlot = layout.getSlot('sidebar');
      const canvasSlot = layout.getSlot('canvas');
      const footerSlot = layout.getSlot('footer');

      expect(topbarSlot.tagName === 'HEADER' || topbarSlot.getAttribute('role') === 'banner').to.be.true;
      expect(sidebarSlot.tagName === 'ASIDE' || sidebarSlot.getAttribute('role') === 'complementary').to.be.true;
      expect(canvasSlot.tagName === 'MAIN' || canvasSlot.getAttribute('role') === 'main').to.be.true;
      expect(footerSlot.tagName === 'FOOTER' || footerSlot.getAttribute('role') === 'contentinfo').to.be.true;

      layout.destroy();
    });

    it('should ensure slot elements have appropriate ARIA roles when not using semantic HTML', async () => {
      const layout = await createColorToolLayout(container);

      const slots = layout.getSlotNames();

      slots.forEach((slotName) => {
        const slot = layout.getSlot(slotName);

        if (!['HEADER', 'ASIDE', 'MAIN', 'FOOTER', 'NAV', 'SECTION'].includes(slot.tagName)) {
          expect(slot.getAttribute('role')).to.exist;
        }
      });

      layout.destroy();
    });
  });
});
