import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { createFloatingToolbarAdapter } from '../../../../../express/code/scripts/color-shared/shell/components/createFloatingToolbarAdapter.js';

describe('createFloatingToolbarAdapter', () => {
  let container;
  let mockInitFloatingToolbar;
  let mockToolbarInstance;
  let mockContextAPI;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    mockToolbarInstance = {
      toolbar: {
        element: document.createElement('div'),
        updateSwatches: sinon.stub(),
        destroy: sinon.stub(),
        on: sinon.stub(),
        emit: sinon.stub(),
      },
      palette: { colors: ['#FF0000', '#00FF00'], name: 'Test Palette' },
      destroy: sinon.stub(),
    };

    mockInitFloatingToolbar = sinon.stub().resolves(mockToolbarInstance);

    mockContextAPI = {
      get: sinon.stub(),
      on: sinon.stub(),
      off: sinon.stub(),
    };
  });

  afterEach(() => {
    container.remove();
    sinon.restore();
  });

  describe('Test 1: delegates init to existing initFloatingToolbar', () => {
    it('should call initFloatingToolbar with container and options', async () => {
      const options = {
        type: 'palette',
        variant: 'standalone',
        ctaText: 'Create with my palette',
        showEdit: true,
      };

      const adapter = await createFloatingToolbarAdapter(
        container,
        options,
        mockContextAPI,
        { initFloatingToolbar: mockInitFloatingToolbar },
      );

      expect(mockInitFloatingToolbar.calledOnce).to.be.true;
      expect(mockInitFloatingToolbar.firstCall.args[0]).to.equal(container);
      expect(mockInitFloatingToolbar.firstCall.args[1]).to.deep.include({
        type: 'palette',
        variant: 'standalone',
        ctaText: 'Create with my palette',
        showEdit: true,
      });
      expect(adapter).to.exist;
    });

    it('should return null if initFloatingToolbar returns null', async () => {
      mockInitFloatingToolbar.resolves(null);

      const adapter = await createFloatingToolbarAdapter(
        container,
        {},
        mockContextAPI,
        { initFloatingToolbar: mockInitFloatingToolbar },
      );

      expect(adapter).to.be.null;
    });

    it('should expose the toolbar element via adapter.element', async () => {
      const adapter = await createFloatingToolbarAdapter(
        container,
        {},
        mockContextAPI,
        { initFloatingToolbar: mockInitFloatingToolbar },
      );

      expect(adapter.element).to.equal(mockToolbarInstance.toolbar.element);
    });

    it('should pass palette from options to initFloatingToolbar', async () => {
      const palette = { colors: ['#123456'], name: 'Custom' };
      const options = { palette };

      await createFloatingToolbarAdapter(
        container,
        options,
        mockContextAPI,
        { initFloatingToolbar: mockInitFloatingToolbar },
      );

      expect(mockInitFloatingToolbar.firstCall.args[1].palette).to.deep.equal(palette);
    });

    it('should use palette from context if not provided in options', async () => {
      const contextPalette = { colors: ['#AABBCC'], name: 'Context Palette' };
      mockContextAPI.get.withArgs('palette').returns(contextPalette);

      await createFloatingToolbarAdapter(
        container,
        {},
        mockContextAPI,
        { initFloatingToolbar: mockInitFloatingToolbar },
      );

      expect(mockInitFloatingToolbar.firstCall.args[1].palette).to.deep.equal(contextPalette);
    });
  });

  describe('Test 2: forwards update() calls (palette changes, options)', () => {
    it('should provide an update method that calls updateSwatches with new colors', async () => {
      const adapter = await createFloatingToolbarAdapter(
        container,
        {},
        mockContextAPI,
        { initFloatingToolbar: mockInitFloatingToolbar },
      );

      const newColors = ['#111111', '#222222', '#333333'];
      adapter.update({ colors: newColors });

      expect(mockToolbarInstance.toolbar.updateSwatches.calledOnce).to.be.true;
      expect(mockToolbarInstance.toolbar.updateSwatches.firstCall.args[0]).to.deep.equal(newColors);
    });

    it('should handle update with palette object containing colors', async () => {
      const adapter = await createFloatingToolbarAdapter(
        container,
        {},
        mockContextAPI,
        { initFloatingToolbar: mockInitFloatingToolbar },
      );

      const newPalette = { colors: ['#AAAAAA', '#BBBBBB'], name: 'Updated' };
      adapter.update({ palette: newPalette });

      expect(mockToolbarInstance.toolbar.updateSwatches.calledOnce).to.be.true;
      expect(mockToolbarInstance.toolbar.updateSwatches.firstCall.args[0]).to.deep.equal(newPalette.colors);
    });

    it('should not throw if update is called with no colors', async () => {
      const adapter = await createFloatingToolbarAdapter(
        container,
        {},
        mockContextAPI,
        { initFloatingToolbar: mockInitFloatingToolbar },
      );

      expect(() => adapter.update({})).to.not.throw();
    });

    it('should handle multiple consecutive updates', async () => {
      const adapter = await createFloatingToolbarAdapter(
        container,
        {},
        mockContextAPI,
        { initFloatingToolbar: mockInitFloatingToolbar },
      );

      adapter.update({ colors: ['#111111'] });
      adapter.update({ colors: ['#222222'] });
      adapter.update({ colors: ['#333333'] });

      expect(mockToolbarInstance.toolbar.updateSwatches.callCount).to.equal(3);
    });
  });

  describe('Test 3: reacts to context changes via shell subscriptions', () => {
    it('should subscribe to palette context changes on init', async () => {
      await createFloatingToolbarAdapter(
        container,
        {},
        mockContextAPI,
        { initFloatingToolbar: mockInitFloatingToolbar },
      );

      expect(mockContextAPI.on.calledWith('palette')).to.be.true;
    });

    it('should update toolbar when palette context changes', async () => {
      let paletteListener;
      mockContextAPI.on.callsFake((key, cb) => {
        if (key === 'palette') paletteListener = cb;
      });

      await createFloatingToolbarAdapter(
        container,
        {},
        mockContextAPI,
        { initFloatingToolbar: mockInitFloatingToolbar },
      );

      expect(paletteListener).to.exist;

      const newPalette = { colors: ['#FEDCBA'], name: 'Context Update' };
      paletteListener(newPalette);

      expect(mockToolbarInstance.toolbar.updateSwatches.calledOnce).to.be.true;
      expect(mockToolbarInstance.toolbar.updateSwatches.firstCall.args[0]).to.deep.equal(newPalette.colors);
    });

    it('should handle context updates with undefined palette gracefully', async () => {
      let paletteListener;
      mockContextAPI.on.callsFake((key, cb) => {
        if (key === 'palette') paletteListener = cb;
      });

      await createFloatingToolbarAdapter(
        container,
        {},
        mockContextAPI,
        { initFloatingToolbar: mockInitFloatingToolbar },
      );

      expect(() => paletteListener(undefined)).to.not.throw();
    });

    it('should handle context updates with null palette gracefully', async () => {
      let paletteListener;
      mockContextAPI.on.callsFake((key, cb) => {
        if (key === 'palette') paletteListener = cb;
      });

      await createFloatingToolbarAdapter(
        container,
        {},
        mockContextAPI,
        { initFloatingToolbar: mockInitFloatingToolbar },
      );

      expect(() => paletteListener(null)).to.not.throw();
    });
  });

  describe('Test 4: destroy() cleans subscriptions and DOM', () => {
    it('should call underlying toolbar destroy on adapter destroy', async () => {
      const adapter = await createFloatingToolbarAdapter(
        container,
        {},
        mockContextAPI,
        { initFloatingToolbar: mockInitFloatingToolbar },
      );

      adapter.destroy();

      expect(mockToolbarInstance.destroy.calledOnce).to.be.true;
    });

    it('should unsubscribe from context palette changes on destroy', async () => {
      let paletteListener;
      mockContextAPI.on.callsFake((key, cb) => {
        if (key === 'palette') paletteListener = cb;
      });

      const adapter = await createFloatingToolbarAdapter(
        container,
        {},
        mockContextAPI,
        { initFloatingToolbar: mockInitFloatingToolbar },
      );

      adapter.destroy();

      expect(mockContextAPI.off.calledOnce).to.be.true;
      expect(mockContextAPI.off.firstCall.args[0]).to.equal('palette');
      expect(mockContextAPI.off.firstCall.args[1]).to.equal(paletteListener);
    });

    it('should not throw if destroy is called multiple times', async () => {
      const adapter = await createFloatingToolbarAdapter(
        container,
        {},
        mockContextAPI,
        { initFloatingToolbar: mockInitFloatingToolbar },
      );

      expect(() => {
        adapter.destroy();
        adapter.destroy();
        adapter.destroy();
      }).to.not.throw();
    });

    it('should clean up all subscriptions even if toolbar destroy throws', async () => {
      mockToolbarInstance.destroy.throws(new Error('Destroy failed'));

      const adapter = await createFloatingToolbarAdapter(
        container,
        {},
        mockContextAPI,
        { initFloatingToolbar: mockInitFloatingToolbar },
      );

      expect(() => adapter.destroy()).to.throw('Destroy failed');
      expect(mockContextAPI.off.calledOnce).to.be.true;
    });
  });
});
