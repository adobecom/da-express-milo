/* global globalThis */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import authMiddleware, { isExpiringSoon } from '../../../express/code/libs/services/middlewares/auth.middleware.js';
import { AuthenticationError } from '../../../express/code/libs/services/core/Errors.js';

describe('authMiddleware', () => {
  afterEach(() => {
    sinon.restore();
    delete globalThis.adobeIMS;
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
      expect(error.message).to.equal('User is not logged in, requires login');
      expect(error.serviceName).to.equal('Stock');
      expect(error.topic).to.equal('topic.test');
    }
  });

  it('calls next and returns result when user is signed in', async () => {
    globalThis.adobeIMS = {
      isSignedInUser: sinon.stub().returns(true),
      getAccessToken: sinon.stub().returns({ token: 'abc', expire: Date.now() + 30 * 60_000 }),
    };
    const next = sinon.stub().resolves('handler-result');

    const result = await authMiddleware('topic.test', ['arg'], next, { serviceName: 'Stock' });

    expect(next.calledOnce).to.be.true;
    expect(result).to.equal('handler-result');
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
