import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../../../express/code/scripts/utils.js';
import createColorToolLayout from '../../../../../express/code/scripts/color-shared/shell/layouts/createColorToolLayout.js';
import { globalDependencyTracker } from '../../../../../express/code/scripts/color-shared/shell/dependencyTracker.js';

setLibs('/libs');

describe('createColorToolLayout non-blocking shell', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container?.remove();
    sinon.restore();
  });

  it('returns slots immediately before critical CSS resolves', async () => {
    let resolveCriticalCss;
    sinon.stub(globalDependencyTracker, 'preload').callsFake(() => new Promise((resolve) => {
      resolveCriticalCss = resolve;
    }));

    const layout = createColorToolLayout(container);

    expect(layout.slots.sidebar).to.exist;
    expect(container.querySelector('.ax-color-tool-layout')).to.exist;

    let cssResolved = false;
    layout.cssReady.then(() => { cssResolved = true; });

    await Promise.resolve();
    expect(cssResolved).to.be.false;

    resolveCriticalCss();
    await layout.cssReady;

    expect(cssResolved).to.be.true;
  });
});
