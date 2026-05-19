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

  it('variant: sticky with reserveSpace false does not add .ax-toolbar-sticky-host to container', async () => {
    await callInit(container, {
      palette: MOCK_PALETTE,
      variant: 'sticky',
      reserveSpace: false,
    });
    expect(container.classList.contains('ax-toolbar-sticky-host')).to.be.false;
  });

  it('mount() moves the existing wrapper into a new container', async () => {
    const result = await callInit(container, { palette: MOCK_PALETTE });
    const nextContainer = document.createElement('div');
    document.body.appendChild(nextContainer);
    const wrapper = container.querySelector('.color-floating-toolbar-container');

    result.mount(nextContainer);

    expect(container.querySelector('.color-floating-toolbar-container')).to.not.exist;
    expect(nextContainer.querySelector('.color-floating-toolbar-container')).to.equal(wrapper);
  });

  it('setVariant() toggles sticky classes on the existing toolbar instance', async () => {
    const result = await callInit(container, { palette: MOCK_PALETTE });
    const wrapper = container.querySelector('.color-floating-toolbar-container');

    result.setVariant('sticky', {
      reserveContainer: container,
      reserveSpace: true,
    });
    expect(wrapper.classList.contains('ax-toolbar-sticky-wrapper')).to.be.true;
    expect(container.classList.contains('ax-toolbar-sticky-host')).to.be.true;
    expect(wrapper.querySelector('.ax-toolbar')?.classList.contains('ax-toolbar-sticky')).to.be.true;

    result.setVariant('standalone');
    expect(wrapper.classList.contains('ax-toolbar-sticky-wrapper')).to.be.false;
    expect(container.classList.contains('ax-toolbar-sticky-host')).to.be.false;
    expect(wrapper.querySelector('.ax-toolbar')?.classList.contains('ax-toolbar-sticky')).to.be.false;
  });

  describe('variant: sticky-on-scroll', () => {
    let OriginalIntersectionObserver;
    let observers;

    beforeEach(() => {
      OriginalIntersectionObserver = window.IntersectionObserver;
      observers = [];
      window.IntersectionObserver = function MockIO(cb, opts) {
        const instance = {
          observe: sinon.stub(),
          disconnect: sinon.stub(),
          opts,
          trigger(entry) { cb([entry]); },
        };
        observers.push(instance);
        return instance;
      };
    });

    afterEach(() => {
      window.IntersectionObserver = OriginalIntersectionObserver;
    });

    it('creates IntersectionObserver on the container', async () => {
      await callInit(container, { palette: MOCK_PALETTE, variant: 'sticky-on-scroll' });
      const io = observers.find((o) => o.opts?.threshold === 0);
      expect(io).to.exist;
      expect(io.observe.calledOnce).to.be.true;
    });

    it('starts in standalone mode (no sticky classes)', async () => {
      await callInit(container, { palette: MOCK_PALETTE, variant: 'sticky-on-scroll' });
      const wrapper = container.querySelector('.color-floating-toolbar-container');
      expect(wrapper.classList.contains('ax-toolbar-sticky-wrapper')).to.be.false;
      expect(wrapper.querySelector('.ax-toolbar')?.classList.contains('ax-toolbar-sticky')).to.be.false;
    });

    it('activates sticky when sentinel scrolls above viewport', async () => {
      await callInit(container, { palette: MOCK_PALETTE, variant: 'sticky-on-scroll' });
      const wrapper = container.querySelector('.color-floating-toolbar-container');
      const io = observers.find((o) => o.opts?.threshold === 0);

      io.trigger({ isIntersecting: false, boundingClientRect: { top: -1 } });
      expect(wrapper.classList.contains('ax-toolbar-sticky-wrapper')).to.be.true;
      expect(wrapper.querySelector('.ax-toolbar')?.classList.contains('ax-toolbar-sticky')).to.be.true;
    });

    it('deactivates sticky when sentinel returns to viewport', async () => {
      await callInit(container, { palette: MOCK_PALETTE, variant: 'sticky-on-scroll' });
      const wrapper = container.querySelector('.color-floating-toolbar-container');
      const io = observers.find((o) => o.opts?.threshold === 0);

      io.trigger({ isIntersecting: false, boundingClientRect: { top: -1 } });
      io.trigger({ isIntersecting: true, boundingClientRect: { top: 10 } });
      expect(wrapper.classList.contains('ax-toolbar-sticky-wrapper')).to.be.false;
      expect(wrapper.querySelector('.ax-toolbar')?.classList.contains('ax-toolbar-sticky')).to.be.false;
    });

    it('disconnects observer on destroy', async () => {
      const result = await callInit(container, { palette: MOCK_PALETTE, variant: 'sticky-on-scroll' });
      const io = observers.find((o) => o.opts?.threshold === 0);

      result.destroy();
      expect(io.disconnect.calledOnce).to.be.true;
    });

    it('setVariant to sticky-on-scroll after standalone creates observer', async () => {
      const result = await callInit(container, { palette: MOCK_PALETTE, variant: 'standalone' });
      result.setVariant('sticky-on-scroll', { reserveContainer: container });

      const io = observers.find((o) => o.opts?.threshold === 0);
      expect(io).to.exist;
    });
  });

  describe('footer visibility observer', () => {
    let OriginalIntersectionObserver;
    let observers;
    let footer;

    beforeEach(() => {
      footer = document.createElement('footer');
      document.body.appendChild(footer);

      OriginalIntersectionObserver = window.IntersectionObserver;
      observers = [];
      window.IntersectionObserver = function MockIO(cb, opts) {
        const instance = {
          observe: sinon.stub(),
          disconnect: sinon.stub(),
          opts,
          trigger(entry) { cb([entry]); },
        };
        observers.push(instance);
        return instance;
      };
    });

    afterEach(() => {
      window.IntersectionObserver = OriginalIntersectionObserver;
    });

    it('creates a footer IntersectionObserver with rootMargin "32px"', async () => {
      await callInit(container, { palette: MOCK_PALETTE });
      const footerIo = observers.find((o) => o.opts?.rootMargin === '32px');
      expect(footerIo).to.exist;
      expect(footerIo.observe.calledOnce).to.be.true;
    });

    it('adds aria-hidden and inert and ax-toolbar-footer-hidden when footer enters view', async () => {
      await callInit(container, { palette: MOCK_PALETTE });
      const wrapper = container.querySelector('.color-floating-toolbar-container');
      const footerIo = observers.find((o) => o.opts?.rootMargin === '32px');

      footerIo.trigger({ isIntersecting: true, intersectionRatio: 1 });

      expect(wrapper.classList.contains('ax-toolbar-footer-hidden')).to.be.true;
      expect(wrapper.getAttribute('aria-hidden')).to.equal('true');
      expect(wrapper.hasAttribute('inert')).to.be.true;
    });

    it('removes aria-hidden and inert and ax-toolbar-footer-hidden when footer leaves view', async () => {
      await callInit(container, { palette: MOCK_PALETTE });
      const wrapper = container.querySelector('.color-floating-toolbar-container');
      const footerIo = observers.find((o) => o.opts?.rootMargin === '32px');

      footerIo.trigger({ isIntersecting: true, intersectionRatio: 1 });
      footerIo.trigger({ isIntersecting: false, intersectionRatio: 0 });

      expect(wrapper.classList.contains('ax-toolbar-footer-hidden')).to.be.false;
      expect(wrapper.hasAttribute('aria-hidden')).to.be.false;
      expect(wrapper.hasAttribute('inert')).to.be.false;
    });

    it('destroy() disconnects the footer observer', async () => {
      const result = await callInit(container, { palette: MOCK_PALETTE });
      const footerIo = observers.find((o) => o.opts?.rootMargin === '32px');

      result.destroy();
      expect(footerIo.disconnect.calledOnce).to.be.true;
    });
  });
});
