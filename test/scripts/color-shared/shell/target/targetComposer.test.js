import { expect } from '@esm-bundle/chai';
import { createTargetComposer } from '../../../../../express/code/scripts/color-shared/shell/target/targetComposer.js';

describe('targetComposer', () => {
  let composer;

  beforeEach(() => {
    composer = createTargetComposer();
  });

  describe('Test 1: target stores layout adapter and layout options', () => {
    it('should store layout adapter reference', () => {
      const mockLayoutAdapter = {
        type: 'palette-builder',
        mount: () => ({
          type: 'palette-builder',
          root: document.createElement('div'),
          hasSlot: () => false,
          getSlot: () => null,
          getSlotNames: () => [],
          clearSlot: () => {},
          destroy: () => {},
        }),
      };

      const config = {
        layout: mockLayoutAdapter,
        layoutOptions: { variant: 'default' },
      };

      composer.configure(config);
      const target = composer.getTarget();

      expect(target.layout).to.equal(mockLayoutAdapter);
    });

    it('should store layout options', () => {
      const mockLayoutAdapter = {
        type: 'palette-builder',
        mount: () => ({
          type: 'palette-builder',
          root: document.createElement('div'),
          hasSlot: () => false,
          getSlot: () => null,
          getSlotNames: () => [],
          clearSlot: () => {},
          destroy: () => {},
        }),
      };

      const layoutOptions = { variant: 'default', theme: 'dark' };
      const config = {
        layout: mockLayoutAdapter,
        layoutOptions,
      };

      composer.configure(config);
      const target = composer.getTarget();

      expect(target.layoutOptions).to.deep.equal(layoutOptions);
    });

    it('should use empty object as default layout options', () => {
      const mockLayoutAdapter = {
        type: 'palette-builder',
        mount: () => ({
          type: 'palette-builder',
          root: document.createElement('div'),
          hasSlot: () => false,
          getSlot: () => null,
          getSlotNames: () => [],
          clearSlot: () => {},
          destroy: () => {},
        }),
      };

      const config = {
        layout: mockLayoutAdapter,
      };

      composer.configure(config);
      const target = composer.getTarget();

      expect(target.layoutOptions).to.deep.equal({});
    });

    it('should validate layout adapter has required properties', () => {
      const invalidAdapter = {
        type: 'invalid',
      };

      const config = {
        layout: invalidAdapter,
      };

      expect(() => composer.configure(config)).to.throw('Layout adapter must have a "mount" method');
    });
  });

  describe('Test 2: shared components map to layout-defined slots', () => {
    it('should store shared component mappings', () => {
      const mockLayoutAdapter = {
        type: 'palette-builder',
        mount: () => ({
          type: 'palette-builder',
          root: document.createElement('div'),
          hasSlot: () => true,
          getSlot: () => document.createElement('div'),
          getSlotNames: () => ['footer', 'topbar'],
          clearSlot: () => {},
          destroy: () => {},
        }),
      };

      const shared = [
        { slot: 'footer', type: 'floatingToolbar', options: { variant: 'sticky' } },
        { slot: 'topbar', type: 'actionMenu', options: { items: [] } },
      ];

      const config = {
        layout: mockLayoutAdapter,
        shared,
      };

      composer.configure(config);
      const target = composer.getTarget();

      expect(target.shared).to.deep.equal(shared);
    });

    it('should handle empty shared components array', () => {
      const mockLayoutAdapter = {
        type: 'palette-builder',
        mount: () => ({
          type: 'palette-builder',
          root: document.createElement('div'),
          hasSlot: () => false,
          getSlot: () => null,
          getSlotNames: () => [],
          clearSlot: () => {},
          destroy: () => {},
        }),
      };

      const config = {
        layout: mockLayoutAdapter,
        shared: [],
      };

      composer.configure(config);
      const target = composer.getTarget();

      expect(target.shared).to.deep.equal([]);
    });

    it('should use empty array as default shared components', () => {
      const mockLayoutAdapter = {
        type: 'palette-builder',
        mount: () => ({
          type: 'palette-builder',
          root: document.createElement('div'),
          hasSlot: () => false,
          getSlot: () => null,
          getSlotNames: () => [],
          clearSlot: () => {},
          destroy: () => {},
        }),
      };

      const config = {
        layout: mockLayoutAdapter,
      };

      composer.configure(config);
      const target = composer.getTarget();

      expect(target.shared).to.deep.equal([]);
    });

    it('should validate shared component has required slot property', () => {
      const mockLayoutAdapter = {
        type: 'palette-builder',
        mount: () => ({
          type: 'palette-builder',
          root: document.createElement('div'),
          hasSlot: () => true,
          getSlot: () => document.createElement('div'),
          getSlotNames: () => ['footer'],
          clearSlot: () => {},
          destroy: () => {},
        }),
      };

      const shared = [
        { type: 'floatingToolbar', options: { variant: 'sticky' } },
      ];

      const config = {
        layout: mockLayoutAdapter,
        shared,
      };

      expect(() => composer.configure(config)).to.throw('Shared component must have a "slot" property');
    });

    it('should validate shared component has required type property', () => {
      const mockLayoutAdapter = {
        type: 'palette-builder',
        mount: () => ({
          type: 'palette-builder',
          root: document.createElement('div'),
          hasSlot: () => true,
          getSlot: () => document.createElement('div'),
          getSlotNames: () => ['footer'],
          clearSlot: () => {},
          destroy: () => {},
        }),
      };

      const shared = [
        { slot: 'footer', options: { variant: 'sticky' } },
      ];

      const config = {
        layout: mockLayoutAdapter,
        shared,
      };

      expect(() => composer.configure(config)).to.throw('Shared component must have a "type" property');
    });
  });

  describe('Test 3: reserved slots are tracked', () => {
    it('should store reserved slots list', () => {
      const mockLayoutAdapter = {
        type: 'palette-builder',
        mount: () => ({
          type: 'palette-builder',
          root: document.createElement('div'),
          hasSlot: () => true,
          getSlot: () => document.createElement('div'),
          getSlotNames: () => ['footer', 'topbar'],
          clearSlot: () => {},
          destroy: () => {},
        }),
      };

      const config = {
        layout: mockLayoutAdapter,
        reservedSlots: ['footer', 'topbar'],
      };

      composer.configure(config);
      const target = composer.getTarget();

      expect(target.reservedSlots).to.deep.equal(['footer', 'topbar']);
    });

    it('should use empty array as default reserved slots', () => {
      const mockLayoutAdapter = {
        type: 'palette-builder',
        mount: () => ({
          type: 'palette-builder',
          root: document.createElement('div'),
          hasSlot: () => false,
          getSlot: () => null,
          getSlotNames: () => [],
          clearSlot: () => {},
          destroy: () => {},
        }),
      };

      const config = {
        layout: mockLayoutAdapter,
      };

      composer.configure(config);
      const target = composer.getTarget();

      expect(target.reservedSlots).to.deep.equal([]);
    });

    it('should check if a slot is reserved', () => {
      const mockLayoutAdapter = {
        type: 'palette-builder',
        mount: () => ({
          type: 'palette-builder',
          root: document.createElement('div'),
          hasSlot: () => true,
          getSlot: () => document.createElement('div'),
          getSlotNames: () => ['footer', 'topbar', 'sidebar'],
          clearSlot: () => {},
          destroy: () => {},
        }),
      };

      const config = {
        layout: mockLayoutAdapter,
        reservedSlots: ['footer', 'topbar'],
      };

      composer.configure(config);

      expect(composer.isSlotReserved('footer')).to.be.true;
      expect(composer.isSlotReserved('topbar')).to.be.true;
      expect(composer.isSlotReserved('sidebar')).to.be.false;
      expect(composer.isSlotReserved('nonexistent')).to.be.false;
    });

    it('should validate reserved slots are strings', () => {
      const mockLayoutAdapter = {
        type: 'palette-builder',
        mount: () => ({
          type: 'palette-builder',
          root: document.createElement('div'),
          hasSlot: () => true,
          getSlot: () => document.createElement('div'),
          getSlotNames: () => ['footer'],
          clearSlot: () => {},
          destroy: () => {},
        }),
      };

      const config = {
        layout: mockLayoutAdapter,
        reservedSlots: ['footer', 123, null],
      };

      expect(() => composer.configure(config)).to.throw('Reserved slot names must be strings');
    });
  });

  describe('Test 4: invalid target config fails fast', () => {
    it('should throw if layout is missing', () => {
      const config = {
        shared: [],
      };

      expect(() => composer.configure(config)).to.throw('Target config must have a "layout" property');
    });

    it('should throw if layout is not an object', () => {
      const config = {
        layout: 'not-an-object',
      };

      expect(() => composer.configure(config)).to.throw('Layout adapter must be an object');
    });

    it('should throw if layout has no type', () => {
      const config = {
        layout: {
          mount: () => {},
        },
      };

      expect(() => composer.configure(config)).to.throw('Layout adapter must have a "type" property');
    });

    it('should throw if layout type is not a string', () => {
      const config = {
        layout: {
          type: 123,
          mount: () => {},
        },
      };

      expect(() => composer.configure(config)).to.throw('Layout adapter must have a "type" property');
    });

    it('should throw if layout has no mount method', () => {
      const config = {
        layout: {
          type: 'palette-builder',
        },
      };

      expect(() => composer.configure(config)).to.throw('Layout adapter must have a "mount" method');
    });

    it('should throw if layoutOptions is not an object', () => {
      const mockLayoutAdapter = {
        type: 'palette-builder',
        mount: () => ({
          type: 'palette-builder',
          root: document.createElement('div'),
          hasSlot: () => false,
          getSlot: () => null,
          getSlotNames: () => [],
          clearSlot: () => {},
          destroy: () => {},
        }),
      };

      const config = {
        layout: mockLayoutAdapter,
        layoutOptions: 'not-an-object',
      };

      expect(() => composer.configure(config)).to.throw('Layout options must be an object');
    });

    it('should throw if shared is not an array', () => {
      const mockLayoutAdapter = {
        type: 'palette-builder',
        mount: () => ({
          type: 'palette-builder',
          root: document.createElement('div'),
          hasSlot: () => false,
          getSlot: () => null,
          getSlotNames: () => [],
          clearSlot: () => {},
          destroy: () => {},
        }),
      };

      const config = {
        layout: mockLayoutAdapter,
        shared: 'not-an-array',
      };

      expect(() => composer.configure(config)).to.throw('Shared components must be an array');
    });

    it('should throw if reservedSlots is not an array', () => {
      const mockLayoutAdapter = {
        type: 'palette-builder',
        mount: () => ({
          type: 'palette-builder',
          root: document.createElement('div'),
          hasSlot: () => false,
          getSlot: () => null,
          getSlotNames: () => [],
          clearSlot: () => {},
          destroy: () => {},
        }),
      };

      const config = {
        layout: mockLayoutAdapter,
        reservedSlots: 'not-an-array',
      };

      expect(() => composer.configure(config)).to.throw('Reserved slots must be an array');
    });

    it('should throw if configure is called twice', () => {
      const mockLayoutAdapter = {
        type: 'palette-builder',
        mount: () => ({
          type: 'palette-builder',
          root: document.createElement('div'),
          hasSlot: () => false,
          getSlot: () => null,
          getSlotNames: () => [],
          clearSlot: () => {},
          destroy: () => {},
        }),
      };

      const config = {
        layout: mockLayoutAdapter,
      };

      composer.configure(config);
      expect(() => composer.configure(config)).to.throw('Target already configured');
    });

    it('should throw if getTarget is called before configure', () => {
      expect(() => composer.getTarget()).to.throw('Target not configured');
    });

    it('should throw if isSlotReserved is called before configure', () => {
      expect(() => composer.isSlotReserved('footer')).to.throw('Target not configured');
    });
  });
});
