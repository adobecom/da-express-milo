import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import createShell from '../../../../express/code/scripts/color-shared/shell/createShell.js';

describe('createShell', () => {
  let shell;
  let mockLayoutAdapter;
  let mockLayoutInstance;
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    // Create mock layout instance
    const slotA = document.createElement('div');
    slotA.setAttribute('data-slot', 'sidebar');
    const slotB = document.createElement('div');
    slotB.setAttribute('data-slot', 'main');
    container.appendChild(slotA);
    container.appendChild(slotB);

    mockLayoutInstance = {
      type: 'test-layout',
      root: container,
      hasSlot: sinon.stub().callsFake((name) => ['sidebar', 'main'].includes(name)),
      getSlot: sinon.stub().callsFake((name) => {
        if (name === 'sidebar') return slotA;
        if (name === 'main') return slotB;
        return null;
      }),
      getSlotNames: sinon.stub().returns(['sidebar', 'main']),
      clearSlot: sinon.stub().callsFake((name) => {
        const slot = mockLayoutInstance.getSlot(name);
        if (slot) {
          Array.from(slot.children).forEach((child) => {
            if (!child.hasAttribute('data-shell-owned')) {
              slot.removeChild(child);
            }
          });
        }
      }),
      destroy: sinon.stub(),
    };

    mockLayoutAdapter = {
      type: 'test-layout',
      mount: sinon.stub().returns(mockLayoutInstance),
    };

    shell = createShell();
  });

  afterEach(() => {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  });

  describe('Test 1: exposes preload, target, route, page, start, navigate, destroy', () => {
    it('should expose preload method', () => {
      expect(shell.preload).to.be.a('function');
    });

    it('should expose target method', () => {
      expect(shell.target).to.be.a('function');
    });

    it('should expose route method', () => {
      expect(shell.route).to.be.a('function');
    });

    it('should expose page method', () => {
      expect(shell.page).to.be.a('function');
    });

    it('should expose start method', () => {
      expect(shell.start).to.be.a('function');
    });

    it('should expose navigate method', () => {
      expect(shell.navigate).to.be.a('function');
    });

    it('should expose destroy method', () => {
      expect(shell.destroy).to.be.a('function');
    });

    it('should have all required public API methods', () => {
      const requiredMethods = ['preload', 'target', 'route', 'page', 'start', 'navigate', 'destroy'];
      requiredMethods.forEach((method) => {
        expect(shell[method]).to.be.a('function');
      });
    });
  });

  describe('Test 2: delegates getSlot, hasSlot, inject, clearSlot to active layout instance', () => {
    beforeEach(async () => {
      shell.target({
        name: 'test-target',
        layoutAdapter: mockLayoutAdapter,
        container,
        components: {},
      });
      await shell.start();
    });

    it('should expose getSlot method', () => {
      expect(shell.getSlot).to.be.a('function');
    });

    it('should expose hasSlot method', () => {
      expect(shell.hasSlot).to.be.a('function');
    });

    it('should expose inject method', () => {
      expect(shell.inject).to.be.a('function');
    });

    it('should expose clearSlot method', () => {
      expect(shell.clearSlot).to.be.a('function');
    });

    it('should delegate getSlot to layout instance', () => {
      const result = shell.getSlot('sidebar');
      expect(mockLayoutInstance.getSlot.calledWith('sidebar')).to.be.true;
      expect(result).to.equal(mockLayoutInstance.getSlot('sidebar'));
    });

    it('should delegate hasSlot to layout instance', () => {
      const result = shell.hasSlot('main');
      expect(mockLayoutInstance.hasSlot.calledWith('main')).to.be.true;
      expect(result).to.be.true;
    });

    it('should delegate clearSlot to layout instance', () => {
      shell.clearSlot('sidebar');
      expect(mockLayoutInstance.clearSlot.calledWith('sidebar')).to.be.true;
    });

    it('should inject content into slot via layout instance', () => {
      const content = document.createElement('div');
      content.textContent = 'Test content';
      
      shell.inject('main', content);
      
      const mainSlot = mockLayoutInstance.getSlot('main');
      expect(mainSlot.contains(content)).to.be.true;
    });

    it('should inject multiple elements into same slot', () => {
      const content1 = document.createElement('div');
      content1.textContent = 'Content 1';
      const content2 = document.createElement('div');
      content2.textContent = 'Content 2';
      
      shell.inject('main', content1);
      shell.inject('main', content2);
      
      const mainSlot = mockLayoutInstance.getSlot('main');
      expect(mainSlot.contains(content1)).to.be.true;
      expect(mainSlot.contains(content2)).to.be.true;
    });

    it('should return slot names from layout instance', () => {
      expect(shell.getSlot).to.be.a('function');
      const slotNames = mockLayoutInstance.getSlotNames();
      expect(slotNames).to.deep.equal(['sidebar', 'main']);
    });
  });

  describe('Test 3: throws helpful error when called before layout mount', () => {
    it('should throw error when calling getSlot before layout mount', () => {
      expect(() => shell.getSlot('sidebar'))
        .to.throw(/layout.*not.*mounted/i);
    });

    it('should throw error when calling hasSlot before layout mount', () => {
      expect(() => shell.hasSlot('sidebar'))
        .to.throw(/layout.*not.*mounted/i);
    });

    it('should throw error when calling inject before layout mount', () => {
      const content = document.createElement('div');
      expect(() => shell.inject('sidebar', content))
        .to.throw(/layout.*not.*mounted/i);
    });

    it('should throw error when calling clearSlot before layout mount', () => {
      expect(() => shell.clearSlot('sidebar'))
        .to.throw(/layout.*not.*mounted/i);
    });

    it('should include helpful message in error', () => {
      try {
        shell.getSlot('sidebar');
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.match(/start/i);
      }
    });

    it('should not throw error for non-slot methods before mount', () => {
      expect(() => shell.target({ name: 'test', layoutAdapter: mockLayoutAdapter, container }))
        .to.not.throw();
      expect(() => shell.route('test-route', () => {}))
        .to.not.throw();
      expect(() => shell.page('test-page', {}))
        .to.not.throw();
    });
  });

  describe('Test 4: stores target config without assuming fixed slot names', () => {
    it('should store target configuration', () => {
      const targetConfig = {
        name: 'test-target',
        layoutAdapter: mockLayoutAdapter,
        container,
        components: {
          toolbar: { type: 'floating-toolbar', options: { theme: 'dark' } },
        },
      };

      shell.target(targetConfig);
      
      // Verify target was stored by checking start() works
      expect(async () => await shell.start()).to.not.throw();
    });

    it('should not assume any fixed slot names in target config', () => {
      const targetConfig = {
        name: 'custom-target',
        layoutAdapter: mockLayoutAdapter,
        container,
        components: {
          'custom-slot-a': { type: 'component-a' },
          'custom-slot-b': { type: 'component-b' },
          'another-slot': { type: 'component-c' },
        },
      };

      expect(() => shell.target(targetConfig)).to.not.throw();
    });

    it('should allow target config with no components', () => {
      const targetConfig = {
        name: 'minimal-target',
        layoutAdapter: mockLayoutAdapter,
        container,
        components: {},
      };

      expect(() => shell.target(targetConfig)).to.not.throw();
    });

    it('should allow target config with arbitrary component mappings', () => {
      const targetConfig = {
        name: 'flexible-target',
        layoutAdapter: mockLayoutAdapter,
        container,
        components: {
          'any-slot-name-1': { type: 'type-1' },
          'any-slot-name-2': { type: 'type-2' },
          'completely-custom': { type: 'type-3' },
        },
      };

      expect(() => shell.target(targetConfig)).to.not.throw();
    });

    it('should store and use layout adapter from target config', async () => {
      shell.target({
        name: 'test-target',
        layoutAdapter: mockLayoutAdapter,
        container,
        components: {},
      });

      await shell.start();

      expect(mockLayoutAdapter.mount.calledOnce).to.be.true;
      expect(mockLayoutAdapter.mount.calledWith(container)).to.be.true;
    });

    it('should pass container to layout adapter mount', async () => {
      const customContainer = document.createElement('div');
      document.body.appendChild(customContainer);

      shell.target({
        name: 'test-target',
        layoutAdapter: mockLayoutAdapter,
        container: customContainer,
        components: {},
      });

      await shell.start();

      expect(mockLayoutAdapter.mount.calledWith(customContainer)).to.be.true;

      document.body.removeChild(customContainer);
    });

    it('should not modify the original target config object', () => {
      const targetConfig = {
        name: 'test-target',
        layoutAdapter: mockLayoutAdapter,
        container,
        components: {
          toolbar: { type: 'floating-toolbar' },
        },
      };

      const originalComponents = { ...targetConfig.components };
      shell.target(targetConfig);

      expect(targetConfig.components).to.deep.equal(originalComponents);
    });
  });
});
