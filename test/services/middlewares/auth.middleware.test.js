/* global globalThis */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../express/code/scripts/utils.js';
import authMiddleware, {
  isExpiringSoon,
  setImsLoader,
  resetImsState,
  ensureIms,
  IMS_READY_EVENT,
} from '../../../express/code/libs/services/middlewares/auth.middleware.js';
import { AuthenticationError } from '../../../express/code/libs/services/core/Errors.js';

describe('authMiddleware', () => {
  afterEach(() => {
    sinon.restore();
    resetImsState();
    delete globalThis.adobeIMS;
  });

  it('resolves immediately when IMS is already on window', async () => {
    globalThis.adobeIMS = {
      isSignedInUser: sinon.stub().returns(true),
      getAccessToken: sinon.stub().returns({ token: 'abc', expire: Date.now() + 30 * 60_000 }),
    };
    const next = sinon.stub().resolves('handler-result');

    const result = await authMiddleware('topic.test', ['arg'], next, { serviceName: 'Stock' });

    expect(next.calledOnce).to.be.true;
    expect(result).to.equal('handler-result');
  });

  it('waits for loader to set adobeIMS when IMS is not yet on window', async () => {
    delete globalThis.adobeIMS;

    const imsStub = {
      isSignedInUser: sinon.stub().returns(true),
      getAccessToken: sinon.stub().returns({ token: 'abc', expire: Date.now() + 30 * 60_000 }),
    };

    setImsLoader(() => {
      globalThis.adobeIMS = imsStub;
      return Promise.resolve();
    });

    const next = sinon.stub().resolves('ok');
    const result = await authMiddleware('topic.test', [], next, { serviceName: 'CCLibrary' });

    expect(next.calledOnce).to.be.true;
    expect(result).to.equal('ok');
  });

  it('throws IMS_TIMEOUT when IMS never becomes ready', async () => {
    delete globalThis.adobeIMS;
    setImsLoader(() => Promise.resolve());

    try {
      await ensureIms(50);
      expect.fail('Expected AuthenticationError');
    } catch (error) {
      expect(error).to.be.instanceOf(AuthenticationError);
      expect(error.code).to.equal('IMS_TIMEOUT');
    }
  });

  it('throws IMS_LOAD_FAILED when the loader rejects', async () => {
    delete globalThis.adobeIMS;
    setImsLoader(() => Promise.reject(new Error('network error')));

    try {
      await ensureIms(5000);
      expect.fail('Expected AuthenticationError');
    } catch (error) {
      expect(error).to.be.instanceOf(AuthenticationError);
      expect(error.code).to.equal('IMS_LOAD_FAILED');
      expect(error.originalError.message).to.equal('network error');
    }
  });

  it('throws AuthenticationError when user is not signed in', async () => {
    globalThis.adobeIMS = {
      isSignedInUser: sinon.stub().returns(false),
    };

    try {
      await authMiddleware('topic.test', [], sinon.stub().resolves('ok'), { serviceName: 'Stock' });
      expect.fail('Expected AuthenticationError');
    } catch (error) {
      expect(error).to.be.instanceOf(AuthenticationError);
      expect(error.message).to.equal('User is not logged in, start login process');
      expect(error.serviceName).to.equal('Stock');
      expect(error.topic).to.equal('topic.test');
    }
  });

  it('buildContext returns service and topic metadata', () => {
    const context = authMiddleware.buildContext({ serviceName: 'Kuler', topic: 'kuler.search' });
    expect(context).to.deep.equal({ serviceName: 'Kuler', topic: 'kuler.search' });
  });

  describe('proactive token refresh', () => {
    it('attempts token refresh when token is expiring soon', async () => {
      const refreshToken = sinon.stub().resolves();
      globalThis.adobeIMS = {
        isSignedInUser: sinon.stub().returns(true),
        getAccessToken: sinon.stub().returns({
          token: 'abc',
          expire: Date.now() + 60_000,
        }),
        refreshToken,
      };
      const next = sinon.stub().resolves('ok');

      const result = await authMiddleware('topic.test', [], next, { serviceName: 'CCLibrary' });

      expect(refreshToken.calledOnce).to.be.true;
      expect(next.calledOnce).to.be.true;
      expect(result).to.equal('ok');
    });

    it('skips token refresh when token has ample time remaining', async () => {
      const refreshToken = sinon.stub().resolves();
      globalThis.adobeIMS = {
        isSignedInUser: sinon.stub().returns(true),
        getAccessToken: sinon.stub().returns({
          token: 'abc',
          expire: Date.now() + 30 * 60_000,
        }),
        refreshToken,
      };
      const next = sinon.stub().resolves('ok');

      await authMiddleware('topic.test', [], next, { serviceName: 'CCLibrary' });

      expect(refreshToken.called).to.be.false;
      expect(next.calledOnce).to.be.true;
    });

    it('still calls next when token refresh fails', async () => {
      globalThis.adobeIMS = {
        isSignedInUser: sinon.stub().returns(true),
        getAccessToken: sinon.stub().returns({
          token: 'abc',
          expire: Date.now() + 60_000,
        }),
        refreshToken: sinon.stub().rejects(new Error('refresh failed')),
      };
      const next = sinon.stub().resolves('ok');

      const result = await authMiddleware('topic.test', [], next, { serviceName: 'CCLibrary' });

      expect(next.calledOnce).to.be.true;
      expect(result).to.equal('ok');
    });

    it('skips refresh when getAccessToken returns no expire field', async () => {
      const refreshToken = sinon.stub().resolves();
      globalThis.adobeIMS = {
        isSignedInUser: sinon.stub().returns(true),
        getAccessToken: sinon.stub().returns({ token: 'abc' }),
        refreshToken,
      };
      const next = sinon.stub().resolves('ok');

      await authMiddleware('topic.test', [], next, { serviceName: 'CCLibrary' });

      expect(refreshToken.called).to.be.false;
      expect(next.calledOnce).to.be.true;
    });
  });

  describe('SUSI modal login redirection', () => {
    let metaTag;

    beforeEach(() => {
      setLibs('/test/services/mocks', { hostname: 'prod.example.com', search: '' });
    });

    afterEach(() => {
      if (metaTag) {
        metaTag.remove();
        metaTag = null;
      }
      delete globalThis.mockGetModalCalls;
    });

    it('opens SUSI modal before throwing when susi-target metadata is present', async () => {
      globalThis.adobeIMS = {
        isSignedInUser: sinon.stub().returns(false),
      };

      metaTag = document.createElement('meta');
      metaTag.setAttribute('name', 'susi-target');
      metaTag.setAttribute('content', '/express/fragments/susi-light#susi-light');
      document.head.appendChild(metaTag);

      try {
        await authMiddleware('topic.test', [], sinon.stub(), { serviceName: 'Stock' });
        expect.fail('Expected AuthenticationError');
      } catch (error) {
        expect(error).to.be.instanceOf(AuthenticationError);
        expect(error.message).to.equal('User is not logged in, start login process');
      }

      expect(globalThis.mockGetModalCalls).to.have.lengthOf(1);
      expect(globalThis.mockGetModalCalls[0]).to.deep.equal({
        id: 'susi-light',
        path: '/express/fragments/susi-light',
      });
    });

    it('passes correct path and id from susi-target metadata', async () => {
      globalThis.adobeIMS = {
        isSignedInUser: sinon.stub().returns(false),
      };

      metaTag = document.createElement('meta');
      metaTag.setAttribute('name', 'susi-target');
      metaTag.setAttribute('content', '/express/fragments/custom-login#my-login-form');
      document.head.appendChild(metaTag);

      try {
        await authMiddleware('topic.test', [], sinon.stub(), { serviceName: 'Kuler' });
        expect.fail('Expected AuthenticationError');
      } catch (error) {
        expect(error).to.be.instanceOf(AuthenticationError);
      }

      expect(globalThis.mockGetModalCalls[0]).to.deep.equal({
        id: 'my-login-form',
        path: '/express/fragments/custom-login',
      });
    });

    it('skips modal and throws directly when susi-target metadata is absent', async () => {
      globalThis.adobeIMS = {
        isSignedInUser: sinon.stub().returns(false),
      };

      try {
        await authMiddleware('topic.test', [], sinon.stub(), { serviceName: 'Stock' });
        expect.fail('Expected AuthenticationError');
      } catch (error) {
        expect(error).to.be.instanceOf(AuthenticationError);
        expect(error.message).to.equal('User is not logged in, start login process');
      }

      expect(globalThis.mockGetModalCalls).to.be.undefined;
    });
  });
});

