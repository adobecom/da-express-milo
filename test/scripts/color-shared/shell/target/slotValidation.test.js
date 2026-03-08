import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { validateSharedComponentSlots, validatePageRequiredSlots } from '../../../../../express/code/scripts/color-shared/shell/target/slotValidation.js';

describe('slotValidation', () => {
  let mockLayoutInstance;

  beforeEach(() => {
    mockLayoutInstance = {
      type: 'test-layout',
      root: document.createElement('div'),
      hasSlot: sinon.stub(),
      getSlot: sinon.stub(),
      getSlotNames: sinon.stub().returns(['topbar', 'sidebar', 'canvas', 'footer']),
      clearSlot: sinon.stub(),
      destroy: sinon.stub(),
    };
  });

  describe('Test 1: missing required page slot throws before page mount', () => {
    it('should throw when page requires a slot not exposed by layout', () => {
      const pageModule = {
        requiredSlots: ['sidebar', 'canvas', 'nonexistent'],
      };

      mockLayoutInstance.hasSlot.withArgs('sidebar').returns(true);
      mockLayoutInstance.hasSlot.withArgs('canvas').returns(true);
      mockLayoutInstance.hasSlot.withArgs('nonexistent').returns(false);

      expect(() => validatePageRequiredSlots(pageModule, mockLayoutInstance))
        .to.throw()
        .with.property('message')
        .that.matches(/nonexistent/i)
        .and.matches(/test-layout/i);
    });

    it('should not throw when all required slots exist', () => {
      const pageModule = {
        requiredSlots: ['sidebar', 'canvas'],
      };

      mockLayoutInstance.hasSlot.withArgs('sidebar').returns(true);
      mockLayoutInstance.hasSlot.withArgs('canvas').returns(true);

      expect(() => validatePageRequiredSlots(pageModule, mockLayoutInstance)).to.not.throw();
    });

    it('should handle empty requiredSlots array', () => {
      const pageModule = {
        requiredSlots: [],
      };

      expect(() => validatePageRequiredSlots(pageModule, mockLayoutInstance)).to.not.throw();
    });

    it('should handle missing requiredSlots property', () => {
      const pageModule = {};

      expect(() => validatePageRequiredSlots(pageModule, mockLayoutInstance)).to.not.throw();
    });

    it('should throw when multiple required slots are missing', () => {
      const pageModule = {
        requiredSlots: ['missing1', 'missing2', 'sidebar'],
      };

      mockLayoutInstance.hasSlot.withArgs('missing1').returns(false);
      mockLayoutInstance.hasSlot.withArgs('missing2').returns(false);
      mockLayoutInstance.hasSlot.withArgs('sidebar').returns(true);

      expect(() => validatePageRequiredSlots(pageModule, mockLayoutInstance))
        .to.throw()
        .with.property('message')
        .that.matches(/missing1/i)
        .and.matches(/missing2/i)
        .and.matches(/test-layout/i);
    });
  });

  describe('Test 2: missing shared component slot throws before shared mount', () => {
    it('should throw when shared component targets a slot not exposed by layout', () => {
      const sharedComponents = [
        { slot: 'footer', type: 'floatingToolbar', options: {} },
        { slot: 'nonexistent', type: 'actionMenu', options: {} },
      ];

      mockLayoutInstance.hasSlot.withArgs('footer').returns(true);
      mockLayoutInstance.hasSlot.withArgs('nonexistent').returns(false);

      expect(() => validateSharedComponentSlots(sharedComponents, mockLayoutInstance))
        .to.throw()
        .with.property('message')
        .that.matches(/nonexistent/i)
        .and.matches(/test-layout/i);
    });

    it('should not throw when all shared component slots exist', () => {
      const sharedComponents = [
        { slot: 'footer', type: 'floatingToolbar', options: {} },
        { slot: 'topbar', type: 'actionMenu', options: {} },
      ];

      mockLayoutInstance.hasSlot.withArgs('footer').returns(true);
      mockLayoutInstance.hasSlot.withArgs('topbar').returns(true);

      expect(() => validateSharedComponentSlots(sharedComponents, mockLayoutInstance)).to.not.throw();
    });

    it('should handle empty shared components array', () => {
      const sharedComponents = [];

      expect(() => validateSharedComponentSlots(sharedComponents, mockLayoutInstance)).to.not.throw();
    });

    it('should throw when multiple shared component slots are missing', () => {
      const sharedComponents = [
        { slot: 'missing1', type: 'component1', options: {} },
        { slot: 'footer', type: 'floatingToolbar', options: {} },
        { slot: 'missing2', type: 'component2', options: {} },
      ];

      mockLayoutInstance.hasSlot.withArgs('missing1').returns(false);
      mockLayoutInstance.hasSlot.withArgs('footer').returns(true);
      mockLayoutInstance.hasSlot.withArgs('missing2').returns(false);

      expect(() => validateSharedComponentSlots(sharedComponents, mockLayoutInstance))
        .to.throw()
        .with.property('message')
        .that.matches(/missing1/i)
        .and.matches(/missing2/i)
        .and.matches(/test-layout/i);
    });
  });

  describe('Test 3: error messages include layout type and slot name', () => {
    it('should include layout type in page slot error message', () => {
      const pageModule = {
        requiredSlots: ['invalidSlot'],
      };

      mockLayoutInstance.hasSlot.withArgs('invalidSlot').returns(false);

      try {
        validatePageRequiredSlots(pageModule, mockLayoutInstance);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('test-layout');
        expect(error.message).to.include('invalidSlot');
      }
    });

    it('should include layout type in shared component slot error message', () => {
      const sharedComponents = [
        { slot: 'invalidSlot', type: 'someComponent', options: {} },
      ];

      mockLayoutInstance.hasSlot.withArgs('invalidSlot').returns(false);

      try {
        validateSharedComponentSlots(sharedComponents, mockLayoutInstance);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('test-layout');
        expect(error.message).to.include('invalidSlot');
      }
    });

    it('should include component type in shared component error message', () => {
      const sharedComponents = [
        { slot: 'invalidSlot', type: 'floatingToolbar', options: {} },
      ];

      mockLayoutInstance.hasSlot.withArgs('invalidSlot').returns(false);

      try {
        validateSharedComponentSlots(sharedComponents, mockLayoutInstance);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('floatingToolbar');
        expect(error.message).to.include('invalidSlot');
      }
    });

    it('should list all available slots in error message', () => {
      const pageModule = {
        requiredSlots: ['invalidSlot'],
      };

      mockLayoutInstance.hasSlot.withArgs('invalidSlot').returns(false);

      try {
        validatePageRequiredSlots(pageModule, mockLayoutInstance);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('topbar');
        expect(error.message).to.include('sidebar');
        expect(error.message).to.include('canvas');
        expect(error.message).to.include('footer');
      }
    });
  });

  describe('Test 4: valid mappings pass cleanly', () => {
    it('should validate successfully when page uses only exposed slots', () => {
      const pageModule = {
        requiredSlots: ['sidebar', 'canvas'],
      };

      mockLayoutInstance.hasSlot.withArgs('sidebar').returns(true);
      mockLayoutInstance.hasSlot.withArgs('canvas').returns(true);

      expect(() => validatePageRequiredSlots(pageModule, mockLayoutInstance)).to.not.throw();
    });

    it('should validate successfully when shared components use only exposed slots', () => {
      const sharedComponents = [
        { slot: 'topbar', type: 'actionMenu', options: {} },
        { slot: 'footer', type: 'floatingToolbar', options: {} },
      ];

      mockLayoutInstance.hasSlot.withArgs('topbar').returns(true);
      mockLayoutInstance.hasSlot.withArgs('footer').returns(true);

      expect(() => validateSharedComponentSlots(sharedComponents, mockLayoutInstance)).to.not.throw();
    });

    it('should validate successfully when page uses all available slots', () => {
      const pageModule = {
        requiredSlots: ['topbar', 'sidebar', 'canvas', 'footer'],
      };

      mockLayoutInstance.hasSlot.withArgs('topbar').returns(true);
      mockLayoutInstance.hasSlot.withArgs('sidebar').returns(true);
      mockLayoutInstance.hasSlot.withArgs('canvas').returns(true);
      mockLayoutInstance.hasSlot.withArgs('footer').returns(true);

      expect(() => validatePageRequiredSlots(pageModule, mockLayoutInstance)).to.not.throw();
    });

    it('should validate successfully with mixed page and shared component slots', () => {
      const pageModule = {
        requiredSlots: ['sidebar', 'canvas'],
      };

      const sharedComponents = [
        { slot: 'topbar', type: 'actionMenu', options: {} },
        { slot: 'footer', type: 'floatingToolbar', options: {} },
      ];

      mockLayoutInstance.hasSlot.withArgs('sidebar').returns(true);
      mockLayoutInstance.hasSlot.withArgs('canvas').returns(true);
      mockLayoutInstance.hasSlot.withArgs('topbar').returns(true);
      mockLayoutInstance.hasSlot.withArgs('footer').returns(true);

      expect(() => validatePageRequiredSlots(pageModule, mockLayoutInstance)).to.not.throw();
      expect(() => validateSharedComponentSlots(sharedComponents, mockLayoutInstance)).to.not.throw();
    });
  });
});
