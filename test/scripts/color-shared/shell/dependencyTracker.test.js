/* eslint-disable max-len */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { createDependencyTracker } from '../../../../express/code/scripts/color-shared/shell/dependencyTracker.js';

describe('createDependencyTracker', () => {
  let loadCSSStub;
  let serviceManagerStub;

  beforeEach(() => {
    loadCSSStub = sinon.stub().resolves();

    serviceManagerStub = {
      init: sinon.stub().resolves(),
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  it('loads CSS via loadCSS', async () => {
    const tracker = createDependencyTracker({
      loadCSS: loadCSSStub,
      serviceManager: serviceManagerStub,
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
    });

    await tracker.preload({
      css: ['https://example.com/style.css'],
    });

    await tracker.preload({
      css: ['https://example.com/style.css'],
    });

    expect(loadCSSStub.callCount).to.equal(2);
    expect(loadCSSStub.firstCall.args[0]).to.equal('https://example.com/style.css');
    expect(loadCSSStub.secondCall.args[0]).to.equal('https://example.com/style.css');
  });

  it('deduplicates service loads and shares in-flight promises', async () => {
    const tracker = createDependencyTracker({
      loadCSS: loadCSSStub,
      serviceManager: serviceManagerStub,
    });

    const promise1 = tracker.preload({
      services: ['analytics'],
    });

    const promise2 = tracker.preload({
      services: ['analytics'],
    });

    await Promise.all([promise1, promise2]);

    expect(serviceManagerStub.init.calledOnce).to.be.true;
    expect(serviceManagerStub.init.firstCall.args[0]).to.deep.equal({
      plugins: ['analytics'],
    });
  });

  it('empty preload config resolves immediately', async () => {
    const tracker = createDependencyTracker({
      loadCSS: loadCSSStub,
      serviceManager: serviceManagerStub,
    });

    await tracker.preload({});

    expect(loadCSSStub.called).to.be.false;
    expect(serviceManagerStub.init.called).to.be.false;
  });

  it('failure does not poison future attempts', async () => {
    const failingLoadCSS = sinon.stub();
    failingLoadCSS.onFirstCall().rejects(new Error('Network error'));
    failingLoadCSS.onSecondCall().resolves();

    const tracker = createDependencyTracker({
      loadCSS: failingLoadCSS,
      serviceManager: serviceManagerStub,
    });

    try {
      await tracker.preload({
        css: ['https://example.com/style.css'],
      });
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err.message).to.equal('Network error');
    }

    await tracker.preload({
      css: ['https://example.com/style.css'],
    });

    expect(failingLoadCSS.callCount).to.equal(2);
  });

  it('loads multiple CSS files', async () => {
    const tracker = createDependencyTracker({
      loadCSS: loadCSSStub,
      serviceManager: serviceManagerStub,
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
    });

    await tracker.preload({
      services: ['analytics', 'logging'],
    });

    expect(serviceManagerStub.init.calledOnce).to.be.true;
    expect(serviceManagerStub.init.firstCall.args[0]).to.deep.equal({
      plugins: ['analytics', 'logging'],
    });
  });

  it('loads CSS and services together', async () => {
    const tracker = createDependencyTracker({
      loadCSS: loadCSSStub,
      serviceManager: serviceManagerStub,
    });

    await tracker.preload({
      css: ['https://example.com/style.css'],
      services: ['analytics'],
    });

    expect(loadCSSStub.calledOnce).to.be.true;
    expect(serviceManagerStub.init.calledOnce).to.be.true;
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
    });

    await tracker.preload();

    expect(loadCSSStub.called).to.be.false;
    expect(serviceManagerStub.init.called).to.be.false;
  });
});
