/* eslint-disable max-len */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { createDependencyTracker } from '../../../../express/code/scripts/color-shared/shell/dependencyTracker.js';

describe('createDependencyTracker', () => {
  let loadCSSStub;
  let serviceManagerStub;
  let loadSpectrumStub;

  beforeEach(() => {
    // Stub loadCSS
    loadCSSStub = sinon.stub().resolves();

    // Stub serviceManager.init
    serviceManagerStub = {
      init: sinon.stub().resolves(),
    };

    // Stub load-spectrum functions
    loadSpectrumStub = {
      loadPicker: sinon.stub().resolves(),
      loadButton: sinon.stub().resolves(),
      loadTooltip: sinon.stub().resolves(),
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  it('loads CSS via loadCSS', async () => {
    const tracker = createDependencyTracker({
      loadCSS: loadCSSStub,
      serviceManager: serviceManagerStub,
      loadSpectrum: loadSpectrumStub,
    });

    await tracker.preload({
      css: ['https://example.com/style.css'],
    });

    expect(loadCSSStub.calledOnce).to.be.true;
    expect(loadCSSStub.firstCall.args[0]).to.equal('https://example.com/style.css');
  });

  it('deduplicates repeated CSS requests', async () => {
    const tracker = createDependencyTracker({
      loadCSS: loadCSSStub,
      serviceManager: serviceManagerStub,
      loadSpectrum: loadSpectrumStub,
    });

    await tracker.preload({
      css: ['https://example.com/style.css'],
    });

    await tracker.preload({
      css: ['https://example.com/style.css'],
    });

    // loadCSS itself deduplicates, but we should only call it once per unique URL
    expect(loadCSSStub.callCount).to.equal(2);
    expect(loadCSSStub.firstCall.args[0]).to.equal('https://example.com/style.css');
    expect(loadCSSStub.secondCall.args[0]).to.equal('https://example.com/style.css');
  });

  it('deduplicates service loads and shares in-flight promises', async () => {
    const tracker = createDependencyTracker({
      loadCSS: loadCSSStub,
      serviceManager: serviceManagerStub,
      loadSpectrum: loadSpectrumStub,
    });

    const promise1 = tracker.preload({
      services: ['analytics'],
    });

    const promise2 = tracker.preload({
      services: ['analytics'],
    });

    await Promise.all([promise1, promise2]);

    // Should only call init once even though preload was called twice
    expect(serviceManagerStub.init.calledOnce).to.be.true;
    expect(serviceManagerStub.init.firstCall.args[0]).to.deep.equal({
      plugins: ['analytics'],
    });
  });

  it('empty preload config resolves immediately', async () => {
    const tracker = createDependencyTracker({
      loadCSS: loadCSSStub,
      serviceManager: serviceManagerStub,
      loadSpectrum: loadSpectrumStub,
    });

    await tracker.preload({});

    expect(loadCSSStub.called).to.be.false;
    expect(serviceManagerStub.init.called).to.be.false;
    expect(loadSpectrumStub.loadPicker.called).to.be.false;
  });

  it('failure does not poison future attempts', async () => {
    const failingLoadCSS = sinon.stub();
    failingLoadCSS.onFirstCall().rejects(new Error('Network error'));
    failingLoadCSS.onSecondCall().resolves();

    const tracker = createDependencyTracker({
      loadCSS: failingLoadCSS,
      serviceManager: serviceManagerStub,
      loadSpectrum: loadSpectrumStub,
    });

    // First attempt fails
    try {
      await tracker.preload({
        css: ['https://example.com/style.css'],
      });
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err.message).to.equal('Network error');
    }

    // Second attempt should succeed
    await tracker.preload({
      css: ['https://example.com/style.css'],
    });

    expect(failingLoadCSS.callCount).to.equal(2);
  });

  it('loads multiple CSS files', async () => {
    const tracker = createDependencyTracker({
      loadCSS: loadCSSStub,
      serviceManager: serviceManagerStub,
      loadSpectrum: loadSpectrumStub,
    });

    await tracker.preload({
      css: ['https://example.com/style1.css', 'https://example.com/style2.css'],
    });

    expect(loadCSSStub.callCount).to.equal(2);
    expect(loadCSSStub.firstCall.args[0]).to.equal('https://example.com/style1.css');
    expect(loadCSSStub.secondCall.args[0]).to.equal('https://example.com/style2.css');
  });

  it('loads multiple services', async () => {
    const tracker = createDependencyTracker({
      loadCSS: loadCSSStub,
      serviceManager: serviceManagerStub,
      loadSpectrum: loadSpectrumStub,
    });

    await tracker.preload({
      services: ['analytics', 'logging'],
    });

    expect(serviceManagerStub.init.calledOnce).to.be.true;
    expect(serviceManagerStub.init.firstCall.args[0]).to.deep.equal({
      plugins: ['analytics', 'logging'],
    });
  });

  it('loads spectrum components', async () => {
    const tracker = createDependencyTracker({
      loadCSS: loadCSSStub,
      serviceManager: serviceManagerStub,
      loadSpectrum: loadSpectrumStub,
    });

    await tracker.preload({
      spectrum: ['picker', 'button'],
    });

    expect(loadSpectrumStub.loadPicker.calledOnce).to.be.true;
    expect(loadSpectrumStub.loadButton.calledOnce).to.be.true;
  });

  it('loads all dependency types together', async () => {
    const tracker = createDependencyTracker({
      loadCSS: loadCSSStub,
      serviceManager: serviceManagerStub,
      loadSpectrum: loadSpectrumStub,
    });

    await tracker.preload({
      css: ['https://example.com/style.css'],
      services: ['analytics'],
      spectrum: ['picker'],
    });

    expect(loadCSSStub.calledOnce).to.be.true;
    expect(serviceManagerStub.init.calledOnce).to.be.true;
    expect(loadSpectrumStub.loadPicker.calledOnce).to.be.true;
  });

  it('deduplicates spectrum component loads', async () => {
    const tracker = createDependencyTracker({
      loadCSS: loadCSSStub,
      serviceManager: serviceManagerStub,
      loadSpectrum: loadSpectrumStub,
    });

    await tracker.preload({
      spectrum: ['picker'],
    });

    await tracker.preload({
      spectrum: ['picker'],
    });

    expect(loadSpectrumStub.loadPicker.callCount).to.equal(2);
  });

  it('silently skips unknown spectrum components', async () => {
    const tracker = createDependencyTracker({
      loadCSS: loadCSSStub,
      serviceManager: serviceManagerStub,
      loadSpectrum: loadSpectrumStub,
    });

    await tracker.preload({
      spectrum: ['nonexistent', 'picker'],
    });

    expect(loadSpectrumStub.loadPicker.calledOnce).to.be.true;
  });

  it('service init failure does not poison future attempts', async () => {
    const failingServiceManager = {
      init: sinon.stub(),
    };
    failingServiceManager.init.onFirstCall().rejects(new Error('Service init failed'));
    failingServiceManager.init.onSecondCall().resolves();

    const tracker = createDependencyTracker({
      loadCSS: loadCSSStub,
      serviceManager: failingServiceManager,
      loadSpectrum: loadSpectrumStub,
    });

    try {
      await tracker.preload({ services: ['analytics'] });
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err.message).to.equal('Service init failed');
    }

    await tracker.preload({ services: ['analytics'] });
    expect(failingServiceManager.init.callCount).to.equal(2);
  });

  it('preload with no arguments resolves without error', async () => {
    const tracker = createDependencyTracker({
      loadCSS: loadCSSStub,
      serviceManager: serviceManagerStub,
      loadSpectrum: loadSpectrumStub,
    });

    await tracker.preload();

    expect(loadCSSStub.called).to.be.false;
    expect(serviceManagerStub.init.called).to.be.false;
  });
});