describe('ensureIms', () => {
  afterEach(() => {
    sinon.restore();
    resetImsState();
    delete globalThis.adobeIMS;
  });

  it('returns window.adobeIMS immediately when already present', async () => {
    const imsStub = { isSignedInUser: () => true };
    globalThis.adobeIMS = imsStub;

    const result = await ensureIms();
    expect(result).to.equal(imsStub);
  });

  it('caches the promise so IMS is only loaded once', async () => {
    const imsStub = {
      isSignedInUser: sinon.stub().returns(true),
      getAccessToken: sinon.stub().returns({ token: 'abc', expire: Date.now() + 30 * 60_000 }),
    };
    const loader = sinon.stub().callsFake(() => {
      globalThis.adobeIMS = imsStub;
      return Promise.resolve();
    });
    setImsLoader(loader);

    const [result1, result2] = await Promise.all([ensureIms(), ensureIms()]);

    expect(result1).to.equal(result2);
    expect(loader.calledOnce).to.be.true;
  });

  it('resolves via loader .then() when loader sets adobeIMS', async () => {
    delete globalThis.adobeIMS;

    const imsStub = { isSignedInUser: () => true };
    setImsLoader(() => {
      globalThis.adobeIMS = imsStub;
      return Promise.resolve();
    });

    const result = await ensureIms();
    expect(result).to.equal(imsStub);
  });

  it('resets cached promise after timeout so retry can succeed', async () => {
    delete globalThis.adobeIMS;
    setImsLoader(() => Promise.resolve());

    try {
      await ensureIms(50);
      expect.fail('Expected AuthenticationError');
    } catch (error) {
      expect(error.code).to.equal('IMS_TIMEOUT');
    }

    // After timeout, ensureIms should start fresh and succeed with a new loader
    const imsStub = { isSignedInUser: () => true };
    setImsLoader(() => {
      globalThis.adobeIMS = imsStub;
      return Promise.resolve();
    });

    const result = await ensureIms();
    expect(result).to.equal(imsStub);
  });

  it('resets cached promise after load failure so retry can succeed', async () => {
    delete globalThis.adobeIMS;
    setImsLoader(() => Promise.reject(new Error('network error')));

    try {
      await ensureIms(5000);
      expect.fail('Expected AuthenticationError');
    } catch (error) {
      expect(error.code).to.equal('IMS_LOAD_FAILED');
    }

    // After failure, ensureIms should start fresh
    const imsStub = { isSignedInUser: () => true };
    setImsLoader(() => {
      globalThis.adobeIMS = imsStub;
      return Promise.resolve();
    });

    const result = await ensureIms();
    expect(result).to.equal(imsStub);
  });
});

