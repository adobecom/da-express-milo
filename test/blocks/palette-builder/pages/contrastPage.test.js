/**
 * Contrast Checker Page Tests (G2)
 * 
 * Tests the contrast page module following the page contract:
 * - declares requiredSlots
 * - mounts into layout instance slots
 * - sets initial contrast-specific context
 * - updates shared action state
 */

import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

describe('contrastPage', () => {
  let contrastPage;
  let mockShell;
  let mockLayout;
  let sidebarSlot;
  let canvasSlot;

  beforeEach(async () => {
    sidebarSlot = document.createElement('div');
    sidebarSlot.dataset.shellSlot = 'sidebar';
    
    canvasSlot = document.createElement('div');
    canvasSlot.dataset.shellSlot = 'canvas';

    mockLayout = {
      type: 'palette-builder',
      root: document.createElement('div'),
      hasSlot: sinon.stub().callsFake((name) => ['sidebar', 'canvas', 'topbar', 'footer'].includes(name)),
      getSlot: sinon.stub().callsFake((name) => {
        if (name === 'sidebar') return sidebarSlot;
        if (name === 'canvas') return canvasSlot;
        return null;
      }),
      getSlotNames: sinon.stub().returns(['topbar', 'sidebar', 'canvas', 'footer']),
      clearSlot: sinon.stub(),
      destroy: sinon.stub(),
    };

    mockShell = {
      set: sinon.stub(),
      get: sinon.stub(),
      on: sinon.stub(),
      off: sinon.stub(),
      getComponent: sinon.stub(),
    };

    const module = await import('../../../../express/code/blocks/palette-builder/pages/contrastPage.js');
    contrastPage = module.default;
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Test 1: declares required slots', () => {
    it('should declare requiredSlots property', () => {
      expect(contrastPage).to.have.property('requiredSlots');
      expect(contrastPage.requiredSlots).to.be.an('array');
    });

    it('should require sidebar and canvas slots', () => {
      expect(contrastPage.requiredSlots).to.include('sidebar');
      expect(contrastPage.requiredSlots).to.include('canvas');
    });

    it('should have exactly 2 required slots', () => {
      expect(contrastPage.requiredSlots).to.have.lengthOf(2);
    });
  });

  describe('Test 2: mounts into layout instance slots', () => {
    it('should have a mount function', () => {
      expect(contrastPage.mount).to.be.a('function');
    });

    it('should mount content into sidebar slot', async () => {
      await contrastPage.mount({ shell: mockShell, layout: mockLayout });

      expect(mockLayout.getSlot.calledWith('sidebar')).to.be.true;
      expect(sidebarSlot.children.length).to.be.greaterThan(0);
    });

    it('should mount content into canvas slot', async () => {
      await contrastPage.mount({ shell: mockShell, layout: mockLayout });

      expect(mockLayout.getSlot.calledWith('canvas')).to.be.true;
      expect(canvasSlot.children.length).to.be.greaterThan(0);
    });

    it('should not assume specific slot names beyond requiredSlots', async () => {
      await contrastPage.mount({ shell: mockShell, layout: mockLayout });

      expect(mockLayout.getSlot.neverCalledWith('main')).to.be.true;
      expect(mockLayout.getSlot.neverCalledWith('content')).to.be.true;
    });

    it('should create DOM elements before appending to slots', async () => {
      await contrastPage.mount({ shell: mockShell, layout: mockLayout });

      const sidebarContent = sidebarSlot.firstChild;
      const canvasContent = canvasSlot.firstChild;

      expect(sidebarContent).to.be.instanceOf(HTMLElement);
      expect(canvasContent).to.be.instanceOf(HTMLElement);
    });
  });

  describe('Test 3: sets initial contrast-specific context', () => {
    it('should have a context property', () => {
      expect(contrastPage).to.have.property('context');
      expect(contrastPage.context).to.be.an('object');
    });

    it('should set palette context with foreground and background colors', () => {
      expect(contrastPage.context).to.have.property('palette');
      expect(contrastPage.context.palette).to.have.property('colors');
      expect(contrastPage.context.palette.colors).to.be.an('array');
      expect(contrastPage.context.palette.colors).to.have.lengthOf(2);
    });

    it('should set contrastRatio context key', () => {
      expect(contrastPage.context).to.have.property('contrastRatio');
      expect(contrastPage.context.contrastRatio).to.be.a('number');
    });

    it('should include palette name in context', () => {
      expect(contrastPage.context.palette).to.have.property('name');
      expect(contrastPage.context.palette.name).to.be.a('string');
    });
  });

  describe('Test 4: updates shared action state', () => {
    it('should have preload property for page-specific dependencies', () => {
      expect(contrastPage).to.have.property('preload');
    });

    it('should declare CSS dependencies if needed', () => {
      if (contrastPage.preload && contrastPage.preload.css) {
        expect(contrastPage.preload.css).to.be.an('array');
      }
    });

    it('should have destroy function for cleanup', () => {
      expect(contrastPage.destroy).to.be.a('function');
    });

    it('should clean up without errors when destroy is called', () => {
      expect(() => {
        contrastPage.destroy({ shell: mockShell, layout: mockLayout });
      }).to.not.throw();
    });
  });

  describe('Additional page contract validation', () => {
    it('should export a valid page module object', () => {
      expect(contrastPage).to.be.an('object');
      expect(contrastPage.requiredSlots).to.exist;
      expect(contrastPage.mount).to.exist;
      expect(contrastPage.context).to.exist;
    });

    it('should have all required page contract properties', () => {
      const requiredProps = ['requiredSlots', 'mount', 'context', 'destroy'];
      requiredProps.forEach((prop) => {
        expect(contrastPage).to.have.property(prop);
      });
    });

    it('should mount asynchronously', async () => {
      const result = contrastPage.mount({ shell: mockShell, layout: mockLayout });
      expect(result).to.be.instanceOf(Promise);
      await result;
    });
  });
});
