import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../../express/code/scripts/utils.js';
import { createStripContainerRenderer } from '../../../../express/code/scripts/color-shared/renderers/createStripContainerRenderer.js';

setLibs('/test/mocks/libs', { hostname: 'prod.example.com', search: '' });

function waitForFrame() {
  return new Promise((resolve) => {
    requestAnimationFrame(resolve);
  });
}

async function waitForCondition(predicate, attempts = 30) {
  for (let index = 0; index < attempts; index += 1) {
    if (predicate()) return true;
    await waitForFrame();
  }

  return false;
}

describe('createStripContainerRenderer', () => {
  let renderer;
  let originalResizeObserver;

  beforeEach(() => {
    originalResizeObserver = window.ResizeObserver;
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
    document.body.innerHTML = '';
    if (originalResizeObserver) {
      window.ResizeObserver = originalResizeObserver;
    } else {
      delete window.ResizeObserver;
    }
  });

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

    const opened = await waitForCondition(() => {
      const editor = document.body.querySelector('.swatches-color-edit-popover color-edit');
      return editor?.open === true;
    }, 40);

    expect(opened).to.be.true;
    expect(document.body.querySelector('.swatches-color-edit-popover')).to.exist;

    renderer.destroy();

    expect(disconnectSpy.called).to.be.true;
    expect(document.body.querySelector('.swatches-color-edit-popover')).to.be.null;
  });
});
