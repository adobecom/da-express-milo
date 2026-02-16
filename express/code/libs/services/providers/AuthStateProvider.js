import BaseProvider from './BaseProvider.js';
import { IMS_READY_EVENT } from '../middlewares/auth.middleware.js';

export default class AuthStateProvider extends BaseProvider {
  /** @type {{ isLoggedIn: boolean, token: string|null, imsReady: boolean }} */
  #state = { isLoggedIn: false, token: null, imsReady: false };

  /** @type {Set<Function>} */
  #listeners = new Set();

  /** @type {Function|null} Bound handler for window IMS ready event */
  #windowHandler = null;

  /** @type {Function|null} Bound handler shared across IMS SDK events */
  #imsHandler = null;

  /** @type {string[]} */
  static IMS_EVENTS = ['onAccessToken', 'onAccessTokenHasExpired', 'onLogout'];

  constructor() {
    super(null);

    if (window.adobeIMS) {
      this.#onImsReady();
    } else {
      this.#windowHandler = () => this.#onImsReady();
      window.addEventListener(IMS_READY_EVENT, this.#windowHandler, { once: true });
    }
  }

  /** @returns {{ isLoggedIn: boolean, token: string|null, imsReady: boolean }} */
  getState() {
    return { ...this.#state };
  }

  /** @returns {boolean} */
  get isLoggedIn() {
    return this.#state.isLoggedIn;
  }

  /** @returns {boolean} */
  get imsReady() {
    return this.#state.imsReady;
  }

  /**
   * @param {(state: { isLoggedIn: boolean, token: string|null, imsReady: boolean }) => void} cb
   * @returns {() => void} Unsubscribe function
   */
  subscribe(callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('subscribe() requires a function callback');
    }
    this.#listeners.add(callback);
    return () => this.#listeners.delete(callback);
  }

  /** @private — called once when IMS SDK becomes available */
  #onImsReady() {
    this.#windowHandler = null;
    this.#state.imsReady = true;
    this.#syncState();
    this.#bridgeImsEvents();
    this.#notify();
  }

  /** @private */
  #syncState(ims = window?.adobeIMS) {
    this.#state = {
      ...this.#state,
      isLoggedIn: ims?.isSignedInUser?.() || false,
      token: ims?.getAccessToken?.()?.token || null,
    };
  }

  /** @private */
  #bridgeImsEvents(ims = window?.adobeIMS) {
    if (!ims?.addEventListener) return;

    this.#imsHandler = () => this.#handleImsEvent();

    AuthStateProvider.IMS_EVENTS.forEach((event) => {
      ims.addEventListener(event, this.#imsHandler);
    });
  }

  /** @private */
  #handleImsEvent() {
    const prevLoggedIn = this.#state.isLoggedIn;
    this.#syncState();

    if (this.#state.isLoggedIn !== prevLoggedIn) {
      this.#notify();
    }
  }

  /** @private */
  #notify() {
    const snapshot = this.getState();
    this.#listeners.forEach((cb) => {
      try {
        cb(snapshot);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('AuthStateProvider subscriber error:', error);
      }
    });
  }

  /**
   * Clean up all event listeners and subscribers.
   * Call this when the provider is no longer needed to prevent memory leaks.
   */
  destroy() {
    if (this.#windowHandler) {
      window.removeEventListener(IMS_READY_EVENT, this.#windowHandler);
      this.#windowHandler = null;
    }

    if (this.#imsHandler) {
      const ims = window?.adobeIMS;
      if (ims?.removeEventListener) {
        AuthStateProvider.IMS_EVENTS.forEach((event) => {
          ims.removeEventListener(event, this.#imsHandler);
        });
      }
      this.#imsHandler = null;
    }

    this.#listeners.clear();
  }
}