describe('resetImsState', () => {
  afterEach(() => {
    resetImsState();
    delete globalThis.adobeIMS;
  });

  it('clears cached promise so ensureIms starts fresh', async () => {
    const imsStub = { isSignedInUser: () => true };
    globalThis.adobeIMS = imsStub;

    const first = await ensureIms();
    expect(first).to.equal(imsStub);

    resetImsState();
    delete globalThis.adobeIMS;

    const imsStub2 = { isSignedInUser: () => false };
    setImsLoader(() => {
      globalThis.adobeIMS = imsStub2;
      return Promise.resolve();
    });

    const second = await ensureIms();
    expect(second).to.equal(imsStub2);
  });
});

describe('IMS_READY_EVENT dispatch', () => {
  afterEach(() => {
    sinon.restore();
    resetImsState();
    delete globalThis.adobeIMS;
  });

  it('dispatches service:ims:ready when adobeIMS is already present', async () => {
    globalThis.adobeIMS = { isSignedInUser: () => true };
    const spy = sinon.spy();
    globalThis.addEventListener(IMS_READY_EVENT, spy, { once: true });

    await ensureIms();

    expect(spy.calledOnce).to.be.true;
  });

  it('dispatches service:ims:ready after loader sets adobeIMS', async () => {
    delete globalThis.adobeIMS;
    const imsStub = { isSignedInUser: () => true };
    setImsLoader(() => {
      globalThis.adobeIMS = imsStub;
      return Promise.resolve();
    });

    const spy = sinon.spy();
    globalThis.addEventListener(IMS_READY_EVENT, spy, { once: true });

    await ensureIms();

    expect(spy.calledOnce).to.be.true;
  });

  it('dispatches the event at most once across multiple ensureIms calls', async () => {
    globalThis.adobeIMS = { isSignedInUser: () => true };
    const spy = sinon.spy();
    globalThis.addEventListener(IMS_READY_EVENT, spy);

    await ensureIms();
    await ensureIms();
    await ensureIms();

    expect(spy.callCount).to.equal(1);

    globalThis.removeEventListener(IMS_READY_EVENT, spy);
  });

  it('can dispatch again after resetImsState', async () => {
    globalThis.adobeIMS = { isSignedInUser: () => true };
    const spy = sinon.spy();
    globalThis.addEventListener(IMS_READY_EVENT, spy);

    await ensureIms();
    expect(spy.callCount).to.equal(1);

    resetImsState();

    await ensureIms();
    expect(spy.callCount).to.equal(2);

    globalThis.removeEventListener(IMS_READY_EVENT, spy);
  });
});

describe('isExpiringSoon', () => {
  it('returns true when token expires within default buffer (5 min)', () => {
    expect(isExpiringSoon(Date.now() + 60_000)).to.be.true;
  });

  it('returns false when token has ample time remaining', () => {
    expect(isExpiringSoon(Date.now() + 10 * 60_000)).to.be.false;
  });

  it('returns true when token is already expired', () => {
    expect(isExpiringSoon(Date.now() - 60_000)).to.be.true;
  });

  it('returns false for null or undefined input', () => {
    expect(isExpiringSoon(null)).to.be.false;
    expect(isExpiringSoon(undefined)).to.be.false;
  });

  it('returns false for non-number input', () => {
    expect(isExpiringSoon('not-a-number')).to.be.false;
  });

  it('respects custom buffer parameter', () => {
    const expire = Date.now() + 2 * 60_000;
    expect(isExpiringSoon(expire, 60_000)).to.be.false;
    expect(isExpiringSoon(expire, 3 * 60_000)).to.be.true;
  });
});
