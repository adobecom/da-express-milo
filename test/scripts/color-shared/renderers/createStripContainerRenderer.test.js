import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../../express/code/scripts/utils.js';
import { createStripContainerRenderer } from '../../../../express/code/scripts/color-shared/renderers/createStripContainerRenderer.js';
import { waitFor } from '../../../helpers/waitfor.js';

setLibs('/test/mocks/libs', { hostname: 'prod.example.com', search: '' });

describe('createStripContainerRenderer', function stripContainerRendererSuite() {
  this.timeout(10000);

  let renderer;
  let originalResizeObserver;
  let errorHandler;
  let frameChannel;
  let frameCallbacks;

  beforeEach(() => {
    originalResizeObserver = window.ResizeObserver;
    // Suppress uncaught errors from Spectrum components registered by prior
    // test files whose disconnectedCallback calls ResizeObserver.unobserve
    // on an instance created outside this test's mock scope.
    errorHandler = (event) => {
      if (event?.message?.includes('unobserve')) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    window.addEventListener('error', errorHandler, true);
    frameChannel = new MessageChannel();
    frameCallbacks = [];
    frameChannel.port1.onmessage = () => frameCallbacks.shift()?.(performance.now());
    sinon.stub(window, 'requestAnimationFrame').callsFake((callback) => {
      frameCallbacks.push(callback);
      frameChannel.port2.postMessage(null);
      return frameCallbacks.length;
    });
    sinon.stub(window, 'matchMedia').callsFake((query) => ({
      matches: false,
      media: query,
      addEventListener() {},
      removeEventListener() {},
    }));
  });

  afterEach(() => {
    renderer?.destroy();
    renderer = null;
    sinon.restore();
    frameChannel.port1.close();
    frameChannel.port2.close();
    frameChannel = null;
    frameCallbacks = null;
    document.body.innerHTML = '';
    if (originalResizeObserver) {
      window.ResizeObserver = originalResizeObserver;
    } else {
      delete window.ResizeObserver;
    }
    window.removeEventListener('error', errorHandler, true);
  });

  // TODO: Fix test MWPW-192264
  it('opens the desktop color editor after render and cleans up its ResizeObserver', async () => {
    const disconnectSpy = sinon.spy();
    window.ResizeObserver = class {
      constructor(callback) {
        this.callback = callback;
        this.connected = false;
      }

      observe() {
        this.connected = true;
        this.callback([{ contentRect: { height: 240 } }]);
      }

      // eslint-disable-next-line class-methods-use-this
      unobserve() {}

      disconnect() {
        this.connected = false;
        disconnectSpy();
      }
    };

    const container = document.createElement('div');
    document.body.appendChild(container);

    renderer = createStripContainerRenderer({
      container,
      data: [{
        id: 'palette-1',
        name: 'Palette 1',
        colors: ['#112233', '#445566', '#778899'],
      }],
      config: {
        stripContainerOrientations: ['horizontal'],
      },
    });

    renderer.render(container);

    const rail = container.querySelector('color-swatch-rail');
    expect(rail).to.exist;

    rail.dispatchEvent(new CustomEvent('color-swatch-rail-edit', {
      detail: {
        index: 1,
        anchorRect: {
          left: 16,
          right: 56,
          top: 24,
          bottom: 48,
        },
      },
      bubbles: true,
      composed: true,
    }));

    await waitFor(() => {
      const editor = document.body.querySelector('.swatches-color-edit-popover color-edit');
      return editor?.open === true;
    });

    expect(document.body.querySelector('.swatches-color-edit-popover')).to.exist;

    renderer.destroy();

    expect(disconnectSpy.called).to.be.true;
    expect(document.body.querySelector('.swatches-color-edit-popover')).to.be.null;
  });
});
