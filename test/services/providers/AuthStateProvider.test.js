import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import AuthStateProvider from '../../../express/code/libs/services/providers/AuthStateProvider.js';
import { IMS_READY_EVENT } from '../../../express/code/libs/services/middlewares/auth.middleware.js';

/** Dispatch the service:ims:ready event to simulate middleware IMS initialization */
function dispatchImsReady() {
  globalThis.dispatchEvent(new CustomEvent(IMS_READY_EVENT));
}

describe('AuthStateProvider', () => {
  let provider;

  afterEach(() => {
    if (provider) provider.destroy();
    sinon.restore();
    delete globalThis.adobeIMS;
  });

  describe('getState / isLoggedIn / imsReady', () => {
    it('returns logged-out state when IMS is not available', () => {
      delete globalThis.adobeIMS;
      provider = new AuthStateProvider();

      expect(provider.getState()).to.deep.equal({
        isLoggedIn: false,
        token: null,
        imsReady: false,
      });
      expect(provider.isLoggedIn).to.be.false;
      expect(provider.imsReady).to.be.false;
    });

    it('returns logged-in state when IMS reports signed-in user', () => {
      globalThis.adobeIMS = {
        isSignedInUser: sinon.stub().returns(true),
        getAccessToken: sinon.stub().returns({ token: 'abc-123' }),
        addEventListener: sinon.stub(),
      };
      provider = new AuthStateProvider();

      expect(provider.getState()).to.deep.equal({
        isLoggedIn: true,
        token: 'abc-123',
        imsReady: true,
      });
      expect(provider.isLoggedIn).to.be.true;
      expect(provider.imsReady).to.be.true;
    });

    it('returns a defensive copy (mutations do not affect internal state)', () => {
      globalThis.adobeIMS = {
        isSignedInUser: sinon.stub().returns(true),
        getAccessToken: sinon.stub().returns({ token: 'abc' }),
        addEventListener: sinon.stub(),
      };
      provider = new AuthStateProvider();

      const state = provider.getState();
      state.isLoggedIn = false;
      state.token = 'tampered';
      state.imsReady = false;

      expect(provider.getState()).to.deep.equal({
        isLoggedIn: true,
        token: 'abc',
        imsReady: true,
      });
    });
  });

  describe('subscribe / unsubscribe', () => {
    it('throws TypeError for non-function callback', () => {
      delete globalThis.adobeIMS;
      provider = new AuthStateProvider();

      expect(() => provider.subscribe('not-a-function')).to.throw(TypeError);
      expect(() => provider.subscribe(null)).to.throw(TypeError);
    });

    it('returns an unsubscribe function', () => {
      delete globalThis.adobeIMS;
      provider = new AuthStateProvider();

      const unsub = provider.subscribe(() => {});
      expect(unsub).to.be.a('function');
    });

    it('prevents duplicate subscriptions (Set-based)', () => {
      const listeners = [];
      globalThis.adobeIMS = {
        isSignedInUser: sinon.stub().returns(false),
        getAccessToken: sinon.stub().returns(null),
        addEventListener: (event, handler) => listeners.push({ event, handler }),
      };
      provider = new AuthStateProvider();

      const spy = sinon.spy();
      provider.subscribe(spy);
      provider.subscribe(spy);

      // Simulate login event
      globalThis.adobeIMS.isSignedInUser.returns(true);
      globalThis.adobeIMS.getAccessToken.returns({ token: 'new' });
      listeners[0].handler();

      expect(spy.callCount).to.equal(1);
    });

    it('unsubscribe removes listener', () => {
      const listeners = [];
      globalThis.adobeIMS = {
        isSignedInUser: sinon.stub().returns(false),
        getAccessToken: sinon.stub().returns(null),
        addEventListener: (event, handler) => listeners.push({ event, handler }),
      };
      provider = new AuthStateProvider();

      const spy = sinon.spy();
      const unsub = provider.subscribe(spy);
      unsub();

      // Simulate login event
      globalThis.adobeIMS.isSignedInUser.returns(true);
      globalThis.adobeIMS.getAccessToken.returns({ token: 'new' });
      listeners[0].handler();

      expect(spy.called).to.be.false;
    });
  });

  describe('IMS event bridging', () => {
    it('registers listeners for all IMS lifecycle events', () => {
      const addSpy = sinon.spy();
      globalThis.adobeIMS = {
        isSignedInUser: sinon.stub().returns(false),
        getAccessToken: sinon.stub().returns(null),
        addEventListener: addSpy,
      };
      provider = new AuthStateProvider();

      const registeredEvents = addSpy.args.map(([event]) => event);
      expect(registeredEvents).to.include('onAccessToken');
      expect(registeredEvents).to.include('onAccessTokenHasExpired');
      expect(registeredEvents).to.include('onLogout');
    });

    it('notifies subscribers when login status changes (logged-out → logged-in)', () => {
      const listeners = [];
      globalThis.adobeIMS = {
        isSignedInUser: sinon.stub().returns(false),
        getAccessToken: sinon.stub().returns(null),
        addEventListener: (event, handler) => listeners.push({ event, handler }),
      };
      provider = new AuthStateProvider();

      const spy = sinon.spy();
      provider.subscribe(spy);

      // Simulate login
      globalThis.adobeIMS.isSignedInUser.returns(true);
      globalThis.adobeIMS.getAccessToken.returns({ token: 'fresh-token' });
      listeners.find((l) => l.event === 'onAccessToken').handler();

      expect(spy.calledOnce).to.be.true;
      expect(spy.firstCall.args[0]).to.deep.equal({
        isLoggedIn: true,
        token: 'fresh-token',
        imsReady: true,
      });
    });

    it('notifies subscribers when login status changes (logged-in → logged-out)', () => {
      const capturedListeners = [];
      globalThis.adobeIMS = {
        isSignedInUser: sinon.stub().returns(true),
        getAccessToken: sinon.stub().returns({ token: 'abc' }),
        addEventListener: (event, handler) => capturedListeners.push({ event, handler }),
      };
      provider = new AuthStateProvider();

      const spy = sinon.spy();
      provider.subscribe(spy);

      // Simulate logout
      globalThis.adobeIMS.isSignedInUser.returns(false);
      globalThis.adobeIMS.getAccessToken.returns(null);
      capturedListeners.find((l) => l.event === 'onLogout').handler();

      expect(spy.calledOnce).to.be.true;
      expect(spy.firstCall.args[0]).to.deep.equal({
        isLoggedIn: false,
        token: null,
        imsReady: true,
      });
    });

    it('does NOT notify when IMS event fires but login status is unchanged', () => {
      const capturedListeners = [];
      globalThis.adobeIMS = {
        isSignedInUser: sinon.stub().returns(true),
        getAccessToken: sinon.stub().returns({ token: 'abc' }),
        addEventListener: (event, handler) => capturedListeners.push({ event, handler }),
      };
      provider = new AuthStateProvider();

      const spy = sinon.spy();
      provider.subscribe(spy);

      // Token refreshed but still logged in — no state change
      globalThis.adobeIMS.getAccessToken.returns({ token: 'refreshed-token' });
      capturedListeners.find((l) => l.event === 'onAccessToken').handler();

      expect(spy.called).to.be.false;
    });

    it('skips IMS bridging when addEventListener is not available', () => {
      globalThis.adobeIMS = {
        isSignedInUser: sinon.stub().returns(true),
        getAccessToken: sinon.stub().returns({ token: 'abc' }),
        // No addEventListener
      };

      // Should not throw
      provider = new AuthStateProvider();
      expect(provider.isLoggedIn).to.be.true;
    });

    it('catches and logs subscriber errors without affecting other subscribers', () => {
      const capturedListeners = [];
      globalThis.adobeIMS = {
        isSignedInUser: sinon.stub().returns(false),
        getAccessToken: sinon.stub().returns(null),
        addEventListener: (event, handler) => capturedListeners.push({ event, handler }),
      };
      provider = new AuthStateProvider();

      const errorSpy = sinon.stub(console, 'error');
      const badSubscriber = sinon.stub().throws(new Error('subscriber boom'));
      const goodSubscriber = sinon.spy();

      provider.subscribe(badSubscriber);
      provider.subscribe(goodSubscriber);

      // Simulate login
      globalThis.adobeIMS.isSignedInUser.returns(true);
      globalThis.adobeIMS.getAccessToken.returns({ token: 'new' });
      capturedListeners[0].handler();

      expect(badSubscriber.calledOnce).to.be.true;
      expect(goodSubscriber.calledOnce).to.be.true;
      expect(errorSpy.calledOnce).to.be.true;
    });
  });

  describe('deferred IMS initialization (service:ims:ready event)', () => {
    it('recovers state when service:ims:ready fires after construction', () => {
      delete globalThis.adobeIMS;
      provider = new AuthStateProvider();

      expect(provider.isLoggedIn).to.be.false;
      expect(provider.imsReady).to.be.false;

      // Simulate IMS loading later
      globalThis.adobeIMS = {
        isSignedInUser: sinon.stub().returns(true),
        getAccessToken: sinon.stub().returns({ token: 'late-token' }),
        addEventListener: sinon.stub(),
      };
      dispatchImsReady();

      expect(provider.isLoggedIn).to.be.true;
      expect(provider.imsReady).to.be.true;
      expect(provider.getState()).to.deep.equal({
        isLoggedIn: true,
        token: 'late-token',
        imsReady: true,
      });
    });

    it('notifies subscribers when service:ims:ready fires and user is signed in', () => {
      delete globalThis.adobeIMS;
      provider = new AuthStateProvider();

      const spy = sinon.spy();
      provider.subscribe(spy);

      globalThis.adobeIMS = {
        isSignedInUser: sinon.stub().returns(true),
        getAccessToken: sinon.stub().returns({ token: 'late-token' }),
        addEventListener: sinon.stub(),
      };
      dispatchImsReady();

      expect(spy.calledOnce).to.be.true;
      expect(spy.firstCall.args[0]).to.deep.equal({
        isLoggedIn: true,
        token: 'late-token',
        imsReady: true,
      });
    });

    it('notifies subscribers of imsReady even when user is not signed in', () => {
      delete globalThis.adobeIMS;
      provider = new AuthStateProvider();

      const spy = sinon.spy();
      provider.subscribe(spy);

      globalThis.adobeIMS = {
        isSignedInUser: sinon.stub().returns(false),
        getAccessToken: sinon.stub().returns(null),
        addEventListener: sinon.stub(),
      };
      dispatchImsReady();

      expect(spy.calledOnce).to.be.true;
      expect(spy.firstCall.args[0]).to.deep.equal({
        isLoggedIn: false,
        token: null,
        imsReady: true,
      });
    });

    it('bridges IMS lifecycle events after service:ims:ready fires', () => {
      delete globalThis.adobeIMS;
      provider = new AuthStateProvider();

      const capturedListeners = [];
      globalThis.adobeIMS = {
        isSignedInUser: sinon.stub().returns(false),
        getAccessToken: sinon.stub().returns(null),
        addEventListener: (event, handler) => capturedListeners.push({ event, handler }),
      };
      dispatchImsReady();

      const registeredEvents = capturedListeners.map(({ event }) => event);
      expect(registeredEvents).to.include('onAccessToken');
      expect(registeredEvents).to.include('onAccessTokenHasExpired');
      expect(registeredEvents).to.include('onLogout');

      // Verify events work after deferred bridging
      const spy = sinon.spy();
      provider.subscribe(spy);

      globalThis.adobeIMS.isSignedInUser.returns(true);
      globalThis.adobeIMS.getAccessToken.returns({ token: 'deferred-token' });
      capturedListeners.find((l) => l.event === 'onAccessToken').handler();

      expect(spy.calledOnce).to.be.true;
      expect(spy.firstCall.args[0]).to.deep.equal({
        isLoggedIn: true,
        token: 'deferred-token',
        imsReady: true,
      });
    });
  });

  describe('standalone provider semantics', () => {
    it('has isAvailable = false (no backing plugin)', () => {
      delete globalThis.adobeIMS;
      provider = new AuthStateProvider();
      expect(provider.isAvailable).to.be.false;
    });
  });

  describe('destroy()', () => {
    it('removes window listener when IMS was not yet ready', () => {
      delete globalThis.adobeIMS;
      provider = new AuthStateProvider();

      const removeSpy = sinon.spy(globalThis, 'removeEventListener');
      provider.destroy();

      const removed = removeSpy.args.find(([event]) => event === IMS_READY_EVENT);
      expect(removed).to.exist;
    });

    it('removes IMS SDK event listeners after bridging', () => {
      const removeSpy = sinon.spy();
      globalThis.adobeIMS = {
        isSignedInUser: sinon.stub().returns(true),
        getAccessToken: sinon.stub().returns({ token: 'abc' }),
        addEventListener: sinon.stub(),
        removeEventListener: removeSpy,
      };
      provider = new AuthStateProvider();

      provider.destroy();

      const removedEvents = removeSpy.args.map(([event]) => event);
      expect(removedEvents).to.include('onAccessToken');
      expect(removedEvents).to.include('onAccessTokenHasExpired');
      expect(removedEvents).to.include('onLogout');
    });

    it('clears all subscribers', () => {
      delete globalThis.adobeIMS;
      provider = new AuthStateProvider();

      const spy = sinon.spy();
      provider.subscribe(spy);
      provider.destroy();

      // Simulate IMS ready after destroy — subscriber should NOT be called
      globalThis.adobeIMS = {
        isSignedInUser: sinon.stub().returns(true),
        getAccessToken: sinon.stub().returns({ token: 'abc' }),
        addEventListener: sinon.stub(),
      };
      dispatchImsReady();

      expect(spy.called).to.be.false;
    });

    it('is safe to call multiple times', () => {
      globalThis.adobeIMS = {
        isSignedInUser: sinon.stub().returns(true),
        getAccessToken: sinon.stub().returns({ token: 'abc' }),
        addEventListener: sinon.stub(),
        removeEventListener: sinon.stub(),
      };
      provider = new AuthStateProvider();

      expect(() => {
        provider.destroy();
        provider.destroy();
      }).to.not.throw();
    });

    it('does not call removeEventListener when IMS has no removeEventListener', () => {
      globalThis.adobeIMS = {
        isSignedInUser: sinon.stub().returns(true),
        getAccessToken: sinon.stub().returns({ token: 'abc' }),
        addEventListener: sinon.stub(),
      };
      provider = new AuthStateProvider();

      expect(() => provider.destroy()).to.not.throw();
    });
  });
});
