/* eslint-disable max-len, no-promise-executor-return */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { initFloatingToolbar } from '../../../../express/code/scripts/color-shared/toolbar/createFloatingToolbar.js';
import { MOCK_PALETTE } from './mocks/palette.js';

const noopDeps = {
  initServices: sinon.stub().resolves(),
  loadStyles: sinon.stub().resolves(),
};

function callInit(container, overrides = {}) {
  return initFloatingToolbar(container, { deps: noopDeps, ...overrides });
}

describe('initFloatingToolbar', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    sinon.restore();
    document.body.innerHTML = '';
  });

  it('returns null when no palette provided (default is null)', async () => {
    const result = await callInit(container, {});
    expect(result).to.be.null;
  });

  it('returns null when palette is explicitly null', async () => {
    const result = await callInit(container, { palette: null });
    expect(result).to.be.null;
  });

  it('returns { toolbar, palette, getLibraryContext, destroy } with valid palette', async () => {
    const result = await callInit(container, { palette: MOCK_PALETTE });
    expect(result).to.not.be.null;
    expect(result.toolbar).to.exist;
    expect(result.palette).to.exist;
    expect(result.getLibraryContext).to.be.a('function');
    expect(result.destroy).to.be.a('function');
  });

  it('mounts .color-floating-toolbar-container wrapper into container', async () => {
    await callInit(container, { palette: MOCK_PALETTE });
    expect(container.querySelector('.color-floating-toolbar-container')).to.exist;
  });

  it('wrapper contains sp-theme with .ax-toolbar inside', async () => {
    await callInit(container, { palette: MOCK_PALETTE });
    const wrapper = container.querySelector('.color-floating-toolbar-container');
    expect(wrapper.querySelector('sp-theme .ax-toolbar')).to.exist;
  });

  it('returned palette matches provided palette object (deep equal)', async () => {
    const result = await callInit(container, { palette: MOCK_PALETTE });
    expect(result.palette).to.deep.equal(MOCK_PALETTE);
  });

  it('getLibraryContext is a function', async () => {
    const result = await callInit(container, { palette: MOCK_PALETTE });
    expect(result.getLibraryContext).to.be.a('function');
  });

  it('destroy() removes toolbar element from DOM', async () => {
    const result = await callInit(container, { palette: MOCK_PALETTE });
    expect(container.querySelector('sp-theme')).to.exist;
    result.destroy();
    expect(container.querySelector('sp-theme')).to.not.exist;
  });

  it('variant: sticky adds .ax-toolbar-sticky-host to container', async () => {
    await callInit(container, { palette: MOCK_PALETTE, variant: 'sticky' });
    expect(container.classList.contains('ax-toolbar-sticky-host')).to.be.true;
  });

  it('variant: sticky adds .ax-toolbar-sticky-wrapper to wrapper', async () => {
    await callInit(container, { palette: MOCK_PALETTE, variant: 'sticky' });
    const wrapper = container.querySelector('.color-floating-toolbar-container');
    expect(wrapper.classList.contains('ax-toolbar-sticky-wrapper')).to.be.true;
  });
});
