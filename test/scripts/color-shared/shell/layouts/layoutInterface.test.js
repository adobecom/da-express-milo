import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import validateLayout from '../../../../../express/code/scripts/color-shared/shell/layouts/layoutInterface.js';

describe('layoutInterface', () => {
  describe('validateLayout - adapter contract', () => {
    it('should accept valid layout with type and mount()', () => {
      const validLayout = {
        type: 'test-layout',
        mount: sinon.stub().returns({
          type: 'test-layout',
          root: document.createElement('div'),
          hasSlot: sinon.stub(),
          getSlot: sinon.stub(),
          getSlotNames: sinon.stub(),
          clearSlot: sinon.stub(),
          destroy: sinon.stub(),
        }),
      };

      expect(() => validateLayout(validLayout)).to.not.throw();
    });

    it('should throw when layout is missing type', () => {
      const invalidLayout = {
        mount: sinon.stub(),
      };

      expect(() => validateLayout(invalidLayout)).to.throw(/type/i);
    });

    it('should throw when layout is missing mount()', () => {
      const invalidLayout = {
        type: 'test-layout',
      };

      expect(() => validateLayout(invalidLayout)).to.throw(/mount/i);
    });
  });

  describe('validateLayout - mounted instance contract', () => {
    let container;

    beforeEach(() => {
      container = document.createElement('div');
    });

    it('should validate mounted instance exposes required methods', () => {
      const validLayout = {
        type: 'test-layout',
        mount: sinon.stub().returns({
          type: 'test-layout',
          root: document.createElement('div'),
          hasSlot: sinon.stub(),
          getSlot: sinon.stub(),
          getSlotNames: sinon.stub(),
          clearSlot: sinon.stub(),
          destroy: sinon.stub(),
        }),
      };

      const result = validateLayout(validLayout);
      const instance = result.mount(container);

      expect(instance).to.have.property('hasSlot');
      expect(instance).to.have.property('getSlot');
      expect(instance).to.have.property('getSlotNames');
      expect(instance).to.have.property('clearSlot');
      expect(instance).to.have.property('destroy');
      expect(instance.hasSlot).to.be.a('function');
      expect(instance.getSlot).to.be.a('function');
      expect(instance.getSlotNames).to.be.a('function');
      expect(instance.clearSlot).to.be.a('function');
      expect(instance.destroy).to.be.a('function');
    });

    it('should throw when mounted instance is missing hasSlot', () => {
      const invalidLayout = {
        type: 'test-layout',
        mount: sinon.stub().returns({
          type: 'test-layout',
          root: document.createElement('div'),
          getSlot: sinon.stub(),
          getSlotNames: sinon.stub(),
          clearSlot: sinon.stub(),
          destroy: sinon.stub(),
        }),
      };

      validateLayout(invalidLayout);
      expect(() => invalidLayout.mount(container)).to.throw(/hasSlot/i);
    });

    it('should throw when mounted instance is missing getSlot', () => {
      const invalidLayout = {
        type: 'test-layout',
        mount: sinon.stub().returns({
          type: 'test-layout',
          root: document.createElement('div'),
          hasSlot: sinon.stub(),
          getSlotNames: sinon.stub(),
          clearSlot: sinon.stub(),
          destroy: sinon.stub(),
        }),
      };

      validateLayout(invalidLayout);
      expect(() => invalidLayout.mount(container)).to.throw(/getSlot/i);
    });

    it('should throw when mounted instance is missing getSlotNames', () => {
      const invalidLayout = {
        type: 'test-layout',
        mount: sinon.stub().returns({
          type: 'test-layout',
          root: document.createElement('div'),
          hasSlot: sinon.stub(),
          getSlot: sinon.stub(),
          clearSlot: sinon.stub(),
          destroy: sinon.stub(),
        }),
      };

      validateLayout(invalidLayout);
      expect(() => invalidLayout.mount(container)).to.throw(/getSlotNames/i);
    });

    it('should throw when mounted instance is missing clearSlot', () => {
      const invalidLayout = {
        type: 'test-layout',
        mount: sinon.stub().returns({
          type: 'test-layout',
          root: document.createElement('div'),
          hasSlot: sinon.stub(),
          getSlot: sinon.stub(),
          getSlotNames: sinon.stub(),
          destroy: sinon.stub(),
        }),
      };

      validateLayout(invalidLayout);
      expect(() => invalidLayout.mount(container)).to.throw(/clearSlot/i);
    });

    it('should throw when mounted instance is missing destroy', () => {
      const invalidLayout = {
        type: 'test-layout',
        mount: sinon.stub().returns({
          type: 'test-layout',
          root: document.createElement('div'),
          hasSlot: sinon.stub(),
          getSlot: sinon.stub(),
          getSlotNames: sinon.stub(),
          clearSlot: sinon.stub(),
        }),
      };

      validateLayout(invalidLayout);
      expect(() => invalidLayout.mount(container)).to.throw(/destroy/i);
    });
  });

  describe('validateLayout - return value', () => {
    it('should return the adapter for chaining', () => {
      const validLayout = {
        type: 'test-layout',
        mount: sinon.stub().returns({
          type: 'test-layout',
          root: document.createElement('div'),
          hasSlot: sinon.stub(),
          getSlot: sinon.stub(),
          getSlotNames: sinon.stub(),
          clearSlot: sinon.stub(),
          destroy: sinon.stub(),
        }),
      };

      const result = validateLayout(validLayout);
      expect(result).to.equal(validLayout);
    });
  });
});
