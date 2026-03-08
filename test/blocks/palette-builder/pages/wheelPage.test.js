import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import wheelPage from '../../../../express/code/blocks/palette-builder/pages/wheelPage.js';

describe('wheelPage', () => {
  let mockShell;
  let mockLayoutInstance;
  let mockContextAPI;

  beforeEach(() => {
    // Create mock layout instance
    mockLayoutInstance = {
      type: 'palette-builder',
      root: document.createElement('div'),
      hasSlot: sinon.stub().callsFake((name) => ['sidebar', 'main'].includes(name)),
      getSlot: sinon.stub().callsFake((name) => {
        if (name === 'sidebar') {
          const slot = document.createElement('div');
          slot.setAttribute('data-slot', 'sidebar');
          return slot;
        }
        if (name === 'main') {
          const slot = document.createElement('div');
          slot.setAttribute('data-slot', 'main');
          return slot;
        }
        return null;
      }),
      getSlotNames: sinon.stub().returns(['sidebar', 'main', 'toolbar']),
      clearSlot: sinon.stub(),
      destroy: sinon.stub(),
    };

    // Create mock context API
    mockContextAPI = {
      get: sinon.stub(),
      set: sinon.stub(),
      on: sinon.stub(),
      off: sinon.stub(),
    };

    // Create mock shell
    mockShell = {
      getSlot: sinon.stub().callsFake((name) => mockLayoutInstance.getSlot(name)),
      hasSlot: sinon.stub().callsFake((name) => mockLayoutInstance.hasSlot(name)),
      inject: sinon.stub(),
      clearSlot: sinon.stub(),
      context: mockContextAPI,
    };
  });

  describe('Test 1: declares requiredSlots', () => {
    it('should have a requiredSlots array property', () => {
      expect(wheelPage).to.have.property('requiredSlots');
      expect(wheelPage.requiredSlots).to.be.an('array');
    });

    it('should declare sidebar and main as required slots', () => {
      expect(wheelPage.requiredSlots).to.include('sidebar');
      expect(wheelPage.requiredSlots).to.include('main');
    });

    it('should have exactly 2 required slots', () => {
      expect(wheelPage.requiredSlots).to.have.lengthOf(2);
    });
  });

  describe('Test 2: mounts into layout-exposed slots only', () => {
    it('should have a mount method', () => {
      expect(wheelPage).to.have.property('mount');
      expect(wheelPage.mount).to.be.a('function');
    });

    it('should mount content into sidebar slot', async () => {
      await wheelPage.mount(mockShell);
      
      expect(mockShell.inject.calledWith('sidebar')).to.be.true;
    });

    it('should mount content into main slot', async () => {
      await wheelPage.mount(mockShell);
      
      expect(mockShell.inject.calledWith('main')).to.be.true;
    });

    it('should inject HTMLElement content into slots', async () => {
      await wheelPage.mount(mockShell);
      
      const sidebarCall = mockShell.inject.getCalls().find(call => call.args[0] === 'sidebar');
      const mainCall = mockShell.inject.getCalls().find(call => call.args[0] === 'main');
      
      expect(sidebarCall).to.exist;
      expect(mainCall).to.exist;
      expect(sidebarCall.args[1]).to.be.instanceOf(HTMLElement);
      expect(mainCall.args[1]).to.be.instanceOf(HTMLElement);
    });

    it('should only inject into required slots', async () => {
      await wheelPage.mount(mockShell);
      
      const injectedSlots = mockShell.inject.getCalls().map(call => call.args[0]);
      
      injectedSlots.forEach(slotName => {
        expect(wheelPage.requiredSlots).to.include(slotName);
      });
    });
  });

  describe('Test 3: provides page-specific shared overrides', () => {
    it('should have a shared property', () => {
      expect(wheelPage).to.have.property('shared');
    });

    it('should provide shared overrides as an object', () => {
      expect(wheelPage.shared).to.be.an('object');
    });

    it('should include action-bar overrides', () => {
      expect(wheelPage.shared).to.have.property('action-bar');
      expect(wheelPage.shared['action-bar']).to.be.an('object');
    });

    it('should set active tool to wheel in action-bar', () => {
      expect(wheelPage.shared['action-bar']).to.have.property('active');
      expect(wheelPage.shared['action-bar'].active).to.equal('wheel');
    });

    it('should provide wheel-specific actions', () => {
      expect(wheelPage.shared['action-bar']).to.have.property('actions');
      expect(wheelPage.shared['action-bar'].actions).to.be.an('array');
      
      const actionIds = wheelPage.shared['action-bar'].actions.map(a => a.id);
      expect(actionIds).to.include('undo');
      expect(actionIds).to.include('redo');
    });
  });

  describe('Test 4: sets initial palette context', () => {
    it('should have a context property', () => {
      expect(wheelPage).to.have.property('context');
    });

    it('should provide initial context as an object', () => {
      expect(wheelPage.context).to.be.an('object');
    });

    it('should include palette in initial context', () => {
      expect(wheelPage.context).to.have.property('palette');
      expect(wheelPage.context.palette).to.be.an('object');
    });

    it('should initialize palette with colors array', () => {
      expect(wheelPage.context.palette).to.have.property('colors');
      expect(wheelPage.context.palette.colors).to.be.an('array');
    });

    it('should initialize palette with a name', () => {
      expect(wheelPage.context.palette).to.have.property('name');
      expect(wheelPage.context.palette.name).to.be.a('string');
    });
  });

  describe('Test 5: destroys page-owned listeners and resources', () => {
    it('should have a destroy method', () => {
      expect(wheelPage).to.have.property('destroy');
      expect(wheelPage.destroy).to.be.a('function');
    });

    it('should accept shell as parameter', () => {
      expect(() => wheelPage.destroy(mockShell)).to.not.throw();
    });

    it('should clean up listeners registered during mount', async () => {
      const contextListeners = [];
      mockContextAPI.on.callsFake((key, callback) => {
        contextListeners.push({ key, callback });
      });
      mockContextAPI.off.callsFake((key, callback) => {
        const index = contextListeners.findIndex(l => l.key === key && l.callback === callback);
        if (index > -1) {
          contextListeners.splice(index, 1);
        }
      });

      await wheelPage.mount(mockShell);
      const listenersAfterMount = contextListeners.length;
      
      wheelPage.destroy(mockShell);
      
      if (listenersAfterMount > 0) {
        expect(mockContextAPI.off.called).to.be.true;
      }
    });

    it('should not throw if called without prior mount', () => {
      expect(() => wheelPage.destroy(mockShell)).to.not.throw();
    });
  });

  describe('Optional: preload property', () => {
    it('should optionally declare preload dependencies', () => {
      if (wheelPage.preload) {
        expect(wheelPage.preload).to.be.an('object');
        
        if (wheelPage.preload.css) {
          expect(wheelPage.preload.css).to.be.an('array');
        }
        
        if (wheelPage.preload.services) {
          expect(wheelPage.preload.services).to.be.an('array');
        }
      }
    });
  });
});
