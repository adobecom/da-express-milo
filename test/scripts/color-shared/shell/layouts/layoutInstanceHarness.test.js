import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import createLayoutInstanceHarness from '../../../../../express/code/scripts/color-shared/shell/layouts/layoutInstanceHarness.js';

describe('layoutInstanceHarness', () => {
  let container;
  let mockInstance;
  let harness;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    // Create mock layout instance with slots
    const slotA = document.createElement('div');
    slotA.setAttribute('data-slot', 'sidebar');
    const slotB = document.createElement('div');
    slotB.setAttribute('data-slot', 'main');
    container.appendChild(slotA);
    container.appendChild(slotB);

    mockInstance = {
      type: 'test-layout',
      root: container,
      hasSlot: sinon.stub().callsFake((name) => ['sidebar', 'main'].includes(name)),
      getSlot: sinon.stub().callsFake((name) => {
        if (name === 'sidebar') return slotA;
        if (name === 'main') return slotB;
        return null;
      }),
      getSlotNames: sinon.stub().returns(['sidebar', 'main']),
      clearSlot: sinon.stub(),
      destroy: sinon.stub(),
    };

    harness = createLayoutInstanceHarness(mockInstance);
  });

  afterEach(() => {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  });

  describe('getSlotNames() returns only exposed slots', () => {
    it('should return only the slots exposed by the layout', () => {
      const slotNames = harness.getSlotNames();
      expect(slotNames).to.deep.equal(['sidebar', 'main']);
    });

    it('should not expose internal implementation slots', () => {
      // Add an internal slot that shouldn't be exposed
      const internalSlot = document.createElement('div');
      internalSlot.setAttribute('data-slot-internal', 'header');
      container.appendChild(internalSlot);

      const slotNames = harness.getSlotNames();
      expect(slotNames).to.not.include('header');
      expect(slotNames).to.deep.equal(['sidebar', 'main']);
    });

    it('should return empty array if no slots are exposed', () => {
      const emptyInstance = {
        type: 'empty-layout',
        root: document.createElement('div'),
        hasSlot: sinon.stub().returns(false),
        getSlot: sinon.stub().returns(null),
        getSlotNames: sinon.stub().returns([]),
        clearSlot: sinon.stub(),
        destroy: sinon.stub(),
      };

      const emptyHarness = createLayoutInstanceHarness(emptyInstance);
      expect(emptyHarness.getSlotNames()).to.deep.equal([]);
    });
  });

  describe('clearSlot() clears only page-owned nodes', () => {
    let slotElement;
    let shellOwnedNode;
    let pageOwnedNode1;
    let pageOwnedNode2;

    beforeEach(() => {
      slotElement = harness.getSlot('sidebar');
      
      // Shell-owned node (should NOT be cleared)
      shellOwnedNode = document.createElement('div');
      shellOwnedNode.setAttribute('data-shell-owned', 'true');
      shellOwnedNode.textContent = 'Shell component';
      slotElement.appendChild(shellOwnedNode);

      // Page-owned nodes (SHOULD be cleared)
      pageOwnedNode1 = document.createElement('div');
      pageOwnedNode1.textContent = 'Page content 1';
      slotElement.appendChild(pageOwnedNode1);

      pageOwnedNode2 = document.createElement('div');
      pageOwnedNode2.textContent = 'Page content 2';
      slotElement.appendChild(pageOwnedNode2);
    });

    it('should clear only page-owned nodes from slot', () => {
      harness.clearSlot('sidebar');

      expect(slotElement.contains(shellOwnedNode)).to.be.true;
      expect(slotElement.contains(pageOwnedNode1)).to.be.false;
      expect(slotElement.contains(pageOwnedNode2)).to.be.false;
    });

    it('should preserve shell-owned nodes when clearing', () => {
      const initialShellNodes = slotElement.querySelectorAll('[data-shell-owned]');
      expect(initialShellNodes.length).to.equal(1);

      harness.clearSlot('sidebar');

      const remainingShellNodes = slotElement.querySelectorAll('[data-shell-owned]');
      expect(remainingShellNodes.length).to.equal(1);
      expect(remainingShellNodes[0]).to.equal(shellOwnedNode);
    });

    it('should clear all page nodes if slot has no shell-owned nodes', () => {
      const mainSlot = harness.getSlot('main');
      const pageNode = document.createElement('div');
      pageNode.textContent = 'Page content';
      mainSlot.appendChild(pageNode);

      expect(mainSlot.children.length).to.equal(1);

      harness.clearSlot('main');

      expect(mainSlot.children.length).to.equal(0);
    });

    it('should handle clearing empty slot gracefully', () => {
      const mainSlot = harness.getSlot('main');
      expect(mainSlot.children.length).to.equal(0);

      expect(() => harness.clearSlot('main')).to.not.throw();
      expect(mainSlot.children.length).to.equal(0);
    });
  });

  describe('missing slot lookups are safe and descriptive', () => {
    it('should return null for non-existent slot in getSlot()', () => {
      const result = harness.getSlot('nonexistent');
      expect(result).to.be.null;
    });

    it('should return false for non-existent slot in hasSlot()', () => {
      const result = harness.hasSlot('nonexistent');
      expect(result).to.be.false;
    });

    it('should handle clearSlot() on non-existent slot gracefully', () => {
      expect(() => harness.clearSlot('nonexistent')).to.not.throw();
    });

    it('should provide descriptive error when attempting to clear non-existent slot with strict mode', () => {
      const strictHarness = createLayoutInstanceHarness(mockInstance, { strict: true });
      
      expect(() => strictHarness.clearSlot('nonexistent'))
        .to.throw(/slot.*nonexistent.*not found/i);
    });

    it('should log warning when accessing missing slot in dev mode', () => {
      const consoleWarnStub = sinon.stub(console, 'warn');
      
      const devHarness = createLayoutInstanceHarness(mockInstance, { dev: true });
      devHarness.getSlot('nonexistent');

      expect(consoleWarnStub.calledOnce).to.be.true;
      expect(consoleWarnStub.firstCall.args[0]).to.match(/slot.*nonexistent/i);
      
      consoleWarnStub.restore();
    });
  });

  describe('destroyed instances reject further access cleanly', () => {
    beforeEach(() => {
      harness.destroy();
    });

    it('should throw descriptive error when calling getSlot() after destroy', () => {
      expect(() => harness.getSlot('sidebar'))
        .to.throw(/destroyed.*cannot.*getSlot/i);
    });

    it('should throw descriptive error when calling hasSlot() after destroy', () => {
      expect(() => harness.hasSlot('sidebar'))
        .to.throw(/destroyed.*cannot.*hasSlot/i);
    });

    it('should throw descriptive error when calling getSlotNames() after destroy', () => {
      expect(() => harness.getSlotNames())
        .to.throw(/destroyed.*cannot.*getSlotNames/i);
    });

    it('should throw descriptive error when calling clearSlot() after destroy', () => {
      expect(() => harness.clearSlot('sidebar'))
        .to.throw(/destroyed.*cannot.*clearSlot/i);
    });

    it('should allow multiple destroy() calls without error', () => {
      expect(() => harness.destroy()).to.not.throw();
      expect(() => harness.destroy()).to.not.throw();
    });

    it('should set isDestroyed flag to true after destroy', () => {
      expect(harness.isDestroyed()).to.be.true;
    });

    it('should delegate destroy to underlying instance', () => {
      expect(mockInstance.destroy.calledOnce).to.be.true;
    });
  });

  describe('harness wrapping behavior', () => {
    it('should expose the underlying instance type', () => {
      expect(harness.type).to.equal('test-layout');
    });

    it('should expose the underlying instance root element', () => {
      expect(harness.root).to.equal(container);
    });

    it('should delegate hasSlot to underlying instance', () => {
      harness.hasSlot('sidebar');
      expect(mockInstance.hasSlot.calledWith('sidebar')).to.be.true;
    });

    it('should delegate getSlot to underlying instance', () => {
      harness.getSlot('main');
      expect(mockInstance.getSlot.calledWith('main')).to.be.true;
    });

    it('should delegate getSlotNames to underlying instance', () => {
      harness.getSlotNames();
      expect(mockInstance.getSlotNames.called).to.be.true;
    });
  });
});
