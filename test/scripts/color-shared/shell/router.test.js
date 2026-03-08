/**
 * Router Core Tests
 * 
 * Tests query-param routing with whitelist validation and page activation
 * through active layout instance.
 */

import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

describe('router', () => {
  let router;
  let mockLayoutInstance;
  let mockPageRegistry;
  let pushStateStub;
  let locationSearchStub;

  beforeEach(() => {
    // Mock history.pushState
    pushStateStub = sinon.stub(window.history, 'pushState');

    // Create mock layout instance following the contract
    mockLayoutInstance = {
      type: 'test-layout',
      root: document.createElement('div'),
      hasSlot: sinon.stub().callsFake((name) => ['content', 'toolbar', 'sidebar'].includes(name)),
      getSlot: sinon.stub().callsFake((name) => {
        if (['content', 'toolbar', 'sidebar'].includes(name)) {
          const slot = document.createElement('div');
          slot.dataset.slot = name;
          return slot;
        }
        return null;
      }),
      getSlotNames: sinon.stub().returns(['content', 'toolbar', 'sidebar']),
      clearSlot: sinon.stub(),
      destroy: sinon.stub(),
    };

    // Create mock page registry
    mockPageRegistry = {
      wheel: {
        id: 'wheel',
        requiredSlots: ['content'],
        mount: sinon.stub().resolves(),
        destroy: sinon.stub(),
      },
      contrast: {
        id: 'contrast',
        requiredSlots: ['content', 'sidebar'],
        mount: sinon.stub().resolves(),
        destroy: sinon.stub(),
      },
      blindness: {
        id: 'blindness',
        requiredSlots: ['content'],
        mount: sinon.stub().resolves(),
        destroy: sinon.stub(),
      },
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Test 1: resolves page IDs from configured query param', () => {
    it('should resolve page ID from ?tool= query parameter', async () => {
      const { createRouter } = await import('../../../../../../express/code/scripts/color-shared/shell/router.js');
      router = createRouter({
        queryParam: 'tool',
        defaultPage: 'wheel',
        pageRegistry: mockPageRegistry,
        getSearchString: () => '?tool=wheel',
      });

      const pageId = router.getCurrentPage();
      expect(pageId).to.equal('wheel');
    });

    it('should resolve page ID from custom query parameter', async () => {
      
      const { createRouter } = await import('../../../../../../express/code/scripts/color-shared/shell/router.js');
      router = createRouter({
        queryParam: 'page',
        defaultPage: 'wheel',
        pageRegistry: mockPageRegistry,
        getSearchString: () => '?page=contrast',
      });

      const pageId = router.getCurrentPage();
      expect(pageId).to.equal('contrast');
    });

    it('should handle multiple query parameters', async () => {
      
      const { createRouter } = await import('../../../../../../express/code/scripts/color-shared/shell/router.js');
      router = createRouter({
        queryParam: 'tool',
        defaultPage: 'wheel',
        pageRegistry: mockPageRegistry,
        getSearchString: () => '?foo=bar&tool=blindness&baz=qux',
      });

      const pageId = router.getCurrentPage();
      expect(pageId).to.equal('blindness');
    });
  });

  describe('Test 2: unknown page falls back to default', () => {
    it('should fall back to default page when query param is missing', async () => {
      const { createRouter } = await import('../../../../../../express/code/scripts/color-shared/shell/router.js');
      router = createRouter({
        queryParam: 'tool',
        defaultPage: 'wheel',
        pageRegistry: mockPageRegistry,
        getSearchString: () => '',
      });

      const pageId = router.getCurrentPage();
      expect(pageId).to.equal('wheel');
    });

    it('should fall back to default page when page ID is not in registry', async () => {
      
      const { createRouter } = await import('../../../../../../express/code/scripts/color-shared/shell/router.js');
      router = createRouter({
        queryParam: 'tool',
        defaultPage: 'wheel',
        pageRegistry: mockPageRegistry,
        getSearchString: () => '?tool=unknown-page',
      });

      const pageId = router.getCurrentPage();
      expect(pageId).to.equal('wheel');
    });

    it('should log warning when unknown page is requested', async () => {
      const consoleWarnStub = sinon.stub(console, 'warn');
      
      const { createRouter } = await import('../../../../../../express/code/scripts/color-shared/shell/router.js');
      router = createRouter({
        queryParam: 'tool',
        defaultPage: 'wheel',
        pageRegistry: mockPageRegistry,
        getSearchString: () => '?tool=invalid',
      });

      router.getCurrentPage();
      
      expect(consoleWarnStub.called).to.be.true;
      expect(consoleWarnStub.firstCall.args[0]).to.include('[Router] Unknown page ID');
      
      consoleWarnStub.restore();
    });
  });

  describe('Test 3: navigate() updates the URL', () => {
    it('should update URL with history.pushState when navigating', async () => {
      
      const { createRouter } = await import('../../../../../../express/code/scripts/color-shared/shell/router.js');
      router = createRouter({
        queryParam: 'tool',
        defaultPage: 'wheel',
        pageRegistry: mockPageRegistry,
        layoutInstance: mockLayoutInstance,
        getSearchString: () => '?tool=wheel',
      });

      await router.navigate('contrast');

      expect(pushStateStub.calledOnce).to.be.true;
      expect(pushStateStub.firstCall.args[0]).to.deep.equal({ pageId: 'contrast' });
      expect(pushStateStub.firstCall.args[1]).to.equal('');
      expect(pushStateStub.firstCall.args[2]).to.equal('?tool=contrast');
    });

    it('should preserve other query parameters when navigating', async () => {
      
      const { createRouter } = await import('../../../../../../express/code/scripts/color-shared/shell/router.js');
      router = createRouter({
        queryParam: 'tool',
        defaultPage: 'wheel',
        pageRegistry: mockPageRegistry,
        layoutInstance: mockLayoutInstance,
        getSearchString: () => '?tool=wheel&foo=bar&baz=qux',
      });

      await router.navigate('contrast');

      expect(pushStateStub.calledOnce).to.be.true;
      const calledUrl = pushStateStub.firstCall.args[2];
      expect(calledUrl).to.include('tool=contrast');
      expect(calledUrl).to.include('foo=bar');
      expect(calledUrl).to.include('baz=qux');
    });

    it('should not update URL when navigating to current page', async () => {
      
      const { createRouter } = await import('../../../../../../express/code/scripts/color-shared/shell/router.js');
      router = createRouter({
        queryParam: 'tool',
        defaultPage: 'wheel',
        pageRegistry: mockPageRegistry,
        layoutInstance: mockLayoutInstance,
        getSearchString: () => '?tool=wheel',
      });

      await router.navigate('wheel');

      expect(pushStateStub.called).to.be.false;
    });
  });

  describe('Test 4: activation validates requiredSlots before mount', () => {
    it('should successfully activate page when all required slots exist', async () => {
      
      const { createRouter } = await import('../../../../../../express/code/scripts/color-shared/shell/router.js');
      router = createRouter({
        queryParam: 'tool',
        defaultPage: 'wheel',
        pageRegistry: mockPageRegistry,
        layoutInstance: mockLayoutInstance,
        getSearchString: () => '?tool=wheel',
      });

      await router.navigate('wheel');

      expect(mockPageRegistry.wheel.mount.calledOnce).to.be.true;
    });

    it('should throw error when required slot is missing', async () => {
      // Create layout instance with only 'content' slot
      const limitedLayoutInstance = {
        ...mockLayoutInstance,
        hasSlot: sinon.stub().callsFake((name) => name === 'content'),
        getSlotNames: sinon.stub().returns(['content']),
      };
      
      const { createRouter } = await import('../../../../../../express/code/scripts/color-shared/shell/router.js');
      router = createRouter({
        queryParam: 'tool',
        defaultPage: 'wheel',
        pageRegistry: mockPageRegistry,
        layoutInstance: limitedLayoutInstance,
        getSearchString: () => '?tool=contrast',
      });

      try {
        await router.navigate('contrast');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.match(/required slot.*sidebar.*not available/i);
      }
    });

    it('should pass slot elements to page mount method', async () => {
      
      const { createRouter } = await import('../../../../../../express/code/scripts/color-shared/shell/router.js');
      router = createRouter({
        queryParam: 'tool',
        defaultPage: 'wheel',
        pageRegistry: mockPageRegistry,
        layoutInstance: mockLayoutInstance,
        getSearchString: () => '?tool=wheel',
      });

      await router.navigate('wheel');

      expect(mockPageRegistry.wheel.mount.calledOnce).to.be.true;
      const slots = mockPageRegistry.wheel.mount.firstCall.args[0];
      expect(slots.content).to.be.instanceOf(HTMLElement);
    });

    it('should clear slots before mounting new page', async () => {
      
      const { createRouter } = await import('../../../../../../express/code/scripts/color-shared/shell/router.js');
      router = createRouter({
        queryParam: 'tool',
        defaultPage: 'wheel',
        pageRegistry: mockPageRegistry,
        layoutInstance: mockLayoutInstance,
        getSearchString: () => '?tool=wheel',
      });

      await router.navigate('wheel');

      expect(mockLayoutInstance.clearSlot.calledWith('content')).to.be.true;
    });

    it('should destroy previous page before activating new one', async () => {
      
      const { createRouter } = await import('../../../../../../express/code/scripts/color-shared/shell/router.js');
      router = createRouter({
        queryParam: 'tool',
        defaultPage: 'wheel',
        pageRegistry: mockPageRegistry,
        layoutInstance: mockLayoutInstance,
        getSearchString: () => '?tool=wheel',
      });

      await router.navigate('wheel');
      await router.navigate('contrast');

      expect(mockPageRegistry.wheel.destroy.calledOnce).to.be.true;
      expect(mockPageRegistry.contrast.mount.calledOnce).to.be.true;
    });
  });

  describe('Test 5: page shared overrides flow into registry', () => {
    it('should merge page-specific options with page config', async () => {
      
      const { createRouter } = await import('../../../../../../express/code/scripts/color-shared/shell/router.js');
      router = createRouter({
        queryParam: 'tool',
        defaultPage: 'wheel',
        pageRegistry: mockPageRegistry,
        layoutInstance: mockLayoutInstance,
        sharedOverrides: {
          wheel: {
            customOption: 'value',
            theme: 'dark',
          },
        },
        getSearchString: () => '?tool=wheel',
      });

      await router.navigate('wheel');

      const mountCallOptions = mockPageRegistry.wheel.mount.firstCall.args[1];
      expect(mountCallOptions.customOption).to.equal('value');
      expect(mountCallOptions.theme).to.equal('dark');
    });

    it('should handle empty shared overrides', async () => {
      
      const { createRouter } = await import('../../../../../../express/code/scripts/color-shared/shell/router.js');
      router = createRouter({
        queryParam: 'tool',
        defaultPage: 'wheel',
        pageRegistry: mockPageRegistry,
        layoutInstance: mockLayoutInstance,
        sharedOverrides: {},
        getSearchString: () => '?tool=wheel',
      });

      await router.navigate('wheel');

      expect(mockPageRegistry.wheel.mount.calledOnce).to.be.true;
    });

    it('should handle missing shared overrides for a page', async () => {
      
      const { createRouter } = await import('../../../../../../express/code/scripts/color-shared/shell/router.js');
      router = createRouter({
        queryParam: 'tool',
        defaultPage: 'wheel',
        pageRegistry: mockPageRegistry,
        layoutInstance: mockLayoutInstance,
        sharedOverrides: {
          contrast: { theme: 'light' },
        },
        getSearchString: () => '?tool=wheel',
      });

      await router.navigate('wheel');

      expect(mockPageRegistry.wheel.mount.calledOnce).to.be.true;
    });
  });

  describe('Edge cases and error handling', () => {
    it('should throw error when pageRegistry is not provided', async () => {
      const { createRouter } = await import('../../../../../../express/code/scripts/color-shared/shell/router.js');
      
      expect(() => createRouter({
        queryParam: 'tool',
        defaultPage: 'wheel',
      })).to.throw(/pageRegistry is required/i);
    });

    it('should throw error when defaultPage is not in registry', async () => {
      const { createRouter } = await import('../../../../../../express/code/scripts/color-shared/shell/router.js');
      
      expect(() => createRouter({
        queryParam: 'tool',
        defaultPage: 'nonexistent',
        pageRegistry: mockPageRegistry,
      })).to.throw(/default page.*not found in registry/i);
    });

    it('should handle navigation to invalid page ID', async () => {
      
      const { createRouter } = await import('../../../../../../express/code/scripts/color-shared/shell/router.js');
      router = createRouter({
        queryParam: 'tool',
        defaultPage: 'wheel',
        pageRegistry: mockPageRegistry,
        layoutInstance: mockLayoutInstance,
        getSearchString: () => '?tool=wheel',
      });

      try {
        await router.navigate('invalid');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.match(/page.*invalid.*not found/i);
      }
    });
  });
});
