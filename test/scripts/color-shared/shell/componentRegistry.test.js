import { expect } from '@esm-bundle/chai';
import createComponentRegistry from '../../../../express/code/scripts/color-shared/shell/componentRegistry.js';

describe('componentRegistry', () => {
  let registry;

  beforeEach(() => {
    registry = createComponentRegistry();
  });

  describe('Test 1: registers component types with defaults', () => {
    it('should register a component type with factory and defaults', () => {
      const mockFactory = () => ({
        init: async () => {},
        element: document.createElement('div'),
        update: () => {},
        destroy: () => {},
      });

      const defaults = { theme: 'dark', size: 'medium' };
      
      expect(() => {
        registry.register('toolbar', mockFactory, defaults);
      }).to.not.throw();
    });

    it('should register multiple component types', () => {
      const factory1 = () => ({
        init: async () => {},
        element: document.createElement('div'),
        update: () => {},
        destroy: () => {},
      });
      const factory2 = () => ({
        init: async () => {},
        element: document.createElement('span'),
        update: () => {},
        destroy: () => {},
      });

      registry.register('toolbar', factory1, { theme: 'dark' });
      registry.register('sidebar', factory2, { width: '300px' });

      expect(() => registry.resolve('toolbar')).to.not.throw();
      expect(() => registry.resolve('sidebar')).to.not.throw();
    });

    it('should allow registering with empty defaults', () => {
      const mockFactory = () => ({
        init: async () => {},
        element: document.createElement('div'),
        update: () => {},
        destroy: () => {},
      });

      expect(() => {
        registry.register('toolbar', mockFactory);
      }).to.not.throw();
    });

    it('should warn when overwriting an existing component type', () => {
      const factory1 = () => ({
        init: async () => {},
        element: document.createElement('div'),
        update: () => {},
        destroy: () => {},
      });
      const factory2 = () => ({
        init: async () => {},
        element: document.createElement('span'),
        update: () => {},
        destroy: () => {},
      });

      const originalWarn = console.warn;
      let warnCalled = false;
      console.warn = () => { warnCalled = true; };

      registry.register('toolbar', factory1);
      registry.register('toolbar', factory2);

      expect(warnCalled).to.be.true;
      console.warn = originalWarn;
    });
  });

  describe('Test 2: resolves a component with merged options', () => {
    it('should resolve a component with default options only', () => {
      const mockFactory = (options) => ({
        init: async () => {},
        element: document.createElement('div'),
        update: () => {},
        destroy: () => {},
        options,
      });

      registry.register('toolbar', mockFactory, { theme: 'dark', size: 'medium' });
      const component = registry.resolve('toolbar');

      expect(component.options).to.deep.equal({ theme: 'dark', size: 'medium' });
    });

    it('should merge provided options with defaults', () => {
      const mockFactory = (options) => ({
        init: async () => {},
        element: document.createElement('div'),
        update: () => {},
        destroy: () => {},
        options,
      });

      registry.register('toolbar', mockFactory, { theme: 'dark', size: 'medium', position: 'top' });
      const component = registry.resolve('toolbar', { size: 'large', color: 'blue' });

      expect(component.options).to.deep.equal({
        theme: 'dark',
        size: 'large',
        position: 'top',
        color: 'blue',
      });
    });

    it('should override defaults with provided options', () => {
      const mockFactory = (options) => ({
        init: async () => {},
        element: document.createElement('div'),
        update: () => {},
        destroy: () => {},
        options,
      });

      registry.register('toolbar', mockFactory, { theme: 'dark', size: 'medium' });
      const component = registry.resolve('toolbar', { theme: 'light' });

      expect(component.options.theme).to.equal('light');
      expect(component.options.size).to.equal('medium');
    });

    it('should handle nested option merging', () => {
      const mockFactory = (options) => ({
        init: async () => {},
        element: document.createElement('div'),
        update: () => {},
        destroy: () => {},
        options,
      });

      registry.register('toolbar', mockFactory, {
        theme: 'dark',
        config: { animation: true, duration: 300 },
      });
      const component = registry.resolve('toolbar', {
        config: { duration: 500 },
      });

      expect(component.options.theme).to.equal('dark');
      expect(component.options.config.duration).to.equal(500);
    });
  });

  describe('Test 3: unknown type throws', () => {
    it('should throw when resolving an unregistered component type', () => {
      expect(() => {
        registry.resolve('nonexistent');
      }).to.throw();
    });

    it('should throw with a descriptive error message', () => {
      expect(() => {
        registry.resolve('unknown-component');
      }).to.throw(/unknown-component/i);
    });

    it('should not throw for registered types', () => {
      const mockFactory = () => ({
        init: async () => {},
        element: document.createElement('div'),
        update: () => {},
        destroy: () => {},
      });

      registry.register('toolbar', mockFactory);

      expect(() => {
        registry.resolve('toolbar');
      }).to.not.throw();
    });
  });

  describe('Test 4: update(slot, options) forwards to mounted component', () => {
    it('should forward update call to the mounted component', async () => {
      let updateCalled = false;
      let receivedOptions = null;

      const mockFactory = () => ({
        init: async () => {},
        element: document.createElement('div'),
        update: (options) => {
          updateCalled = true;
          receivedOptions = options;
        },
        destroy: () => {},
      });

      registry.register('toolbar', mockFactory);
      const component = registry.resolve('toolbar');
      
      const slotEl = document.createElement('div');
      await component.init(slotEl, { theme: 'dark' }, { slotName: 'toolbar-slot' });

      registry.update('toolbar-slot', { theme: 'light' });

      expect(updateCalled).to.be.true;
      expect(receivedOptions).to.deep.equal({ theme: 'light' });
    });

    it('should handle updates to multiple mounted components', async () => {
      let toolbar1Updated = false;
      let toolbar2Updated = false;

      const mockFactory = () => ({
        init: async () => {},
        element: document.createElement('div'),
        update: (options) => {
          if (options.id === 'toolbar1') toolbar1Updated = true;
          if (options.id === 'toolbar2') toolbar2Updated = true;
        },
        destroy: () => {},
      });

      registry.register('toolbar', mockFactory);
      
      const component1 = registry.resolve('toolbar');
      const component2 = registry.resolve('toolbar');
      
      const slot1 = document.createElement('div');
      const slot2 = document.createElement('div');
      
      await component1.init(slot1, { id: 'toolbar1' }, { slotName: 'slot1' });
      await component2.init(slot2, { id: 'toolbar2' }, { slotName: 'slot2' });

      registry.update('slot1', { id: 'toolbar1' });
      registry.update('slot2', { id: 'toolbar2' });

      expect(toolbar1Updated).to.be.true;
      expect(toolbar2Updated).to.be.true;
    });

    it('should not throw when updating a non-existent slot', () => {
      expect(() => {
        registry.update('nonexistent-slot', { theme: 'dark' });
      }).to.not.throw();
    });

    it('should track mounted components by slot name', async () => {
      let updateCount = 0;

      const mockFactory = () => ({
        init: async () => {},
        element: document.createElement('div'),
        update: () => { updateCount++; },
        destroy: () => {},
      });

      registry.register('toolbar', mockFactory);
      const component = registry.resolve('toolbar');
      
      const slotEl = document.createElement('div');
      await component.init(slotEl, {}, { slotName: 'main-toolbar' });

      registry.update('main-toolbar', { theme: 'light' });
      registry.update('main-toolbar', { theme: 'dark' });

      expect(updateCount).to.equal(2);
    });
  });

  describe('Test 5: protocol requires init, element, update, destroy', () => {
    it('should validate that factory returns all required methods', () => {
      const invalidFactory = () => ({
        init: async () => {},
        element: document.createElement('div'),
      });

      registry.register('invalid', invalidFactory);

      expect(() => {
        registry.resolve('invalid');
      }).to.throw(/protocol/i);
    });

    it('should validate init method exists', () => {
      const invalidFactory = () => ({
        element: document.createElement('div'),
        update: () => {},
        destroy: () => {},
      });

      registry.register('invalid', invalidFactory);

      expect(() => {
        registry.resolve('invalid');
      }).to.throw(/init/i);
    });

    it('should validate element property exists', () => {
      const invalidFactory = () => ({
        init: async () => {},
        update: () => {},
        destroy: () => {},
      });

      registry.register('invalid', invalidFactory);

      expect(() => {
        registry.resolve('invalid');
      }).to.throw(/element/i);
    });

    it('should validate update method exists', () => {
      const invalidFactory = () => ({
        init: async () => {},
        element: document.createElement('div'),
        destroy: () => {},
      });

      registry.register('invalid', invalidFactory);

      expect(() => {
        registry.resolve('invalid');
      }).to.throw(/update/i);
    });

    it('should validate destroy method exists', () => {
      const invalidFactory = () => ({
        init: async () => {},
        element: document.createElement('div'),
        update: () => {},
      });

      registry.register('invalid', invalidFactory);

      expect(() => {
        registry.resolve('invalid');
      }).to.throw(/destroy/i);
    });

    it('should accept a valid component with all required methods', () => {
      const validFactory = () => ({
        init: async () => {},
        element: document.createElement('div'),
        update: () => {},
        destroy: () => {},
      });

      registry.register('valid', validFactory);

      expect(() => {
        registry.resolve('valid');
      }).to.not.throw();
    });

    it('should validate that init is a function', () => {
      const invalidFactory = () => ({
        init: 'not a function',
        element: document.createElement('div'),
        update: () => {},
        destroy: () => {},
      });

      registry.register('invalid', invalidFactory);

      expect(() => {
        registry.resolve('invalid');
      }).to.throw(/init/i);
    });

    it('should validate that update is a function', () => {
      const invalidFactory = () => ({
        init: async () => {},
        element: document.createElement('div'),
        update: 'not a function',
        destroy: () => {},
      });

      registry.register('invalid', invalidFactory);

      expect(() => {
        registry.resolve('invalid');
      }).to.throw(/update/i);
    });

    it('should validate that destroy is a function', () => {
      const invalidFactory = () => ({
        init: async () => {},
        element: document.createElement('div'),
        update: () => {},
        destroy: 'not a function',
      });

      registry.register('invalid', invalidFactory);

      expect(() => {
        registry.resolve('invalid');
      }).to.throw(/destroy/i);
    });
  });
});
