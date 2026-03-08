/**
 * Color Blindness Page Tests
 * 
 * Tests the blindness page module following the page contract.
 */

import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

describe('blindnessPage', () => {
  let blindnessPage;
  let mockSlots;
  let mockPageOptions;

  beforeEach(async () => {
    // Import the page module
    const module = await import('../../../../express/code/blocks/palette-builder/pages/blindnessPage.js');
    blindnessPage = module.default;

    // Create mock slot elements
    mockSlots = {
      sidebar: document.createElement('div'),
      canvas: document.createElement('div'),
    };

    mockSlots.sidebar.dataset.slot = 'sidebar';
    mockSlots.canvas.dataset.slot = 'canvas';

    // Mock page options
    mockPageOptions = {
      shared: {
        toolbar: {
          palette: { colors: ['#FF0000', '#00FF00', '#0000FF'], name: 'Test Palette' },
        },
      },
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Test 1: declares required slots', () => {
    it('should declare requiredSlots array', () => {
      expect(blindnessPage).to.have.property('requiredSlots');
      expect(blindnessPage.requiredSlots).to.be.an('array');
    });

    it('should require sidebar and canvas slots', () => {
      expect(blindnessPage.requiredSlots).to.include('sidebar');
      expect(blindnessPage.requiredSlots).to.include('canvas');
    });

    it('should have exactly 2 required slots', () => {
      expect(blindnessPage.requiredSlots).to.have.lengthOf(2);
    });
  });

  describe('Test 2: mounts into layout instance slots', () => {
    it('should have a mount function', () => {
      expect(blindnessPage).to.have.property('mount');
      expect(blindnessPage.mount).to.be.a('function');
    });

    it('should mount content into sidebar slot', async () => {
      await blindnessPage.mount(mockSlots, mockPageOptions);
      
      expect(mockSlots.sidebar.children.length).to.be.greaterThan(0);
    });

    it('should mount content into canvas slot', async () => {
      await blindnessPage.mount(mockSlots, mockPageOptions);
      
      expect(mockSlots.canvas.children.length).to.be.greaterThan(0);
    });

    it('should not modify slots it does not require', async () => {
      const extraSlot = document.createElement('div');
      const slotsWithExtra = { ...mockSlots, extra: extraSlot };
      
      await blindnessPage.mount(slotsWithExtra, mockPageOptions);
      
      expect(extraSlot.children.length).to.equal(0);
    });
  });

  describe('Test 3: sets initial simulation context', () => {
    it('should have context property', () => {
      expect(blindnessPage).to.have.property('context');
      expect(blindnessPage.context).to.be.an('object');
    });

    it('should set initial palette in context', () => {
      expect(blindnessPage.context).to.have.property('palette');
      expect(blindnessPage.context.palette).to.be.an('object');
    });

    it('should set initial simulationType in context', () => {
      expect(blindnessPage.context).to.have.property('simulationType');
      expect(blindnessPage.context.simulationType).to.be.a('string');
    });

    it('should default simulationType to "all"', () => {
      expect(blindnessPage.context.simulationType).to.equal('all');
    });

    it('should have empty colors array in initial palette', () => {
      expect(blindnessPage.context.palette).to.have.property('colors');
      expect(blindnessPage.context.palette.colors).to.be.an('array');
      expect(blindnessPage.context.palette.colors).to.have.lengthOf(0);
    });

    it('should have palette name in initial context', () => {
      expect(blindnessPage.context.palette).to.have.property('name');
      expect(blindnessPage.context.palette.name).to.be.a('string');
    });
  });

  describe('Test 4: updates shared action state', () => {
    it('should have shared property', () => {
      expect(blindnessPage).to.have.property('shared');
      expect(blindnessPage.shared).to.be.an('object');
    });

    it('should configure action bar for blindness page', () => {
      expect(blindnessPage.shared).to.have.property('actionBar');
      expect(blindnessPage.shared.actionBar).to.be.an('object');
    });

    it('should set active tool to blindness', () => {
      expect(blindnessPage.shared.actionBar).to.have.property('active');
      expect(blindnessPage.shared.actionBar.active).to.equal('blindness');
    });

    it('should include undo action', () => {
      expect(blindnessPage.shared.actionBar).to.have.property('actions');
      expect(blindnessPage.shared.actionBar.actions).to.be.an('array');
      
      const undoAction = blindnessPage.shared.actionBar.actions.find(a => a.id === 'undo');
      expect(undoAction).to.exist;
      expect(undoAction.icon).to.equal('Undo');
    });

    it('should include redo action', () => {
      const redoAction = blindnessPage.shared.actionBar.actions.find(a => a.id === 'redo');
      expect(redoAction).to.exist;
      expect(redoAction.icon).to.equal('Redo');
    });

    it('should have exactly 2 actions', () => {
      expect(blindnessPage.shared.actionBar.actions).to.have.lengthOf(2);
    });
  });
});
